# OpenStreetMap Integration Guide for Royal Plate

## Overview

Royal Plate now uses **OpenStreetMap (OSM)** via **Leaflet** for all map features. OpenStreetMap is completely free and open-source - **no API key required**!

## What's Been Implemented

### 1. **Home Page Map Overview**
- Interactive map showing all onboarded restaurants
- Custom Royal Plate logo markers for each restaurant
- Click markers to navigate to restaurant details
- Toggle map visibility with "Show/Hide" button
- Automatically centers on user's location (or Yangon center)

### 2. **Restaurant Details Map**
- Individual map for each restaurant location
- Shows route line from user location to restaurant
- Custom markers for both user and restaurant
- Expandable/collapsible map view

### 3. **Real Distance Calculation**
- Uses Haversine formula to calculate actual distances
- Distances calculated from user's GPS location
- Falls back to Yangon city center if location denied
- Restaurants sorted by distance (closest first)

### 4. **Database Updates**
- Added `latitude` and `longitude` columns to restaurants table
- Migration file created: `supabase/migrations/add_restaurant_coordinates.sql`

## No API Key Needed! 🎉

OpenStreetMap is completely free and doesn't require any API keys. The tiles are served from:
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

However, for production use, you should:
1. Add a proper User-Agent header (already done: "RoyalPlateApp/1.0")
2. Consider using a tile server provider for better performance
3. Follow OSM's [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)

## Setup Instructions

### Step 1: Run Database Migration

You need to add latitude and longitude columns to your restaurants table:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard
```

Go to your Supabase project → SQL Editor → Run this:

```sql
-- Add latitude and longitude columns
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
```

### Step 2: Add Coordinates to Your Restaurants

You need to add actual coordinates for each restaurant. Here are several ways:

#### Option A: Manual Entry via Supabase Dashboard
1. Go to Supabase Dashboard → Table Editor → restaurants
2. For each restaurant, add latitude and longitude values
3. Use [latlong.net](https://www.latlong.net/) to find coordinates

#### Option B: Use Geocoding Script
Create a script to geocode addresses automatically:

```typescript
// scripts/geocode-restaurants.ts
import { supabase } from './supabase-client';
import { geocodeAddress } from '../src/utils/location';

async function geocodeAllRestaurants() {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, address, latitude, longitude')
    .is('latitude', null);

  for (const restaurant of restaurants || []) {
    const coords = await geocodeAddress(restaurant.address);

    if (coords) {
      await supabase
        .from('restaurants')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        .eq('id', restaurant.id);

      console.log(`✓ Geocoded: ${restaurant.address}`);
    } else {
      console.log(`✗ Failed: ${restaurant.address}`);
    }

    // Rate limit: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

geocodeAllRestaurants();
```

#### Option C: Use Google Maps to Find Coordinates
1. Open Google Maps
2. Right-click on the restaurant location
3. Click the coordinates to copy them
4. Update your database

### Step 3: Sample Yangon Coordinates

Here are some sample coordinates for different areas in Yangon:

```sql
-- Downtown Yangon
UPDATE restaurants SET latitude = 16.7833, longitude = 96.1667 WHERE name = 'Restaurant 1';

-- Bahan Township
UPDATE restaurants SET latitude = 16.8050, longitude = 96.1560 WHERE name = 'Restaurant 2';

-- Kamayut Township
UPDATE restaurants SET latitude = 16.8300, longitude = 96.1400 WHERE name = 'Restaurant 3';

-- Sanchaung Township
UPDATE restaurants SET latitude = 16.8100, longitude = 96.1300 WHERE name = 'Restaurant 4';

-- Yankin Township
UPDATE restaurants SET latitude = 16.8400, longitude = 96.1500 WHERE name = 'Restaurant 5';

-- Mayangone Township
UPDATE restaurants SET latitude = 16.8700, longitude = 96.1200 WHERE name = 'Restaurant 6';

-- Hlaing Township
UPDATE restaurants SET latitude = 16.8200, longitude = 96.1100 WHERE name = 'Restaurant 7';

-- Insein Township
UPDATE restaurants SET latitude = 16.8900, longitude = 96.1000 WHERE name = 'Restaurant 8';

-- Mingalar Taung Nyunt
UPDATE restaurants SET latitude = 16.7700, longitude = 96.1800 WHERE name = 'Restaurant 9';

-- Pazundaung Township
UPDATE restaurants SET latitude = 16.7600, longitude = 96.1900 WHERE name = 'Restaurant 10';
```

## Features Explained

### 1. User Location Detection
The app automatically requests user's GPS location:
- If granted: Uses actual user location for distance calculations
- If denied: Falls back to Yangon city center (16.8661, 96.1951)

### 2. Distance Calculation
Uses the Haversine formula to calculate great-circle distance:
```typescript
import { calculateDistance } from '@/utils/location';

const distance = calculateDistance(
  { latitude: 16.8661, longitude: 96.1951 }, // User location
  { latitude: 16.8050, longitude: 96.1560 }  // Restaurant location
);
// Returns distance in miles
```

### 3. Custom Markers
- **Restaurant markers**: White circle with Royal Plate logo, blue border
- **User marker**: Blue dot with white border
- **Route line**: Dashed blue line connecting user to restaurant

### 4. Map Interactions
- **Click marker**: Navigate to restaurant details
- **Zoom**: Scroll or pinch to zoom
- **Pan**: Drag to move around
- **Popup**: Click marker to see restaurant info

## Customization Options

### Change Map Style
You can use different tile providers:

```typescript
// In RestaurantMap.tsx or SingleRestaurantMap.tsx

// Default OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// CartoDB Positron (lighter style)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CartoDB'
}).addTo(map);

