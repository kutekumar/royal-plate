import { useState, useEffect, useRef } from 'react';
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
import gsap from 'gsap';
import LogoImg from '@/imgs/logo.png';
import { formatCurrency } from '@/utils/currency';
import { getUserLocation, calculateDistance, YANGON_CENTER, Coordinates } from '@/utils/location';
import RestaurantMap from '@/components/RestaurantMap';

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

  // Notification system
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCustomerNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Animation refs
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Entrance animations
  useEffect(() => {
    if (restaurants.length === 0) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      headerRef.current,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 }
    )
    .fromTo(
      searchRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(
      mapRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(
      featuredRef.current,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6 },
      '-=0.2'
    )
    .fromTo(
      listRef.current?.children || [],
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
      '-=0.3'
    );
  }, [restaurants]);

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
    
    if (notification.blog_post_id) {
      navigate(`/blog/${notification.blog_post_id}`);
    } else if (notification.order_id) {
      navigate('/orders');
    }
    
    setShowNotifications(false);
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#F5F5F7] font-poppins">

      {/* ── Header ── */}
      <div ref={headerRef} className="flex items-center justify-between px-5 pt-6 pb-3 z-10 relative bg-[#F5F5F7]">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src={LogoImg} alt="Royal Plate" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-[10px] text-gray-400 font-medium tracking-[0.2em] uppercase leading-none">Good day,</p>
            <p className="text-[#1D2956] text-sm font-bold leading-tight">{firstName}</p>
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-200/80 hover:border-[#536DFE]/40 hover:shadow-md transition-all shadow-sm"
          >
            <Bell className="w-4.5 h-4.5 text-[#1D2956]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4.5 h-4.5 bg-[#536DFE] text-white text-[9px] font-bold rounded-full min-w-[18px] min-h-[18px]">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-200/80 hover:border-[#536DFE]/40 hover:shadow-md transition-all shadow-sm"
          >
            <User className="w-4.5 h-4.5 text-[#1D2956]" />
          </button>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute top-[72px] right-5 w-80 max-h-96 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-y-auto z-50">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-[#1D2956] font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] text-[#536DFE] font-bold uppercase tracking-wider">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-[#536DFE]/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notification.is_read ? 'bg-[#536DFE]' : 'bg-gray-200'}`} />
                  <div>
                    <p className="text-[#1D2956] text-sm font-semibold">{notification.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{notification.message}</p>
                    <p className="text-gray-400 text-[10px] mt-1">{new Date(notification.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Search ── */}
      <div ref={searchRef} className="px-5 pb-4 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search restaurants, cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-2xl text-[#1D2956] text-sm placeholder-gray-400 focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/15 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* ── Map Overview ── */}
      {!searchQuery && restaurants.length > 0 && (
        <div ref={mapRef} className="px-5 pb-6 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[#1D2956] text-base font-bold tracking-tight">Explore Map</h2>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest">Find restaurants near you</p>
            </div>
            <button
              onClick={() => setShowMapView(!showMapView)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#536DFE] text-white text-xs font-bold rounded-full hover:bg-[#4557d8] transition-colors"
            >
              <Map className="w-3.5 h-3.5" />
              {showMapView ? 'Hide' : 'Show'}
            </button>
          </div>

          {showMapView && (
            <RestaurantMap
              restaurants={restaurants.filter(r => r.latitude && r.longitude)}
              center={userLocation || YANGON_CENTER}
              zoom={13}
              height="350px"
              onMarkerClick={(id) => navigate(`/restaurant/${id}`)}
            />
          )}
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto pb-24 z-10 scrollbar-hide">

        {/* ── Featured Section ── */}
        {featuredRestaurants.length > 0 && (
          <div ref={featuredRef} className="mb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <div>
                <h2 className="text-[#1D2956] text-base font-bold tracking-tight">Featured</h2>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest">Top picks for you</p>
              </div>
              <button className="text-[#536DFE] text-xs font-bold uppercase tracking-wider">See All</button>
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide touch-pan-x" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
              {featuredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  className="flex-shrink-0 w-64 cursor-pointer group"
                >
                  <div className="relative overflow-hidden rounded-3xl h-48 shadow-xl">
                    <img
                      src={restaurant.image_url || '/placeholder.svg'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Multi-layer gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/10 to-transparent" />

                    {/* Rating pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/25">
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span className="text-white text-[10px] font-bold">{restaurant.rating?.toFixed(1)}</span>
                    </div>

                    {/* Cuisine pill */}
                    <div className="absolute top-3 left-3 bg-[#536DFE]/80 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
                      <span className="text-white text-[9px] font-bold uppercase tracking-wider">{restaurant.cuisine_type || 'Fine Dining'}</span>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                      <h3 className="text-white text-sm font-bold leading-snug drop-shadow">{restaurant.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-white/60" />
                        <span className="text-white/70 text-[10px]">{restaurant.township}</span>
                        <span className="text-white/40 text-[10px]">·</span>
                        <span className="text-white/70 text-[10px]">{restaurant.distance} mi</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── All Restaurants ── */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[#1D2956] text-base font-bold tracking-tight">
                {searchQuery ? 'Search Results' : 'All Restaurants'}
              </h2>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest">
                {filteredRestaurants.length} place{filteredRestaurants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#536DFE]/20 border-t-[#536DFE] rounded-full animate-spin" />
            </div>
          ) : !isLoading && filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-medium">No restaurants found</p>
              <p className="text-gray-300 text-sm mt-1">Try a different search</p>
            </div>
          ) : (
            <div ref={listRef} className="grid grid-cols-2 gap-3">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  className="flex flex-col rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group shadow-sm border border-gray-100/80 active:scale-[0.98] bg-white"
                >
                  {/* Image */}
                  <div className="w-full h-32 overflow-hidden">
                    <img
                      src={restaurant.image_url || '/placeholder.svg'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col p-2.5">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h3 className="text-[#1D2956] text-xs font-bold truncate leading-snug flex-1">{restaurant.name}</h3>
                      <div className="flex items-center gap-0.5 bg-[#536DFE]/8 rounded-full px-1.5 py-0.5 flex-shrink-0">
                        <Star className="w-2.5 h-2.5 text-[#536DFE] fill-[#536DFE]" />
                        <span className="text-[#536DFE] text-[9px] font-bold">{restaurant.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-[9px] mb-1 truncate">{restaurant.cuisine_type || 'International'}</p>
                    <div className="flex items-center gap-1 text-gray-400 text-[9px] truncate">
                      <MapPin className="w-2 h-2 flex-shrink-0" />
                      <span className="truncate">{restaurant.township}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex-shrink-0">{restaurant.distance} mi</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
