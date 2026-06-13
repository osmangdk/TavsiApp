const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://whisegvjblycobvarfpj.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZqUrpHoKIOUyFNc42-UMSw_l4IcbAqZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function seed() {
  console.log('Veriler okunuyor...');
  const dataPath = path.join(__dirname, 'temp_data', 'il_ilce_mahalle.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const locationData = JSON.parse(rawData);

  const cities = Object.keys(locationData);
  console.log(`Toplam ${cities.length} il bulundu. Veritabanına ekleniyor...`);

  for (const cityName of cities) {
    // 1. İli ekle
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .insert([{ name: cityName }])
      .select()
      .single();

    if (cityError) {
      console.error(`İl eklenemedi (${cityName}):`, cityError.message);
      continue;
    }

    const cityId = cityData.id;
    console.log(`+ ${cityName} eklendi.`);

    const districtsObj = locationData[cityName];
    const districtNames = Object.keys(districtsObj);

    for (const districtName of districtNames) {
      // 2. İlçeyi ekle
      const { data: districtData, error: districtError } = await supabase
        .from('districts')
        .insert([{ city_id: cityId, name: districtName }])
        .select()
        .single();

      if (districtError) {
        console.error(`  - İlçe eklenemedi (${districtName}):`, districtError.message);
        continue;
      }

      const districtId = districtData.id;
      const neighborhoods = districtsObj[districtName];

      // 3. Mahalleleri batch halinde ekle
      const neighborhoodPayloads = neighborhoods.map(n => ({
        district_id: districtId,
        name: n
      }));

      // Supabase insert can handle arrays. To avoid huge payloads, chunks of 1000 can be used, but neighborhoods per district is usually < 200.
      const { error: hoodError } = await supabase
        .from('neighborhoods')
        .insert(neighborhoodPayloads);

      if (hoodError) {
        console.error(`    x Mahalleler eklenemedi (${districtName}):`, hoodError.message);
      }
    }
  }

  console.log('Tüm veriler başarıyla eklendi!');
}

seed().catch(console.error);
