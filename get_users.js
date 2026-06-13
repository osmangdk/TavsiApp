const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  async function test() {
    const {data: profiles} = await supabase.from('profiles').select('*');
    console.log(profiles);
  }
  test();
}
