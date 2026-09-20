-- TAVSI production security hardening (tracked migration)
-- Run once in Supabase SQL Editor as the project owner.
-- This migration intentionally removes all legacy policies on the listed tables.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS setup_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS default_visibility text NOT NULL DEFAULT '2nd',
  ADD COLUMN IF NOT EXISTS allow_search boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS anonymous_stats boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_default_visibility_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_default_visibility_check
      CHECK (default_visibility IN ('1st', '2nd', 'public')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'connections_status_check'
      AND conrelid = 'public.connections'::regclass
  ) THEN
    ALTER TABLE public.connections
      ADD CONSTRAINT connections_status_check
      CHECK (status IN ('pending', 'accepted')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'connections_no_self_link_check'
      AND conrelid = 'public.connections'::regclass
  ) THEN
    ALTER TABLE public.connections
      ADD CONSTRAINT connections_no_self_link_check
      CHECK (follower_id <> following_id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_places_visibility_check'
      AND conrelid = 'public.user_places'::regclass
  ) THEN
    ALTER TABLE public.user_places
      ADD CONSTRAINT user_places_visibility_check
      CHECK (visibility IN ('public', 'network', 'custom')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'places_latitude_check'
      AND conrelid = 'public.places'::regclass
  ) THEN
    ALTER TABLE public.places
      ADD CONSTRAINT places_latitude_check
      CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'places_longitude_check'
      AND conrelid = 'public.places'::regclass
  ) THEN
    ALTER TABLE public.places
      ADD CONSTRAINT places_longitude_check
      CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180) NOT VALID;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS connections_follower_status_idx
  ON public.connections (follower_id, status);
CREATE INDEX IF NOT EXISTS connections_following_status_idx
  ON public.connections (following_id, status);
CREATE INDEX IF NOT EXISTS user_places_user_visibility_idx
  ON public.user_places (user_id, visibility);
CREATE INDEX IF NOT EXISTS custom_shares_recipient_idx
  ON public.user_place_custom_shares (shared_with_user_id, user_place_id);

-- Earlier builds could create more than one invitation for the same account.
-- Keep those records intact and serialize future code creation per account.
DROP INDEX IF EXISTS public.invitations_one_code_per_user_idx;

-- Authentication already owns the canonical e-mail address. Keeping a second,
-- publicly queryable copy in profiles only increases the impact of an RLS bug.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.are_connected(first_user uuid, second_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT first_user IS NOT NULL
    AND second_user IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.connections AS connection
      WHERE connection.status = 'accepted'
        AND (
          (connection.follower_id = first_user AND connection.following_id = second_user)
          OR
          (connection.follower_id = second_user AND connection.following_id = first_user)
        )
    );
$$;

