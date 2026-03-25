#!/usr/bin/env node
// Import latitude/longitude coordinates for restaurants from a CSV
// CSV format: restaurant_id,latitude,longitude

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  const args = process.argv.slice(2)
  const fileArg = args.find(a => a.startsWith('--file=')) || args.find(a => a.startsWith('-f '))
  let filePath = null
  if (fileArg) {
    if (fileArg.startsWith('--file=')) filePath = fileArg.split('=')[1]
    else if (fileArg.startsWith('-f ')) filePath = fileArg.slice(3)
  }
  if (!filePath) {
    console.error('Usage: node scripts/import_coordinates.js --file=path/to/coords.csv')
    process.exit(1)
  }

  const content = await fs.readFile(filePath, 'utf8')
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  let updated = 0
  for (const line of lines) {
    // skip header if present
    const parts = line.split(',')
    if (parts.length < 3) continue
    const id = parts[0].trim()
    const lat = parseFloat(parts[1])
    const lon = parseFloat(parts[2])
    if (!id || isNaN(lat) || isNaN(lon)) continue
    const { error } = await supabase.from('restaurants').update({ latitude: lat, longitude: lon }).eq('id', id)
    if (error) {
      console.error(`Failed to update ${id}: ${error.message}`)
    } else {
      updated++
    }
  }
  console.log(`Import done. Updated ${updated} restaurant(s).`)
}

main().catch((e) => {
  console.error('Import failed:', e)
  process.exit(1)
})
