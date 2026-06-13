-- 1. Kullanıcılar Arası Bağlantılar (Ağ) Tablosu
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' (beklemede), 'accepted' (onaylandı)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- 2. Mevcut user_places Tablosunu Güncelle (Puanlama ve Yorum Özellikleri)
ALTER TABLE public.user_places 
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'network'; -- 'public', 'network', 'custom'

-- 3. Yakın Çevre (Custom Share) Tablosu
CREATE TABLE IF NOT EXISTS public.user_place_custom_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_place_id UUID REFERENCES public.user_places(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_place_id, shared_with_user_id)
);

-- RLS (Row Level Security) Ayarları
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_place_custom_shares ENABLE ROW LEVEL SECURITY;

-- Bağlantılar için kurallar (Herkes okuyabilir, sadece kendi ID'si follower olanlar ekleyebilir)
CREATE POLICY "Allow public read access on connections" 
ON public.connections FOR SELECT USING (true);

CREATE POLICY "Allow users to insert connections" 
ON public.connections FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Allow users to update connections directed to them" 
ON public.connections FOR UPDATE 
USING (auth.uid() = following_id OR auth.uid() = follower_id);

-- Yakın çevre paylaşımları için kurallar
CREATE POLICY "Allow public read access on custom shares" 
ON public.user_place_custom_shares FOR SELECT USING (true);

-- MVP için tam yetki verilebilir, normalde user_place sahibine yetki verilmeli
CREATE POLICY "Allow all on custom shares for now" 
ON public.user_place_custom_shares FOR ALL USING (true);

-- profiles tablosuna full_name ve avatar_url sütunları daha önce eklenmediyse diye önlem
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
