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
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#1d2956] font-poppins">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between px-6 pt-6 pb-4 z-10 relative">
        {/* Crown Icon - Left */}
        <div className="flex items-center justify-center w-10 h-10">
          <img src={CrownIcon} alt="Crown" className="w-7 h-7 object-contain" />
        </div>

        {/* Title - Center */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[#caa157] text-2xl tracking-wider" style={{ fontWeight: 700 }}>
          Discover
        </h1>

        {/* Right Icons */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center w-11 h-11 rounded-full border-2 border-[#caa157]/30 bg-[#1d2956] hover:border-[#caa157]/60 transition-all"
          >
            <Bell className="w-5 h-5 text-[#caa157]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Icon */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-[#caa157]/30 bg-[#1d2956] hover:border-[#caa157]/60 transition-all"
          >
            <User className="w-5 h-5 text-[#caa157]" />
          </button>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute top-20 right-6 w-80 max-h-96 bg-[#2a3f6e] border-2 border-[#caa157]/30 rounded-xl shadow-2xl overflow-y-auto z-50">
          <div className="sticky top-0 bg-[#2a3f6e] border-b border-[#caa157]/20 px-4 py-3 flex items-center justify-between">
            <h3 className="text-[#caa157] font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#caa157]/70 hover:text-[#caa157]"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-[#caa157]/60 text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-[#caa157]/10 cursor-pointer hover:bg-[#caa157]/5 transition-colors ${
                  !notification.is_read ? 'bg-[#caa157]/10' : ''
                }`}
              >
                <p className="text-[#caa157] text-sm font-medium">{notification.title}</p>
                <p className="text-[#caa157]/70 text-xs mt-1">{notification.message}</p>
                <p className="text-[#caa157]/50 text-xs mt-2">
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#caa157]/60" />
          <Input
            type="text"
            placeholder="Find your table at the palace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-transparent border-2 border-[#caa157]/40 rounded-xl text-[#caa157] placeholder-[#caa157]/50 focus:border-[#caa157] focus:ring-2 focus:ring-[#caa157]/20 transition-all"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 z-10 scrollbar-hide">
        {/* Featured Selections */}
        {featuredRestaurants.length > 0 && (
          <div ref={featuredRef} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#caa157] text-lg font-bold" style={{ fontWeight: 700 }}>Featured Selections</h2>
              <button className="text-[#caa157]/70 text-sm hover:text-[#caa157] transition-colors" style={{ fontWeight: 500 }}>
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
                <div className="relative overflow-hidden rounded-xl border-2 border-[#caa157]/30 h-40">
                  <img
                    src={restaurant.image_url || '/placeholder.svg'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1d2956] via-[#1d2956]/40 to-transparent" />
                  <Badge className="absolute top-3 left-3 bg-[#caa157] text-[#1d2956] border-0 uppercase text-xs px-3" style={{ fontWeight: 700 }}>
                    {restaurant.cuisine_type || 'Fine Dining'}
                  </Badge>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-[#caa157] text-lg" style={{ fontWeight: 700 }}>{restaurant.name}</h3>
                    <p className="text-[#caa157]/70 text-xs" style={{ fontWeight: 400 }}>
                      {restaurant.cuisine_type || 'Fine Dining'} • {restaurant.township}
                    </p>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Rated */}
        <div>
          <h2 className="text-[#caa157] text-lg mb-4" style={{ fontWeight: 700 }}>Top Rated</h2>
          
          <div ref={listRef} className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                className="flex items-center gap-4 p-4 bg-[#2a3f6e]/30 border-2 border-[#caa157]/30 rounded-xl cursor-pointer hover:border-[#caa157]/60 hover:bg-[#2a3f6e]/50 transition-all group"
              >
                {/* Restaurant Image */}
                <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[#caa157]/20">
                  <img
                    src={restaurant.image_url || '/placeholder.svg'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Restaurant Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[#caa157] text-base truncate" style={{ fontWeight: 700 }}>
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-4 h-4 text-[#caa157] fill-[#caa157]" />
                      <span className="text-[#caa157] text-sm" style={{ fontWeight: 600 }}>
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-[#caa157]/70 text-xs mb-2" style={{ fontWeight: 400 }}>
                    {restaurant.cuisine_type || 'International'}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[#caa157]/60 text-xs" style={{ fontWeight: 400 }}>
                    <span style={{ fontWeight: 600 }}>{restaurant.price_range || '$$$'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {restaurant.distance} miles away
                    </span>
                  </div>
                  
                  <p className="text-[#caa157]/50 text-xs mt-1" style={{ fontWeight: 300 }}>
                    {restaurant.township}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#caa157]/30 border-t-[#caa157] rounded-full animate-spin"></div>
            </div>
          )}

          {!isLoading && filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#caa157]/60">No restaurants found</p>
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
