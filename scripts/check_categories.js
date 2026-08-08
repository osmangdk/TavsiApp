const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '..', 'src', 'services', 'supabaseClient.ts');
const content = fs.readFileSync(clientPath, 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  async function run() {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    
    console.log('Veritabanındaki kategoriler kontrol ediliyor...');
    while (true) {
      const { data, error } = await supabase
        .from('places')
        .select('id, category, name')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        console.error(error);
        break;
      }
      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    console.log(`Toplam çekilen mekan sayısı: ${allData.length}`);
    const counts = {};
    allData.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    console.log('Kategori Dağılımı:', counts);
  }
  run();
}
