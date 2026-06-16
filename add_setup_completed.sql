-- 1. profiles tablosuna setup_completed (kurulum tamamlandı) sütununu ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE;

-- 2. Şu ana kadar girmiş olan herkesin (sizin de) aktivasyonunu sıfırlayalım (test edebilmeniz için)
UPDATE public.profiles SET setup_completed = FALSE;
