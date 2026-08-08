const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Supabase Proje Bilgilerini Bul (supabaseClient.ts dosyasından otomatik okuma)
function getSupabaseCredentials() {
  try {
    const clientPath = path.join(__dirname, '..', 'src', 'services', 'supabaseClient.ts');
    if (fs.existsSync(clientPath)) {
      const content = fs.readFileSync(clientPath, 'utf8');
      const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
      const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);
      
      return {
        url: urlMatch ? urlMatch[1] : null,
        anonKey: keyMatch ? keyMatch[1] : null
      };
    }
  } catch (e) {
    console.warn("supabaseClient.ts dosyası okunamadı, varsayılan ayarlara geçiliyor.");
  }
  return { url: null, anonKey: null };
}

// Kurumsal ağ / Proxy SSL sertifikası engellerini aşmak için TLS sertifika doğrulamasını esnetelim
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
  const credentials = getSupabaseCredentials();

  
  // Çevre değişkenlerinden (environment variables) veya doğrudan buraya yazarak service_role key girilebilir
  const supabaseUrl = process.env.SUPABASE_URL || credentials.url || 'https://whisegvjblycobvarfpj.supabase.co';
  
  // Service role key for bypass RLS in bulk imports
  const defaultServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoaXNlZ3ZqYmx5Y29idmFyZnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTExMjEzNCwiZXhwIjoyMDk2Njg4MTM0fQ.vsbep_QwHPqVkgYy-VmEFz3ljLQzW2VCH9PCjQv-Wdo';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || defaultServiceKey || credentials.anonKey;


  if (!supabaseKey) {
    console.error("Hata: Supabase API anahtarı bulunamadı.");
    console.log("Lütfen SUPABASE_SERVICE_ROLE_KEY çevre değişkenini ayarlayın veya bu betiği düzenleyin.");
    process.exit(1);
  }

  const jsonPath = path.join(__dirname, '..', 'filtered_places.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Hata: '${jsonPath}' dosyası bulunamadı.`);
    console.log("Lütfen önce python extract_osm.py scriptini çalıştırarak bu dosyayı oluşturun.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Toplam ${data.length} adet mekan veritabanına aktarılıyor...`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Verileri 1000'erli paketler halinde toplu insert (bulk upsert) olarak yükleyelim
  const chunkSize = 3000;
  let successCount = 0;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    // Veritabanına toplu ekleme
    const { error } = await supabase
      .from('places')
      .upsert(chunk, { onConflict: 'osm_id' });

    if (error) {
      console.error(`\nHata oluştu (${i} - ${i + chunk.length} arası):`, error.message);
      console.log("İpucu: Eğer RLS (Row Level Security) izni hatası alıyorsanız, veritabanınızda şu SQL kodunu geçici olarak çalıştırın:");
      console.log("CREATE POLICY \"Allow anon insert on places\" ON public.places FOR INSERT WITH CHECK (true);");
      console.log("İşlem tamamlandıktan sonra bu politikayı silebilirsiniz.");
      break;
    } else {
      successCount += chunk.length;
      process.stdout.write(`\r+ ${successCount} / ${data.length} mekan başarıyla aktarıldı.`);
    }
  }

  console.log("\nAktarım işlemi tamamlandı!");
}

run().catch(console.error);
