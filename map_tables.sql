-- places tablosuna enlem ve boylam sütunlarını ekle
ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
