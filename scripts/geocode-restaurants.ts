/**
 * Geocoding Script for Royal Plate Restaurants
 *
 * This script geocodes restaurant addresses to latitude/longitude coordinates
 * using OpenStreetMap's Nominatim API (free, no API key required)
 *
 * Usage:
 * 1. Update SUPABASE_URL and SUPABASE_ANON_KEY below
 * 2. Run: npx tsx scripts/geocode-restaurants.ts
 */

import { createClient } from '@supabase/supabase-js';

// ⚠️ UPDATE THESE WITH YOUR SUPABASE CREDENTIALS
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 */
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, Yangon, Myanmar&limit=1`,
      {
        headers: {
          'User-Agent': 'RoyalPlateApp/1.0',
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Main function to geocode all restaurants
 */
async function geocodeAllRestaurants() {
  console.log('🗺️  Starting restaurant geocoding...\n');

  // Fetch restaurants without coordinates
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, address, latitude, longitude')
    .or('latitude.is.null,longitude.is.null');

  if (error) {
    console.error('❌ Error fetching restaurants:', error);
    return;
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ All restaurants already have coordinates!');
    return;
  }

  console.log(`📍 Found ${restaurants.length} restaurants to geocode\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    console.log(`[${i + 1}/${restaurants.length}] Processing: ${restaurant.name}`);
    console.log(`   Address: ${restaurant.address}`);

    const coords = await geocodeAddress(restaurant.address);

    if (coords) {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        .eq('id', restaurant.id);

      if (updateError) {
        console.log(`   ❌ Failed to update database: ${updateError.message}\n`);
        failCount++;
      } else {
        console.log(`   ✅ Success! Coordinates: ${coords.latitude}, ${coords.longitude}\n`);
        successCount++;
      }
    } else {
      console.log(`   ❌ Could not geocode address\n`);
      failCount++;
    }

    // Rate limit: Wait 1 second between requests (Nominatim requirement)
    if (i < restaurants.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n📊 Geocoding Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📍 Total: ${restaurants.length}`);
}

/**
 * Alternative: Manually set coordinates for specific restaurants
 */
async function setManualCoordinates() {
  console.log('📍 Setting manual coordinates...\n');

  const manualCoordinates = [
    // Example: Update these with your actual restaurant IDs and coordinates
    // { id: 'restaurant-id-1', latitude: 16.8661, longitude: 96.1951 },
    // { id: 'restaurant-id-2', latitude: 16.8050, longitude: 96.1560 },
  ];

  for (const coord of manualCoordinates) {
    const { error } = await supabase
      .from('restaurants')
      .update({
        latitude: coord.latitude,
        longitude: coord.longitude,
      })
      .eq('id', coord.id);

    if (error) {
      console.log(`❌ Failed to update ${coord.id}: ${error.message}`);
    } else {
      console.log(`✅ Updated ${coord.id}`);
    }
  }

  console.log('\n✅ Manual coordinates set!');
}

// Run the script
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ Please update SUPABASE_URL and SUPABASE_ANON_KEY in the script first!');
  process.exit(1);
}

// Choose which function to run:
geocodeAllRestaurants(); // Automatic geocoding
// setManualCoordinates(); // Manual coordinate setting
