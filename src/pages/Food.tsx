import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X, Star, ChevronLeft, ChevronRight, UtensilsCrossed, Crown, Gem, ShoppingCart, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundContext } from '@/contexts/SoundContext';
import DishExplorer from '@/components/DishExplorer';

let cachedData: { restaurants: any[]; menuItems: any[] } | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 5;

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  image_url: string;
  available: boolean;
  restaurant_id: string;
  restaurant_name?: string;
  restaurant_image?: string;
  restaurant_rating?: number;
  restaurant_cuisine?: string;
}

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name A-Z', value: 'name_asc' },
];

const ALL_ITEMS_CATEGORY = 'All';

const Food = () => {
  const navigate = useNavigate();
  const { play } = useSoundContext();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [allData, setAllData] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_ITEMS_CATEGORY);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);

  const seasonalEmoji = useMemo(() => {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return '🌸';
    if (m >= 5 && m <= 7) return '☀️';
    if (m >= 8 && m <= 10) return '🍂';
    return '❄️';
  }, []);

  const favoriteItems = useMemo(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('royal-plate-ordered-items') || '[]');
      if (ids.length === 0) return [];
      return items.filter(item => ids.includes(item.id));
    } catch { return []; }
  }, [items]);

  // Extract unique categories from fetched data
  const categories = useMemo(() => {
    const cats = [ALL_ITEMS_CATEGORY, ...new Set(allData.map(item => item.category).filter(Boolean))];
    return cats;
  }, [allData]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    fetchFoodItems();
  }, [debouncedSearch, selectedCategory, sortBy, currentPage]);

  const fetchFoodItems = useCallback(async () => {
    try {
      setLoading(true);

      let restaurantMap: Record<string, any> = {};
      let rawItems: any[] = [];
      let totalCountFromDb = 0;

      const now = Date.now();
      if (cachedData && now - cacheTime < CACHE_TTL && !debouncedSearch && selectedCategory === ALL_ITEMS_CATEGORY) {
        for (const r of cachedData.restaurants) restaurantMap[r.id] = r;
        const allItems = cachedData.menuItems.filter((item: any) => item.available !== false);
        const from = (currentPage - 1) * PAGE_SIZE;
        rawItems = allItems.slice(from, from + PAGE_SIZE);
        totalCountFromDb = allItems.length;
      } else {
        try {
          const { data: restaurants } = await supabase
            .from('restaurants')
            .select('id, name, image_url, rating, cuisine_type');
          (restaurants || []).forEach((r: any) => { restaurantMap[r.id] = r; });
          if (!debouncedSearch && selectedCategory === ALL_ITEMS_CATEGORY) {
            cachedData = { restaurants: restaurants || [], menuItems: [] };
          }
        } catch (_) {}

        let query = supabase.from('menu_items').select('*', { count: 'exact' });

        if (debouncedSearch.trim()) {
          query = query.or(
            `name.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`
          );
        }

        if (selectedCategory !== ALL_ITEMS_CATEGORY) {
          query = query.eq('category', selectedCategory);
        }

        if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
        else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
        else query = query.order('name', { ascending: true });

        if (selectedCategory === ALL_ITEMS_CATEGORY) {
          const from = (currentPage - 1) * PAGE_SIZE;
          query = query.range(from, from + PAGE_SIZE - 1);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        rawItems = data || [];
        totalCountFromDb = count || 0;

        if (!debouncedSearch && selectedCategory === ALL_ITEMS_CATEGORY && cachedData) {
          cachedData.menuItems = data || [];
          cacheTime = now;
        }
      }

      const availableData = rawItems.filter((item: any) => item.available !== false);

      const enriched: FoodItem[] = availableData.map((item: any) => {
        const r = restaurantMap[item.restaurant_id];
        return {
          ...item,
          restaurant_name: r?.name || 'Unknown Restaurant',
          restaurant_image: r?.image_url || '',
          restaurant_rating: r?.rating || 4.5,
          restaurant_cuisine: r?.cuisine_type || '',
        };
      });

      setItems(enriched);
      setAllData(prev => enriched.length > prev.length ? enriched : prev);
      if (selectedCategory === ALL_ITEMS_CATEGORY) {
        setTotalCount(totalCountFromDb);
      } else {
        setTotalCount(enriched.length);
      }
    } catch (error: any) {
      console.error('Error fetching food items:', error);
      toast.error('Failed to load food items');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, sortBy, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleFoodClick = (item: FoodItem) => {
    play('tap');
    setSelectedFoodItem(item);
  };

  const handleFoodNavigateToRestaurant = (restaurantId: string, menuItemId: string) => {
    setSelectedFoodItem(null);
    navigate(`/restaurant/${restaurantId}`, { state: { scrollToMenuItemId: menuItemId } });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `${(price / 1000).toFixed(1)}k MMK`;
    return `${price.toLocaleString()} MMK`;
  };

  return (
        <div className="relative flex h-screen w-full max-w-sm mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">

      {/* ── Premium Header with Glassmorphism ── */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.1
        }}
        className="relative px-4 pt-6 pb-4 z-10 flex-shrink-0"
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />

        <div className="relative flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-[#1D2956] text-xl font-bold tracking-tight leading-none mb-0.5">
              Culinary Collection
            </h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.25em] font-medium">
              {seasonalEmoji} Discover Exquisite Flavors
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-[11px] font-bold shadow-md ${
              showFilters || selectedCategory !== ALL_ITEMS_CATEGORY || sortBy !== 'default'
                ? 'border-[#536DFE]/30 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40'
                : 'border-white/60 bg-white/80 backdrop-blur-md text-[#1D2956] shadow-black/5'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </motion.button>
        </div>
      </motion.div>

      {/* ── Elevated Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.4
        }}
        className="px-4 pb-3 flex-shrink-0 relative z-10"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/20 to-[#6B7FFF]/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 group-focus-within:text-[#536DFE] transition-colors" />
          <Input
            type="text"
            placeholder="Search for culinary delights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative w-full h-11 pl-11 pr-10 bg-white/90 backdrop-blur-md border border-white/60 rounded-2xl text-[#1D2956] text-xs placeholder-gray-400 focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 shadow-lg shadow-black/5 transition-all"
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-[#536DFE]/10 hover:to-[#536DFE]/20 transition-all shadow-sm"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── Premium Filter Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-4 mb-3 p-4 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-black/5 flex-shrink-0 overflow-hidden"
          >
            <p className="text-[#1D2956] text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
              Sort By
            </p>
            <div className="flex gap-2.5 flex-wrap">
              {SORT_OPTIONS.map((opt, index) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all shadow-md ${
                    sortBy === opt.value
                      ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105'
                      : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-gray-600 hover:border-[#536DFE]/40 hover:text-[#536DFE] hover:shadow-lg'
                  }`}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
            {(selectedCategory !== ALL_ITEMS_CATEGORY || sortBy !== 'default') && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ x: 5 }}
                onClick={() => { setSelectedCategory(ALL_ITEMS_CATEGORY); setSortBy('default'); }}
                className="flex items-center gap-1.5 mt-4 text-gray-400 hover:text-[#536DFE] text-[11px] font-bold transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear all filters
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dynamic Category Pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.5
        }}
        className="flex-shrink-0 pb-4"
      >
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {categories.map((cat, index) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.6 + index * 0.04
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{ willChange: 'transform' }}
              onClick={() => { play('tap'); setSelectedCategory(cat); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-bold tracking-wide transition-all shadow-md ${
                selectedCategory === cat
                  ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105'
                  : 'bg-white/90 backdrop-blur-md border border-white/60 text-gray-600 hover:border-[#536DFE]/40 hover:text-[#536DFE] hover:shadow-lg shadow-black/5'
              }`}
            >
              {cat === ALL_ITEMS_CATEGORY ? 'All' : cat}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Results count with premium styling ── */}
      <div className="px-4 pb-2 flex-shrink-0 flex items-center justify-between">
        <p className="text-gray-500 text-[10px] font-semibold tracking-wide">
          {loading ? 'Loading...' : `${totalCount} ${totalCount !== 1 ? 'Dishes' : 'Dish'} Available`}
        </p>
        {totalPages > 1 && (
          <p className="text-gray-400 text-[11px] font-medium">Page {currentPage} of {totalPages}</p>
        )}
      </div>

      {/* ── Your Favorites ── */}
      {favoriteItems.length > 0 && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span className="text-[#1D2956] text-[10px] font-bold uppercase tracking-[0.15em]">Your Favorites</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {favoriteItems.slice(0, 8).map((item, idx) => (
              <motion.button
                key={`fav-${item.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleFoodClick(item)}
                className="flex-shrink-0 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 border border-white/60 shadow-md hover:shadow-lg hover:border-rose-300 transition-all"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <span className="text-[#1D2956] text-[10px] font-bold whitespace-nowrap">{item.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ── Premium Food Grid ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide" style={{ contentVisibility: 'auto' }}>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/80 backdrop-blur-md overflow-hidden animate-pulse shadow-lg shadow-black/5">
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-3/4" />
                  <div className="h-2.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-1/2" />
                  <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-4 shadow-lg shadow-black/5">
              <UtensilsCrossed className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-[#1D2956] text-sm font-bold mb-1">No Dishes Found</p>
            <p className="text-gray-400 text-xs">Try adjusting your search or filters</p>
            {(searchQuery || selectedCategory !== ALL_ITEMS_CATEGORY) && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory(ALL_ITEMS_CATEGORY); }}
                className="mt-5 px-5 py-2.5 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#536DFE]/40 transition-all active:scale-95 hover:shadow-xl"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: 0.08 + index * 0.04
                }}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFoodClick(item)}
                style={{ willChange: 'transform' }}
                className="text-left rounded-2xl bg-white/90 backdrop-blur-md overflow-hidden shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#536DFE]/20 transition-all duration-500 group border border-white/60"
              >
                {/* Food Image with Premium Overlay and Brand Filter */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 brand-menu-filter brand-shimmer">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brand-image-fade"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {/* Multi-layer gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/0 to-[#536DFE]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Category badge */}
                  {item.category && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md shadow-[#536DFE]/40 backdrop-blur-md border border-white/20">
                        {item.category}
                      </span>
                    </div>
                  )}

                  {/* Rating pill */}
                  {item.restaurant_rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 backdrop-blur-xl rounded-full px-1.5 py-1 border border-white/40 shadow-md">
                      <Star className="w-2.5 h-2.5 fill-white text-white drop-shadow" />
                      <span className="text-white text-[9px] font-bold drop-shadow">{item.restaurant_rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center shadow-xl">
                      <svg className="w-4 h-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-3">
                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.04 }}
                    className="text-[#1D2956] text-xs font-bold leading-tight line-clamp-1 mb-1 group-hover:text-[#536DFE] transition-colors"
                  >
                    {item.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.12 + index * 0.04 }}
                    className="text-gray-400 text-[9px] line-clamp-1 mb-2 font-medium tracking-wide"
                  >
                    {item.restaurant_name}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + index * 0.04 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[#536DFE] font-bold text-sm tracking-tight">{formatPrice(item.price)}</span>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-md shadow-[#536DFE]/30 group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* ── Premium Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md shadow-black/5 hover:shadow-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-[11px] font-bold transition-all shadow-md ${
                      currentPage === page
                        ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105'
                        : 'border border-white/60 bg-white/90 backdrop-blur-md text-gray-600 hover:border-[#536DFE]/50 hover:text-[#536DFE] hover:shadow-lg shadow-black/5'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md shadow-black/5 hover:shadow-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

        {/* ── Dish Explorer Overlay ── */}
        <AnimatePresence>
          {selectedFoodItem && (
            <DishExplorer
              dish={{
                id: selectedFoodItem.id,
                name: selectedFoodItem.name,
                description: selectedFoodItem.description,
                price: selectedFoodItem.price,
                image_url: selectedFoodItem.image_url,
                category: selectedFoodItem.category,
                restaurant_id: selectedFoodItem.restaurant_id,
                restaurant_name: selectedFoodItem.restaurant_name,
                restaurant_image: selectedFoodItem.restaurant_image,
                restaurant_rating: selectedFoodItem.restaurant_rating,
                restaurant_cuisine: selectedFoodItem.restaurant_cuisine,
              }}
              onClose={() => setSelectedFoodItem(null)}
              onNavigateToRestaurant={handleFoodNavigateToRestaurant}
            />
          )}
        </AnimatePresence>
    </div>
  );
};

export default Food;
