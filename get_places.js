const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  async function test() {
    const {data, error} = await supabase.rpc('get_table_columns', { table_name: 'places' });
    if(error) {
       // RPC might not exist, let's just insert a dummy place and fetch it
       await supabase.from('places').insert([{name: 'test', city: 'test'}]);
       const {data: places} = await supabase.from('places').select('*').limit(1);
       console.log(places);
    } else {
       console.log(data);
    }
  }
  test();
}
