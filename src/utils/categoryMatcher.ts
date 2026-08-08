/**
 * Category matching, query expansion, and OpenStreetMap classification for Tavsi app.
 * Ensures searching for categories like "Yeme İçme" brings up all restaurants, cafes,
 * bakeries, soup shops, diners, bars, etc.
 */

export interface CategoryGroup {
  name: string;
  aliases: string[];
  dbCategories: string[];
  osmValues: string[];
}

export const CATEGORY_GROUPS: Record<string, CategoryGroup> = {
  YEME_ICME: {
    name: 'Yeme & İçme',
    aliases: [
      'yeme içme', 'yeme & içme', 'yeme-içme', 'yeme', 'içme', 'yemek', 'içecek',
      'restoran & kafe', 'yeme & i̇çme', 'yeme i̇çme', 'yemeicme', 'yiyecek'
    ],
    dbCategories: [
      'Restoran', 'Restaurant', 'Kafe', 'Cafe', 'Coffee', 'Fırın', 'Pastane',
      'Bakery', 'Çorbacı', 'Çorba', 'Lokanta', 'Esnaf Lokantası', 'Kebap',
      'Kebapçı', 'Döner', 'Dönerci', 'Pide', 'Pideci', 'Köfte', 'Köfteci',
      'Tatlı', 'Tatlıcı', 'Baklava', 'Fast Food', 'Bar', 'Pub', 'Bistro',
      'Meyhane', 'Börek', 'Börekçi', 'Kokoreç', 'Midye', 'Midyeci', 'Pizza',
      'Burger', 'Hamburger', 'Kahve', 'Kahvaltı', 'Kahvaltıcı', 'Sokak Lezzetleri',
      'Dondurma', 'Dondurmacı', 'Büfe', 'Ocakbaşı', 'Lahmacun', 'Tost',
      'Simit', 'Mantı', 'Nargile', 'Şarap', 'Birahane', 'Paça', 'İşkembe',
      'Pizzeria', 'Steakhouse', 'Yeme', 'İçme'
    ],
    osmValues: [
      'restaurant', 'cafe', 'coffee_shop', 'fast_food', 'bar', 'pub', 'bakery',
      'food', 'food_court', 'bistro', 'ice_cream', 'biergarten', 'canteen',
      'pastry', 'delicatessen', 'dining', 'tea_room', 'tea_house'
    ]
  },
  SAGLIK: {
    name: 'Sağlık',
    aliases: [
      'sağlık', 'sağlık & medikal', 'doktor & sağlık', 'doktor', 'hekim',
      'tabip', 'medikal', 'eczane', 'klinik', 'hastane', 'diş'
    ],
    dbCategories: [
      'Sağlık', 'Medikal', 'Doktor', 'Diş', 'Diş Hekimi', 'Klinik', 'Hastane',
      'Eczane', 'Veteriner', 'Psikolog', 'Diyetisyen', 'Fizik Tedavi', 'Göz',
      'Kadın Doğum', 'Pediatri', 'Çocuk Doktoru', 'Poliklinik', 'Laboratuvar', 'Optik'
    ],
    osmValues: ['hospital', 'clinic', 'pharmacy', 'doctors', 'dentist', 'veterinary', 'health']
  },
  KISISEL_BAKIM: {
    name: 'Kişisel Bakım',
    aliases: [
      'kişisel bakım', 'bakım & güzellik', 'güzellik', 'berber', 'kuaför',
      'bakım', 'salon', 'güzellik salonu'
    ],
    dbCategories: [
      'Kişisel Bakım', 'Berber', 'Kuaför', 'Güzellik Salonu', 'Güzellik',
      'Lazer', 'Tırnak', 'Cilt Bakımı', 'SPA', 'Masaj', 'Solaryum', 'Makyaj',
      'Estetik', 'Saç'
    ],
    osmValues: ['barber', 'beauty', 'hairdresser', 'hair_salon', 'spa']
  },
  HIZMETLER: {
    name: 'Hizmetler',
    aliases: [
      'hizmetler', 'hizmet & usta', 'usta & tamirat', 'hizmet', 'tamir',
      'usta', 'tamirat', 'tesisatçı', 'oto tamir'
    ],
    dbCategories: [
      'Hizmet', 'Hizmetler', 'Tesisat', 'Tesisatçı', 'Elektrik', 'Elektrikçi',
      'Tamir', 'Oto Tamir', 'Temizlik', 'Nakliye', 'Terzi', 'Kuru Temizleme',
      'Marangoz', 'Çilingir', 'Boya', 'Badana', 'Servis', 'Ekspertiz', 'Oto Yıkama'
    ],
    osmValues: ['service', 'repair', 'cleaning', 'laundry', 'plumber', 'electrician', 'car_repair', 'car_wash']
  },
  AKTIVITE: {
    name: 'Aktivite',
    aliases: [
      'aktivite', 'aktivite & spor', 'spor', 'egzersiz', 'pilates', 'gym',
      'fitness', 'sinema', 'müze'
    ],
    dbCategories: [
      'Aktivite', 'Spor', 'Pilates', 'Yoga', 'Halı Saha', 'Dans', 'Gym',
      'Fitness', 'Müze', 'Sinema', 'Tiyatro', 'Park', 'Eğlence', 'Kort', 'Yüzme', 'Stadyum'
    ],
    osmValues: ['sports_centre', 'gym', 'stadium', 'museum', 'cinema', 'theatre', 'park']
  },
  EGITIM: {
    name: 'Eğitim',
    aliases: [
      'eğitim', 'eğitim & gelişim', 'okul', 'kurs', 'dershane', 'lise', 'üniversite', 'kolej'
    ],
    dbCategories: [
      'Eğitim', 'Okul', 'Lise', 'Ortaokul', 'İlkokul', 'Anaokulu', 'Kolej',
      'Üniversite', 'Sürücü Kursu', 'Dil Kursu', 'Dershane', 'Kreş', 'Özel Ders'
    ],
    osmValues: ['school', 'university', 'college', 'kindergarten']
  }
};

