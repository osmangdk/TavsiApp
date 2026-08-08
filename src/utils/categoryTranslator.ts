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

  // Hizmetler & Kurumsal
  'professional services': 'Profesyonel Hizmetler',
  'professional service': 'Profesyonel Hizmetler',
  'home service': 'Ev Hizmetleri',
  'financial service': 'Finansal Hizmetler',
  'financial services': 'Finansal Hizmetler',
  'legal services': 'Hukuk Hizmetleri',
  'legal service': 'Hukuk Hizmetleri',
  'real estate service': 'Emlak & Gayrimenkul',
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
  'medical service': 'Medikal Hizmet',

  // Yeme & İçme
  'restaurant': 'Restoran',
  'fast food': 'Fast Food',
  'fast_food': 'Fast Food',
  'cafe': 'Kafe',
  'coffee shop': 'Kafe',
  'coffee_shop': 'Kafe',
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
  'delicatessen': 'Şarküteri',
  'deli': 'Şarküteri',
  'tea_house': 'Çay Bahçesi',
  'tea_room': 'Çay Bahçesi',
  'dining': 'Restoran & Yeme İçme',
  'food': 'Yeme & İçme',
};

const WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bservices\b/gi, 'Hizmetleri'],
  [/\bservice\b/gi, 'Hizmeti'],
  [/\bschool\b/gi, 'Okulu'],
  [/\bcenter\b/gi, 'Merkezi'],
  [/\bstore\b/gi, 'Mağazası'],
  [/\brepair\b/gi, 'Tamir'],
  [/\brental\b/gi, 'Kiralama'],
];

export function formatCategory(category?: string | null): string {
  if (!category || typeof category !== 'string') return 'Mekan';

  const trimmed = category.trim();
  if (!trimmed) return 'Mekan';

  const lower = trimmed.toLowerCase().replace(/_/g, ' ');

  // 1. Direct dictionary match
  if (EXACT_CATEGORY_MAP[lower]) {
    return EXACT_CATEGORY_MAP[lower];
  }

  // 2. Partial dictionary match
  for (const [key, trVal] of Object.entries(EXACT_CATEGORY_MAP)) {
    if (lower === key) return trVal;
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

export function formatLocation(location?: string | null): string {
  if (!location || typeof location !== 'string') return '';
  let loc = location.trim();
  if (!loc) return '';

  // Fix English city name variations
  loc = loc
    .replace(/\bIstanbul\b/g, 'İstanbul')
    .replace(/\bIzmir\b/g, 'İzmir')
    .replace(/\bCankaya\b/g, 'Çankaya')
    .replace(/\bKarsiyaka\b/g, 'Karşıyaka')
    .replace(/\bBostanci\b/g, 'Bostancı')
    .replace(/\bKadikoy\b/g, 'Kadıköy')
    .replace(/\bBesiktas\b/g, 'Beşiktaş')
    .replace(/\bSisli\b/g, 'Şişli');

  // Deduplicate redundant city parts like "İstanbul, İstanbul" or "Ankara, Ankara"
  const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
  const uniqueParts: string[] = [];
  for (const part of parts) {
    if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
      uniqueParts.push(part);
    }
  }

  return uniqueParts.join(', ');
}
