import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, MapPin, ArrowLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnhancedRestaurants } from '@/hooks/useQueries';
import { useSoundContext } from '@/contexts/SoundContext';
import { Input } from '@/components/ui/input';

const PAGE_SIZE = 8;

const AllRestaurants = () => {
  const navigate = useNavigate();
  const { play } = useSoundContext();
  const { data, isLoading } = useEnhancedRestaurants();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');
  const containerRef = useRef<HTMLDivElement>(null);

  const restaurants = data?.all || [];

  const filtered = restaurants.filter((r: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.cuisine_type || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (a.distance_km || 0) - (b.distance_km || 0);
  });

  const displayed = sorted.slice(0, displayCount);
  const hasMore = displayCount < sorted.length;

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const handleRestaurantClick = (id: string) => {
    play('tap');
    navigate(`/restaurant/${id}`);
  };

  return (
    <div className="relative flex h-screen w-full max-w-sm mx-auto flex-col overflow-hidden bg-gradient-to-b from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="w-9 h-9 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#1D2956]" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-[#1D2956] text-base font-bold">All Restaurants</h1>
            <p className="text-gray-400 text-[10px] font-medium">{sorted.length} places</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setDisplayCount(PAGE_SIZE); }}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[#1D2956] text-xs placeholder-gray-400 focus:border-[#536DFE]/40 focus:ring-2 focus:ring-[#536DFE]/10 transition-all"
            />
          </div>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { key: 'rating', label: 'Top Rated' },
            { key: 'distance', label: 'Nearest' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key as typeof sortBy)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                sortBy === opt.key
                  ? 'bg-[#536DFE] text-white shadow-md shadow-[#536DFE]/30'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-100/80">
                <div className="h-28 skeleton-luxury" />
                <div className="p-3 space-y-2">
                  <div className="h-3 skeleton-luxury rounded-full w-3/4" />
                  <div className="h-2 skeleton-luxury rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-[#1D2956] text-sm font-bold mb-1">No restaurants found</p>
            <p className="text-gray-400 text-xs">Try adjusting your search</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <AnimatePresence mode="popLayout">
                {displayed.map((restaurant: any, index: number) => (
                  <motion.div
                    key={restaurant.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: (index % PAGE_SIZE) * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleRestaurantClick(restaurant.id)}
                    className="flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={restaurant.image_url || '/placeholder.svg'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-md">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-[#1D2956] text-[9px] font-bold">{restaurant.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col p-3">
                      <h3 className="text-[#1D2956] text-xs font-bold truncate group-hover:text-[#536DFE] transition-colors">
                        {restaurant.name}
                      </h3>
                      <p className="text-gray-400 text-[9px] mt-1 truncate">{restaurant.cuisine_type || 'International'}</p>
                      <div className="flex items-center gap-1 text-gray-400 text-[9px] mt-auto pt-1.5">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{restaurant.township || 'Downtown'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="font-semibold text-[#536DFE] flex-shrink-0">{formatDistance(restaurant.distance_km || 0)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="flex justify-center py-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDisplayCount(prev => prev + PAGE_SIZE)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-2xl text-[#536DFE] text-xs font-bold shadow-sm hover:shadow-md hover:border-[#536DFE]/30 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More ({sorted.length - displayCount} remaining)
                </motion.button>
              </div>
            )}

            {!hasMore && displayed.length > PAGE_SIZE && (
              <div className="text-center py-6 text-gray-400 text-[10px] font-medium">
                Showing all {sorted.length} restaurants
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllRestaurants;
