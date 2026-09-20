-- TAVSI remove unused legacy table
-- Resolves Supabase Advisor notice: "Table has RLS enabled but no policies created."
-- Since trust_network is an obsolete table from prior development and is not referenced
-- anywhere in the application code, dropping it eliminates technical debt safely.

BEGIN;

DROP TABLE IF EXISTS public.trust_network CASCADE;

COMMIT;
