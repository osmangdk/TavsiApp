/**
 * Category translation and location formatting utilities for Tavsi app.
 * Ensures all place categories and location text display in Turkish across the app.
 */

const EXACT_CATEGORY_MAP: Record<string, string> = {
  // Eğitim
  'high school': 'Lise',
  'high_school': 'Lise',
  'secondary school': 'Ortaokul',
  'middle school': 'Ortaokul',
  'elementary school': 'İlkokul',
  'primary school': 'İlkokul',
  'preschool': 'Anaokulu',
  'kindergarten': 'Anaokulu',
  'private school': 'Özel Okul',
  'school': 'Okul',
  'college': 'Kolej',
  'university': 'Üniversite',
  'driving school': 'Sürücü Kursu',
  'language school': 'Dil Kursu',
  'tutoring': 'Dershane',

  // Bilişim & Ofis
  'coworking space': 'Ortak Çalışma Alanı',
  'coworking': 'Ortak Çalışma Alanı',
  'shared office': 'Ortak Çalışma Alanı',
  'electronics': 'Elektronik & Teknoloji',
  'electronics store': 'Elektronik Mağazası',
  'software company': 'Yazılım Şirketi',
  'it services': 'Bilişim Hizmetleri',
  'it service': 'Bilişim Hizmeti',
  'information technology': 'Bilişim Teknolojileri',

  // Hizmetler & Kurumsal
  'professional services': 'Profesyonel Hizmetler',
  'professional service': 'Profesyonel Hizmetler',
  'home service': 'Ev Hizmetleri',
  'financial service': 'Finansal Hizmetler',
  'financial services': 'Finansal Hizmetler',
  'legal services': 'Hukuk Hizmetleri',
  'legal service': 'Hukuk Hizmetleri',
  'real estate service': 'Emlak & Gayrimenkul',
  'real estate agency': 'Emlak Danışmanlığı',
  'engineering services': 'Mühendislik Hizmetleri',
  'construction services': 'İnşaat Hizmetleri',
  'printing services': 'Baskı & Matbaa',
  'rental service': 'Kiralama Hizmetleri',
  'event technology service': 'Etkinlik & Organizasyon',
  'corporate entertainment services': 'Kurumsal Etkinlik Hizmetleri',
  'freight and cargo service': 'Kargo & Lojistik',
  'automation services': 'Otomasyon Hizmetleri',
  'agricultural service': 'Tarımsal Hizmetler',
  'water treatment equipment and services': 'Su Teknolojileri & Arıtma',
  'garbage collection service': 'Atık & Geri Dönüşüm',
  'community services non profits': 'Sosyal & Sivil Toplum',
  'public service and government': 'Kamu & Devlet Kurumu',
  'auto restoration services': 'Oto Restorasyon & Ekspertiz',
  'automotive services and repair': 'Oto Servis & Tamir',
  'car repair': 'Oto Tamir & Bakım',
  'car care': 'Oto Bakım & Temizlik',
  'car wash': 'Oto Yıkama',
  'auto wash': 'Oto Yıkama',
  'car rental': 'Oto Kiralama',
  'photography store and services': 'Fotoğrafçılık Hizmetleri',
  'hvac services': 'İklimlendirme & Havalandırma',
  'cleaning service': 'Temizlik Hizmeti',
  'repair service': 'Tamir Hizmeti',
  'service': 'Hizmet',
  'services': 'Hizmetler',

  // Sağlık & Medikal
  'hospital': 'Hastane',
  'clinic': 'Klinik',
  'medical center': 'Sağlık Merkezi',
  'health': 'Sağlık',
  'pharmacy': 'Eczane',
  'dentist': 'Diş Hekimi',
  'doctor': 'Doktor',
  'veterinarian': 'Veteriner',
  'veterinary': 'Veteriner Klinik',
  'medical service': 'Medikal Hizmet',

  // Yeme & İçme
  'restaurant': 'Restoran',
  'burger restaurant': 'Burger Restoranı',
  'burger': 'Burger Restoranı',
  'hamburger restaurant': 'Burger Restoranı',
  'pizza restaurant': 'Pizzacı',
  'pizza': 'Pizzacı',
  'pizzeria': 'Pizzacı',
  'steak house': 'Et & Steakhouse',
  'steakhouse': 'Et & Steakhouse',
  'seafood restaurant': 'Balık & Deniz Ürünleri',
  'fish restaurant': 'Balık Restoranı',
  'turkish restaurant': 'Türk Mutfağı & Restoran',
  'breakfast restaurant': 'Kahvaltı Mekanı',
  'dessert restaurant': 'Tatlı & Pastane',
  'dessert shop': 'Tatlıcı',
  'dessert': 'Tatlıcı',
  'fast food': 'Fast Food',
  'fast_food': 'Fast Food',
  'cafe': 'Kafe',
  'coffee shop': 'Kafe',
  'coffee_shop': 'Kafe',
  'coffee': 'Kahve & Kafe',
  'bakery': 'Fırın & Pastane',
  'pastry': 'Pastane',
  'patisserie': 'Pastane',
  'bar': 'Bar & Gece Hayatı',
  'pub': 'Bar & Gece Hayatı',
  'bistro': 'Bistro & Kafe',
  'soup': 'Çorbacı',
  'kebab': 'Kebapçı',
  'food_court': 'Yemek Alanı',
  'canteen': 'Kantin & Yemekhane',
  'ice_cream': 'Dondurmacı',
  'ice cream shop': 'Dondurmacı',
  'delicatessen': 'Şarküteri',
  'deli': 'Şarküteri',
  'tea_house': 'Çay Bahçesi',
  'tea_room': 'Çay Bahçesi',
  'dining': 'Restoran & Yeme İçme',
  'food': 'Yeme & İçme',

  // Bakım & Güzellik
  'beauty salon': 'Güzellik Salonu',
  'beauty': 'Güzellik Salonu',
  'hair salon': 'Kuaför',
  'hairdresser': 'Kuaför',
  'barber': 'Berber',
  'barbershop': 'Berber',
  'spa': 'SPA & Masaj',

  // Alışveriş & Ticaret
  'supermarket': 'Süpermarket',
  'grocery': 'Market',
  'shopping mall': 'Alışveriş Merkezi',
  'shopping center': 'Alışveriş Merkezi',
  'mall': 'Alışveriş Merkezi',
  'clothing store': 'Giyim Mağazası',
  'clothing': 'Giyim & Moda',
  'store': 'Mağaza',
  'shop': 'Mağaza',
  'bank': 'Banka',
  'atm': 'ATM',
  'gas station': 'Akaryakıt İstasyonu',
  'petrol station': 'Akaryakıt İstasyonu',
  'taxi service': 'Taksi Hizmeti',
  'hotel': 'Otel',
  'park': 'Park',
  'gym': 'Spor Salonu & Fitness',
  'fitness center': 'Fitness Merkezi',
  'museum': 'Müze',
  'cinema': 'Sinema',
  'movie theater': 'Sinema',
  'theatre': 'Tiyatro',
};

const WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bburger restaurant\b/gi, 'Burger Restoranı'],
  [/\brestaurant\b/gi, 'Restoranı'],
  [/\bservices\b/gi, 'Hizmetleri'],
  [/\bservice\b/gi, 'Hizmeti'],
  [/\bschool\b/gi, 'Okulu'],
  [/\bcenter\b/gi, 'Merkezi'],
  [/\bcentre\b/gi, 'Merkezi'],
  [/\bstore\b/gi, 'Mağazası'],
  [/\bshop\b/gi, 'Mağazası'],
  [/\brepair\b/gi, 'Tamir'],
  [/\brental\b/gi, 'Kiralama'],
  [/\bcare\b/gi, 'Bakım'],
  [/\bcar\b/gi, 'Oto'],
  [/\bcompany\b/gi, 'Şirketi'],
  [/\bagency\b/gi, 'Ajansı'],
  [/\boffice\b/gi, 'Ofisi'],
  [/\bclinic\b/gi, 'Klinik'],
  [/\bspace\b/gi, 'Alanı'],
  [/\bcoffee\b/gi, 'Kahve'],
  [/\bpizza\b/gi, 'Pizza'],
  [/\bburger\b/gi, 'Burger'],
];

const CATEGORY_MAP_EN: Record<string, string> = {
  // Yeme & İçme (Food & Drink)
  'yeme & içme': 'Food & Drink',
  'yeme ve içme': 'Food & Drink',
  'yeme içme': 'Food & Drink',
  'yeme & i̇çme': 'Food & Drink',
  'yeme i̇çme': 'Food & Drink',
  'food & drink': 'Food & Drink',
  'food and drink': 'Food & Drink',
  'food & drinks': 'Food & Drink',
  'food': 'Food & Drink',
  'restoran & kafe': 'Restaurant & Cafe',
  'restaurant & cafe': 'Restaurant & Cafe',
  'restoran': 'Restaurant',
  'restaurant': 'Restaurant',
  'kafe': 'Cafe',
  'cafe': 'Cafe',
  'kahve': 'Coffee Shop',
  'kahve dükkanı': 'Coffee Shop',
  'coffee': 'Coffee Shop',
  'coffee shop': 'Coffee Shop',
  'bistro': 'Bistro',
  'fırın': 'Bakery',
  'fırın & pastane': 'Bakery & Pastry',
  'pastane': 'Bakery & Pastry',
  'bakery': 'Bakery',
  'patisserie': 'Pastry',
  'tatlıcı': 'Dessert Shop',
  'tatlı': 'Dessert Shop',
  'kahvaltı mekanı': 'Breakfast & Brunch',
  'kahvaltı': 'Breakfast & Brunch',
  'kebapçı': 'Kebab Restaurant',
  'kebap': 'Kebab Restaurant',
  'dönerci': 'Doner Restaurant',
  'döner': 'Doner Restaurant',
  'pizzacı': 'Pizzeria',
  'pizza': 'Pizzeria',
  'burger restoranı': 'Burger Restaurant',
  'burger': 'Burger',
  'hamburger': 'Burger',
  'çorbacı': 'Soup Restaurant',
  'çorba': 'Soup Restaurant',
  'köfteci': 'Meatball Restaurant',
  'köfte': 'Meatball Restaurant',
  'pideci': 'Pide Restaurant',
  'pide': 'Pide Restaurant',
  'balık restoranı': 'Seafood Restaurant',
  'balık & deniz ürünleri': 'Seafood Restaurant',
  'deniz ürünleri': 'Seafood Restaurant',
  'fast food': 'Fast Food',
  'fast_food': 'Fast Food',
  'bar': 'Bar & Pub',
  'pub': 'Pub',
  'meyhane': 'Tavern',
  'ocakbaşı': 'Grill & BBQ',
  'kokoreç': 'Street Food',
  'sokak lezzetleri': 'Street Food',
  'street food': 'Street Food',
  'steakhouse': 'Steakhouse',
  'et & steakhouse': 'Steakhouse',
  'dondurmacı': 'Ice Cream Shop',
  'dondurma': 'Ice Cream',
  'ice cream': 'Ice Cream',
  'şarküteri': 'Delicatessen',
  'delicatessen': 'Delicatessen',
  'çay bahçesi': 'Tea Garden',
  'çay evi': 'Tea House',
  'kantin': 'Canteen',
  'yemek alanı': 'Food Court',

  // Sağlık & Medikal (Health & Medical)
  'sağlık': 'Health',
  'saglik': 'Health',
  'health': 'Health',
  'sağlık & medikal': 'Health & Medical',
  'saglik & medikal': 'Health & Medical',
  'sağlık ve medikal': 'Health & Medical',
  'saglik ve medikal': 'Health & Medical',
  'health & medical': 'Health & Medical',
  'doktor & sağlık': 'Doctor & Health',
  'doktor ve sağlık': 'Doctor & Health',
  'doctor & health': 'Doctor & Health',
  'medikal': 'Medical',
  'doktor': 'Doctor',
  'doctor': 'Doctor',
  'cerrah': 'Surgeon',
  'estetik cerrah': 'Plastic Surgeon',
  'plastik cerrah': 'Plastic Surgeon',
  'estetik': 'Aesthetics & Plastic Surgery',
  'çocuk doktoru': 'Pediatrician',
  'pediatri': 'Pediatrics',
  'pediatrician': 'Pediatrician',
  'hastane': 'Hospital',
  'hospital': 'Hospital',
  'klinik': 'Clinic',
  'clinic': 'Clinic',
  'poliklinik': 'Polyclinic',
  'tıp merkezi': 'Medical Center',
  'sağlık merkezi': 'Health Center',
  'medical center': 'Medical Center',
  'eczane': 'Pharmacy',
  'pharmacy': 'Pharmacy',
  'diş hekimi': 'Dentist',
  'diş kliniği': 'Dental Clinic',
  'diş': 'Dentist',
  'dentist': 'Dentist',
  'veteriner': 'Veterinary',
  'veteriner klinik': 'Veterinary Clinic',
  'veterinary': 'Veterinary',
  'psikolog': 'Psychologist',
  'psychologist': 'Psychologist',
  'diyetisyen': 'Dietitian',
  'fizik tedavi': 'Physical Therapy',
  'göz kliniği': 'Eye Clinic',
  'göz': 'Eye Clinic',

  // Kişisel Bakım & Güzellik (Beauty & Personal Care)
  'kişisel bakım': 'Personal Care',
  'personal care': 'Personal Care',
  'güzellik & bakım': 'Beauty & Care',
  'guzellik & bakim': 'Beauty & Care',
  'güzellik ve bakım': 'Beauty & Care',
  'guzellik ve bakim': 'Beauty & Care',
  'bakım & güzellik': 'Beauty & Care',
  'bakim & guzellik': 'Beauty & Care',
  'beauty & care': 'Beauty & Care',
  'güzellik': 'Beauty',
  'guzellik': 'Beauty',
  'beauty': 'Beauty',
  'güzellik salonu': 'Beauty Salon',
  'guzellik salonu': 'Beauty Salon',
  'beauty salon': 'Beauty Salon',
  'kuaför': 'Hair Salon',
  'kuafor': 'Hair Salon',
  'hair salon': 'Hair Salon',
  'hairdresser': 'Hair Salon',
  'berber': 'Barber',
  'barber': 'Barber',
  'barbershop': 'Barbershop',
  'spa': 'Spa & Wellness',
  'spa & masaj': 'Spa & Massage',
  'masaj': 'Massage & Spa',
  'cilt bakımı': 'Skincare',
  'cilt bakimi': 'Skincare',
  'skincare': 'Skincare',
  'lazer': 'Laser Epilation',
  'tırnak': 'Nail Salon',
  'tirnak': 'Nail Salon',
  'nail salon': 'Nail Salon',
  'solaryum': 'Tanning Salon',
  'makyaj': 'Makeup Studio',

  // Aktivite, Dans & Bale, Spor (Activity & Sports, Dance & Ballet)
  'dans & bale': 'Dance & Ballet',
  'dans ve bale': 'Dance & Ballet',
  'bale & dans': 'Dance & Ballet',
  'bale ve dans': 'Dance & Ballet',
  'dance & ballet': 'Dance & Ballet',
  'dans kursu': 'Dance Studio',
  'dans stüdyosu': 'Dance Studio',
  'dans': 'Dance Studio',
  'dance': 'Dance Studio',
  'bale kursu': 'Ballet School',
  'bale okulu': 'Ballet School',
  'bale': 'Ballet',
  'ballet': 'Ballet',
  'aktivite': 'Activity',
  'activity': 'Activity',
  'aktivite & spor': 'Activity & Sport',
  'aktivite ve spor': 'Activity & Sport',
  'activity & sport': 'Activity & Sport',
  'spor': 'Sports & Fitness',
  'sports': 'Sports & Fitness',
  'fitness': 'Fitness & Gym',
  'gym': 'Fitness & Gym',
  'fitness merkezi': 'Fitness Center',
  'spor salonu': 'Gym & Fitness',
  'pilates': 'Pilates Studio',
  'pilates salonu': 'Pilates Studio',
  'yoga': 'Yoga Studio',
  'yoga salonu': 'Yoga Studio',
  'müze': 'Museum',
  'museum': 'Museum',
  'sinema': 'Cinema',
  'cinema': 'Cinema',
  'movie theater': 'Cinema',
  'tiyatro': 'Theatre',
  'theatre': 'Theatre',
  'park': 'Park',
  'yüzme': 'Swimming Pool',
  'yüzme havuzu': 'Swimming Pool',
  'halı saha': 'Football Pitch',

  // Hizmetler & Usta (Services & Repair)
  'hizmetler': 'Services',
  'hizmet': 'Services',
  'services': 'Services',
  'service': 'Services',
  'usta & tamirat': 'Craftsman & Repair',
  'usta ve tamirat': 'Craftsman & Repair',
  'tamir & bakım': 'Repair & Maintenance',
  'tamir': 'Repair Service',
  'tamirat': 'Repair Service',
  'repair': 'Repair Service',
  'tesisat': 'Plumbing',
  'tesisatçı': 'Plumber',
  'plumber': 'Plumber',
  'elektrik': 'Electrical Services',
  'elektrikçi': 'Electrician',
  'electrician': 'Electrician',
  'oto tamir': 'Car Repair',
  'oto tamir & bakım': 'Car Repair & Maintenance',
  'oto servis & tamir': 'Auto Service & Repair',
  'oto servis': 'Auto Service',
  'oto yıkama': 'Car Wash',
  'car wash': 'Car Wash',
  'oto kiralama': 'Car Rental',
  'car rental': 'Car Rental',
  'temizlik': 'Cleaning Service',
  'temizlik hizmeti': 'Cleaning Service',
  'cleaning': 'Cleaning Service',
  'kuru temizleme': 'Dry Cleaning',
  'terzi': 'Tailor',
  'çilingir': 'Locksmith',
  'nakliye': 'Moving & Logistics',
  'boyacı': 'Painter',
  'marangoz': 'Carpenter',

  // Eğitim (Education)
  'eğitim': 'Education',
  'egitim': 'Education',
  'education': 'Education',
  'eğitim & gelişim': 'Education & Growth',
  'okul': 'School',
  'school': 'School',
  'lise': 'High School',
  'high school': 'High School',
  'ortaokul': 'Middle School',
  'ilkokul': 'Elementary School',
  'anaokulu': 'Kindergarten',
  'kindergarten': 'Kindergarten',
  'kreş': 'Nursery / Daycare',
  'üniversite': 'University',
  'universite': 'University',
  'university': 'University',
  'kolej': 'College',
  'college': 'College',
  'kurs': 'Course & Academy',
  'kursu': 'Course & Academy',
  'akademi': 'Academy',
  'sürücü kursu': 'Driving School',
  'dil kursu': 'Language School',
  'dershane': 'Tutoring Center',

  // Genel & Alışveriş (General & Shopping)
  'mekan': 'Place',
  'yer': 'Place',
  'place': 'Place',
  'mağaza': 'Store & Shopping',
  'alışveriş': 'Shopping',
  'alışveriş merkezi': 'Shopping Mall',
  'avm': 'Shopping Mall',
  'market': 'Supermarket',
  'süpermarket': 'Supermarket',
  'otel': 'Hotel',
  'hotel': 'Hotel',
  'pansiyon': 'Guesthouse',
  'banka': 'Bank',
  'atm': 'ATM',
};

