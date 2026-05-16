import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Star, MapPin, Bell, User, Map, ChevronRight, Percent, Clock, Sparkles, Flame, Heart, Navigation, ChevronDown, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerNotifications, CustomerNotification } from '@/hooks/useCustomerNotifications';
import LogoImg from '@/imgs/logo.png';
import RestaurantMap from '@/components/RestaurantMap';
import { YANGON_CENTER } from '@/utils/location';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundContext } from '@/contexts/SoundContext';
import { useEnhancedRestaurants } from '@/hooks/useQueries';
import { formatCurrency } from '@/utils/currency';

const POPULAR_DISHES_CACHE_KEY = 'home_popular_dishes';
const CACHE_TTL = 1000 * 60 * 5;
const HOME_RESTAURANT_SHOW = 4;
const SLIDER_INTERVAL = 4000;

interface PopularDish {
  id: string;
  name: string;
  price: number;
  image_url: string;
  restaurant_id: string;
  restaurant_name: string;
}

const CUISINE_MAP: Record<string, { emoji: string; label: string }> = {
  burmese: { emoji: '🥘', label: 'Burmese' },
  chinese: { emoji: '🥟', label: 'Chinese' },
  japanese: { emoji: '🍣', label: 'Japanese' },
  korean: { emoji: '🥘', label: 'Korean' },
  thai: { emoji: '🍜', label: 'Thai' },
  italian: { emoji: '🍝', label: 'Italian' },
  indian: { emoji: '🍛', label: 'Indian' },
  western: { emoji: '🥩', label: 'Western' },
  mexican: { emoji: '🌮', label: 'Mexican' },
  seafood: { emoji: '🦐', label: 'Seafood' },
  dessert: { emoji: '🍰', label: 'Dessert' },
  bakery: { emoji: '🥐', label: 'Bakery' },
  beverage: { emoji: '🧋', label: 'Beverage' },
  healthy: { emoji: '🥗', label: 'Healthy' },
  'fast food': { emoji: '🍔', label: 'Fast Food' },
  pizza: { emoji: '🍕', label: 'Pizza' },
  asian: { emoji: '🥢', label: 'Asian' },
  international: { emoji: '🌍', label: 'International' },
  bbq: { emoji: '🥩', label: 'BBQ' },
  salad: { emoji: '🥗', label: 'Salad' },
  soup: { emoji: '🍜', label: 'Soup' },
  snack: { emoji: '🥨', label: 'Snack' },
  breakfast: { emoji: '🥞', label: 'Breakfast' },
};

const getCuisineInfo = (type: string | null) => {
  if (!type) return { emoji: '🍽️', label: 'International' };
  const key = type.trim().toLowerCase();
  return CUISINE_MAP[key] || { emoji: '🍽️', label: type };
};

const getTimeEstimate = (distanceKm: number): string => {
  if (distanceKm <= 0.5) return '15-20 min';
  if (distanceKm <= 1) return '20-25 min';
  if (distanceKm <= 2) return '25-35 min';
  if (distanceKm <= 3) return '30-40 min';
  if (distanceKm <= 5) return '40-50 min';
  return '50+ min';
};

