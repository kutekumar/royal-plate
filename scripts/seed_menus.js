#!/usr/bin/env node
// Seed sample menu items for the restaurants seeded in public.restaurants

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Simple menu seed: 4 items per restaurant with generic categories
const menuTemplate = (name, price, category) => ({
  name,
  category,
  description: `Delicious ${name} item`,
  price,
  image_url: ''
})

const restaurantsMenus = {
  'Le Planteur Restaurants & Lounge': [
    menuTemplate('Signature Steak', 28.0, 'Main'),
    menuTemplate('Coq au Vin', 26.0, 'Main'),
    menuTemplate('Ratatouille', 14.0, 'Appetizer'),
    menuTemplate('Crème Brûlée', 9.5, 'Dessert')
  ],
  'Cafés Dibar - Kan Bae Branch': [
    menuTemplate('Avocado Toast', 8.5, 'Appetizer'),
    menuTemplate('Salmon Bagel', 12.0, 'Main'),
    menuTemplate('Latte', 4.5, 'Drink'),
    menuTemplate('Mango Cheesecake', 6.5, 'Dessert')
  ],
  'Noodle Bowl Restaurant & Lounge': [
    menuTemplate('Beijing Noodle Bowl', 9.5, 'Main'),
    menuTemplate('Dumplings (6pc)', 7.5, 'Appetizer'),
    menuTemplate('Green Tea', 3.5, 'Drink'),
    menuTemplate('Sesame Noodles', 8.0, 'Main')
  ],
  'Vintage 36': [
    menuTemplate('Truffle Fries', 7.5, 'Appetizer'),
    menuTemplate('Lemon Chicken', 13.5, 'Main'),
    menuTemplate('Tiramisu', 6.5, 'Dessert'),
    menuTemplate('Cappuccino', 4.5, 'Drink')
  ],
  'Fu Sun Restaurant': [
    menuTemplate('Beef Chow Fun', 12.0, 'Main'),
    menuTemplate('Egg Roll', 5.0, 'Appetizer'),
    menuTemplate('Oolong Tea', 3.5, 'Drink'),
    menuTemplate('Mango Pudding', 5.5, 'Dessert')
  ],
  'Meraki Lounge Yangon': [
    menuTemplate('Sea Bass', 18.0, 'Main'),
    menuTemplate('Greek Salad', 9.0, 'Appetizer'),
    menuTemplate('Wine by Glass', 7.0, 'Drink'),
    menuTemplate('Baklava', 6.5, 'Dessert')
  ],
  'Yankin Heights Rooftop Restaurant': [
    menuTemplate('Prawn Cocktail', 12.0, 'Appetizer'),
    menuTemplate('Steak Frites', 22.0, 'Main'),
    menuTemplate('Cheesecake', 6.5, 'Dessert'),
    menuTemplate('Sangria', 7.5, 'Drink')
  ],
  'ရွှေဘဲ စားသောက်ဆိုင် - ဆရာစံဆိုင်ခွဲ': [
    menuTemplate('Mohinga', 4.5, 'Main'),
    menuTemplate('Mohinga Egg Roll', 5.5, 'Appetizer'),
    menuTemplate('Ya Kun Coffee', 3.5, 'Drink'),
    menuTemplate('Palm Sugar Cake', 4.8, 'Dessert')
  ],
  'NOAH by the Lake': [
    menuTemplate('Lake Fish & Chips', 16.0, 'Main'),
    menuTemplate('Grilled Vegetables', 9.0, 'Appetizer'),
    menuTemplate('Lemonade', 3.5, 'Drink'),
    menuTemplate('Cheesecake', 6.0, 'Dessert')
  ],
  'Nth Degree': [
    menuTemplate('Herb Crusted Salmon', 19.0, 'Main'),
    menuTemplate('Bruschetta', 8.0, 'Appetizer'),
    menuTemplate('Espresso', 3.8, 'Drink'),
    menuTemplate('Panna Cotta', 6.5, 'Dessert')
  ],
  'D&D မိုးကုတ်ရှမ်းစာနှင့်ခို့က်ဆွဲမျိုးစုံ': [
    menuTemplate('Khow Suey', 12.5, 'Main'),
    menuTemplate('Spring Rolls', 5.5, 'Appetizer'),
    menuTemplate('Iced Tea', 2.5, 'Drink'),
    menuTemplate('Rice Pudding', 4.5, 'Dessert')
  ],
  'Yangon Tea House': [
    menuTemplate('Assorted Tea Set', 6.0, 'Drink'),
    menuTemplate('Tea Sandwich', 5.0, 'Appetizer'),
    menuTemplate('Chai Cake', 5.5, 'Dessert'),
    menuTemplate('Scone', 4.5, 'Dessert')
  ],
  'Real Pork- Kokkine Branch': [
    menuTemplate('Pork Kokkine Special', 14.0, 'Main'),
    menuTemplate('Stir-Fried Veg', 7.0, 'Appetizer'),
    menuTemplate('Soy Milk', 3.0, 'Drink'),
    menuTemplate('Fruit Salad', 5.5, 'Dessert')
  ],
  'White Cottage Restaurant & Beer Garden': [
    menuTemplate('Burger & Fries', 12.5, 'Main'),
    menuTemplate('Onion Rings', 6.0, 'Appetizer'),
    menuTemplate('Draft Beer', 4.5, 'Drink'),
    menuTemplate('Apple Pie', 5.5, 'Dessert')
  ],
  'TORA - Modern Izakaya': [
    menuTemplate('Tempura Platter', 14.0, 'Main'),
    menuTemplate('Gyoza', 7.0, 'Appetizer'),
    menuTemplate('Sake', 8.0, 'Drink'),
    menuTemplate('Mochi', 5.5, 'Dessert')
  ],
  'Byblos Pub & Grill': [
    menuTemplate('Grilled Halloumi', 9.5, 'Appetizer'),
    menuTemplate('Lamb Shish Kebab', 18.0, 'Main'),
    menuTemplate('Tabbouleh', 6.5, 'Appetizer'),
    menuTemplate('Baklava', 6.0, 'Dessert')
  ],
  '96 Cafe': [
    menuTemplate('Nasi Lemak', 9.0, 'Main'),
    menuTemplate('Mee Goreng', 7.5, 'Main'),
    menuTemplate('Sweet Peach Tea', 3.5, 'Drink'),
    menuTemplate('Kuih', 4.5, 'Dessert')
  ],
  'YANKIN HOUSE "Pub & Restaurant"': [
    menuTemplate('BBQ Ribs', 15.0, 'Main'),
    menuTemplate('Caesar Salad', 8.5, 'Appetizer'),
    menuTemplate('Wine Glass', 6.5, 'Drink'),
    menuTemplate('Brownie', 5.0, 'Dessert')
  ],
  'LuLu’s Diner': [
    menuTemplate('Classic American Burger', 11.0, 'Main'),
    menuTemplate('Fries', 4.5, 'Appetizer'),
    menuTemplate('Milkshake', 5.0, 'Drink'),
    menuTemplate('Apple Pie', 4.8, 'Dessert')
  ]
}

async function ensureRestaurantId(name) {
  const { data } = await supabase.from('restaurants').select('id').eq('name', name).limit(1)
  if (Array.isArray(data) && data.length > 0) {
    return data[0].id
  }
  return null
}

async function seedForRestaurant(name, items) {
  const restId = await ensureRestaurantId(name)
  if (!restId) {
    console.warn(`Restaurant not found in DB for seed: ${name}`)
    return
  }
  for (const item of items) {
    // avoid duplicates by checking existing name for this restaurant
    const { data: existing } = await supabase.from('menu_items')
      .select('id')
      .eq('restaurant_id', restId)
      .eq('name', item.name)
    if (existing && existing.length > 0) {
      continue
    }
    const { error } = await supabase.from('menu_items').insert({
      restaurant_id: restId,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image_url: item.image_url
    })
    if (error) {
      console.error(`Failed to insert menu for ${name}: ${item.name}`, error.message)
    } else {
      console.log(`Inserted menu: ${name} -> ${item.name}`)
    }
  }
}

async function main() {
  // Seed menus per restaurant as defined in restaurantsMenus
  for (const [name, items] of Object.entries(restaurantsMenus)) {
    await seedForRestaurant(name, items)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Menu seed failed:', e)
    process.exit(1)
  })
