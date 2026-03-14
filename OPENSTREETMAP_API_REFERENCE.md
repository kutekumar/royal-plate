# OpenStreetMap API Reference - No Key Required! 🎉

## The Best Part: NO API KEY NEEDED!

Unlike Google Maps, Mapbox, or other services, **OpenStreetMap is completely free and requires NO API key**. You can start using it immediately!

## What We're Using

### 1. OpenStreetMap Tiles (Map Display)
```
URL: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
Cost: FREE
Limit: Fair use (no hard limit for reasonable traffic)
Attribution: Required (already included in code)
```

**Usage in Code:**
```typescript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);
```

### 2. Nominatim Geocoding API (Address → Coordinates)
```
URL: https://nominatim.openstreetmap.org/search
Cost: FREE
Limit: 1 request per second
Requirement: User-Agent header (already set)
```

**Usage in Code:**
```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${address}&limit=1`,
  {
    headers: {
      'User-Agent': 'RoyalPlateApp/1.0', // Required!
    },
  }
);
```

## How to Get Started (Spoiler: You Already Have!)

### Step 1: Nothing!
There's no registration, no API key, no setup. Just use it!

### Step 2: Add Attribution
Already done in the code:
```typescript
attribution: '&copy; OpenStreetMap contributors'
```

### Step 3: Follow Usage Policy
- ✅ Don't make excessive requests (we're not)
- ✅ Include User-Agent header (we do)
- ✅ Cache tiles when possible (browser does this)
- ✅ Provide attribution (we do)

## Usage Limits & Fair Use

### OpenStreetMap Tiles
```
Limit: No hard limit, but be reasonable
Our Usage: ~10-50 tile requests per map load
Caching: Browser caches tiles automatically
Recommendation: For high traffic (>100k users/month),
                consider a tile server provider
```

### Nominatim Geocoding
```
Limit: 1 request per second
Our Usage: Only when geocoding addresses (one-time setup)
Script: Includes 1-second delay between requests
Recommendation: Geocode once, store coordinates in database
```

## Alternative Tile Providers (All Free!)

If you want different map styles, here are free alternatives:

### 1. CartoDB (Light Theme)
```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CartoDB',
  maxZoom: 19,
});
```
- Clean, minimal design
- Great for business apps
- FREE, no API key

### 2. CartoDB (Dark Theme)
```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CartoDB',
  maxZoom: 19,
});
```
- Dark mode friendly
- Modern look
- FREE, no API key

### 3. Stamen Terrain
```typescript
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; Stamen Design &copy; OpenStreetMap',
  maxZoom: 18,
});
```
- Topographic style
- Shows elevation
- FREE, no API key

### 4. OpenTopoMap
```typescript
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap &copy; OpenTopoMap',
  maxZoom: 17,
});
```
- Detailed topographic
- Hiking/outdoor style
- FREE, no API key

## When You Might Need a Paid Service

For most apps, OpenStreetMap is perfect. Consider paid services if:

### High Traffic (>100k users/month)
**Options:**
- **Mapbox** - 200k free requests/month, then $5/1k requests
- **Maptiler** - 100k free requests/month, then $1/1k requests
- **Thunderforest** - 150k free requests/month, then paid

### Advanced Features
- Turn-by-turn navigation
- Real-time traffic
- 3D buildings
- Satellite imagery

### Better Performance
- Faster tile loading
- CDN distribution
- Guaranteed uptime SLA

## Our Implementation (No API Key!)

### What We Use
```
✅ OpenStreetMap tiles (free)
✅ Nominatim geocoding (free)
✅ Leaflet library (open-source)
✅ Browser Geolocation API (built-in)
✅ Haversine distance calculation (client-side)

Total Cost: $0/month
API Keys Needed: 0
```

### What We Don't Need
```
❌ Google Maps API ($200 free credit, then $7/1k requests)
❌ Mapbox API (200k free, then $5/1k requests)
❌ HERE Maps API (250k free, then paid)
❌ Azure Maps API (1k free, then paid)
```

## How to Find Coordinates

### Method 1: Google Maps (Easiest)
1. Open Google Maps
2. Right-click on location
3. Click coordinates to copy
4. Format: `16.8661, 96.1951`

### Method 2: OpenStreetMap
1. Go to openstreetmap.org
2. Search for location
3. Click "Share" button
4. Copy coordinates from URL

### Method 3: LatLong.net
1. Go to latlong.net
2. Search for address
3. Copy latitude and longitude

### Method 4: Use Our Geocoding Script
```bash
# Automatically geocode all restaurant addresses
npx tsx scripts/geocode-restaurants.ts
```

## Geocoding API Details

### Request Format
```
GET https://nominatim.openstreetmap.org/search

