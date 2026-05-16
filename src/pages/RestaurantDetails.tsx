import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSoundContext } from '@/contexts/SoundContext';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  Calendar,
  MessageCircle,
  X,
  Check,
  Navigation,
  Sparkles,
  Clock,
  Users,
  Heart,
  Crown,
  Gift,
  Briefcase,
  ChevronRight,
  UtensilsCrossed,
  PartyPopper,
} from 'lucide-react';
import RestaurantChatbot from '@/components/RestaurantChatbot';
import { formatCurrency } from '@/utils/currency';
import { getUserLocation, Coordinates, YANGON_CENTER } from '@/utils/location';
import SingleRestaurantMap from '@/components/SingleRestaurantMap';
import { motion, AnimatePresence } from 'framer-motion';
import DirectionModal from '@/components/DirectionModal';

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
  specialInstructions?: string;
}

interface CartItemWithInstructions extends CartItem {
  specialInstructions?: string;
}

const CART_STORAGE_KEY = 'royal-plate-cart';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { play } = useSoundContext();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [occasion, setOccasion] = useState<string>('');
  const [tablePreference, setTablePreference] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [showInstructionsFor, setShowInstructionsFor] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.restaurantId === id && Array.isArray(parsed.items)) {
          setCart(parsed.items);
        }
      }
    } catch {}
  }, [id]);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        restaurantId: id,
        items: cart,
      }));
    } catch {}
  }, [cart, id]);

  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
      fetchMenuItems();
      fetchUserLocation();
    }
  }, [id]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrolled * 0.3}px) scale(${1 + scrolled * 0.0003})`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUserLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserLocation(location);
    }
  };

  useEffect(() => {
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
        item.is_available !== false
      );
      
      setMenuItems(availableItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback((item: MenuItem) => {
    play('addToCart');
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 500);
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1, specialInstructions: '' }];
    });
    toast.success(`${item.name} added to cart`, { duration: 1500 });
  }, [play]);

  const removeFromCart = useCallback((itemId: string) => {
    play('removeFromCart');
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
  }, [play]);

  const updateItemInstructions = useCallback((itemId: string, instructions: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, specialInstructions: instructions } : item
      )
    );
  }, []);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleProceedToPayment = useCallback(() => {
    if (cart.length === 0) {
      play('error');
      toast.error('Your cart is empty');
      return;
    }

    if (orderType === 'dine_in' && (!selectedDate || !selectedTime)) {
      play('error');
      toast.error('Please select date and time for your reservation');
      return;
    }

    play('checkout');

    const orderData = {
      restaurant,
      cart,
      orderType,
      partySize: orderType === 'dine_in' ? partySize : 1,
      reservationDate: orderType === 'dine_in' ? selectedDate : null,
      reservationTime: orderType === 'dine_in' ? selectedTime : null,
      totalAmount: getTotalPrice(),
    };

    navigate('/payment', { state: orderData });
  }, [cart, orderType, partySize, selectedDate, selectedTime, restaurant, navigate, play]);

  const timeSlots = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ];

  const occasions = [
    { id: '', label: 'None specified', icon: UtensilsCrossed },
    { id: 'birthday', label: 'Birthday', icon: Gift },
    { id: 'anniversary', label: 'Anniversary', icon: Heart },
    { id: 'date_night', label: 'Date Night', icon: Sparkles },
    { id: 'business', label: 'Business Dinner', icon: Briefcase },
    { id: 'celebration', label: 'Celebration', icon: PartyPopper },
    { id: 'chef_table', label: "Chef's Table", icon: Crown },
  ];

  const tablePreferences = [
    { id: '', label: 'No preference' },
    { id: 'indoor', label: 'Indoor Salon' },
    { id: 'terrace', label: 'Terrace' },
    { id: 'chef_counter', label: "Chef's Counter" },
    { id: 'private', label: 'Private Room' },
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate(),
      fullDate: date.toISOString().split('T')[0],
      label: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  };

  // Suggested items based on cart contents
  const suggestedItems = useMemo(() => {
    if (cart.length === 0 || menuItems.length === 0) return [];
    const cartCategoryIds = new Set(cart.map(item => item.id));
    const cartCategories = new Set(cart.map(item => item.category));
    return menuItems
      .filter(item => !cartCategoryIds.has(item.id) && cartCategories.has(item.category))
      .slice(0, 3);
  }, [cart, menuItems]);

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-[#536DFE] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
        <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] max-w-[430px] mx-auto overflow-x-hidden font-poppins">

      {/* ── Cinematic Hero with Parallax ── */}
      <div className="relative w-full h-[340px] overflow-hidden">
        {/* Parallax Image Layer */}
        <div ref={heroRef} className="absolute inset-0 w-full h-[120%] -top-[10%] brand-hero-filter" style={{ willChange: 'transform' }}>
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Sparkle Particles */}
        <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/60 rounded-full animate-sparkle"
              style={{
                top: `${15 + i * 12}%`,
                left: `${10 + i * 15}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + i * 0.3}s`,
                boxShadow: '0 0 6px rgba(255,255,255,0.8)',
              }}
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <div
              key={`gold-${i}`}
              className="absolute w-2 h-2 rounded-full animate-sparkle"
              style={{
                top: `${20 + i * 18}%`,
                right: `${15 + i * 12}%`,
                animationDelay: `${i * 0.6 + 0.3}s`,
                animationDuration: `${2.5 + i * 0.2}s`,
                background: 'radial-gradient(circle, #FBBF24, #F59E0B)',
                boxShadow: '0 0 10px rgba(245,158,11,0.6)',
              }}
            />
          ))}
        </div>

        {/* Cinematic Gradient Cascade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/20 to-transparent z-[2]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-[2]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/15 via-transparent to-[#F59E0B]/10 z-[2]" />

        {/* Premium Back button with Gold accent */}
        <button
          onClick={() => { play('tap'); navigate(-1); }}
          className="absolute top-6 left-5 z-10 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center hover:bg-white/40 hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all shadow-xl group"
        >
          <ArrowLeft className="w-5 h-5 text-white drop-shadow group-hover:scale-110 transition-transform" />
        </button>

        {/* Premium Chatbot button */}
        <button
          onClick={() => { play('tap'); setShowChatbot(!showChatbot); }}
          className="absolute top-6 right-5 z-10 flex items-center gap-2.5 bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-[#536DFE]/60 hover:shadow-[0_0_50px_rgba(83,109,254,0.8)] hover:scale-105 active:scale-[0.98] transition-all duration-300 border border-white/30 backdrop-blur-md"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-bold tracking-wide">Concierge</span>
        </button>

        {/* Animated Rating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="absolute bottom-24 left-5 z-10"
        >
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-2xl rounded-2xl px-4 py-2.5 border border-white/40 shadow-2xl hover:bg-white/30 transition-all">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300 }}
              >
                <Star
                  className={`w-4 h-4 ${
                    i < Math.floor(restaurant.rating)
                      ? 'fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                      : 'text-white/30'
                  }`}
                />
              </motion.div>
            ))}
            <span className="text-white text-sm font-bold ml-1 drop-shadow-lg">{restaurant.rating}</span>
          </div>
        </motion.div>

        {/* Restaurant Name Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="absolute bottom-6 left-5 z-10"
        >
          <h1 className="text-white text-3xl font-bold leading-tight tracking-tight drop-shadow-2xl">
            {restaurant.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse-soft" />
            <span className="text-white/80 text-xs font-medium drop-shadow-lg">Open now</span>
          </div>
        </motion.div>
      </div>

      {/* ── Premium Restaurant Info Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{ willChange: 'transform, opacity' }}
        className="glass-premium mx-5 -mt-8 relative z-10 rounded-3xl shadow-2xl shadow-black/10 border border-white/60 p-6 mb-5">
        
        {/* Cuisine & Rating Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {restaurant.cuisine_type && (
              <span className="bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 text-[#536DFE] text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-[#536DFE]/20">
                {restaurant.cuisine_type}
              </span>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-1.5 bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 rounded-xl px-3 py-1.5 border border-[#F59E0B]/20"
          >
            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-[#F59E0B] text-xs font-bold">{restaurant.rating}</span>
            <span className="text-gray-400 text-[10px]">· 2.3 km</span>
          </motion.div>
        </div>
        
        <p className="text-gray-500 text-sm leading-relaxed">{restaurant.description}</p>

        {/* Premium Contact row */}
        <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
          <button
            onClick={() => { play('tap'); setShowMap(!showMap); }}
            className="flex items-center gap-3.5 w-full text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:shadow-lg transition-all shadow-md">
              <MapPin className="w-5 h-5 text-[#536DFE]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1D2956] text-sm font-semibold truncate">{restaurant.address}</p>
              <p className="text-gray-400 text-[11px] font-medium mt-0.5">{showMap ? 'Tap to hide map' : 'Tap to view on map'}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#536DFE]/10 transition-all">
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#536DFE] transition-colors" />
            </div>
          </button>

          {/* Hours Timeline */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 flex items-center justify-center flex-shrink-0 shadow-md">
              <Clock className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[#1D2956] text-sm font-semibold">Open today</p>
                <span className="text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Open now</span>
              </div>
              <p className="text-gray-400 text-[11px] font-medium mt-0.5">{restaurant.opening_hours}</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center flex-shrink-0 shadow-md">
              <Phone className="w-5 h-5 text-[#536DFE]" />
            </div>
            <div className="flex-1">
              <p className="text-[#1D2956] text-sm font-semibold">{restaurant.phone}</p>
              <p className="text-gray-400 text-[11px] font-medium mt-0.5">Call to make a reservation</p>
            </div>
          </div>
          
          {/* Get Direction Button */}
          {restaurant.latitude && restaurant.longitude && (
            <button
              onClick={() => { play('tap'); setShowDirectionModal(true); }}
              className="flex items-center gap-3.5 w-full text-left group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:shadow-lg transition-all shadow-md">
                <Navigation className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#1D2956] text-sm font-semibold">Get Directions</p>
                <p className="text-gray-400 text-[11px] font-medium mt-0.5">Navigate to restaurant</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-all">
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </div>
            </button>
          )}
        </div>

        {/* Premium Map Display */}
        {showMap && restaurant.latitude && restaurant.longitude && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-5 rounded-2xl overflow-hidden border border-white/60 shadow-xl"
          >
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
          </motion.div>
        )}
      </motion.div>

      {/* ── Premium Order Type Selection ── */}
      <div className="px-5 pb-5">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-black/5 p-5">
          <p className="text-[#1D2956] text-[11px] font-bold uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
            Order Type
          </p>
          <div className="flex gap-3 p-1.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 shadow-inner">
            <button
              onClick={() => { play('tap'); setOrderType('dine_in'); }}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                orderType === 'dine_in'
                  ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-xl shadow-[#536DFE]/40 scale-105'
                  : 'text-gray-500 hover:text-[#1D2956] hover:bg-white/50'
              }`}
            >
              Dine In
            </button>
            <button
              onClick={() => { play('tap'); setOrderType('takeaway'); }}
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
          <div className="glass-premium rounded-3xl border border-white/60 shadow-xl shadow-black/5 p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-[#1D2956] text-lg font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-[#536DFE]" />
                </div>
                Reserve Your Experience
              </h3>

              {/* Occasion Selection */}
              <div className="mb-5">
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Occasion</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {occasions.map((occ) => {
                    const Icon = occ.icon;
                    const isSelected = occasion === occ.id;
                    return (
                      <button
                        key={occ.id}
                        onClick={() => { play('select'); setOccasion(occ.id); }}
                        className={`flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-lg shadow-[#536DFE]/40 scale-105'
                            : 'bg-white/90 border border-gray-200 text-gray-500 hover:text-[#1D2956] hover:border-[#536DFE]/40 hover:shadow-md'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {occ.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table Preference */}
              <div className="mb-5">
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Table Preference</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {tablePreferences.map((pref) => {
                    const isSelected = tablePreference === pref.id;
                    return (
                      <button
                        key={pref.id}
                        onClick={() => { play('select'); setTablePreference(pref.id); }}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-lg shadow-[#536DFE]/40 scale-105'
                            : 'bg-white/90 border border-gray-200 text-gray-500 hover:text-[#1D2956] hover:border-[#536DFE]/40 hover:shadow-md'
                        }`}
                      >
                        {pref.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Premium Party Size */}
              <div className="flex justify-between items-center bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] p-5 rounded-2xl mb-5 border border-gray-100/50 shadow-inner">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#536DFE]" />
                    <p className="text-[#1D2956] text-sm font-bold">Party Size</p>
                  </div>
                  <p className="text-gray-400 text-[11px] font-medium mt-0.5">Number of guests</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { play('tap'); setPartySize(Math.max(1, partySize - 1)); }}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-[#536DFE]/40 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Minus className="w-4.5 h-4.5 text-[#536DFE]" />
                  </button>
                  <motion.span
                    key={partySize}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[#1D2956] text-2xl font-bold w-8 text-center"
                  >
                    {partySize}
                  </motion.span>
                  <button
                    onClick={() => { play('tap'); setPartySize(Math.min(20, partySize + 1)); }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-xl shadow-[#536DFE]/40 hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
                  >
                    <Plus className="w-4.5 h-4.5 text-white" />
                  </button>
                </div>
              </div>

              {/* Premium Date Selection */}
              <div className="mb-5">
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-4">Select Date</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getAvailableDates().map((date) => {
                    const formatted = formatDate(date);
                    const isSelected = selectedDate === formatted.fullDate;
                    return (
                      <motion.button
                        key={formatted.fullDate}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { play('select'); setSelectedDate(formatted.fullDate); }}
                        className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[76px] h-[88px] rounded-2xl transition-all shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40 scale-105 border border-white/30'
                            : 'bg-white/90 backdrop-blur-md border border-gray-200 text-[#1D2956] hover:border-[#536DFE]/40 hover:shadow-xl shadow-black/5'
                        }`}
                      >
                        <span className={`text-[9px] font-bold uppercase mb-0.5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>{formatted.month}</span>
                        <span className="text-2xl font-bold leading-none mb-0.5">{formatted.day}</span>
                        <span className={`text-[9px] font-semibold ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>{formatted.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Premium Time Selection */}
              <div className="mb-5">
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-4">Time Slots</p>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    const isPeak = time === '19:00' || time === '19:30' || time === '20:00';
                    return (
                      <button
                        key={time}
                        onClick={() => { play('select'); setSelectedTime(time); }}
                        className={`relative py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40 scale-105'
                            : 'bg-white/90 backdrop-blur-md border border-gray-200 text-[#1D2956] hover:border-[#536DFE]/40 hover:shadow-xl shadow-black/5'
                        }`}
                      >
                        {time}
                        {isPeak && !isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                            Peak
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Special Requests</p>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Allergies, celebrations, seating preferences..."
                  rows={2}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] border border-gray-100 text-[#1D2956] text-sm placeholder-gray-400 focus:outline-none focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 transition-all shadow-inner resize-none"
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── Premium Menu Preview Section ── */}
      <div className="px-5 pb-36">
        <div className="glass-premium rounded-3xl border border-white/60 shadow-xl shadow-black/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1D2956] text-lg font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center shadow-md">
                <ShoppingCart className="w-5 h-5 text-[#536DFE]" />
              </div>
              Our Menu
            </h3>
            <span className="text-gray-400 text-[11px] font-semibold tracking-wide">{menuItems.length} selections</span>
          </div>

          <p className="text-gray-400 text-xs leading-relaxed mb-5">
            Browse our curated selection of exquisite dishes, from artisanal appetizers to decadent desserts. Each dish is crafted with the finest ingredients.
          </p>

          {/* Menu Preview Grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {menuItems.slice(0, 6).map((item) => (
              <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square shadow-md group">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[8px] font-bold leading-tight drop-shadow-lg line-clamp-1">{item.name}</p>
              </div>
            ))}
          </div>

          {/* Browse Full Menu CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { play('tap'); navigate(`/restaurant/${id}/menu`); }}
            className="w-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#536DFE]/50 hover:shadow-2xl hover:shadow-[#536DFE]/70 active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            <UtensilsCrossed className="w-5 h-5" />
            Browse Full Menu
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {/* Quick add-ons: Popular items */}
          {menuItems.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <p className="text-[#1D2956] text-[11px] font-bold uppercase tracking-[0.2em]">Popular picks</p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {menuItems.slice(0, 5).map((item) => {
                  const cartItem = cart.find(c => c.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="flex-shrink-0 flex items-center gap-2.5 bg-white/90 rounded-2xl px-4 py-3 border border-gray-100 shadow-md hover:shadow-lg hover:border-[#536DFE]/30 transition-all"
                    >
                      <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                      <div className="text-left">
                        <p className="text-[#1D2956] text-[11px] font-bold truncate max-w-[90px]">{item.name}</p>
                        <p className="text-[#536DFE] text-[11px] font-bold">{formatCurrency(item.price)}</p>
                      </div>
                      {cartItem ? (
                        <span className="bg-[#536DFE]/10 text-[#536DFE] text-[9px] font-bold px-2 py-1 rounded-full">{cartItem.quantity}</span>
                      ) : (
                        <Plus className="w-4 h-4 text-[#536DFE] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
            onClick={() => { play('tap'); setSelectedMenuItem(null); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] w-full max-w-[430px] rounded-t-3xl border-t-2 border-[#536DFE]/40 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '90vh' }}
            >
              {/* Premium Full image at top */}
              <div className="relative w-full h-72 overflow-hidden brand-menu-filter">
                <img
                  src={selectedMenuItem.image_url}
                  alt={selectedMenuItem.name}
                  className="w-full h-full object-cover brand-image-fade"
                />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/10 to-transparent" />

              <button
                onClick={() => { play('tap'); setSelectedMenuItem(null); }}
                className="absolute top-5 right-5 w-11 h-11 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/50 flex items-center justify-center hover:bg-white/50 hover:scale-105 transition-all shadow-xl"
              >
                <X className="w-5 h-5 text-[#536DFE] drop-shadow" />
              </button>

              {selectedMenuItem.category && (
                <div className="absolute top-5 left-5">
                  <span className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-xl shadow-[#536DFE]/50 border border-white/30 backdrop-blur-md">
                    {selectedMenuItem.category}
                  </span>
                </div>
              )}

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
            <div className="px-6 pt-5 pb-1">
              <p className="text-gray-500 text-sm leading-relaxed">
                {selectedMenuItem.description || 'A delicious dish prepared with the finest ingredients.'}
              </p>
            </div>

            {/* Special Instructions */}
            <div className="px-6 pb-3">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Special Instructions</p>
              <textarea
                placeholder="Any modifications, allergies, or preferences..."
                rows={2}
                value={instructionText || cart.find(c => c.id === selectedMenuItem.id)?.specialInstructions || ''}
                onChange={(e) => setInstructionText(e.target.value)}
                onBlur={() => {
                  if (instructionText) updateItemInstructions(selectedMenuItem.id, instructionText);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-[#1D2956] text-xs placeholder-gray-300 focus:outline-none focus:border-[#536DFE]/40 focus:ring-2 focus:ring-[#536DFE]/10 transition-all resize-none"
              />
            </div>

            {/* Premium Cart controls */}
            <div className="px-6 pt-2 pb-8">
              {(() => {
                const cartItem = cart.find((c) => c.id === selectedMenuItem.id);
                const qty = cartItem?.quantity || 0;
                const totalPrice = selectedMenuItem.price * (qty || 1);
                return qty > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-5 bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 border border-[#536DFE]/30 rounded-2xl px-8 py-5 flex-1 justify-between shadow-lg">
                        <button
                          onClick={() => removeFromCart(selectedMenuItem.id)}
                          className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <motion.span
                          key={qty}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className="text-[#1D2956] font-bold text-2xl"
                        >
                          {qty}
                        </motion.span>
                        <button
                          onClick={() => addToCart(selectedMenuItem)}
                          className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                      <button
                        onClick={() => { play('tap'); setSelectedMenuItem(null); }}
                        className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white font-bold px-8 py-5 rounded-2xl text-sm uppercase tracking-wider hover:shadow-2xl hover:shadow-[#536DFE]/60 transition-all active:scale-95 shadow-xl shadow-[#536DFE]/40"
                      >
                        Done
                      </button>
                    </div>
                    <p className="text-right text-gray-400 text-xs font-medium">
                      Subtotal: <span className="text-[#536DFE] font-bold">{formatCurrency(totalPrice)}</span>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (instructionText) updateItemInstructions(selectedMenuItem.id, instructionText);
                      addToCart(selectedMenuItem);
                      setSelectedMenuItem(null);
                    }}
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
              className="bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] w-full max-w-[430px] rounded-t-3xl border-t-2 border-[#536DFE]/40 max-h-[88vh] flex flex-col shadow-2xl"
            >
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-[#536DFE]/20 p-6 flex items-center justify-between z-10 rounded-t-3xl">
              <div>
                <h3 className="text-[#536DFE] text-xl font-bold">Your Order</h3>
                <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-medium mt-0.5">{cart.length} {cart.length === 1 ? 'item' : 'items'} selected</p>
              </div>
              <button
                onClick={() => { play('tap'); setShowCart(false); }}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-[#536DFE]/10 hover:to-[#6B7FFF]/10 transition-all shadow-md hover:shadow-lg"
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
                  <p className="text-gray-300 text-xs mt-2">Browse the menu to add items</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg hover:shadow-xl transition-all overflow-hidden"
                    >
                      <div className="flex items-center gap-4 p-4">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-[#536DFE]/20 shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[#1D2956] font-bold text-sm truncate">{item.name}</h4>
                          <p className="text-gray-400 text-[11px] mt-0.5">
                            {formatCurrency(item.price)} each
                          </p>
                          <p className="text-[#536DFE] font-bold text-sm mt-1">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] rounded-xl px-3 py-2 shadow-inner">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                          >
                            <Minus className="w-4.5 h-4.5" />
                          </button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            className="text-[#1D2956] font-bold min-w-[24px] text-center"
                          >
                            {item.quantity}
                          </motion.span>
                          <button
                            onClick={() => addToCart(item)}
                            className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95"
                          >
                            <Plus className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                      {/* Special instructions inline */}
                      {item.specialInstructions && (
                        <div className="px-4 pb-3 pt-0">
                          <div className="flex items-start gap-2 bg-[#536DFE]/5 rounded-xl px-3 py-2">
                            <span className="text-[#536DFE] text-[10px] font-bold uppercase tracking-wider flex-shrink-0">Note:</span>
                            <p className="text-gray-500 text-[11px]">{item.specialInstructions}</p>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setShowInstructionsFor(item.id);
                          setInstructionText(item.specialInstructions || '');
                        }}
                        className="w-full text-left px-4 pb-3 pt-0"
                      >
                        <span className="text-[#536DFE] text-[10px] font-semibold hover:text-[#6B7FFF] transition-colors">
                          + Add special instructions
                        </span>
                      </button>
                    </div>
                  ))}

                  {/* Special Instructions Modal */}
                  {showInstructionsFor && (
                    <div className="fixed inset-0 bg-black/60 z-20 flex items-center justify-center p-6" onClick={() => setShowInstructionsFor(null)}>
                      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-[#1D2956] font-bold text-sm mb-3">Special Instructions</h4>
                        <textarea
                          autoFocus
                          placeholder="Any modifications, allergies, or preferences..."
                          rows={3}
                          value={instructionText}
                          onChange={(e) => setInstructionText(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] border border-gray-100 text-[#1D2956] text-sm placeholder-gray-400 focus:outline-none focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 transition-all resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => setShowInstructionsFor(null)}
                            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (showInstructionsFor) updateItemInstructions(showInstructionsFor, instructionText);
                              setShowInstructionsFor(null);
                              play('tap');
                            }}
                            className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white font-bold text-sm shadow-lg shadow-[#536DFE]/40 hover:shadow-xl transition-all"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggested Add-ons */}
                  {suggestedItems.length > 0 && (
                    <div className="bg-gradient-to-br from-[#F59E0B]/5 to-[#D97706]/5 rounded-2xl p-4 border border-[#F59E0B]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <p className="text-[#F59E0B] text-[11px] font-bold uppercase tracking-[0.2em]">You might also like</p>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {suggestedItems.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => addToCart(suggestion)}
                            className="flex-shrink-0 flex items-center gap-2 bg-white/90 rounded-xl px-3 py-2 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#536DFE]/30 transition-all"
                          >
                            <img src={suggestion.image_url} alt={suggestion.name} className="w-8 h-8 rounded-lg object-cover" />
                            <div className="text-left">
                              <p className="text-[#1D2956] text-[10px] font-bold truncate max-w-[80px]">{suggestion.name}</p>
                              <p className="text-[#536DFE] text-[10px] font-bold">{formatCurrency(suggestion.price)}</p>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-[#536DFE] flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/60">
                    <div className="space-y-2.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs font-medium">Subtotal</span>
                        <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(getTotalPrice())}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs font-medium">Service charge</span>
                        <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(Math.round(getTotalPrice() * 0.05))}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-gray-400 text-xs font-medium">Tax (5%)</span>
                        <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(Math.round(getTotalPrice() * 0.05))}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#536DFE] text-base font-bold">Total</span>
                      <motion.span
                        key={getTotalPrice()}
                        initial={{ scale: 1.1, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[#536DFE] text-2xl font-bold"
                      >
                        {formatCurrency(Math.round(getTotalPrice() * 1.1))}
                      </motion.span>
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
              onClick={() => { play('tap'); setShowCart(true); }}
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

      {/* Get Direction Full-Screen Modal */}
      <DirectionModal
        isOpen={showDirectionModal}
        onClose={() => setShowDirectionModal(false)}
        restaurantName={restaurant?.name || ''}
        restaurantAddress={restaurant?.address || ''}
        destination={{
          lat: restaurant?.latitude || 0,
          lng: restaurant?.longitude || 0,
        }}
        userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
      />
    </div>
    </>
  );
};

export default RestaurantDetails;