// CartoDB Dark Matter (dark style)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CartoDB'
}).addTo(map);

// Stamen Terrain (topographic)
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; Stamen Design &copy; OpenStreetMap'
}).addTo(map);
```

### Change Marker Icons
Edit the marker HTML in `RestaurantMap.tsx`:

```typescript
const royalPlateIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: white;
      border: 3px solid #536DFE;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <img src="/logo.png" alt="Royal Plate" style="width: 24px; height: 24px;" />
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});
```

### Adjust Default Location
Change the default center in `src/utils/location.ts`:

```typescript
export const YANGON_CENTER: Coordinates = {
  latitude: 16.8661,  // Change to your city
  longitude: 96.1951, // Change to your city
};
```

## Performance Tips

1. **Lazy Load Maps**: Maps only render when visible (already implemented)
2. **Limit Markers**: Only show restaurants with valid coordinates
3. **Cache User Location**: Location cached for 5 minutes
4. **Optimize Images**: Use compressed logo for markers

## Troubleshooting

### Map Not Showing
1. Check browser console for errors
2. Ensure Leaflet CSS is imported
3. Verify container has explicit height
4. Check if coordinates are valid numbers

### Markers Not Appearing
1. Verify restaurants have latitude/longitude in database
2. Check console for coordinate validation errors
3. Ensure logo.png exists in public folder

### Distance Shows as 0 or NaN
1. Check if user location is being fetched
2. Verify restaurant coordinates are numbers, not strings
3. Check calculateDistance function for errors

### Location Permission Denied
- App falls back to Yangon center automatically
- User can manually enable location in browser settings

## API Rate Limits

OpenStreetMap Nominatim (geocoding) has rate limits:
- **1 request per second** maximum
- Add delays between requests when geocoding multiple addresses
- Consider caching geocoded results

For production, consider:
- [Mapbox](https://www.mapbox.com/) - 100,000 free requests/month
- [LocationIQ](https://locationiq.com/) - 5,000 free requests/day
- Self-hosted Nominatim instance

## Files Modified/Created

### New Files
- `src/components/RestaurantMap.tsx` - Multi-restaurant map
- `src/components/SingleRestaurantMap.tsx` - Individual restaurant map
- `src/utils/location.ts` - Location utilities
- `supabase/migrations/add_restaurant_coordinates.sql` - Database migration

### Modified Files
- `src/pages/Home.tsx` - Added map overview
- `src/pages/RestaurantDetails.tsx` - Added location map
- `package.json` - Added leaflet dependencies

## Next Steps

1. ✅ Run database migration
2. ✅ Add coordinates to all restaurants
3. ✅ Test map functionality
4. Consider adding:
   - Search by location radius
   - Filter restaurants by distance
   - Directions/navigation integration
   - Clustering for many markers
   - Geofencing for delivery zones

## Resources

- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet Documentation](https://leafletjs.com/)
- [React-Leaflet](https://react-leaflet.js.org/)
- [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [Nominatim Geocoding](https://nominatim.org/)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify database has latitude/longitude columns
3. Ensure coordinates are valid numbers
4. Test with sample coordinates first

---

**Note**: This implementation uses OpenStreetMap which is free and open-source. No API keys or payment required! 🎉
