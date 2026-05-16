import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { Calendar, Clock, Users, X, Sparkles, ShoppingBag, MapPin, UtensilsCrossed, ChefHat, CheckCircle, XCircle, Timer, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import gsap from 'gsap';
import { formatCurrency } from '@/utils/currency';
import { motion, AnimatePresence } from 'framer-motion';


const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; gradient: string }> = {
  pending:    { label: 'Pending',    color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200', icon: Timer, gradient: 'from-amber-400 to-amber-500' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200', icon: CheckCircle, gradient: 'from-blue-400 to-blue-500' },
  preparing:  { label: 'Preparing',  color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: ChefHat, gradient: 'from-purple-400 to-purple-500' },
  ready:      { label: 'Ready',      color: 'text-green-600',  bg: 'bg-green-50 border-green-200', icon: Package, gradient: 'from-green-400 to-green-500' },
  completed:  { label: 'Completed',  color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200', icon: CheckCircle, gradient: 'from-gray-400 to-gray-500' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-500',    bg: 'bg-red-50 border-red-200', icon: XCircle, gradient: 'from-red-400 to-red-500' },
};

const Orders = () => {
  const { user } = useAuth();
  const { play } = useSoundContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fullscreenQR, setFullscreenQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const headerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurants(name, image_url, address)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Entrance animations
  useEffect(() => {
    if (orders.length === 0 && !loading) return;
    
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    tl.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 }
    )
    .fromTo(
      filterRef.current,
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4 },
      '-=0.2'
    );
  }, []);

  // List animation
  useEffect(() => {
    if (listRef.current && !loading) {
      gsap.fromTo(
        listRef.current.children,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [orders, filter, loading]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const filteredOrders = orders.filter(o =>
    filter === 'upcoming'
      ? o.status !== 'completed' && o.status !== 'cancelled'
      : o.status === 'completed' || o.status === 'cancelled'
  );

  const upcomingCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const pastCount = orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length;

  if (loading) {
    return null;
  }

  return (
    <>
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">

      {/* ── Premium Header ── */}
      <div ref={headerRef} className="relative px-5 pt-8 pb-4 z-10">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-[#1D2956] text-2xl font-bold tracking-tight leading-none mb-1">My Orders</h1>
            <p className="text-gray-400 text-[11px] uppercase tracking-[0.3em] font-medium">Track your reservations</p>
          </div>
          <div className="flex items-center gap-2.5 bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 rounded-2xl px-4 py-2.5 border border-[#536DFE]/20 shadow-lg">
            <ShoppingBag className="w-4.5 h-4.5 text-[#536DFE]" />
            <span className="text-[#536DFE] text-sm font-bold">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* ── Premium Filter Tabs ── */}
      <div ref={filterRef} className="px-5 pb-5 z-10">
        <div className="flex p-1.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 shadow-inner">
          {(['upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { play('tap'); setFilter(tab); }}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${
                filter === tab
                  ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-xl shadow-[#536DFE]/40 scale-105'
                  : 'text-gray-500 hover:text-[#1D2956] hover:bg-white/50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab === 'upcoming' ? 'Active' : 'History'}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filter === tab
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab === 'upcoming' ? upcomingCount : pastCount}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Premium Orders List ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center mb-6 shadow-xl shadow-black/5">
              <ShoppingBag className="w-12 h-12 text-[#536DFE]/40" />
            </div>
            <p className="text-[#1D2956] font-bold text-lg mb-2">
              {filter === 'upcoming' ? 'No Active Orders' : 'No Order History'}
            </p>
            <p className="text-gray-400 text-sm max-w-[220px] leading-relaxed">
              {filter === 'upcoming'
                ? 'Your upcoming reservations will appear here'
                : 'Completed orders will show up here'}
            </p>
          </div>
        ) : (
          <div ref={listRef} className="space-y-4">
            {filteredOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const isDineIn = order.order_type === 'dine_in';
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  onClick={() => { play('tap'); setSelectedOrder(order); }}
                  className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-[#536DFE]/20 transition-all duration-500 active:scale-[0.98] border border-white/60"
                >
                  {/* ── Background Image with Brand Filter ── */}
                  <div className="relative h-48 brand-image-filter brand-shimmer">
                    {order.restaurants?.image_url ? (
                      <img
                        src={order.restaurants.image_url}
                        alt={order.restaurants?.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brand-image-fade"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1D2956] to-[#536DFE]/80" />
                    )}

                    {/* ── Enhanced Gradient Overlay ── */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1D2956]/95 via-[#1D2956]/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#536DFE]/15 to-transparent" />

                    {/* ── Top Row: Status + Type ── */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.2, duration: 0.3 }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r ${status.gradient} text-white text-[10px] font-bold uppercase tracking-wider shadow-xl border border-white/30`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.3, duration: 0.3 }}
                        className="flex items-center gap-2 bg-white/20 backdrop-blur-xl text-white text-[10px] font-bold uppercase tracking-wide px-3.5 py-2 rounded-full border border-white/30 shadow-lg"
                      >
                        {isDineIn ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                        {isDineIn ? 'Dine In' : 'Take Out'}
                      </motion.div>
                    </div>

                    {/* ── Bottom Content ── */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white text-xl font-bold leading-tight drop-shadow-lg mb-2">
                        {order.restaurants?.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs mb-3.5">
                        {isDineIn && order.reservation_date ? (
                          <>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(order.reservation_date)}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {order.reservation_time}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Users className="w-3.5 h-3.5" />
                              {order.party_size} {order.party_size === 1 ? 'guest' : 'guests'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(order.created_at)}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(order.created_at)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-white font-bold text-2xl drop-shadow-lg">
                          {formatCurrency(order.total_amount)}
                        </p>
                        <div className="flex items-center gap-2.5 bg-white/25 backdrop-blur-xl rounded-full px-4 py-2 border border-white/30 group-hover:bg-white/35 transition-all shadow-lg">
                          <span className="text-white text-xs font-bold uppercase tracking-wider">View Details</span>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>

      <AnimatePresence>
        {selectedOrder && !fullscreenQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => { setSelectedOrder(null); setFullscreenQR(false); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col"
              style={{ maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="px-6 pb-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-[#1D2956] text-lg font-bold">{selectedOrder.restaurants?.name}</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => { setSelectedOrder(null); setFullscreenQR(false); }} className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all active:scale-90">
                  <X className="w-4.5 h-4.5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                <div className="mb-5">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 rounded-3xl p-5">
                    <button type="button" className="w-full" onClick={() => { play('tap'); setFullscreenQR(true); }}>
                      <QRCodeSVG value={selectedOrder.qr_code} size={240} level="H" includeMargin className="w-full h-auto" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-[11px] text-center mt-2 font-medium">Tap QR to enlarge · Show to staff</p>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${(statusConfig[selectedOrder.status] || statusConfig.pending).bg}`}>
                    {(statusConfig[selectedOrder.status] || statusConfig.pending).label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D2956]/5 text-[#1D2956] text-xs font-bold">
                    {selectedOrder.order_type === 'dine_in' ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                    {selectedOrder.order_type === 'dine_in' ? 'Dine In' : 'Take Out'}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {selectedOrder.order_type === 'dine_in' && selectedOrder.reservation_date && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-2xl p-3 text-center"><Calendar className="w-4 h-4 text-[#536DFE] mx-auto mb-1" /><p className="text-[10px] text-gray-400 font-medium">Date</p><p className="text-[#1D2956] text-xs font-bold">{formatDate(selectedOrder.reservation_date)}</p></div>
                      <div className="bg-gray-50 rounded-2xl p-3 text-center"><Clock className="w-4 h-4 text-[#536DFE] mx-auto mb-1" /><p className="text-[10px] text-gray-400 font-medium">Time</p><p className="text-[#1D2956] text-xs font-bold">{selectedOrder.reservation_time}</p></div>
                      <div className="bg-gray-50 rounded-2xl p-3 text-center"><Users className="w-4 h-4 text-[#536DFE] mx-auto mb-1" /><p className="text-[10px] text-gray-400 font-medium">Party</p><p className="text-[#1D2956] text-xs font-bold">{selectedOrder.party_size}</p></div>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
                    <div className="flex items-center justify-between px-4 py-3"><span className="text-gray-400 text-xs">Payment</span><span className="text-[#1D2956] text-xs font-bold uppercase">{selectedOrder.payment_method}</span></div>
                    <div className="flex items-center justify-between px-4 py-4"><span className="text-[#1D2956] text-sm font-bold">Total</span><span className="text-[#536DFE] text-xl font-bold">{formatCurrency(selectedOrder.total_amount)}</span></div>
                  </div>
                </div>
                {selectedOrder.order_items?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-[#1D2956] text-xs font-bold uppercase tracking-wider mb-2">Items</h4>
                    <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
                      {selectedOrder.order_items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3">
                          <div className="flex-1 min-w-0"><p className="text-[#1D2956] text-xs font-semibold truncate">{item.name}</p><p className="text-gray-400 text-[10px]">×{item.quantity}</p></div>
                          <p className="text-[#536DFE] text-xs font-bold flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedOrder.restaurants?.address && (
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
                    <MapPin className="w-4 h-4 text-[#536DFE] mt-0.5 shrink-0" />
                    <p className="text-gray-500 text-xs leading-relaxed">{selectedOrder.restaurants.address}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && fullscreenQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center"
            onClick={() => setFullscreenQR(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] flex flex-col items-center p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Scan to verify</p>
                <p className="text-[#1D2956] text-lg font-bold mt-1">{selectedOrder.restaurants?.name}</p>
                <p className="text-gray-400 text-[11px] font-mono mt-1">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border-2 border-gray-200 shadow-lg w-full max-w-[260px]">
                <QRCodeSVG value={selectedOrder.qr_code} size={260} level="H" includeMargin={false} className="w-full h-auto" />
              </div>
              <p className="text-gray-400 text-xs text-center mt-5 leading-relaxed max-w-[220px]">Present this code at the restaurant for order verification</p>
              <button onClick={() => setFullscreenQR(false)} className="w-full mt-6 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] hover:shadow-2xl hover:shadow-[#536DFE]/50 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm transition-all shadow-xl shadow-[#536DFE]/40 active:scale-[0.98]">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Orders;
