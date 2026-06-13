const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  Promise.all([
    supabase.from('cities').select('*', {count: 'exact', head: true}),
    supabase.from('districts').select('*', {count: 'exact', head: true}),
    supabase.from('neighborhoods').select('*', {count: 'exact', head: true})
  ]).then((res) => {
    console.log('Cities: ' + res[0].count);
    console.log('Districts: ' + res[1].count);
    console.log('Neighborhoods: ' + res[2].count);
  });
}
