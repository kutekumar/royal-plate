import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserLocation, calculateDistance, YANGON_CENTER } from '@/utils/location';

const STALE_TIME = 1000 * 60 * 5;

export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
  });
}

export function useEnhancedRestaurants() {
  const { data: restaurants, isLoading: restaurantsLoading } = useRestaurants();

  const enhanced = useQuery({
    queryKey: ['restaurants-enhanced', restaurants?.length],
    queryFn: async () => {
      if (!restaurants || restaurants.length === 0) return { all: [], featured: [] };

      const location = await getUserLocation();
      const referencePoint = location || YANGON_CENTER;

      const extractTownship = (address: string): string => {
        const parts = address.split(',');
        return parts[parts.length - 2]?.trim() || parts[0]?.trim() || 'Downtown';
      };

      const enhancedData = restaurants.map((restaurant: any) => {
        let distance_km = 0;
        if (restaurant.latitude && restaurant.longitude) {
          distance_km = calculateDistance(referencePoint, {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          });
        }
        return {
          ...restaurant,
          township: extractTownship(restaurant.address),
          distance_km,
          rating: restaurant.rating || 4.5,
          total_reviews: restaurant.total_reviews || 0,
        };
      });

      const sorted = [...enhancedData].sort((a, b) => a.distance_km - b.distance_km);
      const topRated = [...enhancedData]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);

      return { all: sorted, featured: topRated };
    },
    enabled: !!restaurants,
    staleTime: STALE_TIME,
  });

  return { ...enhanced, restaurants, isLoading: restaurantsLoading || enhanced.isLoading };
}

export function useMenuItems() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
  });
}

export function useOrders(customerId?: string | null) {
  return useQuery({
    queryKey: ['orders', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurants(name, image_url, address)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
    staleTime: STALE_TIME,
  });
}
