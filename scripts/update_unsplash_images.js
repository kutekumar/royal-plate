#!/usr/bin/env node
// Replace existing Unsplash-based images with wiki-based or placeholder images
// for all menu_items where image_url starts with https://source.unsplash.com/

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function fetchWikiImage(title) {
  // Try REST summary thumbnail
  try {
    const t = encodeURIComponent(title)
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${t}`
    const res = await fetch(summaryUrl, { headers: { 'User-Agent': 'RoyalPlate-Wiki/0.1' } })
    if (res.ok) {
      const data = await res.json()
      if (data?.thumbnail?.source) return data.thumbnail.source
    }
  } catch {
    // ignore and continue
  }
  // Fallback to pageimages thumbnail
  try {
    const t = encodeURIComponent(title)
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${t}&format=json&pithumbsize=600`
    const res = await fetch(url, { headers: { 'User-Agent': 'RoyalPlate-Wiki/0.1' } })
    if (res.ok) {
      const data = await res.json()
      const pages = data?.query?.pages
      if (pages) {
        for (const key of Object.keys(pages)) {
          const p = pages[key]
          if (p?.thumbnail?.source) return p.thumbnail.source
        }
      }
    }
  } catch {
    // ignore
  }
  return null
}

async function main() {
  // Find items using Unsplash-only URLs
  const { data, error } = await supabase
    .from('menu_items')
    .select('id,name,image_url')
    .like('image_url', 'https://source.unsplash.com/%')
  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }
  const items = (data || []).filter((m) => m.image_url && m.image_url.startsWith('https://source.unsplash.com/'))
  if (items.length === 0) {
    console.log('No Unsplash-based images found to replace.')
    process.exit(0)
  }

  let updated = 0
  for (const item of items) {
    const title = item.name || ''
    const wikiImg = await fetchWikiImage(title || 'food')
    const newUrl = wikiImg || `https://placehold.co/600x400?text=${encodeURIComponent(title || 'food')}`
    if (!DRY_RUN) {
      const { error: updError } = await supabase.from('menu_items').update({ image_url: newUrl }).eq('id', item.id)
      if (updError) {
        console.error(`Failed to update image for ${item.name}: ${updError.message}`)
      } else {
        console.log(`Updated image for ${item.name}: ${newUrl}`)
        updated++
      }
    } else {
      console.log(`[DRY-RUN] Would update image for ${item.name}: ${newUrl}`)
      updated++
    }
    // throttle a bit
    await new Promise(r => setTimeout(r, 400))
  }
  console.log(`Finished. Updated ${updated} menu item(s).`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
