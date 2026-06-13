-- 1. Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Circle'
);

-- 2. Alt Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS public.subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(category_id, name)
);

-- RLS (Row Level Security) Ayarları
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on subcategories" ON public.subcategories FOR SELECT USING (true);

-- Verileri Temizle (Eğer tekrar çalıştırılırsa diye)
TRUNCATE TABLE public.subcategories RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.categories RESTART IDENTITY CASCADE;

-- 3. Ana Kategorileri Ekle
INSERT INTO public.categories (name, icon_name) VALUES
('Yeme & İçme', 'Coffee'),
('Sağlık & Medikal', 'Stethoscope'),
('Kişisel Bakım', 'Scissors'),
('Hizmet & Usta', 'Tool'),
('Eğitim & Gelişim', 'Book'),
('Aktivite & Spor', 'Activity'),
('Hukuk', 'Scale'),
('Gayrimenkul', 'Home');

-- 4. Alt Kategorileri Ekle
-- Yeme & İçme (id: 1)
INSERT INTO public.subcategories (category_id, name) VALUES
(1, 'Restoran'), (1, 'Kafe'), (1, 'Kebapçı'), (1, 'Kahvaltıcı'), 
(1, 'Tatlıcı'), (1, 'Sokak Lezzetleri'), (1, 'Meyhane'), (1, 'Burger');

-- Sağlık & Medikal (id: 2)
INSERT INTO public.subcategories (category_id, name) VALUES
(2, 'Çocuk Doktoru'), (2, 'Kadın Doğum Uzmanı'), (2, 'Diş Hekimi'), 
(2, 'Psikolog'), (2, 'Diyetisyen'), (2, 'Göz Doktoru'), (2, 'Veteriner'), (2, 'Fizik Tedavi');

-- Kişisel Bakım (id: 3)
INSERT INTO public.subcategories (category_id, name) VALUES
(3, 'Kadın Kuaförü'), (3, 'Erkek Berberi'), (3, 'Güzellik Merkezi'), 
(3, 'Lazer Epilasyon'), (3, 'Tırnak Stüdyosu'), (3, 'Cilt Bakımı');

-- Hizmet & Usta (id: 4)
INSERT INTO public.subcategories (category_id, name) VALUES
(4, 'Tesisatçı'), (4, 'Elektrikçi'), (4, 'Oto Tamircisi'), 
(4, 'Temizlik Şirketi'), (4, 'Nakliye'), (4, 'Terzi'), (4, 'Kuru Temizleme'), (4, 'Marangoz');

-- Eğitim & Gelişim (id: 5)
INSERT INTO public.subcategories (category_id, name) VALUES
(5, 'Özel Ders Öğretmeni'), (5, 'Sürücü Kursu'), (5, 'Yabancı Dil Kursu'), (5, 'Kreş / Anaokulu');

-- Aktivite & Spor (id: 6)
INSERT INTO public.subcategories (category_id, name) VALUES
(6, 'Spor Salonu'), (6, 'Pilates / Yoga'), (6, 'Halı Saha'), (6, 'Dans Kursu');

-- Hukuk (id: 7)
INSERT INTO public.subcategories (category_id, name) VALUES
(7, 'Avukat'), (7, 'Arabulucu'), (7, 'Hukuk Bürosu'), (7, 'Noter');

-- Gayrimenkul (id: 8)
INSERT INTO public.subcategories (category_id, name) VALUES
(8, 'Emlakçı'), (8, 'Gayrimenkul Danışmanı'), (8, 'Değerleme Uzmanı (Ekspertiz)');
