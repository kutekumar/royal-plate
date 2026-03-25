#!/usr/bin/env node
// Geocode restaurants with missing lat/lon using OpenStreetMap Nominatim

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

function ask(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close()
    resolve(ans)
  }))
}
import { promises as fs } from 'fs'

// Geocoding provider preferences (OpenStreetMap-only, with local cache)
const PRIMARY = 'nominatim'
const CACHE_FILE = './geocode_cache.json'
let geocodeCache = {}
let cacheLoaded = false
let providerBlocked = false

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function geocodeWithNominatim(address) {
  if (!address) return null
  const q = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`
  const contactEmail = process.env.GEOCODER_CONTACT || 'royalplate@example.com'
  const resp = await fetch(url, {
    headers: { 'User-Agent': `RoyalPlate-Geocoder/1.0 (${contactEmail})` }
  })
  if (!resp.ok) {
    // Return null to allow fallback logic to trigger
    return { ok: false, status: resp.status }
  }
  const data = await resp.json()
  if (Array.isArray(data) && data.length > 0) {
    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon }
  }
  return null
}

async function geocodeWithMapbox(address) {
  if (!address || !MAPBOX_TOKEN) return null
  const encoded = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`
  const resp = await fetch(url)
  if (!resp.ok) return { ok: false, status: resp.status }
  const data = await resp.json()
  if (Array.isArray(data.features) && data.features.length > 0) {
    const [lon, lat] = data.features[0].center
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon }
  }
  return null
}

async function geocode(address) {
  if (providerBlocked) return null
  if (!cacheLoaded) {
    try {
      const data = await fs.readFile(CACHE_FILE, 'utf8')
      geocodeCache = JSON.parse(data || '{}')
    } catch {
      geocodeCache = {}
    } finally {
      cacheLoaded = true
    }
  }

  const key = String(address).toLowerCase().trim()
  if (geocodeCache[key] && geocodeCache[key].latitude != null && geocodeCache[key].longitude != null) {
    return geocodeCache[key]
  }

  // OpenStreetMap Nominatim only
  const nom = await geocodeWithNominatim(address)
  if (nom && nom.lat != null && nom.lon != null) {
    const coords = { latitude: nom.lat, longitude: nom.lon }
    geocodeCache[key] = coords
    try { await fs.writeFile(CACHE_FILE, JSON.stringify(geocodeCache, null, 2)) } catch {
      // ignore cache write errors
    }
    return coords
  }
  if (nom && nom.ok === false && (nom.status === 403 || nom.status === 429)) {
    // Blocked by provider; stop further requests in this run
    providerBlocked = true
  }
  return null
}

async function main() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id,address,name')
    .is('latitude', null)
    .is('longitude', null)
    .limit(100)

  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }
  if (!Array.isArray(data) || data.length === 0) {
    console.log('No restaurants need geocoding.')
    process.exit(0)
  }

  let updated = 0
  for (const r of data) {
    const coords = await geocode(r.address)
    if (coords) {
      const { error: updError } = await supabase.from('restaurants').update({ latitude: coords.latitude, longitude: coords.longitude }).eq('id', r.id)
      if (updError) {
        console.error(`Failed to update restaurant ${r.id}: ${updError.message}`)
      } else {
        console.log(`Updated restaurant ${r.id} with latitude=${coords.latitude}, longitude=${coords.longitude}`)
        updated++
        // If the provider previously blocked, allow continuing after manual input
        providerBlocked = false
      }
    } else {
      // Interactive fallback: allow user to provide coordinates
      console.log(`Could not geocode address: ${r.address} for restaurant ${r.name}`)
      let provided = false
      for (let tries = 0; tries < 3; tries++) {
        const latStr = await ask(`Enter latitude for '${r.name}' (or type 'skip' to skip): `)
        if (!latStr || latStr.trim().toLowerCase() === 'skip') {
          break
        }
        const lat = parseFloat(latStr)
        if (isNaN(lat)) {
          console.log('Invalid latitude. Please enter a numeric value.')
          continue
        }
        const lonStr = await ask(`Enter longitude for '${r.name}': `)
        if (!lonStr || lonStr.trim().toLowerCase() === 'skip') {
          break
        }
        const lon = parseFloat(lonStr)
        if (isNaN(lon)) {
          console.log('Invalid longitude. Please enter a numeric value.')
          continue
        }
        const { error: updError } = await supabase.from('restaurants').update({ latitude: lat, longitude: lon }).eq('id', r.id)
        if (updError) {
          console.error(`Failed to update restaurant ${r.id}: ${updError.message}`)
        } else {
          console.log(`Updated restaurant ${r.id} with latitude=${lat}, longitude=${lon}`)
          updated++
        }
        provided = true
        break
      }
      if (!provided) {
        console.log(`Skipped updating coordinates for restaurant ${r.id}.`)
      }
    }
    // rate limit per Nomination policy
    await new Promise(res => setTimeout(res, 1000))
    if (providerBlocked) {
      console.warn('Geocoding blocked by provider (403/429). Stopping further attempts.')
      break
    }
  }
  console.log(`Geocoding done. Updated ${updated} restaurant(s).`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
