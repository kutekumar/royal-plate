export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  address: string;
  phone: string;
  image_url: string;
  rating: number;
  distance: string;
  open_hours: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  available: boolean;
}

export const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Yangon Bistro',
    description: 'Contemporary Myanmar cuisine with a modern twist',
    cuisine_type: 'Myanmar',
    address: 'Kabar Aye Pagoda Rd, Yangon',
    phone: '+95 9 123 456 789',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    rating: 4.8,
    distance: '2.3 km',
    open_hours: '11:00 AM - 10:00 PM'
  },
  {
    id: '2',
    name: 'The Coffee House',
    description: 'Premium coffee and light bites in an elegant setting',
    cuisine_type: 'Café',
    address: 'Inya Rd, Yangon',
    phone: '+95 9 234 567 890',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    rating: 4.6,
    distance: '1.5 km',
    open_hours: '7:00 AM - 9:00 PM'
  },
  {
    id: '3',
    name: 'Tokyo Bowl',
    description: 'Authentic Japanese ramen and sushi',
    cuisine_type: 'Japanese',
    address: 'Shwedagon Pagoda Rd, Yangon',
    phone: '+95 9 345 678 901',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    rating: 4.9,
    distance: '3.1 km',
    open_hours: '11:30 AM - 10:30 PM'
  },
  {
    id: '4',
    name: 'Royal Thai Dine',
    description: 'Exquisite Thai flavors in a luxurious atmosphere',
    cuisine_type: 'Thai',
    address: 'University Ave, Yangon',
    phone: '+95 9 456 789 012',
    image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    rating: 4.7,
    distance: '4.2 km',
    open_hours: '12:00 PM - 11:00 PM'
  }
];

export const mockMenuItems: Record<string, MenuItem[]> = {
  '1': [
    {
      id: 'm1',
      restaurant_id: '1',
      name: 'Traditional Mohinga',
      description: 'Rice noodles in fish broth with crispy fritters',
      price: 5000,
      image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
      available: true
    },
    {
      id: 'm2',
      restaurant_id: '1',
      name: 'Tea Leaf Salad',
      description: 'Fermented tea leaves with peanuts and tomatoes',
      price: 4500,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      available: true
    },
    {
      id: 'm3',
      restaurant_id: '1',
      name: 'Shan Noodles',
      description: 'Flat rice noodles with chicken in savory sauce',
      price: 5500,
      image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      available: true
    }
  ],
  '2': [
    {
      id: 'm4',
      restaurant_id: '2',
      name: 'Signature Latte',
      description: 'Smooth espresso with steamed milk',
      price: 3500,
      image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
      available: true
    },
    {
      id: 'm5',
      restaurant_id: '2',
      name: 'Croissant',
      description: 'Buttery, flaky French pastry',
      price: 2500,
      image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
      available: true
    }
  ],
  '3': [
    {
      id: 'm6',
      restaurant_id: '3',
      name: 'Tonkotsu Ramen',
      description: 'Rich pork broth with tender chashu',
      price: 8000,
      image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      available: true
    },
    {
      id: 'm7',
      restaurant_id: '3',
      name: 'Salmon Sushi Set',
      description: '8 pieces of fresh salmon nigiri',
      price: 12000,
      image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
      available: true
    }
  ],
  '4': [
    {
      id: 'm8',
      restaurant_id: '4',
      name: 'Pad Thai',
      description: 'Stir-fried rice noodles with shrimp',
      price: 7000,
      image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400',
      available: true
    },
    {
      id: 'm9',
      restaurant_id: '4',
      name: 'Green Curry',
      description: 'Aromatic Thai curry with chicken',
      price: 7500,
      image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
      available: true
    }
  ]
};
