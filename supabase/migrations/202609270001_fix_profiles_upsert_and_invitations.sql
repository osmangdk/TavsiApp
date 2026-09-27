-- TAVSI Fix profiles UPDATE permission for id & ensure invitation master codes
-- Run this in Supabase SQL Editor if you experience permission issues during profile setup.

BEGIN;

-- 1. profiles tablosunda id alanı için authenticated rolüne UPDATE izni ver (upsert uyumluluğu için)
GRANT UPDATE (id) ON public.profiles TO authenticated;

-- 2. Kurucu ve ILK1000 davetiye kodlarını ekle / güncelle
INSERT INTO public.invitations (inviter_id, code, used_count, max_uses)
VALUES 
  (NULL, 'KURUCU', 0, 999999),
  (NULL, 'TAVSI-KURUCU', 0, 999999),
  (NULL, 'ILK1000', 0, 1000)
ON CONFLICT (code) DO UPDATE 
SET max_uses = EXCLUDED.max_uses;

COMMIT;
