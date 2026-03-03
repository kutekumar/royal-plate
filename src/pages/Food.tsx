import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/BottomNav';
import { Search, SlidersHorizontal, X, Star, ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import gsap from 'gsap';

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

  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Entrance animation
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
  }, []);

  // List animation on page change
  useEffect(() => {
    if (listRef.current && !isLoading) {
      gsap.fromTo(
        listRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out' }
      );
    }
  }, [foodItems, isLoading]);

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
    navigate(`/restaurant/${item.restaurant_id}`, {
      state: { scrollToMenuItemId: item.id }
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `${(price / 1000).toFixed(1)}k MMK`;
    return `${price.toLocaleString()} MMK`;
  };

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#F5F5F7] font-poppins">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between px-6 pt-6 pb-4 z-10 relative flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#536DFE]/10 border border-[#536DFE]/20">
            <UtensilsCrossed className="w-5 h-5 text-[#536DFE]" />
          </div>
          <div>
            <h1 className="text-[#1D2956] text-2xl tracking-wider font-bold leading-none">Food</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">Explore All Dishes</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all ${
            showFilters || selectedCategory !== 'All' || sortBy !== 'default'
              ? 'border-[#536DFE] bg-[#536DFE]/10'
              : 'border-gray-200 bg-white shadow-sm'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 text-[#536DFE]" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 pb-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#536DFE]/50" />
          <Input
            type="text"
            placeholder="Search dishes, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-10 bg-white border-2 border-[#536DFE]/30 rounded-xl text-[#536DFE] placeholder-[#536DFE]/40 focus:border-[#536DFE] focus:ring-0 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1D2956] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-6 pb-4 flex-shrink-0 border-b border-gray-100">
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold mb-3">Sort By</p>
          <div className="flex gap-2 flex-wrap mb-4">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sortBy === opt.value
                    ? 'bg-[#536DFE] text-white shadow-sm'
                    : 'bg-white border border-[#536DFE]/30 text-[#536DFE]/70 hover:border-[#536DFE]/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {(selectedCategory !== 'All' || sortBy !== 'default') && (
            <button
              onClick={() => { setSelectedCategory('All'); setSortBy('default'); }}
              className="flex items-center gap-1 text-gray-400 hover:text-[#1D2956] text-xs transition-colors"
            >
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex-shrink-0 px-6 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                selectedCategory === cat
                  ? 'bg-[#536DFE] text-white shadow-md'
                  : 'bg-white border border-[#536DFE]/25 text-[#536DFE]/60 hover:border-[#536DFE]/50 hover:text-[#536DFE]/90'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-6 pb-2 flex-shrink-0 flex items-center justify-between">
        <p className="text-gray-400 text-xs font-medium">
          {isLoading ? 'Loading...' : `${totalCount} dish${totalCount !== 1 ? 'es' : ''} found`}
        </p>
        {totalPages > 1 && (
          <p className="text-gray-400 text-xs">Page {currentPage} of {totalPages}</p>
        )}
      </div>

      {/* Food List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-[#536DFE]/10 overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : foodItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg font-semibold">No dishes found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-4 px-5 py-2 bg-[#536DFE]/10 border border-[#536DFE]/20 text-[#536DFE] rounded-xl text-sm font-semibold hover:bg-[#536DFE]/25 transition-all"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div ref={listRef} className="grid grid-cols-2 gap-3">
            {foodItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleFoodClick(item)}
                className="text-left rounded-2xl bg-white border border-[#536DFE]/15 overflow-hidden hover:border-[#536DFE]/50 hover:shadow-[0_0_20px_rgba(210,141,31,0.15)] transition-all active:scale-[0.97] group"
              >
                {/* Food Image */}
                <div className="relative h-32 overflow-hidden bg-gray-50">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {/* Category badge */}
                  {item.category && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-[#536DFE] text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-[#1D2956] text-sm font-semibold leading-tight line-clamp-1 mb-0.5">
                    {item.name}
                  </h3>
                  <p className="text-gray-400 text-[10px] line-clamp-1 mb-2">
                    {item.restaurant_name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#536DFE] font-bold text-sm">{formatPrice(item.price)}</span>
                    {item.restaurant_rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#536DFE] text-[#536DFE]" />
                        <span className="text-gray-400 text-[10px] font-semibold">
                          {item.restaurant_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-[#536DFE]/5 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-[#536DFE] text-white shadow-md'
                        : 'border border-gray-200 bg-white text-gray-500 hover:border-[#536DFE]/50 hover:text-[#1D2956]'
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
              className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-[#536DFE]/5 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Food;
