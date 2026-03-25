#!/usr/bin/env node
// Categorize existing menu_items by analyzing name/description and update the category field

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function categorize(name, description) {
  const text = `${name ?? ''} ${description ?? ''}`.toLowerCase()
  if (text.includes('pizza')) return 'Pizza'
  if (text.includes('burger')) return 'Burger'
  if (text.includes('ramen') || text.includes('noodle') || text.includes('udon') || text.includes('soba')) return 'Main'
  if (text.includes('pasta')) return 'Pasta'
  if (text.includes('fries') || text.includes('wings') || text.includes('dumpling') || text.includes('dumplings')) return 'Appetizer'
  if (text.includes('salad')) return 'Appetizer'
  if (text.includes('soup')) return 'Soup'
  if (text.includes('tea') || text.includes('coffee') || text.includes('drink')) return 'Drink'
  if (text.includes('cake') || text.includes('dessert') || text.includes('pudding') || text.includes('pie')) return 'Dessert'
  return 'Other'
}

async function main() {
  // Fetch items with NULL or empty category
  const { data, error } = await supabase.from('menu_items').select('id,name,description,category').is('category', null)
  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }
  if (!Array.isArray(data) || data.length === 0) {
    console.log('No menu_items with missing category found.')
    process.exit(0)
  }

  let updated = 0
  for (const item of data) {
    const current = item.category?.trim()
    if (current && current.length > 0) continue

    const newCat = categorize(item.name, item.description)
    if (!newCat) continue

    const { error: updError } = await supabase.from('menu_items').update({ category: newCat }).eq('id', item.id)
    if (updError) {
      console.error(`Failed to categorize ${item.name}: ${updError.message}`)
    } else {
      console.log(`Categorized: ${item.name} -> ${newCat}`)
      updated++
    }
  }

  console.log(`Done. Updated ${updated} item(s).`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
