import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Star, MapPin, Bell, User, Map } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCustomerNotifications } from '@/hooks/useCustomerNotifications';
import LogoImg from '@/imgs/logo.png';
import { formatCurrency } from '@/utils/currency';
import { getUserLocation, calculateDistance, YANGON_CENTER, Coordinates } from '@/utils/location';
import RestaurantMap from '@/components/RestaurantMap';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: any;
  cuisine_type: string | null;
  price_range: string;
  image_url: string;
  is_featured: boolean;
  rating: number;
  total_reviews: number;
  latitude?: number;
  longitude?: number;
  township?: string;
  distance?: number;
}

const Home = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [showMapView, setShowMapView] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Notification system
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCustomerNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchRestaurants();
    fetchUserLocation();
  }, []);

  const fetchUserLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserLocation(location);
    } else {
      // Use Yangon center as default
      setUserLocation(YANGON_CENTER);
    }
  };

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Get user location for distance calculation
        const location = await getUserLocation();
        const referencePoint = location || YANGON_CENTER;

        // Add township and calculate real distance
        const enhancedData = data.map((restaurant: any) => {
          let distance = 0;

          // Calculate real distance if coordinates exist
          if (restaurant.latitude && restaurant.longitude) {
            distance = calculateDistance(referencePoint, {
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            });
          } else {
            // Fallback to mock distance if no coordinates
            distance = calculateMockDistance();
          }

          return {
            ...restaurant,
            township: extractTownship(restaurant.address),
            distance,
            rating: restaurant.rating || 4.5,
            total_reviews: restaurant.total_reviews || Math.floor(Math.random() * 500) + 50
          };
        });

        // Sort by distance (closest first)
        const sortedByDistance = [...enhancedData].sort((a, b) => a.distance - b.distance);
        setRestaurants(sortedByDistance);

        // Set featured as top 10 restaurants by rating
        const topRated = [...enhancedData]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 10);
        setFeaturedRestaurants(topRated);
      }
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const extractTownship = (address: string): string => {
    // Extract township from address (simplified logic)
    const parts = address.split(',');
    return parts[parts.length - 2]?.trim() || parts[0]?.trim() || 'Downtown';
  };

  const calculateMockDistance = (): number => {
    // Generate random distance between 0.5 and 10 miles
    return parseFloat((Math.random() * 9.5 + 0.5).toFixed(1));
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (restaurant.cuisine_type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);

    setIsTransitioning(true);
    setTimeout(() => {
      if (notification.blog_post_id) {
        navigate(`/blog/${notification.blog_post_id}`);
      } else if (notification.order_id) {
        navigate('/orders');
      }
      setShowNotifications(false);
    }, 600);
  };

  const handleRestaurantClick = (id: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(`/restaurant/${id}`);
    }, 600);
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Guest';

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
        className="relative px-5 pt-8 pb-4 z-10"
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />

        <div className="relative flex items-center justify-between">
          {/* Logo & Greeting */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2
            }}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.3
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] p-0.5 shadow-xl shadow-[#536DFE]/30"
            >
              <div className="w-full h-full rounded-[14px] bg-white p-1.5 flex items-center justify-center">
                <img src={LogoImg} alt="Royal Plate" className="w-full h-full object-contain" />
              </div>
            </motion.div>
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-[11px] text-gray-400 font-semibold tracking-[0.25em] uppercase leading-none"
              >
                Welcome Back
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-[#1D2956] text-base font-bold leading-tight mt-0.5"
              >
                {firstName}
              </motion.p>
            </div>
          </motion.div>

          {/* Right Icons with Premium Styling */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.3
            }}
            className="flex items-center gap-2.5"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 hover:border-[#536DFE]/40 hover:shadow-xl transition-all shadow-lg shadow-black/5"
            >
              <Bell className="w-5 h-5 text-[#1D2956]" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-[9px] font-bold rounded-full px-1.5 shadow-lg shadow-[#536DFE]/50"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 hover:border-[#536DFE]/40 hover:shadow-xl transition-all shadow-lg shadow-black/5"
            >
              <User className="w-5 h-5 text-[#1D2956]" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Notification Dropdown with Premium Styling */}
      {showNotifications && (
        <div className="absolute top-[88px] right-5 w-80 max-h-96 bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden z-50">
          <div className="sticky top-0 bg-gradient-to-b from-white to-white/95 backdrop-blur-xl border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
            <h3 className="text-[#1D2956] font-bold text-base">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] text-[#536DFE] font-bold uppercase tracking-wider hover:text-[#6B7FFF] transition-colors">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gradient-to-r hover:from-[#536DFE]/5 hover:to-transparent transition-all ${!notification.is_read ? 'bg-[#536DFE]/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-lg ${!notification.is_read ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF]' : 'bg-gray-200'}`} />
                  <div>
                    <p className="text-[#1D2956] text-sm font-semibold">{notification.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{notification.message}</p>
                    <p className="text-gray-400 text-[10px] mt-1.5 font-medium">{new Date(notification.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Premium Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.4
        }}
        className="px-5 pb-5 z-10"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/20 to-[#6B7FFF]/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 group-focus-within:text-[#536DFE] transition-colors" />
          <Input
            type="text"
            placeholder="Search restaurants, cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative w-full h-14 pl-14 pr-4 bg-white/90 backdrop-blur-md border border-white/60 rounded-3xl text-[#1D2956] text-sm placeholder-gray-400 focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 shadow-xl shadow-black/5 transition-all"
          />
        </div>
      </motion.div>

      {/* ── Premium Map Overview ── */}
      {!searchQuery && restaurants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.5
          }}
          className="px-5 pb-6 z-10"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-black/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[#1D2956] text-lg font-bold tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                  Explore Map
                </h2>
                <p className="text-gray-400 text-[11px] uppercase tracking-[0.25em] font-medium ml-4">Find restaurants near you</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMapView(!showMapView)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-xs font-bold rounded-2xl hover:shadow-xl hover:shadow-[#536DFE]/40 transition-all shadow-lg shadow-[#536DFE]/30"
              >
                <Map className="w-4 h-4" />
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
                  className="rounded-2xl overflow-hidden border border-white/40 shadow-lg"
                >
                  <RestaurantMap
                    restaurants={restaurants.filter(r => r.latitude && r.longitude)}
                    center={userLocation || YANGON_CENTER}
                    zoom={13}
                    height="350px"
                    onMarkerClick={(id) => navigate(`/restaurant/${id}`)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto pb-24 z-10 scrollbar-hide">

        {/* ── Premium Featured Section ── */}
        {featuredRestaurants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.6
            }}
            className="mb-8"
          >
            <div className="flex items-center justify-between px-5 mb-4">
              <div>
                <h2 className="text-[#1D2956] text-lg font-bold tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                  Featured
                </h2>
                <p className="text-gray-400 text-[11px] uppercase tracking-[0.25em] font-medium ml-4">Top rated restaurants</p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
              {featuredRestaurants.slice(0, 5).map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.7 + index * 0.08
                  }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                  className="flex-shrink-0 w-72 cursor-pointer"
                >
                  <Card className="overflow-hidden bg-white/90 backdrop-blur-md border-white/60 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 rounded-3xl">
                    <div className="relative h-56 overflow-hidden brand-featured-filter">
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="w-full h-full object-cover brand-shimmer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          duration: 0.5,
                          ease: [0.34, 1.56, 0.64, 1],
                          delay: 0.8 + index * 0.08
                        }}
                        className="absolute top-4 right-4"
                      >
                        <Badge className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white border-0 shadow-xl shadow-[#536DFE]/50 px-3 py-1.5 text-xs font-bold">
                          ⭐ {restaurant.rating}
                        </Badge>
                      </motion.div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.9 + index * 0.08 }}
                          className="text-white font-bold text-lg mb-1 drop-shadow-lg"
                        >
                          {restaurant.name}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: 1.0 + index * 0.08 }}
                          className="flex items-center gap-3 text-white/90 text-xs"
                        >
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {restaurant.distance?.toFixed(1)} mi
                          </span>
                          <span>•</span>
                          <span>{restaurant.cuisine_type || 'International'}</span>
                        </motion.div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Premium All Restaurants Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: 1.1
          }}
          className="px-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[#1D2956] text-lg font-bold tracking-tight flex items-center gap-2">
                <div className="w-1.5 h-6 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                {searchQuery ? 'Search Results' : 'All Restaurants'}
              </h2>
              <p className="text-gray-400 text-[11px] uppercase tracking-[0.25em] font-medium ml-4">
                {filteredRestaurants.length} {filteredRestaurants.length !== 1 ? 'Places' : 'Place'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-[#536DFE]/20 border-t-[#536DFE] rounded-full animate-spin" />
            </div>
          ) : !isLoading && filteredRestaurants.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-black/5">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-[#1D2956] text-base font-bold mb-1">No restaurants found</p>
              <p className="text-gray-400 text-sm">Try a different search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 1.2 + index * 0.06
                  }}
                  whileHover={{ scale: 1.03, y: -6 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                  className="flex flex-col rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-[#536DFE]/20 transition-all duration-500 group shadow-xl shadow-black/5 border border-white/60 bg-white/90 backdrop-blur-md"
                >
                  {/* Image with Premium Overlay and Brand Filter */}
                  <div className="relative w-full h-36 overflow-hidden brand-image-filter brand-shimmer">
                    <img
                      src={restaurant.image_url || '/placeholder.svg'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brand-image-fade"
                    />
                    {/* Multi-layer gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/0 to-[#536DFE]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Rating badge with glassmorphism */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1],
                        delay: 1.3 + index * 0.06
                      }}
                      className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/25 backdrop-blur-xl rounded-full px-2 py-1 border border-white/40 shadow-lg"
                    >
                      <Star className="w-2.5 h-2.5 text-white fill-white drop-shadow" />
                      <span className="text-white text-[10px] font-bold drop-shadow">{restaurant.rating.toFixed(1)}</span>
                    </motion.div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center shadow-xl">
                        <svg className="w-4 h-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info Section with Premium Styling */}
                  <div className="flex-1 flex flex-col p-3.5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 1.4 + index * 0.06 }}
                      className="flex items-start justify-between gap-1.5 mb-1.5"
                    >
                      <h3 className="text-[#1D2956] text-sm font-bold truncate leading-snug flex-1 group-hover:text-[#536DFE] transition-colors">{restaurant.name}</h3>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.5 + index * 0.06 }}
                      className="text-gray-400 text-[10px] mb-2 truncate font-medium tracking-wide"
                    >
                      {restaurant.cuisine_type || 'International'}
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.6 + index * 0.06 }}
                      className="flex items-center gap-1.5 text-gray-400 text-[10px] truncate mt-auto"
                    >
                      <MapPin className="w-3 h-3 flex-shrink-0 text-[#536DFE]" />
                      <span className="truncate font-medium">{restaurant.township}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex-shrink-0 font-semibold text-[#536DFE]">{restaurant.distance} mi</span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav />
    </div>
      </PageTransition>
    </>
  );
};

export default Home;
