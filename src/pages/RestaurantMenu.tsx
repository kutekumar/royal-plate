import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSoundContext } from '@/contexts/SoundContext';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Check,
  Star,
  Gem,
  Crown,
  Flame,
  UtensilsCrossed,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { motion, AnimatePresence } from 'framer-motion';

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

const CART_STORAGE_KEY = 'royal-plate-cart';

const RestaurantMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { play } = useSoundContext();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [instructionText, setInstructionText] = useState('');
  const [showInstructionsFor, setShowInstructionsFor] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const menuItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load cart from localStorage
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

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ restaurantId: id, items: cart }));
    } catch {}
  }, [cart, id]);

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchMenu();
    }
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setRestaurant(data);
    } catch {
      toast.error('Failed to load restaurant');
    }
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id);
      if (error) throw error;
      setMenuItems((data || []).filter(item => item.is_available !== false));
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = useMemo(() => {
    return ['all', ...new Set(menuItems.map(item => item.category))].filter(Boolean);
  }, [menuItems]);

  const filteredByCategory = useMemo(() => {
    if (activeCategory === 'all') return filteredMenuItems;
    return filteredMenuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, filteredMenuItems]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return filteredMenuItems.length;
    return filteredMenuItems.filter(item => item.category === cat).length;
  };

  const addToCart = useCallback((item: MenuItem) => {
    play('addToCart');
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1, specialInstructions: '' }];
    });
    toast.success(`${item.name} added`, { duration: 1200 });
    if (id) {
      try {
        const raw = localStorage.getItem('royal-plate-ordered-items');
        const data = raw ? JSON.parse(raw) as Record<string, string[]> : {};
        if (!data[id]) data[id] = [];
        if (!data[id].includes(item.id)) data[id].push(item.id);
        localStorage.setItem('royal-plate-ordered-items', JSON.stringify(data));
      } catch {}
    }
  }, [play, id]);

  const removeFromCart = useCallback((itemId: string) => {
    play('removeFromCart');
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.id !== itemId);
    });
  }, [play]);

  const updateItemInstructions = useCallback((itemId: string, instructions: string) => {
    setCart(prev => prev.map(item =>
      item.id === itemId ? { ...item, specialInstructions: instructions } : item
    ));
  }, []);

  const getTotalPrice = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      play('error');
      toast.error('Cart is empty');
      return;
    }
    play('checkout');
    navigate('/payment', {
      state: {
        restaurant,
        cart,
        orderType: 'dine_in',
        partySize: 2,
        totalAmount: getTotalPrice(),
      },
    });
  };

  const suggestedItems = useMemo(() => {
    if (cart.length === 0 || menuItems.length === 0) return [];
    const cartIds = new Set(cart.map(item => item.id));
    const cartCats = new Set(cart.map(item => item.category));
    return menuItems
      .filter(item => !cartIds.has(item.id) && cartCats.has(item.category))
      .slice(0, 3);
  }, [cart, menuItems]);

  const todaysSpecialId = useMemo(() => {
    const nonBeverage = menuItems.filter(i => i.category !== 'Beverages' && i.category !== 'Appetizers');
    if (nonBeverage.length === 0) return null;
    const stored = sessionStorage.getItem(`menu-special-${id}`);
    if (stored) return stored;
    const pick = nonBeverage[Math.floor(Math.random() * nonBeverage.length)].id;
    sessionStorage.setItem(`menu-special-${id}`, pick);
    return pick;
  }, [menuItems, id]);

  const orderedBeforeIds = useMemo(() => {
    try {
      const raw = localStorage.getItem('royal-plate-ordered-items');
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string[]>;
        return data[id || ''] || [];
      }
    } catch {}
    return [];
  }, [id]);

  const scrollToCategory = (cat: string) => {
    play('select');
    setActiveCategory(cat);
    if (cat === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = categoryRefs.current[cat];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#536DFE]/20 border-t-[#536DFE] rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Preparing the menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <p className="text-gray-400">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] max-w-[430px] mx-auto overflow-x-hidden font-poppins">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <button
            onClick={() => { play('tap'); navigate(-1); }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center hover:from-[#536DFE]/10 hover:to-[#6B7FFF]/10 transition-all shadow-md flex-shrink-0"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-[#1D2956]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[#1D2956] text-base font-bold truncate">{restaurant.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="text-gray-400 text-[10px] font-semibold">{restaurant.rating}</span>
              </div>
              {restaurant.cuisine_type && (
                <>
                  <span className="text-gray-300 text-[10px]">·</span>
                  <span className="text-gray-400 text-[10px] font-medium">{restaurant.cuisine_type}</span>
                </>
              )}
              <span className="text-gray-300 text-[10px]">·</span>
              <span className="text-emerald-500 text-[10px] font-bold">Open</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/restaurant/${id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-[#1D2956] text-[10px] font-bold hover:border-[#536DFE]/30 hover:shadow-md transition-all"
          >
            <MapPin className="w-3 h-3" />
            Info
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 group-focus-within:text-[#536DFE] transition-colors" />
            <input
              type="text"
              placeholder="Search this menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] border border-gray-100 text-[#1D2956] text-xs placeholder-gray-400 focus:outline-none focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Category Chips */}
        {categories.length > 1 && (
          <div className="px-5 pb-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className={`category-chip flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    activeCategory === cat
                      ? 'category-chip-active'
                      : 'bg-white border border-gray-200 text-gray-500 hover:text-[#1D2956] hover:border-[#536DFE]/40 shadow-sm'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                  <span className={`ml-1 text-[9px] ${activeCategory === cat ? 'text-white/70' : 'text-gray-400'}`}>
                    ({getCategoryCount(cat)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Menu Content ── */}
      <div className="flex-1 px-5 pt-4 pb-36">
        {filteredByCategory.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-semibold">No items found</p>
            <p className="text-gray-300 text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          <>
            {/* Grouped by category when "All" is selected */}
            {activeCategory === 'all' ? (
              categories.filter(c => c !== 'all').map(category => {
                const items = filteredMenuItems.filter(i => i.category === category);
                if (items.length === 0) return null;
                return (
                  <div key={category} ref={(el) => { categoryRefs.current[category] = el; }}>
                    <div className="flex items-center gap-3 mb-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                        <h3 className="text-[#1D2956] text-sm font-bold">{category}</h3>
                      </div>
                      <span className="text-gray-300 text-[10px] font-medium">{items.length} items</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-100 to-transparent" />
                    </div>
                    <div className="space-y-3 mb-8">
                      {items.map((item, index) => renderMenuItem(item, index))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-3">
                {filteredByCategory.map((item, index) => renderMenuItem(item, index))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Fixed Bottom Checkout Bar ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-5 bg-white/95 backdrop-blur-xl border-t border-[#536DFE]/20 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => { play('tap'); setShowCart(true); }}
              className="text-[#536DFE] text-sm font-bold flex items-center gap-2.5 hover:text-[#6B7FFF] transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center shadow-md">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-md shadow-[#536DFE]/40">
                  <span className="text-white text-[9px] font-bold">{getTotalItems()}</span>
                </div>
              </div>
              <span>View Cart</span>
            </button>
            <p className="text-[#1D2956] text-xl font-bold">
              {formatCurrency(getTotalPrice())}
            </p>
          </div>
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] hover:shadow-2xl hover:shadow-[#536DFE]/60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-[#536DFE]/50 uppercase tracking-widest text-sm"
          >
            <Check className="w-5 h-5" />
            Secure Checkout
          </button>
        </div>
      )}

      {/* ── Item Detail Modal ── */}
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
              <div className="relative w-full h-72 overflow-hidden brand-menu-filter">
                <img src={selectedMenuItem.image_url} alt={selectedMenuItem.name} className="w-full h-full object-cover brand-image-fade" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/10 to-transparent" />
                <button onClick={() => { play('tap'); setSelectedMenuItem(null); }} className="absolute top-5 right-5 w-11 h-11 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/50 flex items-center justify-center hover:bg-white/50 hover:scale-105 transition-all shadow-xl">
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
                  <h2 className="text-[#1D2956] text-2xl font-bold leading-tight drop-shadow-lg mb-2">{selectedMenuItem.name}</h2>
                  <p className="text-[#536DFE] text-xl font-bold drop-shadow-lg">{formatCurrency(selectedMenuItem.price)}</p>
                </div>
              </div>
              <div className="px-6 pt-5 pb-1">
                <p className="text-gray-500 text-sm leading-relaxed">
                  {selectedMenuItem.description || 'A delicious dish prepared with the finest ingredients.'}
                </p>
              </div>
              <div className="px-6 pb-3">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Special Instructions</p>
                <textarea
                  placeholder="Any modifications, allergies, or preferences..."
                  rows={2}
                  value={instructionText || cart.find(c => c.id === selectedMenuItem.id)?.specialInstructions || ''}
                  onChange={(e) => setInstructionText(e.target.value)}
                  onBlur={() => { if (instructionText) updateItemInstructions(selectedMenuItem.id, instructionText); }}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-[#1D2956] text-xs placeholder-gray-300 focus:outline-none focus:border-[#536DFE]/40 focus:ring-2 focus:ring-[#536DFE]/10 transition-all resize-none"
                />
              </div>
              <div className="px-6 pt-2 pb-8">
                {(() => {
                  const cartItem = cart.find(c => c.id === selectedMenuItem.id);
                  const qty = cartItem?.quantity || 0;
                  return qty > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-5 bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 border border-[#536DFE]/30 rounded-2xl px-8 py-5 flex-1 justify-between shadow-lg">
                          <button onClick={() => removeFromCart(selectedMenuItem.id)} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                            <Minus className="w-6 h-6" />
                          </button>
                          <motion.span key={qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-[#1D2956] font-bold text-2xl">{qty}</motion.span>
                          <button onClick={() => addToCart(selectedMenuItem)} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                        <button onClick={() => { play('tap'); setSelectedMenuItem(null); }} className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white font-bold px-8 py-5 rounded-2xl text-sm uppercase tracking-wider hover:shadow-2xl hover:shadow-[#536DFE]/60 transition-all active:scale-95 shadow-xl shadow-[#536DFE]/40">Done</button>
                      </div>
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

      {/* ── Cart Modal ── */}
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
                  <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-medium mt-0.5">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
                </div>
                <button onClick={() => { play('tap'); setShowCart(false); }} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-[#536DFE]/10 hover:to-[#6B7FFF]/10 transition-all shadow-md">
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
                    {cart.map(item => (
                      <div key={item.id} className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg overflow-hidden">
                        <div className="flex items-center gap-4 p-4">
                          <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-xl object-cover border border-[#536DFE]/20 shadow-md" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[#1D2956] font-bold text-sm truncate">{item.name}</h4>
                            <p className="text-gray-400 text-[11px] mt-0.5">{formatCurrency(item.price)} each</p>
                            <p className="text-[#536DFE] font-bold text-sm mt-1">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] rounded-xl px-3 py-2 shadow-inner">
                            <button onClick={() => removeFromCart(item.id)} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                              <Minus className="w-4.5 h-4.5" />
                            </button>
                            <motion.span key={item.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-[#1D2956] font-bold min-w-[24px] text-center">{item.quantity}</motion.span>
                            <button onClick={() => addToCart(item)} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                              <Plus className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                        {item.specialInstructions && (
                          <div className="px-4 pb-3 pt-0">
                            <div className="flex items-start gap-2 bg-[#536DFE]/5 rounded-xl px-3 py-2">
                              <span className="text-[#536DFE] text-[10px] font-bold uppercase tracking-wider flex-shrink-0">Note:</span>
                              <p className="text-gray-500 text-[11px]">{item.specialInstructions}</p>
                            </div>
                          </div>
                        )}
                        <button onClick={() => { setShowInstructionsFor(item.id); setInstructionText(item.specialInstructions || ''); }} className="w-full text-left px-4 pb-3 pt-0">
                          <span className="text-[#536DFE] text-[10px] font-semibold">+ Add special instructions</span>
                        </button>
                      </div>
                    ))}

                    {showInstructionsFor && (
                      <div className="fixed inset-0 bg-black/60 z-20 flex items-center justify-center p-6" onClick={() => setShowInstructionsFor(null)}>
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                          <h4 className="text-[#1D2956] font-bold text-sm mb-3">Special Instructions</h4>
                          <textarea autoFocus placeholder="Any modifications, allergies, or preferences..." rows={3}
                            value={instructionText}
                            onChange={(e) => setInstructionText(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] border border-gray-100 text-[#1D2956] text-sm placeholder-gray-400 focus:outline-none focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 transition-all resize-none"
                          />
                          <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowInstructionsFor(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={() => { if (showInstructionsFor) updateItemInstructions(showInstructionsFor, instructionText); setShowInstructionsFor(null); play('tap'); }} className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white font-bold text-sm shadow-lg shadow-[#536DFE]/40 hover:shadow-xl transition-all">Save</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {suggestedItems.length > 0 && (
                      <div className="bg-gradient-to-br from-[#F59E0B]/5 to-[#D97706]/5 rounded-2xl p-4 border border-[#F59E0B]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Gem className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <p className="text-[#F59E0B] text-[11px] font-bold uppercase tracking-[0.2em]">You might also like</p>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                          {suggestedItems.map(suggestion => (
                            <button key={suggestion.id} onClick={() => addToCart(suggestion)} className="flex-shrink-0 flex items-center gap-2 bg-white/90 rounded-xl px-3 py-2 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#536DFE]/30 transition-all">
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
                        <motion.span key={getTotalPrice()} initial={{ scale: 1.1, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} className="text-[#536DFE] text-2xl font-bold">
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

    </div>
  );

  function renderMenuItem(item: MenuItem, index: number) {
    const cartItem = cart.find(c => c.id === item.id);
    const quantity = cartItem?.quantity || 0;
    const isPopular = index < 3 && item.category !== 'Beverages';
    const isTodaysSpecial = item.id === todaysSpecialId;
    const wasOrderedBefore = orderedBeforeIds.includes(item.id);
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
        ref={(el) => { menuItemRefs.current[item.id] = el; }}
        className={`flex gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer group active:scale-[0.99] ${
          isTodaysSpecial
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 shadow-lg shadow-amber-200/40 hover:shadow-xl'
            : 'bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] border border-transparent hover:border-[#536DFE]/20 shadow-md hover:shadow-xl'
        }`}
        onClick={() => { play('tap'); setSelectedMenuItem(item); }}
      >
        <div className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-white/60 brand-menu-filter brand-shimmer ${
          isTodaysSpecial ? 'ring-2 ring-amber-400/60' : ''
        }`}>
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brand-image-fade" />
          {isPopular && (
            <div className="absolute top-1 left-1 chef-badge text-[8px] px-1.5 py-0.5 z-10">
              <Crown className="w-2.5 h-2.5 inline mr-0.5" />Popular
            </div>
          )}
          {isTodaysSpecial && (
            <div className="absolute top-1 right-1 z-10">
              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[7px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-lg border border-white/30 animate-streak-fire">
                <Gem className="w-2 h-2" />
                Special
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[#1D2956] font-bold text-sm truncate group-hover:text-[#536DFE] transition-colors">{item.name}</h4>
            {isPopular && <span className="chef-badge flex-shrink-0"><Crown className="w-2.5 h-2.5 inline mr-0.5" />Chef's Pick</span>}
            {wasOrderedBefore && !isPopular && (
              <span className="text-[8px] text-[#536DFE] font-bold bg-[#536DFE]/10 px-2 py-0.5 rounded-full border border-[#536DFE]/20 flex-shrink-0">❤️</span>
            )}
          </div>
          <p className="text-gray-400 text-[11px] line-clamp-2 mb-2.5 leading-relaxed">{item.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[#536DFE] font-bold text-base">{formatCurrency(item.price)}</p>
              {item.category === 'Appetizers' && (
                <span className="dietary-icon text-emerald-500 border-emerald-300" title="Vegetarian">V</span>
              )}
              {item.name.toLowerCase().includes('spicy') && (
                <Flame className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>
            {quantity > 0 ? (
              <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-1.5 border border-[#536DFE]/30 shadow-lg shadow-[#536DFE]/20" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                  <Minus className="w-4 h-4" />
                </button>
                <motion.span key={quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-[#1D2956] font-bold text-sm min-w-[20px] text-center">{quantity}</motion.span>
                <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="text-[#536DFE] hover:scale-110 transition-transform active:scale-95">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-[#536DFE]/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
};

export default RestaurantMenu;
