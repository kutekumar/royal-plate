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

  const menuSectionRef = useRef<HTMLDivElement>(null);
  const menuItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
      fetchMenuItems();
    }
  }, [id]);

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

    navigate('/payment', { state: orderData });
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
    <div className="relative flex min-h-screen w-full flex-col bg-[#F5F5F7] max-w-[430px] mx-auto overflow-x-hidden font-poppins">

      {/* ── Hero Image ── */}
      <div className="relative w-full h-72 overflow-hidden">
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-4 z-10 w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Chatbot button */}
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="absolute top-5 right-4 z-10 flex items-center gap-2 bg-[#536DFE] text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-[#536DFE]/40 hover:scale-105 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-bold">AI Chat</span>
        </button>

        {/* Chatbot Overlay */}
        {showChatbot && (
          <div className="absolute top-16 right-4 w-80 z-20 max-w-[calc(100vw-2rem)]">
            <RestaurantChatbot restaurantId={id || ''} />
          </div>
        )}

        {/* Rating badge on hero */}
        <div className="absolute bottom-16 left-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/30">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(restaurant.rating) ? 'fill-white text-white' : 'text-white/30'}`} />
          ))}
          <span className="text-white text-xs font-bold ml-1">{restaurant.rating}</span>
          <span className="text-white/60 text-xs">• 1.2k reviews</span>
        </div>
      </div>

      {/* ── Restaurant Info Card ── */}
      <div className="bg-white mx-4 -mt-6 relative z-10 rounded-3xl shadow-xl border border-gray-100 p-5 mb-4">
        <h1 className="text-[#1D2956] text-2xl font-bold leading-tight tracking-tight mb-1">
          {restaurant.name}
        </h1>
        <div className="flex items-center gap-2 mb-3">
          {restaurant.cuisine_type && (
            <span className="bg-[#536DFE]/10 text-[#536DFE] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              {restaurant.cuisine_type}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{restaurant.description}</p>

        {/* Contact row */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <button
            onClick={() => {
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
              window.open(mapUrl, '_blank');
            }}
            className="flex items-center gap-3 w-full text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#536DFE]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[#536DFE]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1D2956] text-sm font-medium truncate">{restaurant.address}</p>
              <p className="text-gray-400 text-[11px]">Tap to open in maps</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-[#536DFE] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#536DFE]/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-[#536DFE]" />
            </div>
            <div>
              <p className="text-[#1D2956] text-sm font-medium">{restaurant.phone}</p>
              <p className="text-gray-400 text-[11px]">{restaurant.opening_hours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Order Type Selection ── */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
          <p className="text-[#1D2956] text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Order Type</p>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl border border-gray-200">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                orderType === 'dine_in'
                  ? 'bg-[#536DFE] text-white shadow-md shadow-[#536DFE]/30'
                  : 'text-gray-500 hover:text-[#1D2956]'
              }`}
            >
              Dine In
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                orderType === 'takeaway'
                  ? 'bg-[#536DFE] text-white shadow-md shadow-[#536DFE]/30'
                  : 'text-gray-500 hover:text-[#1D2956]'
              }`}
            >
              Take Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Reservation Section ── */}
      {orderType === 'dine_in' && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-[#1D2956] text-base font-bold mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#536DFE]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#536DFE]" />
              </div>
              Reserve Your Table
            </h3>

            {/* Party Size */}
            <div className="flex justify-between items-center bg-[#F5F5F7] p-4 rounded-2xl mb-5">
              <div>
                <p className="text-[#1D2956] text-sm font-bold">Party Size</p>
                <p className="text-gray-400 text-[11px]">Number of guests</p>
              </div>
              <div className="flex items-center gap-5">
                <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-[#536DFE]/40 transition-all shadow-sm">
                  <Minus className="w-4 h-4 text-[#536DFE]" />
                </button>
                <span className="text-[#1D2956] text-xl font-bold w-6 text-center">{partySize}</span>
                <button onClick={() => setPartySize(Math.min(20, partySize + 1))} className="w-9 h-9 rounded-xl bg-[#536DFE] flex items-center justify-center shadow-md shadow-[#536DFE]/30 hover:bg-[#536DFE]/90 transition-all">
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-5">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Select Date</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {getAvailableDates().map((date) => {
                  const formatted = formatDate(date);
                  const isSelected = selectedDate === formatted.fullDate;
                  return (
                    <button
                      key={formatted.fullDate}
                      onClick={() => setSelectedDate(formatted.fullDate)}
                      className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[60px] h-[72px] rounded-2xl transition-all ${
                        isSelected
                          ? 'bg-[#536DFE] text-white shadow-md shadow-[#536DFE]/30'
                          : 'bg-[#F5F5F7] border border-gray-200 text-[#1D2956] hover:border-[#536DFE]/40'
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase mb-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{formatted.month}</span>
                      <span className="text-xl font-bold">{formatted.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Time Slots</p>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-2xl text-sm font-bold transition-all ${
                        isSelected
                          ? 'bg-[#536DFE] text-white shadow-md shadow-[#536DFE]/30'
                          : 'bg-[#F5F5F7] border border-gray-200 text-[#1D2956] hover:border-[#536DFE]/40'
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

      {/* ── Menu Section ── */}
      <div className="px-4 pb-36">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1D2956] text-base font-bold flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#536DFE]/10 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-[#536DFE]" />
              </div>
              Menu
            </h3>
            <span className="text-gray-400 text-[11px] font-medium">{filteredMenuItems.length} items</span>
          </div>

          {/* Search Bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F5F5F7] border border-gray-100 text-[#1D2956] text-sm placeholder-gray-400 focus:outline-none focus:border-[#536DFE]/40 focus:ring-2 focus:ring-[#536DFE]/10 transition-all"
            />
          </div>

          {/* Menu Items */}
          <div className="space-y-3">
            {filteredMenuItems.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">No menu items found</p>
            ) : (
              filteredMenuItems.map((item) => {
                const cartItem = cart.find((c) => c.id === item.id);
                const quantity = cartItem?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    ref={(el) => { menuItemRefs.current[item.id] = el; }}
                    className="flex gap-3 p-3 bg-[#F5F5F7] rounded-2xl hover:bg-gray-100 transition-all cursor-pointer group border border-transparent hover:border-[#536DFE]/10"
                    onClick={() => setSelectedMenuItem(item)}
                  >
                    {/* Image */}
                    <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1D2956] font-bold text-sm mb-0.5 truncate">{item.name}</h4>
                      <p className="text-gray-400 text-[11px] line-clamp-2 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[#536DFE] font-bold text-sm">{formatCurrency(item.price)}</p>
                        {quantity > 0 ? (
                          <div className="flex items-center gap-2 bg-white rounded-xl px-2.5 py-1 border border-[#536DFE]/20 shadow-sm" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-[#536DFE] hover:scale-110 transition-transform">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[#1D2956] font-bold text-sm min-w-[16px] text-center">{quantity}</span>
                            <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="text-[#536DFE] hover:scale-110 transition-transform">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                            className="bg-[#536DFE] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm shadow-[#536DFE]/30 hover:bg-[#536DFE]/90 transition-all active:scale-95"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Menu Item Detail Modal */}
      {selectedMenuItem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-end justify-center"
          onClick={() => setSelectedMenuItem(null)}
        >
          <div
            className="bg-[#F5F5F7] w-full max-w-[430px] rounded-t-3xl border-t border-[#536DFE]/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '88vh' }}
          >
            {/* Full image at top */}
            <div className="relative w-full h-64 overflow-hidden">
              <img
                src={selectedMenuItem.image_url}
                alt={selectedMenuItem.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay — dark at bottom for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/40 to-transparent" />

              {/* Close button */}
              <button
                onClick={() => setSelectedMenuItem(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F5F5F7]/70 backdrop-blur-md border border-[#536DFE]/30 flex items-center justify-center hover:bg-[#F5F5F7] transition-all"
              >
                <X className="w-4 h-4 text-[#536DFE]" />
              </button>

              {/* Category badge */}
              {selectedMenuItem.category && (
                <div className="absolute top-4 left-4">
                  <span className="bg-[#536DFE] text-[#F5F5F7] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {selectedMenuItem.category}
                  </span>
                </div>
              )}

              {/* Name & price overlaid on image bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
                <h2 className="text-[#1D2956] text-2xl font-bold leading-tight drop-shadow-lg">
                  {selectedMenuItem.name}
                </h2>
                <p className="text-[#536DFE] text-xl font-bold mt-1 drop-shadow-lg">
                  {formatCurrency(selectedMenuItem.price)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pt-4 pb-2">
              <p className="text-gray-500 text-sm leading-relaxed">
                {selectedMenuItem.description || 'A delicious dish prepared with the finest ingredients.'}
              </p>
            </div>

            {/* Cart controls */}
            <div className="px-6 pt-4 pb-8">
              {(() => {
                const cartItem = cart.find((c) => c.id === selectedMenuItem.id);
                const qty = cartItem?.quantity || 0;
                return qty > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-[#536DFE]/10 border border-[#536DFE]/30 rounded-2xl px-6 py-4 flex-1 justify-between">
                      <button
                        onClick={() => removeFromCart(selectedMenuItem.id)}
                        className="text-[#536DFE] hover:scale-110 transition-transform"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-[#1D2956] font-bold text-xl">{qty}</span>
                      <button
                        onClick={() => addToCart(selectedMenuItem)}
                        className="text-[#536DFE] hover:scale-110 transition-transform"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedMenuItem(null)}
                      className="bg-[#536DFE] text-[#F5F5F7] font-bold px-6 py-4 rounded-2xl text-sm uppercase tracking-wider hover:bg-[#536DFE]/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(210,141,31,0.3)]"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { addToCart(selectedMenuItem); setSelectedMenuItem(null); }}
                    className="w-full bg-[#536DFE] text-[#F5F5F7] font-bold py-5 rounded-2xl text-sm uppercase tracking-widest hover:bg-[#536DFE]/90 transition-all active:scale-[0.98] shadow-[0_0_24px_rgba(210,141,31,0.35)] flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart — {formatCurrency(selectedMenuItem.price)}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-[#F5F5F7] w-full max-w-[430px] rounded-t-3xl border-t border-[#536DFE]/20 max-h-[85vh] flex flex-col">
            <div className="sticky top-0 bg-[#F5F5F7] border-b border-[#536DFE]/20 p-6 flex items-center justify-between z-10">
              <h3 className="text-[#536DFE] text-xl font-bold">Your Cart</h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-[#536DFE]/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-white/20 p-4 rounded-xl border border-[#536DFE]/20"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover border border-[#536DFE]/20"
                      />
                      <div className="flex-1">
                        <h4 className="text-[#1D2956] font-semibold">{item.name}</h4>
                        <p className="text-[#536DFE] font-bold">
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#536DFE] hover:scale-110 transition-transform"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-[#1D2956] font-bold min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="text-[#536DFE] hover:scale-110 transition-transform"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[#536DFE]/20 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Subtotal</span>
                      <span className="text-[#1D2956] font-semibold">{formatCurrency(getTotalPrice())}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#536DFE] text-lg font-bold">Total</span>
                      <span className="text-[#536DFE] text-2xl font-bold">{formatCurrency(getTotalPrice())}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Fixed Bottom Checkout Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-[#F5F5F7]/90 backdrop-blur-xl border-t border-[#536DFE]/20 z-50">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowCart(true)}
              className="text-[#536DFE] text-sm font-semibold flex items-center gap-2 hover:text-[#536DFE]/80 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems()} items
            </button>
            <p className="text-[#1D2956] text-xl font-bold">
              {formatCurrency(getTotalPrice())}
            </p>
          </div>
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-[#536DFE] hover:bg-[#536DFE]/90 text-[#F5F5F7] font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(202,161,87,0.2)] uppercase tracking-widest text-sm"
          >
            <Check className="w-5 h-5" />
            Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;
