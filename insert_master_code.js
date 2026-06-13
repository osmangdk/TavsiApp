const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');

const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  async function insertCode() {
    const { data, error } = await supabase
      .from('invitations')
      .upsert([{ 
        code: 'TAVSI-KURUCU', 
        used_count: 0, 
        max_uses: 999999 
      }], { onConflict: 'code' });
      
    if (error) {
      console.error("Error inserting code:", error);
    } else {
      console.log("Master code TAVSI-KURUCU inserted successfully!");
    }
  }
  
  insertCode();
} else {
  console.log("Could not find supabase credentials in supabaseClient.ts");
}
