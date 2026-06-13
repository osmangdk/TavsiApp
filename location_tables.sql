-- 1. Tabloları Oluştur
CREATE TABLE IF NOT EXISTS public.cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.districts (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.neighborhoods (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL
);

-- 2. Herkesin okuyabilmesi (SELECT) ve geçici olarak veri ekleyebilmesi (INSERT) için RLS (Row Level Security) ayarları
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Okuma (Select) İzinleri (Herkes)
CREATE POLICY "Allow public read access on cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Allow public read access on districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on neighborhoods" ON public.neighborhoods FOR SELECT USING (true);

-- Ekleme (Insert) İzinleri (Geçici - İşlem bitince sileceğiz)
CREATE POLICY "Allow anon insert on cities" ON public.cities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert on districts" ON public.districts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert on neighborhoods" ON public.neighborhoods FOR INSERT WITH CHECK (true);
