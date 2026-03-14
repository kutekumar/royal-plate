# Quick Start: OpenStreetMap Integration

## ✅ What's Done

1. **Installed Leaflet** - React map library (no API key needed!)
2. **Created Map Components**:
   - `RestaurantMap.tsx` - Shows all restaurants on home page
   - `SingleRestaurantMap.tsx` - Shows individual restaurant location
3. **Added Location Utils** - Distance calculation, geocoding, user location
4. **Updated Pages**:
   - Home page: Interactive map with all restaurants
   - Restaurant details: Individual location map
5. **Database Migration** - SQL file to add latitude/longitude columns

## 🚀 Next Steps (Required)

### 1. Run Database Migration

Open Supabase Dashboard → SQL Editor → Run this:

```sql
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
```

### 2. Add Coordinates to Restaurants

**Option A: Use Supabase Dashboard**
- Go to Table Editor → restaurants
- Add latitude/longitude for each restaurant
- Find coordinates at [latlong.net](https://www.latlong.net/)

**Option B: Use Geocoding Script**
```bash
# 1. Update Supabase credentials in scripts/geocode-restaurants.ts
# 2. Install tsx if needed
npm install -D tsx

# 3. Run the script
npx tsx scripts/geocode-restaurants.ts
```

**Sample Yangon Coordinates:**
```sql
-- Downtown: 16.7833, 96.1667
-- Bahan: 16.8050, 96.1560
-- Kamayut: 16.8300, 96.1400
-- Sanchaung: 16.8100, 96.1300
-- Yankin: 16.8400, 96.1500
```

### 3. Test the App

```bash
npm run dev
```

Visit home page and click "Show" button to see the map!

## 📍 Features

- **No API Key Required** - OpenStreetMap is free!
- **Real Distance Calculation** - Uses GPS coordinates
- **Custom Markers** - Royal Plate logo on map
- **User Location** - Shows route from user to restaurant
- **Interactive** - Click markers to navigate

## 📖 Full Documentation

See `OPENSTREETMAP_SETUP.md` for complete guide including:
- Customization options
- Troubleshooting
- Alternative map styles
- Performance tips

## 🎯 How It Works

1. User opens app → Requests GPS location
2. Fetches restaurants with coordinates from database
3. Calculates real distances using Haversine formula
4. Displays restaurants on map with custom markers
5. Sorts by distance (closest first)

## ⚠️ Important Notes

- Restaurants without coordinates will use mock distances
- User location permission is optional (falls back to Yangon center)
- Nominatim geocoding: 1 request/second limit
- Map tiles load from OpenStreetMap servers (free)

---

**Ready to use!** Just add coordinates to your restaurants and the maps will work automatically. 🗺️
