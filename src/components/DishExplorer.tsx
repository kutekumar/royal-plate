import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Timer, ChefHat, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currency';
import { useSoundContext } from '@/contexts/SoundContext';

interface DishExplorerProps {
  dish: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category?: string;
    restaurant_id: string;
    restaurant_name?: string;
    restaurant_image?: string;
    restaurant_rating?: number;
    restaurant_cuisine?: string;
  };
  onClose: () => void;
  onNavigateToRestaurant: (restaurantId: string, menuItemId: string) => void;
}

const getTimeEstimate = (distanceKm: number): string => {
  if (distanceKm <= 0.5) return '15-20 min';
  if (distanceKm <= 1) return '20-25 min';
  if (distanceKm <= 2) return '25-35 min';
  if (distanceKm <= 3) return '30-40 min';
  if (distanceKm <= 5) return '40-50 min';
  return '50+ min';
};

const DishExplorer = ({ dish, onClose, onNavigateToRestaurant }: DishExplorerProps) => {
  const { play } = useSoundContext();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [extraInfo, setExtraInfo] = useState<{ description?: string; category?: string }>({});

  useEffect(() => {
    if (!dish.description || !dish.category) {
      supabase.from('menu_items')
        .select('description, category')
        .eq('id', dish.id)
        .single()
        .then(({ data }) => {
          if (data) setExtraInfo({ description: data.description, category: data.category });
        })
        .catch(() => {});
    }
  }, [dish.id, dish.description, dish.category]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const { data: similarItems } = await supabase
          .from('menu_items')
          .select('id, restaurant_id')
          .eq('available', true)
          .ilike('name', `%${dish.name}%`);

        const seen = new Set<string>();
        const restIds: string[] = [];
        if (similarItems) {
          for (const item of similarItems) {
            if (!seen.has(item.restaurant_id)) {
              seen.add(item.restaurant_id);
              restIds.push(item.restaurant_id);
            }
          }
        }
        if (!seen.has(dish.restaurant_id)) restIds.unshift(dish.restaurant_id);

        if (restIds.length > 0) {
          const { data: restData } = await supabase
            .from('restaurants')
            .select('id, name, image_url, rating, cuisine_type, address, latitude, longitude')
            .in('id', restIds);
          setRestaurants(restData || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchRestaurants();
  }, [dish]);

  const desc = extraInfo.description || dish.description || '';
  const category = extraInfo.category || dish.category;
  const shouldTruncate = desc.length > 100;

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-[60] flex flex-col bg-[#F5F5F7] font-poppins will-change-transform max-w-[430px] mx-auto"
    >
      <div className="relative flex-shrink-0">
        <div className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] px-4 pt-12 pb-6">
          <div className="absolute inset-0 bg-black/10" />

          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => { play('tap'); onClose(); }}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.93 }}
            className="relative z-10 flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-bold mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 flex items-start gap-4"
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl flex-shrink-0">
              {dish.image_url ? (
                <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-white/60" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-white text-lg font-bold drop-shadow-lg leading-tight">{dish.name}</h1>
              {category && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[9px] font-bold uppercase tracking-wider border border-white/20">
                  {category}
                </span>
              )}
              <p className="text-white text-lg font-bold mt-1 drop-shadow">{formatCurrency(dish.price)}</p>
            </div>
          </motion.div>

          {desc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 mt-3"
            >
              <p className="text-white/80 text-[11px] leading-relaxed">
                {shouldTruncate && !showFullDesc ? `${desc.slice(0, 100)}...` : desc}
                {shouldTruncate && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-white font-bold ml-1 underline decoration-white/40"
                  >
                    {showFullDesc ? 'Less' : 'More'}
                  </button>
                )}
              </p>
            </motion.div>
          )}
        </div>

        <motion.div
          className="absolute bottom-[-1px] left-0 right-0 h-6 bg-[#F5F5F7]"
          style={{ borderRadius: '24px 24px 0 0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-5 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
          <h2 className="text-[#1D2956] text-sm font-bold">
            Available at {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-full w-2/3" />
                    <div className="h-2 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-full w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ChefHat className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-[#1D2956] text-sm font-bold">No restaurants available</p>
            <p className="text-gray-400 text-xs mt-1">This dish isn't currently available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((restaurant, idx) => (
              <motion.button
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  play('tap');
                  onNavigateToRestaurant(restaurant.id, dish.id);
                }}
                className="w-full text-left rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-lg shadow-black/5 overflow-hidden hover:shadow-xl hover:border-[#536DFE]/30 transition-all"
              >
                <div className="flex items-center gap-3 p-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/60 shadow-sm flex-shrink-0">
                    <img
                      src={restaurant.image_url || ''}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1D2956] text-sm font-bold truncate">{restaurant.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {restaurant.rating && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {Number(restaurant.rating).toFixed(1)}
                        </span>
                      )}
                      {restaurant.cuisine_type && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] text-gray-500">{restaurant.cuisine_type}</span>
                        </>
                      )}
                    </div>
                    {restaurant.distance_km !== undefined && restaurant.distance_km > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Timer className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-[9px] text-gray-400 font-medium">{getTimeEstimate(restaurant.distance_km)}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DishExplorer;