CREATE OR REPLACE FUNCTION private.is_within_profile_scope(
  owner_id uuid,
  viewer_id uuid,
  profile_scope text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE COALESCE(profile_scope, '2nd')
    WHEN 'public' THEN true
    WHEN '1st' THEN private.are_connected(owner_id, viewer_id)
    ELSE private.are_connected(owner_id, viewer_id)
      OR EXISTS (
        SELECT 1
        FROM public.connections AS first_hop
        JOIN public.connections AS second_hop
          ON (
            CASE
              WHEN first_hop.follower_id = owner_id THEN first_hop.following_id
              ELSE first_hop.follower_id
            END
          ) = (
            CASE
              WHEN second_hop.follower_id = viewer_id THEN second_hop.following_id
              ELSE second_hop.follower_id
            END
          )
        WHERE first_hop.status = 'accepted'
          AND second_hop.status = 'accepted'
          AND owner_id IN (first_hop.follower_id, first_hop.following_id)
          AND viewer_id IN (second_hop.follower_id, second_hop.following_id)
      )
  END;
$$;

CREATE OR REPLACE FUNCTION private.can_view_user_place(
  target_user_place_id uuid,
  owner_id uuid,
  item_visibility text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  profile_scope text;
BEGIN
  IF viewer_id IS NULL THEN
    RETURN false;
  END IF;

  IF viewer_id = owner_id THEN
    RETURN true;
  END IF;

  IF COALESCE(item_visibility, 'network') = 'custom' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_place_custom_shares AS share
      WHERE share.user_place_id = target_user_place_id
        AND share.shared_with_user_id = viewer_id
    );
  END IF;

  IF COALESCE(item_visibility, 'network') = 'network' THEN
    RETURN private.is_within_profile_scope(owner_id, viewer_id, '2nd');
  END IF;

  SELECT profile.default_visibility
  INTO profile_scope
  FROM public.profiles AS profile
  WHERE profile.id = owner_id;

  RETURN private.is_within_profile_scope(owner_id, viewer_id, profile_scope);
END;
$$;

CREATE OR REPLACE FUNCTION private.owns_user_place(target_user_place_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_places AS user_place
    WHERE user_place.id = target_user_place_id
      AND user_place.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION private.are_connected(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_within_profile_scope(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_view_user_place(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_user_place(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.are_connected(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_within_profile_scope(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_user_place(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.owns_user_place(uuid) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_place_custom_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles', 'connections', 'places', 'user_places',
        'user_place_custom_shares', 'invitations', 'cities',
        'districts', 'neighborhoods', 'categories', 'subcategories'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  END LOOP;
END
$$;

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.connections FROM anon, authenticated;
REVOKE ALL ON public.user_places FROM anon, authenticated;
REVOKE ALL ON public.user_place_custom_shares FROM anon, authenticated;
REVOKE ALL ON public.invitations FROM anon, authenticated;
REVOKE ALL ON public.places FROM anon, authenticated;
REVOKE ALL ON public.cities FROM anon, authenticated;
REVOKE ALL ON public.districts FROM anon, authenticated;
REVOKE ALL ON public.neighborhoods FROM anon, authenticated;
REVOKE ALL ON public.categories FROM anon, authenticated;
REVOKE ALL ON public.subcategories FROM anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (
  id, full_name, username, avatar_url, bio, city, district,
  setup_completed, default_visibility, allow_search, anonymous_stats,
  notifications_enabled
) ON public.profiles TO authenticated;
GRANT UPDATE (
  full_name, username, avatar_url, bio, city, district, updated_at,
  setup_completed, default_visibility, allow_search, anonymous_stats,
  notifications_enabled
) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.connections TO authenticated;
GRANT UPDATE (status) ON public.connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_places TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_place_custom_shares TO authenticated;
GRANT SELECT ON public.invitations TO authenticated;
GRANT SELECT ON public.places TO anon, authenticated;
GRANT INSERT ON public.places TO authenticated;
GRANT SELECT ON public.cities, public.districts, public.neighborhoods TO anon, authenticated;
GRANT SELECT ON public.categories, public.subcategories TO anon, authenticated;

CREATE POLICY profiles_select_authenticated
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR allow_search
    OR (SELECT private.are_connected(id, auth.uid()))
  );

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY connections_select_participant
  ON public.connections
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (follower_id, following_id));

CREATE POLICY connections_insert_pending_as_sender
  ON public.connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_id = (SELECT auth.uid())
    AND following_id <> (SELECT auth.uid())
    AND status = 'pending'
  );

CREATE POLICY connections_accept_as_recipient
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (following_id = (SELECT auth.uid()) AND status = 'pending')
  WITH CHECK (following_id = (SELECT auth.uid()) AND status = 'accepted');

CREATE POLICY connections_delete_participant
  ON public.connections
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IN (follower_id, following_id));

CREATE POLICY places_read_public
  ON public.places
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY places_insert_authenticated
  ON public.places
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY user_places_select_authorized
  ON public.user_places
  FOR SELECT
  TO authenticated
  USING ((SELECT private.can_view_user_place(id, user_id, visibility)));

CREATE POLICY user_places_insert_own
  ON public.user_places
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_places_update_own
  ON public.user_places
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_places_delete_own
  ON public.user_places
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY custom_shares_select_owner_or_recipient
  ON public.user_place_custom_shares
  FOR SELECT
  TO authenticated
  USING (
    shared_with_user_id = (SELECT auth.uid())
    OR (SELECT private.owns_user_place(user_place_id))
  );

CREATE POLICY custom_shares_insert_by_owner
  ON public.user_place_custom_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_with_user_id <> (SELECT auth.uid())
    AND (SELECT private.owns_user_place(user_place_id))
  );

CREATE POLICY custom_shares_delete_by_owner
  ON public.user_place_custom_shares
  FOR DELETE
  TO authenticated
  USING ((SELECT private.owns_user_place(user_place_id)));

CREATE POLICY invitations_select_own
  ON public.invitations
  FOR SELECT
  TO authenticated
  USING (inviter_id = (SELECT auth.uid()));

CREATE POLICY cities_read_public
  ON public.cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY districts_read_public
  ON public.districts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY neighborhoods_read_public
  ON public.neighborhoods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categories_read_public
  ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY subcategories_read_public
  ON public.subcategories FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.consume_invitation(invite_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  normalized_code text := upper(trim(invite_code));
  invitation_id uuid;
  generated_code text;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF normalized_code IS NULL OR normalized_code = '' OR length(normalized_code) > 20 THEN
    RAISE EXCEPTION 'Invalid invitation';
  END IF;

  -- Prevent concurrent profile-setup requests from creating multiple codes or
  -- consuming the same invitation twice for one account.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(caller_id::text, 0)
  );

  SELECT invitation.code
  INTO generated_code
  FROM public.invitations AS invitation
  WHERE invitation.inviter_id = caller_id
  ORDER BY invitation.created_at ASC, invitation.id ASC
  LIMIT 1;

  IF generated_code IS NOT NULL THEN
    RETURN generated_code;
  END IF;

  SELECT invitation.id
  INTO invitation_id
  FROM public.invitations AS invitation
  WHERE invitation.code = normalized_code
    AND invitation.used_count < invitation.max_uses
  FOR UPDATE;

  IF invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or exhausted invitation';
  END IF;

  UPDATE public.invitations
  SET used_count = used_count + 1
  WHERE id = invitation_id;

  LOOP
    generated_code := upper(encode(extensions.gen_random_bytes(6), 'hex'));
    BEGIN
      INSERT INTO public.invitations (inviter_id, code, used_count, max_uses)
      VALUES (caller_id, generated_code, 0, 5);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Generate another cryptographically random code.
    END;
  END LOOP;

  RETURN generated_code;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_invitation(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.user_place_custom_shares
  WHERE shared_with_user_id = caller_id;

  DELETE FROM public.user_places
  WHERE user_id = caller_id;

  DELETE FROM public.connections
  WHERE follower_id = caller_id OR following_id = caller_id;

  DELETE FROM public.invitations
  WHERE inviter_id = caller_id;

  DELETE FROM public.profiles
  WHERE id = caller_id;

  DELETE FROM auth.users
  WHERE id = caller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- Remove the permanent master invitation. Campaign codes may remain, but are no
-- longer enumerable and can only be consumed atomically by authenticated users.
DELETE FROM public.invitations WHERE code = 'TAVSI-KURUCU';

-- Older clients generated avatar URLs by sending a person's full name to a
-- third-party service. The app now renders initials locally instead.
UPDATE public.profiles
SET avatar_url = NULL
WHERE avatar_url LIKE 'https://api.dicebear.com/%';

-- Storage: this project only uses the avatars bucket. Remove legacy permissive
-- object policies and allow safe raster images only in each user's own folder.
DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', existing_policy.policyname);
  END LOOP;
END
$$;

CREATE POLICY avatars_read_authenticated
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY avatars_insert_own_folder
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND lower(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp'])
  );

CREATE POLICY avatars_update_own_folder
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND lower(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp'])
  );

CREATE POLICY avatars_delete_own_folder
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

COMMIT;
