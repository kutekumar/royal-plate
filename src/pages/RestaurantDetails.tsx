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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Restaurant not found</h2>
          <Button onClick={() => navigate('/home')}>Back to Home</Button>
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header Image with View on Map overlay */}
      <div className="relative h-64">
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-black/50 text-white hover:bg-black/70"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* View on Map: opens Google Maps search in new tab using address/name */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 bg-black/65 text-white hover:bg-black/80 border-none px-3 py-1 text-xs rounded-full"
          onClick={() => {
            const query = encodeURIComponent(restaurant.address || restaurant.name);
            const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
        >
          View on Map
        </Button>

        {/* AI Chatbot Button */}
        <Button
          size="icon"
          className="absolute bottom-4 left-4 w-14 h-14 rounded-full luxury-gradient shadow-2xl hover:scale-110 transition-all duration-300 group"
          onClick={() => setIsChatbotOpen(true)}
        >
          <MessageCircle className="w-6 h-6 text-white group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </Button>
      </div>

      {/* Restaurant Info */}
      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{restaurant.name}</h1>
              <p className="text-muted-foreground">{restaurant.description}</p>
            </div>
            <Badge className="bg-primary text-primary-foreground border-0">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {restaurant.rating}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {restaurant.address}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {restaurant.open_hours}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {restaurant.phone}
            </div>
          </div>
        </div>

        {/* Order Type Selection */}
        <Card className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Order Type</h3>
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dine_in">
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Dine In
                </TabsTrigger>
                <TabsTrigger value="takeaway">
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
        </Card>

        {/* Menu */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Menu</h2>
          {/* Search bar for filtering menu items */}
          <div className="mt-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search menu items..."
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
              <Card key={item.id} className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  <button
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setSelectedItem(item)}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 rounded-lg object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </button>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">
                        {item.price.toLocaleString()} MMK
                      </span>
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
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
                    className="luxury-gradient px-5 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all"
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

      {/* Cart Summary Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">{totalItems} items</div>
              <div className="text-lg font-bold">{totalAmount.toLocaleString()} MMK</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsCartPreviewOpen(true)}
              >
                View Orders
              </Button>
              <Button
                onClick={handleProceedToPayment}
                className="luxury-gradient"
                size="lg"
              >
                Pay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Preview Modal */}
      <Dialog open={isCartPreviewOpen} onOpenChange={setIsCartPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Order Summary</DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No items in your cart.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity} x {item.price.toLocaleString()} MMK
                      </span>
                    </div>
                    <span className="font-semibold">
                      {(item.price * item.quantity).toLocaleString()} MMK
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Total ({totalItems} items)
                </span>
                <span className="text-lg font-bold text-primary">
                  {totalAmount.toLocaleString()} MMK
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chatbot */}
      <RestaurantChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        restaurantName={restaurant.name}
        restaurantImage={restaurant.image}
      />
    </div>
  );
};

export default RestaurantDetails;
