-- 1. Davetiyeler Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    used_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Row Level Security) Ayarları
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Herkes davetiye kodunu okuyabilmeli (kayıt sırasında kodun geçerli olup olmadığını kontrol etmek için)
CREATE POLICY "Allow public read access on invitations" 
ON public.invitations FOR SELECT 
USING (true);

-- Kullanıcılar davetiye kodunu (kullanım sayısını artırmak için) güncelleyebilmeli (anonimken kayıt olurken)
-- Normalde bu işlem bir Edge Function ile yapılmalı ama MVP aşamasında basit tutmak için anonim UPDATE yetkisi veriyoruz
CREATE POLICY "Allow anon update on invitations" 
ON public.invitations FOR UPDATE 
USING (true);

-- Yeni üye olan kişi kendine ait davetiye kodunu INSERT edebilmeli
CREATE POLICY "Allow authenticated insert on invitations" 
ON public.invitations FOR INSERT 
WITH CHECK (auth.uid() = inviter_id);

-- Kurucu Kodunu Ekle (Master Code)
-- Bu kodu sonsuz kullanım hakkıyla ekliyoruz
INSERT INTO public.invitations (inviter_id, code, used_count, max_uses) 
VALUES (NULL, 'TAVSI-KURUCU', 0, 999999)
ON CONFLICT (code) DO NOTHING;