const promoSlides = [
  { id: 1, title: 'Free Delivery', subtitle: 'On your first 3 orders', gradient: 'from-[#536DFE] to-[#6B7FFF]', icon: <Percent className="w-5 h-5" /> },
  { id: 2, title: 'Weekend Special', subtitle: 'Up to 30% off on all items', gradient: 'from-rose-500 to-pink-500', icon: <Sparkles className="w-5 h-5" /> },
  { id: 3, title: 'Quick Delivery', subtitle: 'Under 30 mins or it\'s free', gradient: 'from-amber-500 to-orange-500', icon: <Clock className="w-5 h-5" /> },
  { id: 4, title: 'Royal Rewards', subtitle: 'Earn points with every order', gradient: 'from-emerald-500 to-teal-500', icon: <Star className="w-5 h-5" /> },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { play } = useSoundContext();
  const { data, isLoading } = useEnhancedRestaurants();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMapView, setShowMapView] = useState(false);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCustomerNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Feature states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('Detecting...');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationOptions] = useState<string[]>(['Downtown', 'Hlaing', 'Sanchaung', 'Kamayut', 'Bahan', 'Dagon', 'Mingalar Taung Nyunt', 'Yankin']);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const restaurants = data?.all || [];
  const featuredRestaurants = data?.featured || [];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Derive categories from restaurant data
  useEffect(() => {
    if (restaurants.length > 0) {
      const cats = new Set<string>();
      restaurants.forEach((r: any) => {
        if (r.cuisine_type) {
          const types = r.cuisine_type.split(',').map((t: string) => t.trim().toLowerCase());
          types.forEach((t: string) => {
            const mapped = CUISINE_MAP[t] ? t : null;
            if (mapped) cats.add(mapped);
          });
        }
      });
      setAllCategories(Array.from(cats).slice(0, 10));
    }
  }, [restaurants]);

  // Detect location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const { getUserLocation } = await import('@/utils/location');
        const loc = await getUserLocation();
        if (loc) {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json&accept-language=en`);
          const data = await res.json();
          const town = data?.address?.suburb || data?.address?.town || data?.address?.city_district || '';
          if (town) setCurrentLocation(town);
          else setCurrentLocation('Downtown');
        } else {
          setCurrentLocation('Downtown');
        }
      } catch {
        setCurrentLocation('Downtown');
      }
    };
    detectLocation();
  }, []);

  // Fetch favorites from order history
  useEffect(() => {
    if (!user) return;
    const fetchFavorites = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('restaurant_id')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (orders && orders.length > 0) {
        const seen = new Set<string>();
        const ids = orders
          .map((o: any) => o.restaurant_id)
          .filter((id: string) => {
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .slice(0, 8);

        if (ids.length > 0) {
          const { data: restaurantsData } = await supabase
            .from('restaurants')
            .select('id, name, image_url, rating, cuisine_type, address')
            .in('id', ids);
          setFavoriteRestaurants(restaurantsData || []);
        }
      }
    };
    fetchFavorites();
  }, [user]);

  // Search + category + filter combined logic
  const filteredRestaurants = useMemo(() => {
    let result = restaurants.filter((restaurant: any) => {
      // Search filter
      if (searchQuery.trim() &&
        !restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(restaurant.description || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(restaurant.cuisine_type || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Category filter
      if (selectedCategory) {
        const types = (restaurant.cuisine_type || '').toLowerCase().split(',').map((t: string) => t.trim());
        if (!types.includes(selectedCategory.toLowerCase())) return false;
      }
      return true;
    });

    // Quick filters
    if (activeFilters.has('nearby')) {
      result = result.filter((r: any) => r.distance_km !== undefined && r.distance_km <= 2);
    }
    if (activeFilters.has('rating')) {
      result = result.filter((r: any) => (r.rating || 0) >= 4.5);
    }
    if (activeFilters.has('open')) {
      result = result.filter((r: any) => r.opening_hours && r.opening_hours.trim());
    }

    return result;
  }, [restaurants, searchQuery, selectedCategory, activeFilters]);

  // Scroll to restaurant section when category changes
  useEffect(() => {
    if (selectedCategory && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const cached = sessionStorage.getItem(POPULAR_DISHES_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) { setPopularDishes(parsed.data); return; }
      } catch {}
    }
    fetchPopularDishes();
  }, []);

  const fetchPopularDishes = async () => {
    try {
      const { data: rData } = await supabase.from('restaurants').select('id, name');
      const restaurantMap: Record<string, string> = {};
      (rData || []).forEach((r: any) => { restaurantMap[r.id] = r.name; });
      const { data: items } = await supabase.from('menu_items')
        .select('id, name, price, image_url, restaurant_id')
        .eq('available', true).not('image_url', 'is', null).limit(20);
      if (!items) return;
      const dishes: PopularDish[] = items.filter((i: any) => i.image_url).map((i: any) => ({
        id: i.id, name: i.name, price: i.price, image_url: i.image_url,
        restaurant_id: i.restaurant_id, restaurant_name: restaurantMap[i.restaurant_id] || 'Unknown',
      }));
      setPopularDishes(dishes);
      sessionStorage.setItem(POPULAR_DISHES_CACHE_KEY, JSON.stringify({ data: dishes, ts: Date.now() }));
    } catch {}
  };

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide(prev => (prev + 1) % promoSlides.length); }, SLIDER_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(filter) ? next.delete(filter) : next.add(filter);
      return next;
    });
    play('tap');
  };

  const handleCategoryClick = (cat: string) => {
    play('tap');
    setSelectedCategory(prev => prev === cat ? null : cat);
  };

  const handleDishClick = useCallback((dish: PopularDish) => {
    play('tap');
    navigate(`/restaurant/${dish.restaurant_id}`, { state: { scrollToMenuItemId: dish.id } });
  }, [navigate, play]);

  const handleNotificationClick = useCallback((notification: CustomerNotification) => {
    play('notification');
    markAsRead(notification.id);
    if (notification.blog_post_id) navigate(`/blog/${notification.blog_post_id}`);
    else if (notification.order_id) navigate('/orders');
    setShowNotifications(false);
  }, [navigate, play]);

  const handleRestaurantClick = useCallback((id: string) => {
    play('tap');
    navigate(`/restaurant/${id}`);
  }, [navigate, play]);

  const firstName = user?.email?.split('@')[0] || 'Guest';
  const filterCount = activeFilters.size + (selectedCategory ? 1 : 0);

  return (
    <div className="relative flex h-screen w-full max-w-sm mx-auto flex-col overflow-hidden bg-gradient-to-b from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">
      {/* Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="sticky top-0 z-50 px-4 pt-5 pb-1"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-transparent backdrop-blur-lg" />
        <div className="relative flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="flex items-center gap-2.5"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] p-0.5 shadow-lg shadow-[#536DFE]/30 flex-shrink-0"
            >
              <div className="w-full h-full rounded-[9px] bg-white p-0.5 flex items-center justify-center">
                <img src={LogoImg} alt="Royal Plate" className="w-full h-full object-contain" />
              </div>
            </motion.div>
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-[9px] text-gray-500 font-semibold tracking-[0.2em] uppercase leading-none"
              >
                Welcome Back
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-[#1D2956] text-sm font-bold leading-tight mt-0.5"
              >
                {firstName}
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 hover:border-[#536DFE]/40 hover:shadow-xl transition-all shadow-lg shadow-black/5"
            >
              <Bell className="w-3.5 h-3.5 text-[#1D2956]" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-3.5 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-[7px] font-bold rounded-full px-0.5 shadow-lg shadow-[#536DFE]/50"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 hover:border-[#536DFE]/40 hover:shadow-xl transition-all shadow-lg shadow-black/5"
            >
              <User className="w-3.5 h-3.5 text-[#1D2956]" />
            </motion.button>
          </motion.div>
        </div>

        {/* Location Selector */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLocationPicker(!showLocationPicker)}
          className="relative flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-gray-200/60 shadow-sm hover:shadow-md hover:border-[#536DFE]/30 transition-all"
        >
          <Navigation className="w-3 h-3 text-[#536DFE]" />
          <span className="text-[10px] text-[#1D2956] font-semibold truncate max-w-[140px]">{currentLocation}</span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showLocationPicker ? 'rotate-180' : ''}`} />
        </motion.button>

        {/* Location Picker Dropdown */}
        <AnimatePresence>
          {showLocationPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-4 right-4 mt-1 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl shadow-black/10 overflow-hidden z-50"
            >
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] px-4 pt-3 pb-2">Select Location</p>
              {locationOptions.map((loc) => (
                <button
                  key={loc}
                  onClick={() => { setCurrentLocation(loc); setShowLocationPicker(false); play('tap'); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center gap-2 ${
                    currentLocation === loc ? 'text-[#536DFE] bg-[#536DFE]/5' : 'text-[#1D2956] hover:bg-gray-50'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${currentLocation === loc ? 'text-[#536DFE]' : 'text-gray-300'}`} />
                  {loc}
                  {currentLocation === loc && <span className="ml-auto text-[9px] text-[#536DFE] font-bold">✓</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute top-[100px] right-4 w-72 max-h-80 bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50">
          <div className="sticky top-0 bg-gradient-to-b from-white to-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-[#1D2956] font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[9px] text-[#536DFE] font-bold uppercase tracking-wider hover:text-[#6B7FFF] transition-colors">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-xs">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gradient-to-r hover:from-[#536DFE]/5 hover:to-transparent transition-all ${notification.status === 'unread' ? 'bg-[#536DFE]/5' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 shadow-lg ${notification.status === 'unread' ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF]' : 'bg-gray-200'}`} />
                  <div>
                    <p className="text-[#1D2956] text-xs font-semibold">{notification.title}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{notification.message}</p>
                    <p className="text-gray-400 text-[9px] mt-1 font-medium">{new Date(notification.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {/* Promotion Slider */}
        <div className="px-4 pb-3 pt-2">
          <div className="relative rounded-2xl overflow-hidden h-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute inset-0 bg-gradient-to-br ${promoSlides[currentSlide].gradient} p-4 flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    {promoSlides[currentSlide].icon}
                  </div>
                  <div className="flex gap-1">
                    {promoSlides.map((_, idx) => (
                      <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white text-base font-bold drop-shadow">{promoSlides[currentSlide].title}</p>
                  <p className="text-white/80 text-[11px] mt-0.5 drop-shadow">{promoSlides[currentSlide].subtitle}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/20 to-[#6B7FFF]/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 group-focus-within:text-[#536DFE] transition-colors" />
            <Input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full h-10 pl-10 pr-4 bg-white/90 backdrop-blur-md border border-white/60 rounded-2xl text-[#1D2956] text-xs placeholder-gray-500 focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 shadow-lg shadow-black/5 transition-all"
            />
          </div>
        </div>

        {/* ── FEATURE 1: What are you craving? ── */}
        {!searchQuery && allCategories.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-2.5">
              <h2 className="text-[#1D2956] text-sm font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#536DFE]" />
                What are you craving?
              </h2>
            </div>
            <div ref={categoryScrollRef} className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
              {allCategories.map((cat, idx) => {
                const info = getCuisineInfo(cat);
                const isActive = selectedCategory === cat;
                return (
                  <motion.button
                    key={cat}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 w-[72px] py-2.5 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-lg shadow-[#536DFE]/30 scale-105'
                        : 'bg-white/90 backdrop-blur-md border border-gray-100/80 text-[#1D2956] shadow-sm hover:shadow-md hover:border-[#536DFE]/30'
                    }`}
                  >
                    <span className="text-xl leading-none">{info.emoji}</span>
                    <span className="text-[9px] font-bold leading-tight text-center">{info.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FEATURE 2: Quick Filter Chips ── */}
        {!searchQuery && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { key: 'nearby', label: 'Under 2 km', icon: <MapPin className="w-3 h-3" /> },
              { key: 'rating', label: 'Rating 4.5+', icon: <Star className="w-3 h-3" /> },
              { key: 'open', label: 'Open Now', icon: <Clock className="w-3 h-3" /> },
            ].map((chip) => {
              const isActive = activeFilters.has(chip.key);
              return (
                <motion.button
                  key={chip.key}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleFilter(chip.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-bold transition-all border ${
                    isActive
                      ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white border-transparent shadow-md shadow-[#536DFE]/30'
                      : 'bg-white/90 backdrop-blur-md border-gray-200/70 text-gray-600 hover:border-[#536DFE]/40 hover:text-[#536DFE] shadow-sm'
                  }`}
                >
                  {chip.icon}
                  {chip.label}
                </motion.button>
              );
            })}
            {filterCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setSelectedCategory(null); setActiveFilters(new Set()); play('tap'); }}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-[10px] font-bold border border-red-200 text-red-500 bg-red-50/50 shadow-sm"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">{filterCount}</span>
                Clear
              </motion.button>
            )}
          </div>
        )}

        {/* ── FEATURE 3: Your Favorites ── */}
        {!searchQuery && favoriteRestaurants.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-2.5">
              <h2 className="text-[#1D2956] text-sm font-bold flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                Your Favorites
              </h2>
              <span className="text-gray-400 text-[9px] font-medium">Reorder easily</span>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
              {favoriteRestaurants.map((restaurant, idx) => {
                const info = getCuisineInfo(restaurant.cuisine_type);
                return (
                  <motion.button
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRestaurantClick(restaurant.id)}
                    className="flex-shrink-0 flex items-center gap-2.5 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/60 shadow-md hover:shadow-lg hover:border-[#536DFE]/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/60 shadow-sm flex-shrink-0">
                      <img src={restaurant.image_url || ''} alt={restaurant.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[#1D2956] text-[11px] font-bold truncate max-w-[100px]">{restaurant.name}</p>
                      <p className="text-gray-400 text-[8px] mt-0.5">{info.emoji} {info.label}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Popular Dishes */}
        {popularDishes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-2.5">
              <div>
                <h2 className="text-[#1D2956] text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#536DFE]" />
                  Popular Dishes
                </h2>
                <p className="text-gray-400 text-[8px] uppercase tracking-[0.2em] font-medium ml-[22px]">Top picks from our kitchens</p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
              {popularDishes.slice(0, 12).map((dish, index) => (
                <motion.button
                  key={dish.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.03 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDishClick(dish)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[80px]"
                >
                  <div className="relative w-[68px] h-[68px] rounded-full overflow-hidden shadow-md shadow-[#536DFE]/15 ring-2 ring-white/80">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] opacity-10" />
                    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
                  </div>
                  <div className="text-center w-full px-0.5">
                    <p className="text-[#1D2956] text-[9px] font-bold leading-tight truncate">{dish.name}</p>
                    <p className="text-[#536DFE] text-[9px] font-semibold mt-0.5">{formatCurrency(dish.price)}</p>
                    <p className="text-gray-400 text-[7px] truncate mt-0.5">{dish.restaurant_name}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Top Restaurant */}
        {featuredRestaurants.length > 0 && !searchQuery && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-2.5">
              <div>
                <h2 className="text-[#1D2956] text-sm font-bold flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Top Restaurant
                </h2>
                <p className="text-gray-400 text-[8px] uppercase tracking-[0.2em] font-medium ml-[22px]">Featured & top rated</p>
              </div>
              <button onClick={() => navigate('/restaurants')} className="text-[9px] text-[#536DFE] font-bold flex items-center gap-0.5 hover:text-[#6B7FFF] transition-colors">
                See All <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
              {featuredRestaurants.slice(0, 5).map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, x: 40, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.06 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                  className="flex-shrink-0 w-56 cursor-pointer"
                >
                  <Card className="overflow-hidden bg-white/95 backdrop-blur-md border-white/70 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-500 rounded-2xl">
                    <div className="relative h-36 overflow-hidden">
                      <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 backdrop-blur-xl rounded-full px-1.5 py-0.5 border border-white/40 shadow-lg">
                        <Star className="w-2.5 h-2.5 fill-white text-white drop-shadow" />
                        <span className="text-white text-[9px] font-bold drop-shadow">{restaurant.rating}</span>
                      </div>
                      {restaurant.distance_km !== undefined && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/20 backdrop-blur-xl rounded-full px-2 py-0.5 border border-white/40 shadow-lg">
                          <Timer className="w-2.5 h-2.5 text-white drop-shadow" />
                          <span className="text-white text-[8px] font-bold drop-shadow">{getTimeEstimate(restaurant.distance_km)}</span>
                        </div>
                      )}
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <h3 className="text-white font-bold text-sm mb-0.5 drop-shadow-lg">{restaurant.name}</h3>
                        <div className="flex items-center gap-1.5 text-white text-[10px]">
                          <MapPin className="w-2.5 h-2.5" />
                          {restaurant.distance_km?.toFixed(1)} km
                          <span>•</span>
                          <span>{restaurant.cuisine_type || 'International'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Restaurant Near Me */}
        {!searchQuery && restaurants.length > 0 && (
          <div className="px-4 pb-4">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg shadow-black/5 p-3">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h2 className="text-[#1D2956] text-sm font-bold flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#536DFE]" />
                    Restaurant Near Me
                  </h2>
                  <p className="text-gray-400 text-[8px] uppercase tracking-[0.2em] font-medium ml-[22px]">Discover local dining spots</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { play('tap'); setShowMapView(!showMapView); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-[10px] font-bold rounded-xl hover:shadow-lg hover:shadow-[#536DFE]/40 transition-all shadow-md shadow-[#536DFE]/30"
                >
                  <Map className="w-3 h-3" />
                  {showMapView ? 'Hide' : 'Show'}
                </motion.button>
              </div>
              <AnimatePresence>
                {showMapView && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-xl overflow-hidden border border-white/40 shadow-lg"
                  >
                    <RestaurantMap
                      restaurants={restaurants.filter((r: any) => r.latitude && r.longitude)}
                      center={YANGON_CENTER}
                      zoom={13}
                      height="240px"
                      onMarkerClick={(id) => navigate(`/restaurant/${id}`)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* All Restaurants (filtered by category + chips + search) */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[#1D2956] text-sm font-bold flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                {searchQuery || selectedCategory ? 'Search Results' : 'All Restaurants'}
              </h2>
              <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] font-medium ml-[10px]">
                {filteredRestaurants.length} {filteredRestaurants.length !== 1 ? 'Places' : 'Place'}
              </p>
            </div>
            {!searchQuery && !selectedCategory && activeFilters.size === 0 && (
              <button onClick={() => navigate('/restaurants')} className="text-[9px] text-[#536DFE] font-bold flex items-center gap-0.5 hover:text-[#6B7FFF] transition-colors">
                See All <ChevronRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-100/80">
                  <div className="h-28 skeleton-luxury" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 skeleton-luxury rounded-full w-3/4" />
                    <div className="h-2 skeleton-luxury rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/5">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-[#1D2956] text-sm font-bold mb-1">No restaurants found</p>
              <p className="text-gray-400 text-xs">Try different filters or search</p>
              {filterCount > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedCategory(null); setActiveFilters(new Set()); setSearchQuery(''); }}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#536DFE]/40 transition-all hover:shadow-xl"
                >
                  Clear All Filters
                </motion.button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {(searchQuery || selectedCategory || activeFilters.size > 0
                  ? filteredRestaurants
                  : filteredRestaurants.slice(0, HOME_RESTAURANT_SHOW)
                ).map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 + index * 0.04 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleRestaurantClick(restaurant.id)}
                    style={{ willChange: 'transform' }}
                    className="flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white/90 backdrop-blur-md border border-white/60 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#536DFE]/20 transition-all duration-500 group"
                  >
                    <div className="relative w-full h-28 overflow-hidden">
                      <img src={restaurant.image_url || '/placeholder.svg'} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      {/* FEATURE: Time Estimate Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/25 backdrop-blur-xl rounded-full px-2 py-0.5 border border-white/40 shadow-lg">
                        <Timer className="w-2.5 h-2.5 text-white drop-shadow" />
                        <span className="text-white text-[8px] font-bold drop-shadow">{getTimeEstimate(restaurant.distance_km || 0)}</span>
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/25 backdrop-blur-xl rounded-full px-1.5 py-0.5 border border-white/40 shadow-lg">
                        <Star className="w-2 h-2 text-white fill-white drop-shadow" />
                        <span className="text-white text-[8px] font-bold drop-shadow">{restaurant.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col p-2.5">
                      <h3 className="text-[#1D2956] text-[11px] font-bold truncate leading-snug group-hover:text-[#536DFE] transition-colors">{restaurant.name}</h3>
                      <p className="text-gray-400 text-[8px] mb-1 truncate font-medium tracking-wide">{restaurant.cuisine_type || 'International'}</p>
                      <div className="flex items-center gap-1 text-gray-400 text-[8px] truncate mt-auto">
                        <MapPin className="w-2 h-2 flex-shrink-0 text-[#536DFE]" />
                        <span className="truncate font-medium">{restaurant.township}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex-shrink-0 font-semibold text-[#536DFE]">{restaurant.distance}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {!searchQuery && !selectedCategory && activeFilters.size === 0 && filteredRestaurants.length > HOME_RESTAURANT_SHOW && (
                <div className="flex justify-center mt-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/restaurants')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-[#536DFE] text-[11px] font-bold shadow-sm hover:shadow-md hover:border-[#536DFE]/30 transition-all"
                  >
                    See All Restaurants <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
