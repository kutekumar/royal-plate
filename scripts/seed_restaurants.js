#!/usr/bin/env node
// Seed initial restaurant data into public.restaurants using Supabase

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const restaurants = [
  {
    name: 'Le Planteur Restaurants & Lounge',
    description: 'French-inspired fine dining with a Yangon twist',
    cuisine_type: 'French',
    address: 'No. 33, U Wire, Thein Phyu Street, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Cafés Dibar - Kan Bae Branch',
    description: 'Cafe and bistro with light bites and coffee',
    cuisine_type: 'Cafe',
    address: 'Kanbae, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Noodle Bowl Restaurant & Lounge',
    description: 'Licensed restaurant offering noodles and lounge seating',
    cuisine_type: 'Asian',
    address: 'Yangon Center, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Vintage 36',
    description: 'Stylish eatery with modern continental dishes',
    cuisine_type: 'Continental',
    address: 'Inya Road, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Fu Sun Restaurant',
    description: 'Traditional Chinese-inspired fare',
    cuisine_type: 'Chinese',
    address: 'Near Shwe Dagon Pagoda, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Meraki Lounge Yangon',
    description: 'European-influenced lounge and dining',
    cuisine_type: 'European',
    address: 'Aung San Stadium area, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Yankin Heights Rooftop Restaurant',
    description: 'Rooftop dining with city views',
    cuisine_type: 'Multi',
    address: 'Yankin Township, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'ရွှေဘဲ စားသောက်ဆိုင် - ဆရာစံဆိုင်ခွဲ',
    description: 'Local Burmese cuisine with family-friendly atmosphere',
    cuisine_type: 'Burmese',
    address: 'Shwe Taung Nyar, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'NOAH by the Lake',
    description: 'Family-friendly restaurant with lakeside views',
    cuisine_type: 'Multi',
    address: 'No. Lake, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Nth Degree',
    description: 'Creative cuisine and modern vibes',
    cuisine_type: 'Global',
    address: 'No. 37, Kyaik tè Street, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'D&D မိုးကုတ်ရှမ်းစာနှင့်ခေါက်ဆွဲမျိုးစုံ',
    description: 'Traditional and noodle dishes',
    cuisine_type: 'Burmese/Noodle',
    address: 'Yankin Area, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Yangon Tea House',
    description: 'Classic Yangon cafe with tea and light bites',
    cuisine_type: 'Cafe',
    address: 'Downtown Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Real Pork- Kokkine Branch',
    description: 'Meat-focused restaurant with pork specialties',
    cuisine_type: 'Cafe/Meat',
    address: 'Kokkine, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'White Cottage Restaurant & Beer Garden',
    description: 'Casual dining with beer garden',
    cuisine_type: 'Eatery',
    address: 'Mingalar Street, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'TORA - Modern Izakaya',
    description: 'Modern Japanese Izakaya with shared plates',
    cuisine_type: 'Japanese',
    address: 'Inya Lake area, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'Byblos Pub & Grill',
    description: 'Mediterranean-inspired pub & grill',
    cuisine_type: 'Mediterranean',
    address: 'Golden Valley, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: '96 Cafe',
    description: 'Cafe with Malaysian-inspired dishes',
    cuisine_type: 'Cafe',
    address: 'Yankin, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'YANKIN HOUSE "Pub & Restaurant"',
    description: 'Pub with restaurant and casual dining',
    cuisine_type: 'Pub',
    address: 'Yankin, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  },
  {
    name: 'LuLu’s Diner',
    description: 'American diner classics',
    cuisine_type: 'American',
    address: 'Insein Road, Yangon',
    phone: '',
    image_url: '',
    rating: 0,
    distance: '',
    open_hours: ''
  }
]

async function main() {
  for (const r of restaurants) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: r.name,
          description: r.description,
          cuisine_type: r.cuisine_type,
          address: r.address,
          phone: r.phone,
          image_url: r.image_url,
          rating: r.rating,
          distance: r.distance,
          open_hours: r.open_hours
        })
        .select()
        .single()

      if (error) {
        console.error(`Error inserting ${r.name}:`, error.message)
      } else {
        console.log(`Inserted: ${r.name} (id=${data.id})`)
      }
    } catch (err) {
      console.error(`Unexpected error inserting ${r.name}:`, err)
    }
  }
}

main().then(() => process.exit(0))
.catch((e) => {
  console.error('Seed script failed:', e)
  process.exit(1)
})
