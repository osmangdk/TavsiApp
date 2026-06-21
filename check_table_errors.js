const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

async function test() {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  const email = `test_runner_${Date.now()}@tavsi.com`;
  const password = 'TestPassword123!';
  
  console.log(`Signing up test user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError) {
    console.error("SignUp Error:", signUpError);
    return;
  }
  
  const userId = signUpData.user?.id;
  console.log("Logged in! Simulating selectedPrefs save...");
  
  // Simulated selectedPrefs from MandatoryPreferencesScreen.tsx
  const selectedPrefs = [
    {
      id: '3583274', // Photon ID
      name: 'Photon Cafe',
      category: 'Kafe',
      city: 'Istanbul',
      district: 'Kadikoy',
      rating: 5,
      review_text: 'Nice cafe',
      visibility: 'network'
    },
    {
      id: 'custom_123456789', // Custom ID
      name: 'My Custom Dentist',
      category: 'Doktor',
      city: 'Ankara',
      district: 'Cankaya',
      rating: 4,
      review_text: 'Good dentist',
      visibility: 'public'
    }
  ];

  for (const place of selectedPrefs) {
    console.log(`Saving place: ${place.name}...`);
    const { data: placeData, error: placeError } = await supabase
      .from('places')
      .upsert({
        osm_id: place.id.toString(),
        name: place.name,
        category: place.category,
        city: place.city,
        district: place.district,
        latitude: place.latitude,
        longitude: place.longitude
      }, { onConflict: 'osm_id' })
      .select()
      .single();
      
    if (placeError || !placeData) {
      console.error(`Error saving place ${place.name}:`, placeError);
      continue;
    }

    console.log(`Saved place in places table: ${placeData.id}. Saving user_place...`);

    const { data: upData, error: upError } = await supabase
      .from('user_places')
      .upsert({
        user_id: userId,
        place_id: placeData.id,
        rating: place.rating || 0,
        review_text: place.review_text || null,
        visibility: place.visibility || 'network'
      }, { onConflict: 'user_id, place_id' })
      .select();
      
    if (upError) {
      console.error(`Error saving user_place for ${place.name}:`, upError);
    } else {
      console.log(`Saved user_place for ${place.name} successfully!`);
    }
  }
}

test();
