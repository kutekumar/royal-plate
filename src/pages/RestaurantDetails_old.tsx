import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Star, MapPin, Clock, Phone, Plus, Minus, ShoppingBag, UtensilsCrossed, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import RestaurantChatbot from '@/components/RestaurantChatbot';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  address: string;
  phone: string | null;
  image_url: string | null;
  rating: number | null;
  distance: string | null;
  open_hours: string | null;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
}

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  
  // Dine-in specific states
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [selectedTime, setSelectedTime] = useState<string>('12:00 PM');
  
  // Chatbot state
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestaurantAndMenu();
    }
  }, [id]);

  const fetchRestaurantAndMenu = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', id).single(),
        supabase.from('menu_items').select('*').eq('restaurant_id', id).eq('available', true)
      ]);

      if (restaurantRes.error) throw restaurantRes.error;
      if (menuRes.error) throw menuRes.error;

      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-background flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant not found</h2>
            <p className="text-gray-600">The restaurant you're looking for doesn't exist or has been removed.</p>
          </div>
          <Button 
            onClick={() => navigate('/home')}
            className="luxury-gradient hover:shadow-gold transition-all duration-300"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast.error('Please add items to your cart');
      return;
    }
    
    const orderDetails = {
      cart,
      restaurant,
      orderType,
      totalAmount,
      ...(orderType === 'dine_in' && {
        partySize,
        reservationDate: selectedDate,
        reservationTime: selectedTime
      })
    };
    
    navigate('/payment', { state: orderDetails });
  };

  // Generate date options (Today, Tomorrow, and next 5 days)
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    dates.push({ value: 'today', label: 'Today' });
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dates.push({ value: 'tomorrow', label: 'Tomorrow' });
    
    for (let i = 2; i <= 6; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      dates.push({ value: date.toISOString(), label: `${dayName}, ${dateStr}` });
    }
    
    return dates;
  };

  // Generate time options (11:00 AM to 10:00 PM)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 11; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayMin = min === 0 ? '00' : min;
        times.push(`${displayHour}:${displayMin} ${period}`);
      }
    }
    return times;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-background pb-24">
      {/* Enhanced Header Image with better visual hierarchy */}
      <div className="relative h-80">
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Modern back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 active-scale z-10"
        >
          <ArrowLeft className="h-6 w-6 text-gray-800" />
        </button>

        {/* Enhanced action buttons */}
        <div className="absolute top-6 right-6 flex gap-2 z-10">
          {/* View on Map button */}
          <button
            onClick={() => {
              const query = encodeURIComponent(restaurant.address || restaurant.name);
              const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 active-scale"
            title="View on Map"
          >
            <MapPin className="h-5 w-5 text-gray-800" />
          </button>
        </div>

        {/* Enhanced AI Chatbot Button */}
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="absolute bottom-6 left-6 w-16 h-16 rounded-full luxury-gradient shadow-gold flex items-center justify-center hover:scale-110 transition-all duration-300 group z-10"
        >
          <MessageCircle className="w-7 h-7 text-white group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white animate-pulse"></span>
        </button>

        {/* Restaurant name overlay */}
        <div className="absolute bottom-6 left-6 right-20 z-10">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{restaurant.name}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
              <Star className="h-4 w-4 text-gold fill-current" />
              <span className="text-sm font-semibold text-gray-900">{restaurant.rating || '4.5'}</span>
            </div>
            {restaurant.cuisine_type && (
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                <span className="text-sm font-semibold text-gray-900">{restaurant.cuisine_type}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Restaurant Info Section */}
      <div className="px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gold/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-gold" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{restaurant.rating || '4.5'}</p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-royal-blue/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-royal-blue" />
            </div>
            <p className="text-2xl font-bold text-gray-900">24/7</p>
            <p className="text-xs text-gray-500">Open Now</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-success/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-gray-900">2.5</p>
            <p className="text-xs text-gray-500">km away</p>
          </div>
        </div>

        {/* Restaurant Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                <p className="text-gray-600 leading-relaxed">{restaurant.description || 'Experience exceptional dining at our restaurant. We offer a unique culinary journey with carefully crafted dishes using the finest ingredients.'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <MapPin className="h-4 w-4 text-royal-blue" />
                <span>{restaurant.address || '123 Main Street, City'}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-royal-blue" />
                <span>{restaurant.open_hours || 'Open 24 hours'}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Phone className="h-4 w-4 text-royal-blue" />
                <span>{restaurant.phone || '+1 234 567 8900'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Order Type Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-royal-blue/10 flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-royal-blue" />
              </div>
              Select Order Type
            </h3>
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
              <TabsList className="grid w-full grid-cols-2 h-14 bg-gray-100 p-1">
                <TabsTrigger 
                  value="dine_in" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-royal-blue font-semibold transition-all duration-200"
                >
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Dine In
                </TabsTrigger>
                <TabsTrigger 
                  value="takeaway" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-royal-blue font-semibold transition-all duration-200"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Takeaway
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Dine-in specific options */}
          {orderType === 'dine_in' && (
            <div className="space-y-4 pt-2 border-t border-border">
              {/* Party Size */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Party Size</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((size) => (
                    <button
                      key={size}
                      onClick={() => setPartySize(size)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                        partySize === size
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time Selection */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Reservation Date & Time</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Date Picker - iOS Style */}
                  <div className="relative">
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-3 rounded-lg bg-muted/50 border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                      }}
                    >
                      {generateDateOptions().map((date) => (
                        <option key={date.value} value={date.value}>
                          {date.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Picker - iOS Style */}
                  <div className="relative">
                    <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-3 rounded-lg bg-muted/50 border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                      }}
                    >
                      {generateTimeOptions().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Menu Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-gold" />
              </div>
              Menu Items
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {menuItems.length} items
            </span>
          </div>
          
          {/* Enhanced Search bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for dishes..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-royal-blue focus:border-transparent transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {menuItems
            .filter((item) => {
              const value = searchTerm.toLowerCase().trim();
              if (!value) return true;
              return (
                item.name.toLowerCase().includes(value) ||
                (item.description || '').toLowerCase().includes(value)
              );
            })
            .map((item) => {
            const cartItem = cart.find(c => c.id === item.id);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="flex gap-4 p-4">
                  <button
                    type="button"
                    className="focus:outline-none flex-shrink-0"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden">
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                      />
                    </div>
                  </button>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description || ' delicious dish prepared with care'}</p>
                      {item.available && (
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span className="text-xs text-success font-medium">Available</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-lg text-royal-blue">
                        ${item.price.toFixed(2)}
                      </span>
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <button
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors active-scale"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-900">{cartItem.quantity}</span>
                          <button
                            className="w-8 h-8 rounded-full bg-royal-blue text-white flex items-center justify-center hover:bg-royal-blue/90 transition-colors active-scale"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="px-6 py-2 luxury-gradient text-white rounded-xl font-semibold shadow-gold hover:shadow-xl transition-all duration-300 active-scale flex items-center gap-2"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu Item Preview Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-sm p-0 border-0 bg-transparent shadow-none">
          {selectedItem && (
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <img
                src={selectedItem.image_url}
                alt={selectedItem.name}
                className="w-full h-[360px] object-cover"
              />
              {/* Gradient overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              {/* Content overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-2 text-white">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold leading-tight">
                    {selectedItem.name}
                  </h3>
                  <span className="text-sm font-semibold px-2 py-1 rounded-full bg-white/12 backdrop-blur">
                    {selectedItem.price.toLocaleString()} MMK
                  </span>
                </div>
                {selectedItem.description && (
                  <p className="text-xs text-white/80 line-clamp-2">
                    {selectedItem.description}
                  </p>
                )}
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      addToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Cart Summary Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4 pb-safe">
            <div>
              <div className="text-sm font-medium text-gray-500">{totalItems} {totalItems === 1 ? 'item' : 'items'}</div>
              <div className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartPreviewOpen(true)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors active-scale flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                View Cart
              </button>
              <button
                onClick={handleProceedToPayment}
                className="px-6 py-3 luxury-gradient text-white rounded-xl font-semibold shadow-gold hover:shadow-xl transition-all duration-300 active-scale flex items-center gap-2"
              >
                Checkout
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Cart Preview Modal */}
      <Dialog open={isCartPreviewOpen} onOpenChange={setIsCartPreviewOpen}>
        <DialogContent className="max-w-md p-0 border-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-royal-blue to-gold p-6 text-white">
            <DialogTitle className="text-xl font-bold">Your Order Summary</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm text-white/90">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
            </div>
          </div>
          <div className="p-6">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600">{item.quantity} x ${item.price.toFixed(2)}</span>
                            <div className="flex items-center gap-2">
                              <button
                                className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="h-3 w-3 text-gray-600" />
                              </button>
                              <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
                              <button
                                className="w-6 h-6 rounded-full bg-royal-blue text-white flex items-center justify-center hover:bg-royal-blue/90 transition-colors"
                                onClick={() => addToCart(item)}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-900">${(totalAmount * 0.9).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Tax (10%)</span>
                    <span className="font-semibold text-gray-900">${(totalAmount * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-royal-blue">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {cart.length > 0 && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsCartPreviewOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors active-scale"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    setIsCartPreviewOpen(false);
                    handleProceedToPayment();
                  }}
                  className="flex-1 px-4 py-3 luxury-gradient text-white rounded-xl font-semibold shadow-gold hover:shadow-xl transition-all duration-300 active-scale"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chatbot */}
      <RestaurantChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        restaurantName={restaurant.name}
        restaurantImage={restaurant.image_url}
      />
    </div>
  );
};

export default RestaurantDetails;
