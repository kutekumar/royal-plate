import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Star, MapPin, Bell, User } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCustomerNotifications } from '@/hooks/useCustomerNotifications';
import gsap from 'gsap';
import CrownIcon from '@/imgs/crown.png';

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

  // Notification system
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCustomerNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Animation refs
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

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
        // Add mock township and distance data
        const enhancedData = data.map((restaurant: any) => ({
          ...restaurant,
          township: extractTownship(restaurant.address),
          distance: calculateMockDistance(),
          rating: restaurant.rating || 4.5,
          total_reviews: restaurant.total_reviews || Math.floor(Math.random() * 500) + 50
        }));

        setRestaurants(enhancedData);
        
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

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#F5F5F7] font-poppins">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between px-6 pt-6 pb-4 z-10 relative">
        {/* Crown Icon - Left */}
        <div className="flex items-center justify-center w-10 h-10">
          <img src={CrownIcon} alt="Crown" className="w-7 h-7 object-contain" />
        </div>

        {/* Title - Center */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[#1D2956] text-2xl tracking-wider" style={{ fontWeight: 700 }}>
          Discover
        </h1>

        {/* Right Icons */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#536DFE]/50 hover:shadow-md transition-all shadow-sm"
          >
            <Bell className="w-5 h-5 text-[#1D2956]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Icon */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#536DFE]/50 hover:shadow-md transition-all shadow-sm"
          >
            <User className="w-5 h-5 text-[#1D2956]" />
          </button>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute top-20 right-6 w-80 max-h-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-y-auto z-50">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h3 className="text-[#1D2956] font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#536DFE] hover:text-[#536DFE]/80 font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-[#536DFE]/8' : ''
                }`}
              >
                <p className="text-[#1D2956] text-sm font-semibold">{notification.title}</p>
                <p className="text-gray-500 text-xs mt-1">{notification.message}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search Box */}
      <div ref={searchRef} className="px-6 pb-6 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Find your table at the palace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-[#1D2956] placeholder-gray-400 focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 z-10 scrollbar-hide">
        {/* Featured Selections */}
        {featuredRestaurants.length > 0 && (
          <div ref={featuredRef} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#1D2956] text-lg font-bold" style={{ fontWeight: 700 }}>Featured Selections</h2>
              <button className="text-[#536DFE] text-sm hover:text-[#536DFE]/80 font-semibold transition-colors" style={{ fontWeight: 500 }}>
                View All
              </button>
            </div>

            {/* Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide touch-pan-x" style={{ 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}>
              {featuredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                className="flex-shrink-0 w-72 cursor-pointer group"
              >
                <div className="relative overflow-hidden rounded-2xl h-44 shadow-lg">
                  <img
                    src={restaurant.image_url || '/placeholder.svg'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Strong gradient for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                  {/* Cuisine badge */}
                  <Badge className="absolute top-3 left-3 bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase text-[10px] px-3 tracking-wide" style={{ fontWeight: 700 }}>
                    {restaurant.cuisine_type || 'Fine Dining'}
                  </Badge>
                  {/* Star rating badge top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2 py-1 border border-white/20">
                    <Star className="w-3 h-3 fill-white text-white" />
                    <span className="text-white text-[10px] font-bold">{restaurant.rating?.toFixed(1)}</span>
                  </div>
                  {/* Bottom text */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-6">
                    <h3 className="text-white text-base leading-tight drop-shadow-md" style={{ fontWeight: 700 }}>{restaurant.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/80 text-[11px]" style={{ fontWeight: 400 }}>
                        {restaurant.cuisine_type || 'Fine Dining'}
                      </span>
                      <span className="text-white/50 text-[11px]">•</span>
                      <span className="text-white/80 text-[11px]" style={{ fontWeight: 400 }}>
                        {restaurant.township}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Rated */}
        <div>
          <h2 className="text-[#1D2956] text-lg mb-4" style={{ fontWeight: 700 }}>Top Rated</h2>
          
          <div ref={listRef} className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-[#536DFE]/40 hover:shadow-md transition-all group shadow-sm"
              >
                {/* Restaurant Image */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                  <img
                    src={restaurant.image_url || '/placeholder.svg'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Restaurant Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[#1D2956] text-base truncate" style={{ fontWeight: 700 }}>
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-4 h-4 text-[#536DFE] fill-[#536DFE]" />
                      <span className="text-[#536DFE] text-sm" style={{ fontWeight: 600 }}>
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-xs mb-2" style={{ fontWeight: 400 }}>
                    {restaurant.cuisine_type || 'International'}
                  </p>
                  
                  <div className="flex items-center gap-3 text-gray-500 text-xs" style={{ fontWeight: 400 }}>
                    <span style={{ fontWeight: 700 }} className="text-[#536DFE]">{restaurant.price_range || '$$$'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {restaurant.distance} miles away
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-xs mt-1" style={{ fontWeight: 300 }}>
                    {restaurant.township}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#536DFE]/30 border-t-[#536DFE] rounded-full animate-spin"></div>
            </div>
          )}

          {!isLoading && filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No restaurants found</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Home;
