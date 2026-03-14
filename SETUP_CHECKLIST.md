# 🗺️ Map Integration - Setup Checklist

## ✅ Completed (Already Done)

- [x] Installed Leaflet and React-Leaflet packages
- [x] Created map components (RestaurantMap, SingleRestaurantMap)
- [x] Created location utilities (distance calculation, geocoding)
- [x] Updated Home page with map overview
- [x] Updated RestaurantDetails page with location map
- [x] Added Leaflet CSS to main.tsx
- [x] Created database migration files
- [x] Created geocoding helper script
- [x] Built project successfully (no errors)
- [x] Created documentation files

## 📋 Your Next Steps

### Step 1: Database Setup (5 minutes)

1. **Open Supabase Dashboard**
   - Go to your project at supabase.com
   - Navigate to SQL Editor

2. **Run Migration**
   ```sql
   -- Copy from: supabase/migrations/add_restaurant_coordinates.sql
   -- Or run this:

   ALTER TABLE restaurants
   ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
   ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

   CREATE INDEX IF NOT EXISTS idx_restaurants_location
   ON restaurants(latitude, longitude);
   ```

3. **Verify Columns Added**
   - Go to Table Editor → restaurants
   - Check that latitude and longitude columns exist

### Step 2: Add Coordinates (Choose One Method)

#### Option A: Quick Test (2 minutes) ⚡
Run the sample coordinates script:
```sql
-- Copy from: supabase/migrations/add_sample_coordinates.sql
-- This adds coordinates to your first 10 restaurants
```

#### Option B: Manual Entry (10-30 minutes) 🖱️
1. Go to Table Editor → restaurants
2. For each restaurant:
   - Find location on [latlong.net](https://www.latlong.net/)
   - Enter latitude and longitude
   - Save

#### Option C: Automatic Geocoding (15 minutes) 🤖
1. Open `scripts/geocode-restaurants.ts`
2. Update these lines:
   ```typescript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
3. Run the script:
   ```bash
   npm install -D tsx
   npx tsx scripts/geocode-restaurants.ts
   ```

### Step 3: Test the App (2 minutes)

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Home Page**
   - Open http://localhost:5173/home
   - Look for "Explore Map" section
   - Click "Show" button
   - You should see a map with restaurant markers

3. **Test Restaurant Details**
   - Click any restaurant card
   - Scroll to address section
   - Click "Show on map"
   - You should see individual restaurant map

4. **Test Distance Calculation**
   - Check if distances are showing (e.g., "2.5 mi")
   - Restaurants should be sorted by distance

### Step 4: Grant Location Permission (Optional)

1. When prompted, click "Allow" for location access
2. This enables:
   - Real distance calculations from your location
   - Route lines on maps
   - Better sorting by proximity

If you deny:
- App still works!
- Uses Yangon city center as reference point

## 🎯 Expected Results

### Home Page
```
✓ "Explore Map" section appears
✓ "Show" button toggles map visibility
✓ Map displays with restaurant markers
✓ Markers show Royal Plate logo
✓ Clicking marker navigates to restaurant
✓ Distances show real values (not random)
```

### Restaurant Details
```
✓ Address section has "Show on map" text
✓ Clicking address toggles map
✓ Map shows restaurant location
✓ If location granted: shows route from you to restaurant
✓ Map is interactive (zoom, pan)
```

## 🐛 Troubleshooting

### Map Not Showing?
- [ ] Check browser console for errors
- [ ] Verify Leaflet CSS is loaded (check Network tab)
- [ ] Ensure restaurants have coordinates in database
- [ ] Try hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

### No Markers on Map?
- [ ] Check database: `SELECT * FROM restaurants WHERE latitude IS NOT NULL`
- [ ] Verify coordinates are numbers, not strings
- [ ] Check that /public/logo.png exists

### Distance Shows "NaN mi"?
- [ ] Verify latitude/longitude are valid numbers
- [ ] Check browser console for calculation errors
- [ ] Ensure coordinates are in correct format (decimal degrees)

### Location Permission Issues?
- [ ] App should work even without permission
- [ ] Check browser settings for location access
- [ ] Try in different browser
- [ ] Falls back to Yangon center automatically

## 📊 Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check how many restaurants have coordinates
SELECT
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as with_coords,
  COUNT(*) FILTER (WHERE latitude IS NULL) as without_coords,
  COUNT(*) as total
FROM restaurants;

-- View restaurants with coordinates
SELECT id, name, address, latitude, longitude
FROM restaurants
WHERE latitude IS NOT NULL
LIMIT 10;

-- Check coordinate ranges (should be around Yangon)
SELECT
  MIN(latitude) as min_lat,
  MAX(latitude) as max_lat,
  MIN(longitude) as min_lon,
  MAX(longitude) as max_lon
FROM restaurants
WHERE latitude IS NOT NULL;
-- Expected: lat ~16.7-16.9, lon ~96.1-96.2 for Yangon
```

## 📚 Documentation Reference

| File | Purpose |
|------|---------|
| `MAP_QUICKSTART.md` | Quick start guide (read this first!) |
| `OPENSTREETMAP_SETUP.md` | Complete documentation with customization |
| `MAP_IMPLEMENTATION_SUMMARY.md` | Technical details and features |
| `supabase/migrations/add_restaurant_coordinates.sql` | Database migration |
| `supabase/migrations/add_sample_coordinates.sql` | Sample test data |
| `scripts/geocode-restaurants.ts` | Automatic geocoding script |

## 🎉 Success Criteria

You'll know it's working when:

- [x] Home page shows "Explore Map" section
- [x] Clicking "Show" displays interactive map
- [x] Restaurant markers appear with Royal Plate logo
- [x] Clicking markers navigates to restaurant details
- [x] Distances show real values (e.g., "2.5 mi")
- [x] Restaurant details page shows location map
- [x] Route line appears if location permission granted
- [x] No console errors related to maps

## 🚀 Going Live

Before deploying to production:

1. **Add Real Coordinates**
   - Replace sample coordinates with actual locations
   - Verify each restaurant location is accurate

2. **Test on Mobile**
   - Maps should be responsive
   - Touch gestures should work (pinch, pan)
   - Location permission prompt should appear

3. **Performance Check**
   - Maps should load within 2-3 seconds
   - No lag when toggling map visibility
   - Smooth marker interactions

4. **Consider Tile Server**
   - For high traffic, consider paid tile provider
   - Options: Mapbox, Maptiler, Thunderforest
   - OpenStreetMap free tier is fine for moderate use

## 💡 Tips

- **Start with Option A** (sample coordinates) to test quickly
- **Grant location permission** for best experience
- **Use Chrome DevTools** to simulate different locations
- **Check mobile view** - maps are responsive
- **Read MAP_QUICKSTART.md** for quick reference

## 📞 Need Help?

1. Check documentation files (especially OPENSTREETMAP_SETUP.md)
2. Review browser console for errors
3. Verify database schema with SQL queries above
4. Test with sample coordinates first

---

## ⏱️ Time Estimate

- Database setup: 5 minutes
- Add coordinates (Option A): 2 minutes
- Testing: 2 minutes
- **Total: ~10 minutes to get maps working!**

---

**Ready to start?** Begin with Step 1 above! 🚀

**Current Status:** ✅ Code ready, just needs database setup and coordinates!