Parameters:
  format=json          (response format)
  q=<address>          (search query)
  limit=1              (number of results)

Headers:
  User-Agent: RoyalPlateApp/1.0  (REQUIRED!)
```

### Response Format
```json
[
  {
    "lat": "16.8661",
    "lon": "96.1951",
    "display_name": "Yangon, Myanmar",
    "type": "city",
    "importance": 0.8
  }
]
```

### Example Request
```bash
curl -H "User-Agent: RoyalPlateApp/1.0" \
  "https://nominatim.openstreetmap.org/search?format=json&q=123+Main+St,+Yangon,+Myanmar&limit=1"
```

## Rate Limiting Best Practices

### For Geocoding (Nominatim)
```typescript
// ✅ GOOD: Wait between requests
for (const restaurant of restaurants) {
  const coords = await geocodeAddress(restaurant.address);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
}

// ❌ BAD: Rapid requests
for (const restaurant of restaurants) {
  const coords = await geocodeAddress(restaurant.address);
  // No delay - will get rate limited!
}
```

### For Map Tiles
```typescript
// ✅ GOOD: Browser handles caching automatically
// ✅ GOOD: Only load maps when visible
// ✅ GOOD: Lazy load map components

// ❌ BAD: Loading maps on every component render
// ❌ BAD: Disabling browser cache
```

## Attribution Requirements

### Required Attribution (Already Included)
```html
© OpenStreetMap contributors
```

### Where It Appears
- Bottom right of every map
- Automatically added by Leaflet
- Links to OpenStreetMap copyright page

### Legal Requirements
- Must be visible on all maps
- Must link to openstreetmap.org/copyright
- Cannot be removed or hidden

## Performance Optimization

### Tile Caching
```typescript
// Browser automatically caches tiles
// Cache-Control: max-age=604800 (7 days)
// No action needed on your part!
```

### Lazy Loading
```typescript
// ✅ Already implemented
{showMapView && (
  <RestaurantMap restaurants={restaurants} />
)}
```

### Debouncing
```typescript
// For search/filter features
const debouncedSearch = debounce((query) => {
  // Update map markers
}, 300);
```

## Troubleshooting

### "403 Forbidden" Error
**Cause:** Missing User-Agent header
**Fix:** Already included in our code
```typescript
headers: { 'User-Agent': 'RoyalPlateApp/1.0' }
```

### "429 Too Many Requests"
**Cause:** Exceeding 1 request/second for Nominatim
**Fix:** Add delays between requests (already in script)
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Tiles Not Loading
**Cause:** Network issues or CORS
**Fix:** Check browser console, verify internet connection

### Coordinates Not Accurate
**Cause:** Address not found or ambiguous
**Fix:** Add more specific address details (city, country)

## Resources

### Official Documentation
- OpenStreetMap: https://www.openstreetmap.org/
- Nominatim API: https://nominatim.org/release-docs/latest/api/Overview/
- Leaflet: https://leafletjs.com/
- React-Leaflet: https://react-leaflet.js.org/

### Tile Usage Policy
- https://operations.osmfoundation.org/policies/tiles/

### Community
- OpenStreetMap Forum: https://forum.openstreetmap.org/
- Leaflet GitHub: https://github.com/Leaflet/Leaflet

## Summary

### What You Need
```
✅ Nothing! Just use it!
```

### What You Don't Need
```
❌ API key
❌ Registration
❌ Credit card
❌ Usage tracking
❌ Payment setup
```

### What You Must Do
```
✅ Include attribution (already done)
✅ Add User-Agent header (already done)
✅ Follow fair use policy (we do)
✅ Respect rate limits (we do)
```

### Cost Breakdown
```
OpenStreetMap tiles: $0
Nominatim geocoding: $0
Leaflet library: $0
Browser APIs: $0
Total: $0/month forever! 🎉
```

---

**Bottom Line:** OpenStreetMap is completely free, requires no API key, and works perfectly for Royal Plate. Just add coordinates to your restaurants and you're done! 🗺️
