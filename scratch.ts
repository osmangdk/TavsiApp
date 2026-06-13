import { supabase } from './src/services/supabaseClient';

async function test() {
  const { data, error } = await supabase.from('places').select('*').limit(5);
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

test();
