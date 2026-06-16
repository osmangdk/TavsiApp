const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  async function test() {
    const {data: profiles} = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles schema:");
    const {data: info, error} = await supabase.rpc('get_schema', {});
    // just try inserting to see error
    const res = await supabase.from('profiles').insert([{id: '00000000-0000-0000-0000-000000000000', email: 'test@test.com'}]);
    console.log("Insert result:", res);
  }
  test();
}
