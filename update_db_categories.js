const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

const EXACT_CATEGORY_MAP = {
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
  'bakery': 'Fırın & Pastane',
  'bar': 'Bar & Gece Hayatı',
  'pub': 'Bar & Gece Hayatı',

  // Bakım & Güzellik
  'beauty salon': 'Güzellik Salonu',
  'hair salon': 'Kuaför',
  'barber': 'Berber',
  'barbershop': 'Berber',
  'spa': 'SPA & Masaj',

  // Alışveriş & Ticaret
  'supermarket': 'Süpermarket',
  'grocery': 'Market',
  'shopping mall': 'Alışveriş Merkezi',
  'clothing store': 'Giyim Mağazası',
  'store': 'Mağaza',
  'bank': 'Banka',
  'atm': 'ATM',
  'gas station': 'Akaryakıt İstasyonu',
  'car wash': 'Oto Yıkama',
  'taxi service': 'Taksi Hizmeti',
  'hotel': 'Otel',
  'park': 'Park',
};

async function updateDbCategories() {
  console.log('Starting DB category translation update...');
  
  for (const [engCat, trCat] of Object.entries(EXACT_CATEGORY_MAP)) {
    // Exact match update
    const { data: updated, error } = await supabase
      .from('places')
      .update({ category: trCat })
      .ilike('category', engCat)
      .select('id');
      
    if (error) {
      console.error(`Error updating category "${engCat}":`, error.message);
    } else if (updated && updated.length > 0) {
      console.log(`Updated ${updated.length} places from "${engCat}" to "${trCat}"`);
    }
  }

  console.log('Finished exact category updates. Checking remaining English category patterns...');

  // Also query any categories with "Service", "School", "Center"
  const { data: remaining } = await supabase
    .from('places')
    .select('id, category')
    .or('category.ilike.%service%,category.ilike.%school%,category.ilike.%center%,category.ilike.%store%')
    .limit(1000);

  if (remaining && remaining.length > 0) {
    console.log(`Found ${remaining.length} remaining places with potential English terms.`);
    let count = 0;
    for (const p of remaining) {
      let newCat = p.category
        .replace(/\bservices\b/gi, 'Hizmetleri')
        .replace(/\bservice\b/gi, 'Hizmeti')
        .replace(/\bschool\b/gi, 'Okulu')
        .replace(/\bcenter\b/gi, 'Merkezi')
        .replace(/\bstore\b/gi, 'Mağazası');

      if (newCat !== p.category) {
        await supabase.from('places').update({ category: newCat }).eq('id', p.id);
        count++;
      }
    }
    console.log(`Updated ${count} additional place category strings.`);
  }

  console.log('All DB category updates completed!');
}

updateDbCategories();
