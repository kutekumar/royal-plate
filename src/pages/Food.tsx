import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/BottomNav';
import { Search, SlidersHorizontal, X, Star, ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';

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

const CATEGORIES = [
  'All', 'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad', 'Soup', 'Snack', 'Breakfast', 'Seafood'
];

const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name A-Z', value: 'name_asc' },
];

const Food = () => {
  const navigate = useNavigate();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      setIsLoading(true);

      // First fetch restaurants to build a lookup map (ignore errors — enrichment is optional)
      let restaurantMap: Record<string, any> = {};
      try {
        const { data: restaurants } = await supabase
          .from('restaurants')
          .select('id, name, image_url, rating, cuisine_type');
        (restaurants || []).forEach((r: any) => {
          restaurantMap[r.id] = r;
        });
      } catch (_) {
        // Non-fatal — food items will still show without restaurant info
      }

      // Build menu_items query — no is_available filter to avoid column name mismatch
      let query = supabase
        .from('menu_items')
        .select('*', { count: 'exact' });

      // Search filter — only use columns that exist in schema (name, description)
      if (debouncedSearch.trim()) {
        query = query.or(
          `name.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`
        );
      }

      // Sorting
      if (sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('name', { ascending: true });
      }

      // Only apply DB-level pagination when no client-side category filter needed
      if (selectedCategory === 'All') {
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase error fetching menu_items:', error);
        throw error;
      }

      // Filter available items client-side using the actual `available` column
      const availableData = (data || []).filter(
        (item: any) => item.available !== false
      );

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

      // Apply category filter client-side (no category column in DB — match against name/description)
      const categoryFiltered = selectedCategory === 'All'
        ? enriched
        : enriched.filter((item) =>
            item.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(selectedCategory.toLowerCase())
          );

      if (selectedCategory === 'All') {
        // DB already paginated
        setFoodItems(categoryFiltered);
        setTotalCount(count || 0);
      } else {
        // Client-side pagination for category-filtered results
        const totalFiltered = categoryFiltered.length;
        const from = (currentPage - 1) * PAGE_SIZE;
        const paginated = categoryFiltered.slice(from, from + PAGE_SIZE);
        setFoodItems(paginated);
        setTotalCount(totalFiltered);
      }
    } catch (error: any) {
      console.error('Error fetching food items:', error);
      toast.error('Failed to load food items');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, sortBy, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleFoodClick = (item: FoodItem) => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(`/restaurant/${item.restaurant_id}`, {
        state: { scrollToMenuItemId: item.id }
      });
    }, 600);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `${(price / 1000).toFixed(1)}k MMK`;
    return `${price.toLocaleString()} MMK`;
  };

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <PageTransition>
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">

      {/* ── Premium Header with Glassmorphism ── */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.1
        }}
        className="relative px-5 pt-8 pb-5 z-10 flex-shrink-0"
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />

        <div className="relative flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-[#1D2956] text-2xl font-bold tracking-tight leading-none mb-1">
              Culinary Collection
            </h1>
            <p className="text-gray-400 text-[11px] uppercase tracking-[0.3em] font-medium">
              Discover Exquisite Flavors
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-xs font-bold shadow-lg ${
              showFilters || selectedCategory !== 'All' || sortBy !== 'default'
                ? 'border-[#536DFE]/30 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40'
                : 'border-white/60 bg-white/80 backdrop-blur-md text-[#1D2956] shadow-black/5'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
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
        className="px-5 pb-4 flex-shrink-0 relative z-10"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/20 to-[#6B7FFF]/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 z-10 group-focus-within:text-[#536DFE] transition-colors" />
          <Input
            type="text"
            placeholder="Search for culinary delights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative w-full h-14 pl-14 pr-12 bg-white/90 backdrop-blur-md border border-white/60 rounded-3xl text-[#1D2956] text-sm placeholder-gray-400 focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 shadow-xl shadow-black/5 transition-all"
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
            className="mx-5 mb-4 p-5 bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl shadow-black/5 flex-shrink-0 overflow-hidden"
          >
            <p className="text-[#1D2956] text-[11px] font-bold uppercase tracking-[0.25em] mb-3.5 flex items-center gap-2">
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
            {(selectedCategory !== 'All' || sortBy !== 'default') && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ x: 5 }}
                onClick={() => { setSelectedCategory('All'); setSortBy('default'); }}
                className="flex items-center gap-1.5 mt-4 text-gray-400 hover:text-[#536DFE] text-[11px] font-bold transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear all filters
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Luxury Category Pills ── */}
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
        <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {CATEGORIES.map((cat, index) => (
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
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wide transition-all shadow-lg ${
                selectedCategory === cat
                  ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40 scale-105'
                  : 'bg-white/90 backdrop-blur-md border border-white/60 text-gray-600 hover:border-[#536DFE]/40 hover:text-[#536DFE] hover:shadow-xl shadow-black/5'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Results count with premium styling ── */}
      <div className="px-5 pb-3 flex-shrink-0 flex items-center justify-between">
        <p className="text-gray-500 text-[11px] font-semibold tracking-wide">
          {isLoading ? 'Loading...' : `${totalCount} ${totalCount !== 1 ? 'Dishes' : 'Dish'} Available`}
        </p>
        {totalPages > 1 && (
          <p className="text-gray-400 text-[11px] font-medium">Page {currentPage} of {totalPages}</p>
        )}
      </div>

      {/* ── Premium Food Grid ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white/80 backdrop-blur-md overflow-hidden animate-pulse shadow-xl shadow-black/5">
                <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-3/4" />
                  <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-1/2" />
                  <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : foodItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-5 shadow-xl shadow-black/5">
              <UtensilsCrossed className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-[#1D2956] text-lg font-bold mb-1">No Dishes Found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-6 px-6 py-3 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#536DFE]/40 transition-all active:scale-95 hover:shadow-2xl"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {foodItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 1.0 + index * 0.06
                }}
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFoodClick(item)}
                className="text-left rounded-3xl bg-white/90 backdrop-blur-md overflow-hidden shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-[#536DFE]/20 transition-all duration-500 group border border-white/60"
              >
                {/* Food Image with Premium Overlay and Brand Filter */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 brand-menu-filter brand-shimmer">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brand-image-fade"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <UtensilsCrossed className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {/* Multi-layer gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/0 to-[#536DFE]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Category badge with glassmorphism */}
                  {item.category && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1],
                        delay: 1.1 + index * 0.06
                      }}
                      className="absolute top-3 left-3"
                    >
                      <span className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-[#536DFE]/40 backdrop-blur-md border border-white/20">
                        {item.category}
                      </span>
                    </motion.div>
                  )}

                  {/* Rating pill with glassmorphism */}
                  {item.restaurant_rating && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1],
                        delay: 1.15 + index * 0.06
                      }}
                      className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-xl rounded-full px-2.5 py-1.5 border border-white/40 shadow-lg"
                    >
                      <Star className="w-3 h-3 fill-white text-white drop-shadow" />
                      <span className="text-white text-[10px] font-bold drop-shadow">{item.restaurant_rating.toFixed(1)}</span>
                    </motion.div>
                  )}

                  {/* Hover overlay with icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center shadow-2xl">
                      <svg className="w-5 h-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info Section with Premium Styling */}
                <div className="p-4">
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.2 + index * 0.06 }}
                    className="text-[#1D2956] text-sm font-bold leading-tight line-clamp-1 mb-1.5 group-hover:text-[#536DFE] transition-colors"
                  >
                    {item.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1.25 + index * 0.06 }}
                    className="text-gray-400 text-[10px] line-clamp-1 mb-3 font-medium tracking-wide"
                  >
                    {item.restaurant_name}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.3 + index * 0.06 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[#536DFE] font-bold text-base tracking-tight">{formatPrice(item.price)}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-lg shadow-[#536DFE]/40 group-hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-11 h-11 rounded-2xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-lg shadow-black/5 hover:shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
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
                    className={`w-11 h-11 rounded-2xl text-xs font-bold transition-all shadow-lg ${
                      currentPage === page
                        ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40 scale-110'
                        : 'border border-white/60 bg-white/90 backdrop-blur-md text-gray-600 hover:border-[#536DFE]/50 hover:text-[#536DFE] hover:shadow-xl shadow-black/5'
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
              className="flex items-center justify-center w-11 h-11 rounded-2xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-lg shadow-black/5 hover:shadow-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
      </PageTransition>
    </>
  );
};

export default Food;
