#!/usr/bin/env node
import 'dotenv/config'
// Fetch images for menu items from Wikipedia/Wikimedia when image_url is missing
// Strategy: try Wikipedia REST thumbnail, then Wikipedia pageimages thumbnail, then fallback to placeholder

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function fetchWikiSummaryImage(title) {
  const t = encodeURIComponent(title)
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${t}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RoyalPlate-Wiki/0.1' } })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.thumbnail?.source) return data.thumbnail.source
  } catch {
    // ignore and fall back
  }
  return null
}

async function fetchWikiPageimage(title) {
  const t = encodeURIComponent(title)
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${t}&format=json&pithumbsize=600`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RoyalPlate-Wiki/0.1' } })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    for (const key of Object.keys(pages)) {
      const p = pages[key]
      if (p?.thumbnail?.source) return p.thumbnail.source
    }
  } catch {
    // ignore
  }
  return null
}

async function getImageForTitle(title) {
  const summary = await fetchWikiSummaryImage(title)
  if (summary) return summary
  const pageimg = await fetchWikiPageimage(title)
  if (pageimg) return pageimg
  return null
}

async function main() {
  // Get items missing images (NULL or empty)
  const { data: dataNull, error: errorNull } = await supabase
    .from('menu_items')
    .select('id,name,category,image_url')
    .is('image_url', null)
    .limit(1000)
  const { data: dataEmpty, error: errorEmpty } = await supabase
    .from('menu_items')
    .select('id,name,category,image_url')
    .eq('image_url', '')
    .limit(1000)
  if (errorNull || errorEmpty) {
    console.error('Query error:', (errorNull && errorNull.message) || (errorEmpty && errorEmpty.message))
    process.exit(1)
  }
  const data = [ ...(dataNull || []), ...(dataEmpty || []) ]
  const items = data.filter((m) => !m.image_url || m.image_url.trim() === '')
  if (items.length === 0) {
    console.log('No menu items needing wiki images.')
    process.exit(0)
  }

  let updated = 0
  for (const item of items) {
    const title = item.name || item.category || 'food'
    const img = await getImageForTitle(title)
    if (img) {
      if (!DRY_RUN) {
        const { error: updError } = await supabase.from('menu_items').update({ image_url: img }).eq('id', item.id)
        if (updError) {
          console.error(`Failed to update image for ${item.name}: ${updError.message}`)
        } else {
          console.log(`Wiki image set for ${item.name}: ${img}`)
          updated++
        }
      } else {
        console.log(`[DRY-RUN] Would set wiki image for ${item.name}: ${img}`)
        updated++
      }
    } else {
      // fallback to placeholder if no wiki image found
      const placeholder = `https://placehold.co/600x400?text=${encodeURIComponent(title)}`
      if (!DRY_RUN) {
        const { error: updError } = await supabase.from('menu_items').update({ image_url: placeholder }).eq('id', item.id)
        if (updError) {
          console.error(`Failed to set placeholder for ${item.name}: ${updError.message}`)
        } else {
          console.log(`Placeholder image set for ${item.name}: ${placeholder}`)
          updated++
        }
      } else {
        console.log(`[DRY-RUN] Would set placeholder for ${item.name}: ${placeholder}`)
        updated++
      }
    }
    // gentle throttle
    await new Promise((r) => setTimeout(r, 700))
  }
  console.log(`Wiki image fetch done. Updated ${updated} menu item image(s).`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
