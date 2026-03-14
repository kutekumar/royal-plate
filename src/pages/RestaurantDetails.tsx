import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Calendar,
  MessageCircle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import RestaurantChatbot from '@/components/RestaurantChatbot';
import { formatCurrency } from '@/utils/currency';
import { getUserLocation, Coordinates } from '@/utils/location';
import SingleRestaurantMap from '@/components/SingleRestaurantMap';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  opening_hours: string;
  rating: number;
  image_url: string;
  cuisine_type: string;
  latitude?: number;
  longitude?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const menuSectionRef = useRef<HTMLDivElement>(null);
  const menuItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
      fetchMenuItems();
      fetchUserLocation();
    }
  }, [id]);

  const fetchUserLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserLocation(location);
    }
  };

  useEffect(() => {
    // Generate available dates (next 7 days)
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, []);

  // Scroll to a specific menu item when navigated from Food page
  useEffect(() => {
    const scrollToId = location.state?.scrollToMenuItemId;
    if (!scrollToId || menuItems.length === 0) return;

    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      const el = menuItemRefs.current[scrollToId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight briefly
        el.classList.add('ring-2', 'ring-[#536DFE]', 'ring-offset-2', 'ring-offset-[#F5F5F7]');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#536DFE]', 'ring-offset-2', 'ring-offset-[#F5F5F7]');
        }, 2000);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [menuItems, location.state]);

  const fetchRestaurantDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant details');
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id);

      if (error) throw error;
      
      // Filter available items
      const availableItems = (data || []).filter(item => 
        item.is_available !== false && item.available !== false
      );
      
      setMenuItems(availableItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter((cartItem) => cartItem.id !== itemId);
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (orderType === 'dine_in' && (!selectedDate || !selectedTime)) {
      toast.error('Please select date and time for your reservation');
      return;
    }

    const orderData = {
      restaurant,
      cart,
      orderType,
      partySize: orderType === 'dine_in' ? partySize : 1,
      reservationDate: orderType === 'dine_in' ? selectedDate : null,
      reservationTime: orderType === 'dine_in' ? selectedTime : null,
      totalAmount: getTotalPrice(),
    };

    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/payment', { state: orderData });
    }, 600);
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const timeSlots = [
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate(),
      fullDate: date.toISOString().split('T')[0],
    };
  };

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-[#536DFE] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <PageTransition>
        <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] max-w-[430px] mx-auto overflow-x-hidden font-poppins">

      {/* ── Premium Hero Image ── */}
      <div className="relative w-full h-80 overflow-hidden brand-hero-filter">
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-full h-full object-cover brand-image-fade"
        />
        {/* Multi-layer premium gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/10 to-transparent" />

        {/* Premium Back button with glassmorphism */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-5 z-10 w-11 h-11 rounded-2xl bg-white/25 backdrop-blur-xl border border-white/40 flex items-center justify-center hover:bg-white/40 hover:scale-105 transition-all shadow-xl"
        >
          <ArrowLeft className="w-5 h-5 text-white drop-shadow" />
        </button>

        {/* Premium Chatbot button */}
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="absolute top-6 right-5 z-10 flex items-center gap-2.5 bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-[#536DFE]/60 hover:shadow-[0_0_40px_rgba(83,109,254,0.8)] hover:scale-105 transition-all duration-300 border border-white/30 backdrop-blur-md"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-bold tracking-wide">Talk To Us</span>
        </button>

        {/* Premium Rating badge */}
        <div className="absolute bottom-20 left-5 flex items-center gap-2 bg-white/25 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-white/40 shadow-2xl">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < Math.floor(restaurant.rating) ? 'fill-white text-white' : 'text-white/30'} drop-shadow`} />
          ))}
          <span className="text-white text-sm font-bold ml-1 drop-shadow">{restaurant.rating}</span>
          <span className="text-white/70 text-sm drop-shadow">• 1.2k reviews</span>
        </div>
      </div>

      {/* ── Premium Restaurant Info Card ── */}
      <div className="bg-white/95 backdrop-blur-xl mx-5 -mt-8 relative z-10 rounded-3xl shadow-2xl shadow-black/10 border border-white/60 p-6 mb-5">
        <h1 className="text-[#1D2956] text-2xl font-bold leading-tight tracking-tight mb-2">
          {restaurant.name}
        </h1>
        <div className="flex items-center gap-2 mb-4">
          {restaurant.cuisine_type && (
            <span className="bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 text-[#536DFE] text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-[#536DFE]/20">
              {restaurant.cuisine_type}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{restaurant.description}</p>

        {/* Premium Contact row */}
        <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-3.5 w-full text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md">
              <MapPin className="w-5 h-5 text-[#536DFE]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1D2956] text-sm font-semibold truncate">{restaurant.address}</p>
              <p className="text-gray-400 text-[11px] font-medium mt-0.5">{showMap ? 'Hide map' : 'Show on map'}</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-[#536DFE] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center flex-shrink-0 shadow-md">
              <Phone className="w-5 h-5 text-[#536DFE]" />
            </div>
            <div>
              <p className="text-[#1D2956] text-sm font-semibold">{restaurant.phone}</p>
              <p className="text-gray-400 text-[11px] font-medium mt-0.5">{restaurant.opening_hours}</p>
            </div>
          </div>
        </div>

        {/* Premium Map Display */}
        {showMap && restaurant.latitude && restaurant.longitude && (
          <div className="mt-5 rounded-2xl overflow-hidden border border-white/60 shadow-xl">
            <SingleRestaurantMap
              name={restaurant.name}
              address={restaurant.address}
              coordinates={{
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              }}
              height="250px"
              userLocation={userLocation}
            />
          </div>
        )}
      </div>

      {/* ── Premium Order Type Selection ── */}
      <div className="px-5 pb-5">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-black/5 p-5">
          <p className="text-[#1D2956] text-[11px] font-bold uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
            Order Type
          </p>
          <div className="flex gap-3 p-1.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 shadow-inner">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                orderType === 'dine_in'
                  ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-xl shadow-[#536DFE]/40 scale-105'
                  : 'text-gray-500 hover:text-[#1D2956] hover:bg-white/50'
              }`}
            >
              Dine In
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                orderType === 'takeaway'
                  ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-xl shadow-[#536DFE]/40 scale-105'
                  : 'text-gray-500 hover:text-[#1D2956] hover:bg-white/50'
              }`}
            >
              Take Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Premium Reservation Section ── */}
      {orderType === 'dine_in' && (
        <div className="px-5 pb-5">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-black/5 p-6">
            <h3 className="text-[#1D2956] text-lg font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-[#536DFE]" />
              </div>
              Reserve Your Table
            </h3>

            {/* Premium Party Size */}
            <div className="flex justify-between items-center bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] p-5 rounded-2xl mb-6 border border-gray-100/50 shadow-inner">
              <div>
                <p className="text-[#1D2956] text-sm font-bold">Party Size</p>
                <p className="text-gray-400 text-[11px] font-medium mt-0.5">Number of guests</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-[#536DFE]/40 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Minus className="w-4.5 h-4.5 text-[#536DFE]" />
                </button>
                <span className="text-[#1D2956] text-2xl font-bold w-8 text-center">{partySize}</span>
                <button
                  onClick={() => setPartySize(Math.min(20, partySize + 1))}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-xl shadow-[#536DFE]/40 hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
                >
                  <Plus className="w-4.5 h-4.5 text-white" />
                </button>
              </div>
            </div>

            {/* Premium Date Selection */}
            <div className="mb-6">
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-4">Select Date</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {getAvailableDates().map((date) => {
                  const formatted = formatDate(date);
                  const isSelected = selectedDate === formatted.fullDate;
                  return (
                    <button
                      key={formatted.fullDate}
                      onClick={() => setSelectedDate(formatted.fullDate)}
                      className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[68px] h-[80px] rounded-2xl transition-all shadow-lg ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40 scale-105 border border-white/30'
                          : 'bg-white/90 backdrop-blur-md border border-gray-200 text-[#1D2956] hover:border-[#536DFE]/40 hover:shadow-xl shadow-black/5'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{formatted.month}</span>
                      <span className="text-2xl font-bold">{formatted.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Premium Time Selection */}
            <div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-4">Time Slots</p>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40 scale-105'
                          : 'bg-white/90 backdrop-blur-md border border-gray-200 text-[#1D2956] hover:border-[#536DFE]/40 hover:shadow-xl shadow-black/5'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Premium Menu Section ── */}
      <div className="px-5 pb-36">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-black/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[#1D2956] text-lg font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center shadow-md">
                <ShoppingCart className="w-5 h-5 text-[#536DFE]" />
              </div>
              Menu
            </h3>
            <span className="text-gray-400 text-[11px] font-semibold tracking-wide">{filteredMenuItems.length} items</span>
          </div>

          {/* Premium Search Bar */}
          <div className="mb-5 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/10 to-[#6B7FFF]/10 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 z-10 group-focus-within:text-[#536DFE] transition-colors" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] border border-gray-100 text-[#1D2956] text-sm placeholder-gray-400 focus:outline-none focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 transition-all shadow-inner"
            />
          </div>

          {/* Premium Menu Items */}
          <div className="space-y-4">
            {filteredMenuItems.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">No menu items found</p>
            ) : (
              filteredMenuItems.map((item, index) => {
                const cartItem = cart.find((c) => c.id === item.id);
                const quantity = cartItem?.quantity || 0;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    ref={(el) => { menuItemRefs.current[item.id] = el; }}
                    className="flex gap-4 p-4 bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] rounded-2xl hover:from-white hover:to-[#F5F5F7] hover:shadow-xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-[#536DFE]/20 shadow-md"
                    onClick={() => setSelectedMenuItem(item)}
                  >
                    {/* Premium Image with Brand Filter */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-white/60 brand-menu-filter brand-shimmer">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brand-image-fade"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1D2956] font-bold text-sm mb-1 truncate group-hover:text-[#536DFE] transition-colors">{item.name}</h4>
                      <p className="text-gray-400 text-[11px] line-clamp-2 mb-2.5 leading-relaxed">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[#536DFE] font-bold text-base">{formatCurrency(item.price)}</p>
                        {quantity > 0 ? (
                          <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-1.5 border border-[#536DFE]/30 shadow-lg shadow-[#536DFE]/20" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-[#1D2956] font-bold text-sm min-w-[20px] text-center">{quantity}</span>
                            <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                            className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-[#536DFE]/40 hover:shadow-xl hover:scale-105 transition-all active:scale-95"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Premium Menu Item Detail Modal */}
      {selectedMenuItem && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-end justify-center"
            onClick={() => setSelectedMenuItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] w-full max-w-[430px] rounded-t-3xl border-t-2 border-[#536DFE]/40 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '88vh' }}
            >
              {/* Premium Full image at top */}
              <div className="relative w-full h-72 overflow-hidden brand-menu-filter">
                <img
                  src={selectedMenuItem.image_url}
                  alt={selectedMenuItem.name}
                  className="w-full h-full object-cover brand-image-fade"
                />
              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/10 to-transparent" />

              {/* Premium Close button */}
              <button
                onClick={() => setSelectedMenuItem(null)}
                className="absolute top-5 right-5 w-11 h-11 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/50 flex items-center justify-center hover:bg-white/50 hover:scale-105 transition-all shadow-xl"
              >
                <X className="w-5 h-5 text-[#536DFE] drop-shadow" />
              </button>

              {/* Premium Category badge */}
              {selectedMenuItem.category && (
                <div className="absolute top-5 left-5">
                  <span className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-xl shadow-[#536DFE]/50 border border-white/30 backdrop-blur-md">
                    {selectedMenuItem.category}
                  </span>
                </div>
              )}

              {/* Premium Name & price overlaid on image bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
                <h2 className="text-[#1D2956] text-2xl font-bold leading-tight drop-shadow-lg mb-2">
                  {selectedMenuItem.name}
                </h2>
                <p className="text-[#536DFE] text-xl font-bold drop-shadow-lg">
                  {formatCurrency(selectedMenuItem.price)}
                </p>
              </div>
            </div>

            {/* Premium Description */}
            <div className="px-6 pt-5 pb-3">
              <p className="text-gray-500 text-sm leading-relaxed">
                {selectedMenuItem.description || 'A delicious dish prepared with the finest ingredients.'}
              </p>
            </div>

            {/* Premium Cart controls */}
            <div className="px-6 pt-4 pb-8">
              {(() => {
                const cartItem = cart.find((c) => c.id === selectedMenuItem.id);
                const qty = cartItem?.quantity || 0;
                return qty > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-5 bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 border border-[#536DFE]/30 rounded-2xl px-8 py-5 flex-1 justify-between shadow-lg">
                      <button
                        onClick={() => removeFromCart(selectedMenuItem.id)}
                        className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <span className="text-[#1D2956] font-bold text-2xl">{qty}</span>
                      <button
                        onClick={() => addToCart(selectedMenuItem)}
                        className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedMenuItem(null)}
                      className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white font-bold px-8 py-5 rounded-2xl text-sm uppercase tracking-wider hover:shadow-2xl hover:shadow-[#536DFE]/60 transition-all active:scale-95 shadow-xl shadow-[#536DFE]/40"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { addToCart(selectedMenuItem); setSelectedMenuItem(null); }}
                    className="w-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white font-bold py-5 rounded-2xl text-sm uppercase tracking-widest hover:shadow-2xl hover:shadow-[#536DFE]/60 transition-all active:scale-[0.98] shadow-xl shadow-[#536DFE]/50 flex items-center justify-center gap-3"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart — {formatCurrency(selectedMenuItem.price)}
                  </button>
                );
              })()}
            </div>
          </motion.div>
        </motion.div>
        </AnimatePresence>
      )}

      {/* Premium Cart Modal */}
      {showCart && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] w-full max-w-[430px] rounded-t-3xl border-t-2 border-[#536DFE]/40 max-h-[85vh] flex flex-col shadow-2xl"
            >
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-[#536DFE]/20 p-6 flex items-center justify-between z-10 rounded-t-3xl">
              <h3 className="text-[#536DFE] text-xl font-bold">Your Cart</h3>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-[#536DFE]/10 hover:to-[#6B7FFF]/10 transition-all shadow-md"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-5 shadow-xl">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-lg font-semibold">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg hover:shadow-xl transition-all"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover border border-[#536DFE]/20 shadow-md"
                      />
                      <div className="flex-1">
                        <h4 className="text-[#1D2956] font-bold text-sm">{item.name}</h4>
                        <p className="text-[#536DFE] font-bold text-sm mt-1">
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] rounded-xl px-3 py-2 shadow-inner">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                        >
                          <Minus className="w-4.5 h-4.5" />
                        </button>
                        <span className="text-[#1D2956] font-bold min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                        >
                          <Plus className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[#536DFE]/20 pt-5 mt-5 bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm font-semibold">Subtotal</span>
                      <span className="text-[#1D2956] font-bold">{formatCurrency(getTotalPrice())}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#536DFE] text-lg font-bold">Total</span>
                      <span className="text-[#536DFE] text-2xl font-bold">{formatCurrency(getTotalPrice())}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
        </AnimatePresence>
      )}


      {/* Premium Fixed Bottom Checkout Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-white/95 backdrop-blur-xl border-t border-[#536DFE]/20 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowCart(true)}
              className="text-[#536DFE] text-sm font-bold flex items-center gap-2.5 hover:text-[#6B7FFF] transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center shadow-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              {getTotalItems()} items
            </button>
            <p className="text-[#1D2956] text-xl font-bold">
              {formatCurrency(getTotalPrice())}
            </p>
          </div>
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] hover:shadow-2xl hover:shadow-[#536DFE]/60 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-[#536DFE]/50 uppercase tracking-widest text-sm"
          >
            <Check className="w-5 h-5" />
            Checkout
          </button>
        </div>
      )}

      {/* Full-Screen Chatbot */}
      <RestaurantChatbot
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        restaurantName={restaurant?.name || ''}
        restaurantImage={restaurant?.image_url}
      />
    </div>
      </PageTransition>
    </>
  );
};

export default RestaurantDetails;
