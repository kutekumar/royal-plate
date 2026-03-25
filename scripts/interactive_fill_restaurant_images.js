#!/usr/bin/env node
// Interactive fill for restaurant images: enter image URLs one-by-one

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans)))
}

async function main() {
  // Fetch restaurants with missing image_url
  const { data: missing1, error: err1 } = await supabase.from('restaurants').select('id,name,image_url').is('image_url', null)
  const { data: missing2, error: err2 } = await supabase.from('restaurants').select('id,name,image_url').eq('image_url','')
  if (err1 || err2) {
    console.error('Query error:', (err1 && err1.message) || (err2 && err2.message))
    process.exit(1)
  }
  const list = [ ...(missing1 || []), ...(missing2 || []) ].filter(r => !r.image_url || r.image_url.trim() === '')
  if (list.length === 0) {
    console.log('No restaurants with empty image_url found.')
    return
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  for (const r of list) {
    const url = await ask(rl, `Enter image URL for '${r.name}' (or type 'skip' to skip, 'exit' to finish): `)
    const trimmed = (url || '').trim()
    if (!trimmed) {
      console.log('Skipped (empty input).')
      continue
    }
    const lower = trimmed.toLowerCase()
    if (lower === 'skip') {
      console.log('Skipped.')
      continue
    }
    if (lower === 'exit') {
      break
    }
    let finalUrl = trimmed
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }
    const { error } = await supabase.from('restaurants').update({ image_url: finalUrl }).eq('id', r.id)
    if (error) {
      console.error(`Update failed for ${r.name}: ${error.message}`)
    } else {
      console.log(`Updated ${r.name} with ${finalUrl}`)
    }
  }
  rl.close()
  console.log('Interactive restaurant image fill finished.')
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
