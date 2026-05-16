import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, MapPin, ShoppingCart, ChefHat, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import { useSoundContext } from '@/contexts/SoundContext';

const CART_KEY = 'royal-plate-cart';

const CUISINE_VIBE: Record<string, { gradient: string; bg: string }> = {
  thai: { gradient: 'from-amber-500 to-orange-600', bg: 'bg-orange-50' },
  japanese: { gradient: 'from-rose-400 to-red-500', bg: 'bg-rose-50' },
  korean: { gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50' },
  chinese: { gradient: 'from-red-600 to-rose-700', bg: 'bg-red-50' },
  italian: { gradient: 'from-emerald-500 to-green-600', bg: 'bg-green-50' },
  indian: { gradient: 'from-orange-400 to-amber-600', bg: 'bg-orange-50' },
  burmese: { gradient: 'from-[#536DFE] to-[#6B7FFF]', bg: 'bg-blue-50' },
  western: { gradient: 'from-amber-600 to-yellow-700', bg: 'bg-amber-50' },
  mexican: { gradient: 'from-lime-500 to-green-600', bg: 'bg-lime-50' },
  seafood: { gradient: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50' },
  dessert: { gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-50' },
  bakery: { gradient: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50' },
  beverage: { gradient: 'from-sky-400 to-indigo-500', bg: 'bg-sky-50' },
  healthy: { gradient: 'from-lime-400 to-green-500', bg: 'bg-lime-50' },
  pizza: { gradient: 'from-yellow-500 to-orange-600', bg: 'bg-yellow-50' },
  asian: { gradient: 'from-red-400 to-rose-500', bg: 'bg-red-50' },
  bbq: { gradient: 'from-orange-600 to-red-700', bg: 'bg-orange-50' },
};

const EMERGENCY_EMOJI: Record<string, string> = {
  thai: '🍜', japanese: '🍣', korean: '🥘', chinese: '🥟',
  italian: '🍝', indian: '🍛', burmese: '🥘', western: '🥩',
  mexican: '🌮', seafood: '🦐', dessert: '🍰', bakery: '🥐',
  beverage: '🧋', healthy: '🥗', pizza: '🍕', asian: '🥢',
  bbq: '🥩',
};

const getCuisineEmoji = (type: string | null): string => {
  if (!type) return '🍽️';
  return EMERGENCY_EMOJI[type.trim().toLowerCase()] || '🍽️';
};

const getCuisineVibe = (type: string | null) => {
  const key = type?.trim().toLowerCase() || '';
  return CUISINE_VIBE[key] || { gradient: 'from-[#536DFE] to-[#6B7FFF]', bg: 'bg-blue-50' };
};

const getTimeEstimate = (distanceKm: number): string => {
  if (distanceKm <= 0.5) return '15-20 min';
  if (distanceKm <= 1) return '20-25 min';
  if (distanceKm <= 2) return '25-35 min';
  if (distanceKm <= 3) return '30-40 min';
  if (distanceKm <= 5) return '40-50 min';
  return '50+ min';
};

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
}

interface CuisineExplorerProps {
  cuisine: string;
  restaurants: any[];
  onClose: () => void;
  onNavigateToRestaurant: (id: string) => void;
}

const CuisineExplorer = ({ cuisine, restaurants, onClose, onNavigateToRestaurant }: CuisineExplorerProps) => {
  const { play } = useSoundContext();
  const [menuByRestaurant, setMenuByRestaurant] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState<string | null>(null);

  const vibe = getCuisineVibe(cuisine);
  const emoji = getCuisineEmoji(cuisine);
  const totalDishes = Object.values(menuByRestaurant).reduce((sum, items) => sum + items.length, 0);

  useEffect(() => {
    const ids = restaurants.map(r => r.id);
    if (ids.length === 0) { setLoading(false); return; }
    const fetchMenu = async () => {
      try {
        const { data } = await supabase
          .from('menu_items')
          .select('id, name, description, price, category, image_url, available, restaurant_id')
          .in('restaurant_id', ids)
          .eq('available', true)
          .limit(60);
        const grouped: Record<string, MenuItem[]> = {};
        (data || []).forEach((item: any) => {
          if (!grouped[item.restaurant_id]) grouped[item.restaurant_id] = [];
          grouped[item.restaurant_id].push({
            id: item.id, name: item.name, description: item.description || '',
            price: item.price, category: item.category || 'Main',
            image_url: item.image_url || '', is_available: item.available,
          });
        });
        setMenuByRestaurant(grouped);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchMenu();
  }, [restaurants]);

  const handleAddToCart = useCallback((item: MenuItem, restId: string) => {
    play('addToCart');
    setAddingItem(item.id);
    try {
      const saved = localStorage.getItem(CART_KEY);
      const cartItem = { ...item, quantity: 1, specialInstructions: '' };

      if (!saved) {
        localStorage.setItem(CART_KEY, JSON.stringify({ restaurantId: restId, items: [cartItem] }));
        toast.success(`${item.name} added! Redirecting...`);
        setTimeout(() => onNavigateToRestaurant(restId), 350);
        return;
      }

      const parsed = JSON.parse(saved);
      if (parsed.restaurantId === restId) {
        const existing = parsed.items.find((i: any) => i.id === item.id);
        if (existing) existing.quantity += 1;
        else parsed.items.push(cartItem);
        localStorage.setItem(CART_KEY, JSON.stringify(parsed));
        toast.success(`${item.name} added! Redirecting...`);
        setTimeout(() => onNavigateToRestaurant(restId), 350);
      } else {
        const prev = restaurants.find(r => r.id === parsed.restaurantId);
        const prevName = prev?.name || 'another restaurant';
        toast(`Switch from ${prevName}?`, {
          description: `Your cart has items from ${prevName}. Clear and order from this restaurant instead?`,
          duration: 6000,
          action: {
            label: "Switch",
            onClick: () => {
              play('success');
              localStorage.setItem(CART_KEY, JSON.stringify({ restaurantId: restId, items: [cartItem] }));
              toast.success(`Switched to ${item.name}!`);
              setTimeout(() => onNavigateToRestaurant(restId), 350);
            }
          }
        });
      }
    } catch { toast.error('Could not add to cart'); }
    setTimeout(() => setAddingItem(null), 600);
  }, [restaurants, play, onNavigateToRestaurant]);

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-[60] flex flex-col bg-[#F5F5F7] font-poppins will-change-transform"
    >
      <div className={`relative flex-shrink-0 bg-gradient-to-br ${vibe.gradient} px-4 pt-12 pb-6`}>
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
          className="relative z-10"
        >
          <h1 className="text-white text-2xl font-bold flex items-center gap-2.5 drop-shadow-lg">
            <span className="text-3xl">{emoji}</span>
            <span className="capitalize">{cuisine}</span>
          </h1>
          <p className="text-white/80 text-xs mt-1 ml-1 drop-shadow">
            {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
            {totalDishes > 0 && ` · ${totalDishes} dishes`}
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-[-1px] left-0 right-0 h-6 bg-[#F5F5F7]"
          style={{ borderRadius: '24px 24px 0 0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-5 pb-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                <div className="h-28 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-3 skeleton rounded-full w-2/3" />
                  <div className="h-2 skeleton rounded-full w-1/3" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-8 skeleton rounded-xl flex-1" />
                    <div className="h-8 skeleton rounded-xl flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ChefHat className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-[#1D2956] text-sm font-bold">No restaurants found</p>
            <p className="text-gray-400 text-xs mt-1">Try exploring another cuisine</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant, idx) => {
              const items = menuByRestaurant[restaurant.id] || [];
              const displayItems = items.slice(0, 4);
              const hasMore = items.length > 4;

              return (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.4 }}
                  className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-lg shadow-black/5 overflow-hidden"
                >
                  <button
                    onClick={() => { play('tap'); onNavigateToRestaurant(restaurant.id); }}
                    className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/60 shadow-sm flex-shrink-0">
                      <img src={restaurant.image_url || ''} alt={restaurant.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[#1D2956] text-sm font-bold truncate">{restaurant.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {restaurant.rating?.toFixed(1)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <MapPin className="w-2.5 h-2.5 text-[#536DFE]" />
                          {restaurant.distance_km ? `${restaurant.distance_km.toFixed(1)} km` : restaurant.distance}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Timer className="w-2.5 h-2.5" />
                          {getTimeEstimate(restaurant.distance_km || 0)}
                        </span>
                      </div>
                    </div>
                  </button>

                  {displayItems.length > 0 && (
                    <div className="px-3.5 pb-3.5 pt-0">
                      <div className="h-px bg-gradient-to-r from-gray-100 via-gray-200 to-transparent mb-3" />
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Popular dishes</p>
                      <div className="flex flex-wrap gap-2">
                        {displayItems.map(item => (
                          <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddToCart(item, restaurant.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F0F2FF] hover:bg-[#536DFE]/10 transition-all border border-transparent hover:border-[#536DFE]/20 shadow-sm"
                          >
                            <span className="text-[10px] font-bold text-[#1D2956] truncate max-w-[80px]">{item.name}</span>
                            <span className="text-[9px] font-semibold text-[#536DFE]">{formatCurrency(item.price)}</span>
                            <motion.div
                              animate={addingItem === item.id ? { scale: [1, 1.3, 0], opacity: [1, 0.5, 0] } : {}}
                              transition={{ duration: 0.4 }}
                            >
                              <ShoppingCart className="w-2.5 h-2.5 text-[#536DFE]" />
                            </motion.div>
                          </motion.button>
                        ))}
                        {hasMore && (
                          <button
                            onClick={() => { play('tap'); onNavigateToRestaurant(restaurant.id); }}
                            className="text-[9px] text-[#536DFE] font-bold px-2 py-1 hover:bg-[#536DFE]/5 rounded-lg transition-colors"
                          >
                            +{items.length - 4} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CuisineExplorer;
