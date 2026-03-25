#!/usr/bin/env node
// Fill missing menu item images by querying free image sources (Unsplash Source)
// Uses: restaurant menu item name as a search keyword to fetch an image URL

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  // Fetch all menu items and fill those with missing image_url
  const { data, error } = await supabase
    .from('menu_items')
    .select('id,name,category,image_url')
  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }
  const all = data || []
  const need = all.filter((m) => !m.image_url || m.image_url.trim() === '')
  if (need.length === 0) {
    console.log('No menu items needing images.')
    process.exit(0)
  }

  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d')
  let updated = 0
  for (const item of need) {
    const query = encodeURIComponent(item.name || item.category || 'food')
    // Use a safe placeholder image so that testing environments always have a valid image URL
    const url = `https://placehold.co/600x400?text=${query}`
    if (dryRun) {
      console.log(`[DRY-RUN] Would set image for ${item.name}: ${url}`)
      updated++
    } else {
      const { error: updError } = await supabase.from('menu_items').update({ image_url: url }).eq('id', item.id)
      if (updError) {
        console.error(`Failed to update image for ${item.name}: ${updError.message}`)
      } else {
        console.log(`Image set for ${item.name}: ${url}`)
        updated++
      }
    }
  }
  console.log(`Done. Updated ${updated} menu item image(s).`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