/**
 * Checks if the given query text matches category "Yeme & İçme" or food & drink concepts.
 */
export function isFoodAndDrinkQuery(queryText: string): boolean {
  if (!queryText) return false;
  const qLower = queryText.trim().toLowerCase();
  
  // Direct match with aliases
  if (CATEGORY_GROUPS.YEME_ICME.aliases.some(a => qLower === a || qLower.includes(a))) {
    return true;
  }
  
  // Specific food keywords
  const foodKeywords = [
    'restoran', 'restaurant', 'kafe', 'cafe', 'coffee', 'fırın', 'pastane',
    'çorbacı', 'çorba', 'lokanta', 'kebap', 'döner', 'pide', 'köfte', 'tatlı',
    'fast food', 'bar', 'pub', 'bistro', 'meyhane', 'börek', 'kokoreç', 'midye',
    'pizza', 'burger', 'kahve', 'kahvaltı', 'dondurma', 'büfe', 'ocakbaşı',
    'lahmacun', 'tost', 'simit', 'mantı', 'nargile', 'şarap', 'birahane'
  ];
  
  return foodKeywords.some(kw => qLower.includes(kw));
}

/**
 * Builds a comprehensive Supabase `.or()` query filter string for a given search query.
 */
export function buildSupabaseOrFilter(queryText: string): string {
  if (!queryText || !queryText.trim()) {
    return '';
  }

  const trimmed = queryText.trim();
  const qLower = trimmed.toLowerCase();

  // 1. Check if user is searching for "Yeme İçme" category
  if (
    qLower === 'yeme içme' ||
    qLower === 'yeme & içme' ||
    qLower === 'yeme-içme' ||
    qLower === 'yeme i̇çme' ||
    qLower === 'yeme & i̇çme' ||
    qLower === 'yeme' ||
    qLower === 'içme' ||
    qLower === 'yemek' ||
    qLower === 'içecek' ||
    qLower === 'yemeicme'
  ) {
    // Generate OR filter matching all Food & Drink category patterns in database
    const catConditions = CATEGORY_GROUPS.YEME_ICME.dbCategories.map(
      cat => `category.ilike.%${cat}%`
    );
    const nameConditions = [
      'name.ilike.%Restoran%', 'name.ilike.%Kafe%', 'name.ilike.%Pastane%',
      'name.ilike.%Çorbacı%', 'name.ilike.%Lokanta%', 'name.ilike.%Fırın%',
      'name.ilike.%Kebap%', 'name.ilike.%Döner%', 'name.ilike.%Kahve%'
    ];
    return [...catConditions, ...nameConditions].join(',');
  }

  // 2. Check other matched category groups
  let extraCatConditions: string[] = [];

  if (qLower.includes('doktor') || qLower.includes('hekim') || qLower.includes('tabip') || qLower.includes('sağlık')) {
    extraCatConditions = CATEGORY_GROUPS.SAGLIK.dbCategories.map(cat => `category.ilike.%${cat}%`);
  } else if (qLower.includes('berber') || qLower.includes('kuaför') || qLower.includes('güzellik') || qLower.includes('bakım')) {
    extraCatConditions = CATEGORY_GROUPS.KISISEL_BAKIM.dbCategories.map(cat => `category.ilike.%${cat}%`);
  } else if (qLower.includes('usta') || qLower.includes('tamir') || qLower.includes('tesisat') || qLower.includes('hizmet')) {
    extraCatConditions = CATEGORY_GROUPS.HIZMETLER.dbCategories.map(cat => `category.ilike.%${cat}%`);
  } else if (qLower.includes('spor') || qLower.includes('aktivite') || qLower.includes('pilates') || qLower.includes('fitness')) {
    extraCatConditions = CATEGORY_GROUPS.AKTIVITE.dbCategories.map(cat => `category.ilike.%${cat}%`);
  } else if (qLower.includes('okul') || qLower.includes('eğitim') || qLower.includes('kurs') || qLower.includes('dershane')) {
    extraCatConditions = CATEGORY_GROUPS.EGITIM.dbCategories.map(cat => `category.ilike.%${cat}%`);
  } else if (isFoodAndDrinkQuery(trimmed)) {
    // Specific food term (e.g. "çorbacı", "pastane", "restoran")
    extraCatConditions = CATEGORY_GROUPS.YEME_ICME.dbCategories
      .filter(cat => cat.toLowerCase().includes(qLower) || qLower.includes(cat.toLowerCase()))
      .map(cat => `category.ilike.%${cat}%`);
  }

  const baseConditions = [
    `name.ilike.%${trimmed}%`,
    `category.ilike.%${trimmed}%`
  ];

  const allConditions = Array.from(new Set([...baseConditions, ...extraCatConditions]));
  return allConditions.join(',');
}

/**
 * Classifies OpenStreetMap feature osm_value into Tavsi categories.
 */
export function classifyOsmCategory(osmVal?: string | null): string {
  if (!osmVal) return 'Mekan';
  const val = osmVal.toLowerCase().trim();

  for (const group of Object.values(CATEGORY_GROUPS)) {
    if (group.osmValues.includes(val)) {
      return group.name;
    }
  }

  return 'Mekan';
}

/**
 * Formats Photon search query string for live OpenStreetMap searches.
 */
export function getPhotonSearchQuery(queryText: string): string {
  const trimmed = queryText.trim();
  const qLower = trimmed.toLowerCase();

  if (
    qLower === 'yeme içme' ||
    qLower === 'yeme & içme' ||
    qLower === 'yeme-içme' ||
    qLower === 'yeme i̇çme' ||
    qLower === 'yeme' ||
    qLower === 'içme' ||
    qLower === 'yemek'
  ) {
    return 'Restoran Kafe Pastane Türkiye';
  }

  return `${trimmed} Türkiye`;
}