/**
 * Infers category from a place's name when category is generic ('Mekan', 'Place') or missing.
 */
export function inferCategoryFromName(placeName?: string | null): { tr: string; en: string } | null {
  if (!placeName || typeof placeName !== 'string') return null;
  const name = placeName.toLowerCase();

  // Dans & Bale
  if ((name.includes('bale') && name.includes('dans')) || name.includes('dans & bale')) {
    return { tr: 'Dans & Bale', en: 'Dance & Ballet' };
  }
  if (name.includes('bale kursu') || name.includes('bale okulu')) {
    return { tr: 'Dans & Bale', en: 'Dance & Ballet' };
  }
  if (name.includes('dans kursu') || name.includes('dans stüdyosu') || name.includes('dans akademi')) {
    return { tr: 'Dans Stüdyosu', en: 'Dance Studio' };
  }
  if (name.includes('bale')) return { tr: 'Dans & Bale', en: 'Dance & Ballet' };
  if (name.includes('dans')) return { tr: 'Dans Stüdyosu', en: 'Dance Studio' };

  // Yeme & İçme
  if (name.includes('kafe') || name.includes('cafe') || name.includes('kahve') || name.includes('coffee')) {
    return { tr: 'Kafe', en: 'Cafe' };
  }
  if (name.includes('kokoreç') || name.includes('kokorec')) return { tr: 'Yeme & İçme', en: 'Food & Drink' };
  if (name.includes('kebap') || name.includes('ocakbaşı') || name.includes('döner')) return { tr: 'Yeme & İçme', en: 'Food & Drink' };
  if (name.includes('pizza') || name.includes('pizzeria')) return { tr: 'Pizzacı', en: 'Pizzeria' };
  if (name.includes('burger')) return { tr: 'Burger Restoranı', en: 'Burger Restaurant' };
  if (name.includes('restoran') || name.includes('restaurant') || name.includes('lokanta')) return { tr: 'Restoran', en: 'Restaurant' };
  if (name.includes('pastane') || name.includes('fırın') || name.includes('bakery') || name.includes('tatlı')) return { tr: 'Pastane & Fırın', en: 'Bakery & Pastry' };

  // Kişisel Bakım
  if (name.includes('güzellik') || name.includes('beauty') || name.includes('estetik merkez')) return { tr: 'Güzellik & Bakım', en: 'Beauty & Care' };
  if (name.includes('kuaför') || name.includes('kuafor') || name.includes('hair') || name.includes('berber')) return { tr: 'Kuaför & Berber', en: 'Hair Salon' };
  if (name.includes('spa') || name.includes('masaj')) return { tr: 'SPA & Masaj', en: 'Spa & Wellness' };

  // Sağlık
  if (name.includes('cerrah') || name.includes('doktor') || name.includes('dr.') || name.includes('dr ') || name.includes('hekim')) return { tr: 'Sağlık & Medikal', en: 'Health & Medical' };
  if (name.includes('klinik') || name.includes('hastane') || name.includes('hospital') || name.includes('poliklinik')) return { tr: 'Sağlık & Medikal', en: 'Health & Medical' };
  if (name.includes('diş') || name.includes('dentist')) return { tr: 'Diş Hekimi', en: 'Dentist' };
  if (name.includes('eczane') || name.includes('pharmacy')) return { tr: 'Eczane', en: 'Pharmacy' };
  if (name.includes('veteriner')) return { tr: 'Veteriner', en: 'Veterinary' };

  // Spor & Aktivite
  if (name.includes('pilates')) return { tr: 'Pilates', en: 'Pilates Studio' };
  if (name.includes('yoga')) return { tr: 'Yoga', en: 'Yoga Studio' };
  if (name.includes('fitness') || name.includes('gym')) return { tr: 'Spor & Fitness', en: 'Fitness & Gym' };

  // Eğitim
  if (name.includes('kursu') || name.includes('akademi') || name.includes('dershane')) return { tr: 'Kurs & Akademi', en: 'Course & Academy' };
  if (name.includes('okul') || name.includes('kolej') || name.includes('lise')) return { tr: 'Okul & Eğitim', en: 'School & Education' };

  return null;
}

