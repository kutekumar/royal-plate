import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  Clock,
  Users,
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Calendar,
  MessageCircle,
  X,
  Check,
} from 'lucide-react';
import RestaurantChatbot from '@/components/RestaurantChatbot';

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
      <div className="min-h-screen bg-[#1d2956] flex items-center justify-center">
        <div className="text-[#caa157] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#1d2956] max-w-[430px] mx-auto overflow-x-hidden">
      {/* Hero Image with Back Button and Chatbot */}
      <div className="relative w-full h-80 overflow-hidden">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#1d2956]/60 backdrop-blur-md rounded-full p-2 flex items-center justify-center border border-white/10 hover:bg-[#1d2956]/80 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Chatbot Button on Hero Image */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowChatbot(!showChatbot)}
            className="bg-[#caa157] text-[#1d2956] p-3 rounded-full shadow-[0_0_30px_rgba(202,161,87,0.4)] hover:scale-110 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${restaurant.image_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d2956] via-transparent to-transparent"></div>
        </div>
        
        {/* Chatbot Overlay */}
        {showChatbot && (
          <div className="absolute top-16 right-4 w-80 z-20 max-w-[calc(100vw-2rem)]">
            <RestaurantChatbot restaurantId={id || ''} />
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="bg-[#1d2956] px-4 pb-6 -mt-4 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[#caa157] tracking-tight text-[34px] font-bold leading-tight pt-6">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(restaurant.rating)
                      ? 'fill-[#caa157] text-[#caa157]'
                      : 'text-[#caa157]/30'
                  }`}
                />
              ))}
              <span className="text-sm text-slate-400 ml-2 font-light">
                ({restaurant.rating} • 1.2k reviews)
              </span>
            </div>
          </div>
        </div>
        <p className="text-slate-300 text-sm mt-4 leading-relaxed font-light">
          {restaurant.description}
        </p>
      </div>

      {/* Contact Info */}
      <div className="py-4 space-y-1 bg-[#1d2956]">
        <button 
          onClick={() => {
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
            window.open(mapUrl, '_blank');
          }}
          className="flex items-center gap-4 px-4 min-h-[64px] w-full hover:bg-[#263569]/20 transition-all rounded-xl"
        >
          <div className="text-[#caa157] flex items-center justify-center rounded-xl bg-[#caa157]/5 shrink-0 size-11 border border-[#caa157]/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center flex-1 text-left">
            <p className="text-white text-base font-medium leading-normal">
              {restaurant.address}
            </p>
            <p className="text-slate-400 text-sm font-normal">
              {restaurant.cuisine_type} • Tap to view map
            </p>
          </div>
        </button>
        <div className="flex items-center gap-4 px-4 min-h-[64px]">
          <div className="text-[#caa157] flex items-center justify-center rounded-xl bg-[#caa157]/5 shrink-0 size-11 border border-[#caa157]/20">
            <Phone className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-white text-base font-medium leading-normal">
              {restaurant.phone}
            </p>
            <p className="text-slate-400 text-sm font-normal">
              {restaurant.opening_hours}
            </p>
          </div>
        </div>
      </div>

      {/* Order Type Selection */}
      <div className="px-4 pt-6 pb-4 bg-[#1d2956]">
        <p className="text-[#caa157]/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          Order Type
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setOrderType('dine_in')}
            className={`flex-1 py-4 rounded-xl text-sm font-bold transition-all ${
              orderType === 'dine_in'
                ? 'bg-[#caa157] text-[#1d2956] shadow-[0_0_20px_rgba(202,161,87,0.3)]'
                : 'bg-[#263569]/30 border border-[#caa157]/40 text-[#caa157] hover:bg-[#caa157]/10'
            }`}
          >
            DINE IN
          </button>
          <button
            onClick={() => setOrderType('takeaway')}
            className={`flex-1 py-4 rounded-xl text-sm font-bold transition-all ${
              orderType === 'takeaway'
                ? 'bg-[#caa157] text-[#1d2956] shadow-[0_0_20px_rgba(202,161,87,0.3)]'
                : 'bg-[#263569]/30 border border-[#caa157]/40 text-[#caa157] hover:bg-[#caa157]/10'
            }`}
          >
            TAKE OUT
          </button>
        </div>
      </div>

      {/* Reservation Section - Only for Dine In */}
      {orderType === 'dine_in' && (
        <div className="px-4 py-8 bg-[#1d2956]">
          <h3 className="text-[#caa157] text-xl font-bold leading-tight tracking-tight mb-8 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reserve Your Table
          </h3>

          {/* Party Size */}
          <div className="flex justify-between items-center bg-[#263569]/40 p-5 rounded-2xl border border-[#caa157]/20 mb-6">
            <div>
              <p className="text-[#caa157] text-[10px] font-bold uppercase tracking-[0.2em]">
                Party Size
              </p>
              <p className="text-slate-400 text-[10px] font-medium">Guests</p>
            </div>
            <div className="flex items-center gap-8">
              <button
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                className="flex items-center justify-center outline-none"
              >
                <Minus className="w-8 h-8 text-[#caa157] cursor-pointer hover:scale-110 transition-transform" />
              </button>
              <span className="text-white text-2xl font-bold w-6 text-center">
                {partySize}
              </span>
              <button
                onClick={() => setPartySize(Math.min(20, partySize + 1))}
                className="flex items-center justify-center outline-none"
              >
                <Plus className="w-8 h-8 text-[#caa157] cursor-pointer hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-10">
            <p className="text-[#caa157]/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              Select Date
            </p>
            <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
              {getAvailableDates().map((date) => {
                const formatted = formatDate(date);
                const isSelected = selectedDate === formatted.fullDate;
                return (
                  <button
                    key={formatted.fullDate}
                    onClick={() => setSelectedDate(formatted.fullDate)}
                    className={`flex flex-col items-center justify-center min-w-[68px] h-[84px] rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-[#caa157] text-[#1d2956] font-bold shadow-[0_0_20px_rgba(202,161,87,0.3)]'
                        : 'bg-[#263569]/30 border border-[#caa157]/40 text-[#caa157]'
                    }`}
                  >
                    <span className="text-[10px] uppercase opacity-80">
                      {formatted.month}
                    </span>
                    <span className="text-2xl font-bold">{formatted.day}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <p className="text-[#caa157]/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              Available Time Slots
            </p>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-4 rounded-xl text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#caa157] text-[#1d2956] shadow-[0_0_20px_rgba(202,161,87,0.3)]'
                        : 'bg-[#263569]/30 border border-[#caa157]/40 text-[#caa157] hover:bg-[#caa157]/10'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Menu Section */}
      <div className="px-4 py-8 bg-[#1d2956] pb-32">
        <h3 className="text-[#caa157] text-xl font-bold leading-tight tracking-tight mb-6 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Our Menu
        </h3>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#caa157]/60" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#263569]/30 border border-[#caa157]/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#caa157]/60 transition-all"
          />
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {filteredMenuItems.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No menu items found</p>
          ) : (
            filteredMenuItems.map((item) => {
              const cartItem = cart.find((c) => c.id === item.id);
              const quantity = cartItem?.quantity || 0;

              return (
                <div
                  key={item.id}
                  className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-4 hover:border-[#caa157]/40 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#caa157]/20">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-base mb-1">
                        {item.name}
                      </h4>
                      <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[#caa157] font-bold text-lg">
                          ${item.price.toFixed(2)}
                        </p>
                        {quantity > 0 ? (
                          <div className="flex items-center gap-3 bg-[#caa157]/10 rounded-lg px-3 py-1 border border-[#caa157]/30">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[#caa157] hover:scale-110 transition-transform"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-bold min-w-[20px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="text-[#caa157] hover:scale-110 transition-transform"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-[#caa157] text-[#1d2956] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#caa157]/90 transition-all active:scale-95"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-[#1d2956] w-full max-w-[430px] rounded-t-3xl border-t border-[#caa157]/20 max-h-[85vh] flex flex-col">
            <div className="sticky top-0 bg-[#1d2956] border-b border-[#caa157]/20 p-6 flex items-center justify-between z-10">
              <h3 className="text-[#caa157] text-xl font-bold">Your Cart</h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-[#caa157]/30 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-[#263569]/20 p-4 rounded-xl border border-[#caa157]/20"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover border border-[#caa157]/20"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{item.name}</h4>
                        <p className="text-[#caa157] font-bold">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#caa157] hover:scale-110 transition-transform"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-white font-bold min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="text-[#caa157] hover:scale-110 transition-transform"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[#caa157]/20 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Subtotal</span>
                      <span className="text-white font-semibold">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#caa157] text-lg font-bold">Total</span>
                      <span className="text-[#caa157] text-2xl font-bold">${getTotalPrice().toFixed(2)}</span>
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
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-[#1d2956]/90 backdrop-blur-xl border-t border-[#caa157]/20 z-50">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowCart(true)}
              className="text-[#caa157] text-sm font-semibold flex items-center gap-2 hover:text-[#caa157]/80 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems()} items
            </button>
            <p className="text-white text-xl font-bold">
              ${getTotalPrice().toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-[#caa157] hover:bg-[#caa157]/90 text-[#1d2956] font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(202,161,87,0.2)] uppercase tracking-widest text-sm"
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
