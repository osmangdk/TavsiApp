const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '..', 'src', 'services', 'supabaseClient.ts');
const content = fs.readFileSync(clientPath, 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

const EXACT_CATEGORY_MAP = {
  // Eğitim
  'High School': 'Lise',
  'high school': 'Lise',
  'high_school': 'Lise',
  'Secondary School': 'Ortaokul',
  'Middle School': 'Ortaokul',
  'middle school': 'Ortaokul',
  'Elementary School': 'İlkokul',
  'Primary School': 'İlkokul',
  'Preschool': 'Anaokulu',
  'Kindergarten': 'Anaokulu',
  'Day Care Preschool': 'Anaokulu & Kreş',
  'Child Care And Day Care': 'Anaokulu & Kreş',
  'Private School': 'Özel Okul',
  'School': 'Okul',
  'College': 'Kolej',
  'University': 'Üniversite',
  'Driving School': 'Sürücü Kursu',
  'Language School': 'Dil Kursu',
  'Tutoring Center': 'Dershane',
  'Tutoring': 'Dershane',
  'Vocational And Technical School': 'Meslek Lisesi',
  'Educational Services': 'Eğitim Hizmetleri',

  // Hizmetler & Kurumsal
  'Professional Services': 'Profesyonel Hizmetler',
  'Professional Service': 'Profesyonel Hizmetler',
  'professional services': 'Profesyonel Hizmetler',
  'Business To Business Services': 'Kurumsal Hizmetler',
  'Home Service': 'Ev Hizmetleri',
  'Financial Service': 'Finansal Hizmetler',
  'Financial Services': 'Finansal Hizmetler',
  'Legal Services': 'Hukuk Hizmetleri',
  'Legal Service': 'Hukuk Hizmetleri',
  'Real Estate Service': 'Emlak & Gayrimenkul',
  'Real Estate': 'Emlak & Gayrimenkul',
  'Engineering Services': 'Mühendislik Hizmetleri',
  'Construction Services': 'İnşaat Hizmetleri',
  'Printing Services': 'Baskı & Matbaa',
  'Rental Service': 'Kiralama Hizmetleri',
  'Rental Services': 'Kiralama Hizmetleri',
  'Event Technology Service': 'Etkinlik & Organizasyon',
  'Corporate Entertainment Services': 'Kurumsal Etkinlik Hizmetleri',
  'Freight And Cargo Service': 'Kargo & Lojistik',
  'Automation Services': 'Otomasyon Hizmetleri',
  'Agricultural Service': 'Tarımsal Hizmetler',
  'Water Treatment Equipment And Services': 'Su Teknolojileri & Arıtma',
  'Garbage Collection Service': 'Atık & Geri Dönüşüm',
  'Community Services Non Profits': 'Sosyal & Sivil Toplum',
  'Public Service And Government': 'Kamu & Devlet Kurumu',
  'Government Services': 'Kamu Hizmetleri',
  'Auto Restoration Services': 'Oto Restorasyon & Ekspertiz',
  'Automotive Services And Repair': 'Oto Servis & Tamir',
  'Car Inspection': 'Oto Ekspertiz',
  'Photography Store And Services': 'Fotoğrafçılık Hizmetleri',
  'Hvac Services': 'İklimlendirme & Havalandırma',
  'Cleaning Service': 'Temizlik Hizmeti',
  'Dry Cleaning': 'Kuru Temizleme',
  'Repair Service': 'Tamir Hizmeti',

  // Sağlık & Medikal
  'Hospital': 'Hastane',
  'Clinic': 'Klinik',
  'Medical Center': 'Sağlık Merkezi',
  'Health': 'Sağlık',
  'Health And Medical': 'Sağlık & Medikal',
  'Pharmacy': 'Eczane',
  'Dentist': 'Diş Hekimi',
  'Doctor': 'Doktor',
  'Veterinarian': 'Veteriner',
  'Medical Service': 'Medikal Hizmet',
  'Pediatrician': 'Çocuk Doktoru',
  'Dermatologist': 'Cildiye (Dermatoloji)',
  'Surgeon': 'Cerrah',
  'Psychotherapist': 'Psikoterapist',
  'Psychiatrist': 'Psikiyatri',
  'Orthopedist': 'Ortopedi Uzmanı',
  'Endocrinologist': 'Endokrinoloji',
  'Audiologist': 'Odyoloji Uzmanı',
  'Ear Nose And Throat': 'Kulak Burun Boğaz',
  'Obstetrician And Gynecologist': 'Kadın Doğum Uzmanı',
  'Plastic Surgeon': 'Estetik Cerrahı',
  'Urologist': 'Üroloji Uzmanı',
  'Radiologist': 'Radyoloji Uzmanı',
  'Neurologist': 'Nöroloji Uzmanı',
  'Pulmonologist': 'Göğüs Hastalıkları Uzmanı',

  // Yeme & İçme
  'Restaurant': 'Restoran',
  'Fast Food': 'Fast Food',
  'fast food': 'Fast Food',
  'Cafe': 'Kafe',
  'Coffee Shop': 'Kafe',
  'Bakery': 'Fırın & Pastane',
  'Bar': 'Bar & Gece Hayatı',
  'Pub': 'Bar & Gece Hayatı',
  'Soup Restaurant': 'Çorbacı',
  'Theme Restaurant': 'Tematik Restoran',
  'Seafood Restaurant': 'Deniz Ürünleri Restoranı',

  // Bakım & Güzellik
  'Beauty Salon': 'Güzellik Salonu',
  'Hair Salon': 'Kuaför',
  'Barber': 'Berber',
  'Barbershop': 'Berber',
  'Spa': 'SPA & Masaj',
  'Spas': 'SPA & Masaj',
  'Nail Salon': 'Tırnak Salonu',
  'Skin Care': 'Cilt Bakımı',

  // Alışveriş & Ticaret
  'Supermarket': 'Süpermarket',
  'Grocery': 'Market',
  'Shopping Mall': 'Alışveriş Merkezi',
  'Clothing Store': 'Giyim Mağazası',
  'Store': 'Mağaza',
  'Bank': 'Banka',
  'Atm': 'ATM',
  'Gas Station': 'Akaryakıt İstasyonu',
  'Car Wash': 'Oto Yıkama',
  'Taxi Service': 'Taksi Hizmeti',
  'Hotel': 'Otel',
  'Park': 'Park',
};

async function updateDbCategories() {
  console.log('🌍 Veritabanı kapsamlı Türkçe kategori güncellemesi (.eq) başlatılıyor...');
  let totalUpdated = 0;

  for (const [engCat, trCat] of Object.entries(EXACT_CATEGORY_MAP)) {
    // Exact match kullanılarak hızlıca ID'ler alınıyor
    const { data: places, error: fetchErr } = await supabase
      .from('places')
      .select('id')
      .eq('category', engCat)
      .limit(5000);

    if (fetchErr) {
      console.error(`"${engCat}" aranırken hata:`, fetchErr.message);
      continue;
    }

    if (places && places.length > 0) {
      const ids = places.map(p => p.id);
      
      for (let i = 0; i < ids.length; i += 100) {
        const batchIds = ids.slice(i, i + 100);
        const { error: updateErr } = await supabase
          .from('places')
          .update({ category: trCat })
          .in('id', batchIds);

        if (updateErr) {
          console.error(`"${engCat}" paketi güncellenirken hata:`, updateErr.message);
        } else {
          totalUpdated += batchIds.length;
        }
      }
      console.log(`✅ "${engCat}" ➔ "${trCat}" (${places.length} mekan güncellendi)`);
    }
  }

  console.log(`\n🎉 İşlem tamamlandı! Toplam ${totalUpdated} mekan kategorisi Türkçe'ye güncellendi.`);
}

updateDbCategories();