export function formatCategory(
  category?: string | null,
  lang: 'tr' | 'en' = 'tr',
  placeName?: string | null
): string {
  const trimmed = (category || '').trim();
  const lower = trimmed
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/İ/g, 'i')
    .replace(/i̇/g, 'i');

  const isGeneric = !trimmed || lower === 'mekan' || lower === 'place' || lower === 'diğer' || lower === 'other';

  // If generic category or missing, attempt to infer from place name
  if (isGeneric && placeName) {
    const inferred = inferCategoryFromName(placeName);
    if (inferred) {
      return lang === 'en' ? inferred.en : inferred.tr;
    }
  }

  if (isGeneric) {
    return lang === 'en' ? 'Place' : 'Mekan';
  }

  if (lang === 'en') {
    // 1. Direct match
    if (CATEGORY_MAP_EN[lower]) {
      return CATEGORY_MAP_EN[lower];
    }
    // 2. Partial match sorted by length descending (longest keys match first)
    const sortedKeys = Object.keys(CATEGORY_MAP_EN).sort((a, b) => b.length - a.length);
    for (const trKey of sortedKeys) {
      if (lower.includes(trKey)) {
        return CATEGORY_MAP_EN[trKey];
      }
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // 1. Direct dictionary match for Turkish
  if (EXACT_CATEGORY_MAP[lower]) {
    return EXACT_CATEGORY_MAP[lower];
  }

  // 2. Partial dictionary match (longest keys match first)
  const sortedExactKeys = Object.keys(EXACT_CATEGORY_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedExactKeys) {
    if (lower === key || lower.includes(key)) {
      return EXACT_CATEGORY_MAP[key];
    }
  }

  // 3. Fallback word replacements if still contains English terms
  let result = trimmed;
  let hasEnglishWords = false;

  for (const [regex, replacement] of WORD_REPLACEMENTS) {
    if (regex.test(result)) {
      hasEnglishWords = true;
      result = result.replace(regex, replacement);
    }
  }

  if (hasEnglishWords) {
    return result;
  }

  return trimmed;
}

export function formatLocation(location?: string | null, lang: 'tr' | 'en' = 'tr'): string {
  if (!location || typeof location !== 'string') return '';
  let loc = location.trim();
  if (!loc) return '';

  // Fix English city/district name variations and capitalization
  loc = loc
    .replace(/\bIstanbul\b/gi, 'İstanbul')
    .replace(/\bIzmir\b/gi, 'İzmir')
    .replace(/\bCankaya\b/gi, 'Çankaya')
    .replace(/\bKarsiyaka\b/gi, 'Karşıyaka')
    .replace(/\bBostanci\b/gi, 'Bostancı')
    .replace(/\bKadikoy\b/gi, 'Kadıköy')
    .replace(/\bBesiktas\b/gi, 'Beşiktaş')
    .replace(/\bSisli\b/gi, 'Şişli')
    .replace(/\bBornova\b/gi, 'Bornova')
    .replace(/\bMenemen\b/gi, 'Menemen')
    .replace(/\bTurkey\b/gi, 'Türkiye');

  // Fix lowercase district/city formats like "izmir, izmir" -> "İzmir" or "menemen/izmir" -> "Menemen, İzmir"
  loc = loc.replace(/\//g, ', ');

  if (lang === 'en') {
    loc = loc
      .replace(/\bTürkiye\b/gi, 'Turkey')
      .replace(/\bMahallesi\b/gi, 'Neighborhood')
      .replace(/\bMah\./gi, 'Neighborhood');
  }

  // Capitalize properly if all lowercase or all uppercase (e.g. ORAN -> Oran)
  const parts = loc.split(',').map(p => {
    let pt = p.trim();
    if (!pt) return '';
    if (pt.toLowerCase() === 'izmir') return 'İzmir';
    if (pt.toLowerCase() === 'istanbul') return 'İstanbul';
    if (pt.toLowerCase() === 'ankara') return 'Ankara';
    return pt.charAt(0).toUpperCase() + pt.slice(1).toLowerCase();
  }).filter(Boolean);

  // Deduplicate redundant city parts like "İzmir, İzmir"
  const uniqueParts: string[] = [];
  for (const part of parts) {
    if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
      uniqueParts.push(part);
    }
  }

  return uniqueParts.join(', ');
}
