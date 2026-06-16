-- Veritabanında tam yetki için geçici RLS iptalleri ve tanımlamaları
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public places are viewable by everyone" ON public.places;
DROP POLICY IF EXISTS "Users can insert places" ON public.places;
DROP POLICY IF EXISTS "Users can update places" ON public.places;

DROP POLICY IF EXISTS "Public user_places are viewable by everyone" ON public.user_places;
DROP POLICY IF EXISTS "Users can view all user_places" ON public.user_places;
DROP POLICY IF EXISTS "Users can insert own user_places" ON public.user_places;
DROP POLICY IF EXISTS "Users can update own user_places" ON public.user_places;
DROP POLICY IF EXISTS "Users can delete own user_places" ON public.user_places;

-- PLACES TABLOSU (Herkes görebilir, herkes ekleyip güncelleyebilir)
CREATE POLICY "Public places are viewable by everyone" 
  ON public.places FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert places" 
  ON public.places FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update places" 
  ON public.places FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- USER_PLACES TABLOSU
CREATE POLICY "Users can view all user_places" 
  ON public.user_places FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own user_places" 
  ON public.user_places FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_places" 
  ON public.user_places FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_places" 
  ON public.user_places FOR DELETE 
  USING (auth.uid() = user_id);
