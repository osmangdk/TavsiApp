const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const {data, error} = await supabase.from('user_places').select('*, places(*)');
  console.log(JSON.stringify(data || error, null, 2));
}
run();
