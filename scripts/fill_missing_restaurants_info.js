#!/usr/bin/env node
import 'dotenv/config'
// Fill missing restaurant fields: phone, distance, rating, open_hours
// - Phone: generate fake numbers starting with 09xxxxxxxxx
// - Distance: compute from a center point (Yangon city center) using haversine, store as '<num> km'
// - Rating: random 3.5 - 5.0 if missing
// - Open hours: default to '11:00 AM - 10:00 PM' if missing
// - Interactive mode is not required; this is a batch fill feature with an optional dry-run

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const CENTER_LAT = 16.8661
const CENTER_LON = 96.1951

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function randomPhone() {
  let s = '09'
  for (let i = 0; i < 9; i++) s += Math.floor(Math.random() * 10).toString()
  return s
}

function randRating() {
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10
}

function defaultOpenHours() {
  return '11:00 AM - 10:00 PM'
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.from('restaurants').select('id,name,phone,distance,rating,open_hours,latitude,longitude')
  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }
  const rows = data || []
  let count = 0
  for (const r of rows) {
    const updates = {}
    // Phone
    if (!r.phone || r.phone.toString().trim() === '') {
      updates.phone = randomPhone()
    }
    // Open hours
    if (!r.open_hours || (typeof r.open_hours === 'string' && r.open_hours.trim() === '')) {
      updates.open_hours = defaultOpenHours()
    }
    // Rating
    if (typeof r.rating !== 'number' || Number.isNaN(r.rating)) {
      updates.rating = randRating()
    }
    // Distance (requires lat/lon)
    if ((typeof r.distance !== 'string' || r.distance.trim() === '') &&
        typeof r.latitude === 'number' && typeof r.longitude === 'number') {
      const distKm = haversine(r.latitude, r.longitude, CENTER_LAT, CENTER_LON)
      updates.distance = distKm.toFixed(2) + ' km'
    }

    // If there is something to update, apply it
    if (Object.keys(updates).length > 0) {
      if (!DRY_RUN) {
        const { error: updError } = await supabase.from('restaurants').update(updates).eq('id', r.id)
        if (updError) {
          console.error(`Failed to update restaurant ${r.id}: ${updError.message}`)
        } else {
          console.log(`Restaurant ${r.name} updated with ${JSON.stringify(updates)}`)
          count++
        }
      } else {
        console.log(`[DRY-RUN] Would update restaurant ${r.id} with ${JSON.stringify(updates)}`)
        count++
      }
    }
  }
  console.log(`Done. ${count} restaurants processed.`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
