import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, Clock, Users, X, Sparkles, ShoppingBag, MapPin, UtensilsCrossed, ChefHat, CheckCircle, XCircle, Timer, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import gsap from 'gsap';
import { formatCurrency } from '@/utils/currency';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; gradient: string }> = {
  pending:    { label: 'Pending',    color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200', icon: Timer, gradient: 'from-amber-400 to-amber-500' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200', icon: CheckCircle, gradient: 'from-blue-400 to-blue-500' },
  preparing:  { label: 'Preparing',  color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: ChefHat, gradient: 'from-purple-400 to-purple-500' },
  ready:      { label: 'Ready',      color: 'text-green-600',  bg: 'bg-green-50 border-green-200', icon: Package, gradient: 'from-green-400 to-green-500' },
  completed:  { label: 'Completed',  color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200', icon: CheckCircle, gradient: 'from-gray-400 to-gray-500' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-500',    bg: 'bg-red-50 border-red-200', icon: XCircle, gradient: 'from-red-400 to-red-500' },
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fullscreenQR, setFullscreenQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchOrders(); }, []);

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

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please sign in to view your orders'); setLoading(false); return; }
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
  };

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
    return (
      <>
        <BrandLoader isLoading={true} />
      </>
    );
  }

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <PageTransition>
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">

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
              onClick={() => setFilter(tab)}
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
                  onClick={() => setSelectedOrder(order)}
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

      {/* ── Order Details Dialog ── */}
      <Dialog open={!!selectedOrder && !fullscreenQR} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setFullscreenQR(false); } }}>
        <DialogContent className="max-w-[400px] max-h-[88vh] bg-white border-0 text-[#1D2956] p-0 overflow-hidden flex flex-col [&>button]:hidden rounded-3xl shadow-2xl">
          {selectedOrder && (
            <>
              {/* Dialog hero image */}
              <div className="relative h-40 flex-shrink-0 overflow-hidden">
                {selectedOrder.restaurants?.image_url ? (
                  <img src={selectedOrder.restaurants.image_url} alt={selectedOrder.restaurants?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1D2956] to-[#536DFE]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1D2956]/80 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-white/70" />
                      <span className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Order Details</span>
                    </div>
                    <h2 className="text-white text-lg font-bold">{selectedOrder.restaurants?.name}</h2>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/30 transition-all">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                {/* QR Code */}
                <div className="p-5 border-b border-gray-100">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <button type="button" className="w-full" onClick={() => setFullscreenQR(true)}>
                      <QRCodeSVG value={selectedOrder.qr_code} size={220} level="H" includeMargin className="w-full h-auto" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-[11px] text-center mt-2">Tap to enlarge · Show to restaurant staff</p>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  {/* Order type badge */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 bg-[#1D2956] text-white text-xs font-bold px-4 py-2 rounded-full">
                      {selectedOrder.order_type === 'dine_in' ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                      {selectedOrder.order_type === 'dine_in' ? 'Dine In' : 'Take Out'}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${(statusConfig[selectedOrder.status] || statusConfig.pending).bg} ${(statusConfig[selectedOrder.status] || statusConfig.pending).color}`}>
                      {(statusConfig[selectedOrder.status] || statusConfig.pending).label}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-400 font-medium">Order ID</span>
                      <span className="text-[#1D2956] font-mono font-bold">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    {selectedOrder.order_type === 'dine_in' && selectedOrder.reservation_date && (
                      <>
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-gray-400 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#536DFE]" /> Date</span>
                          <span className="text-[#1D2956] font-semibold">{formatDate(selectedOrder.reservation_date)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-gray-400 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#536DFE]" /> Time</span>
                          <span className="text-[#1D2956] font-semibold">{selectedOrder.reservation_time}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-gray-400 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-[#536DFE]" /> Party</span>
                          <span className="text-[#1D2956] font-semibold">{selectedOrder.party_size} {selectedOrder.party_size === 1 ? 'Guest' : 'Guests'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-400 font-medium">Payment</span>
                      <span className="text-[#1D2956] font-semibold uppercase">{selectedOrder.payment_method}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-4 bg-[#536DFE]/5">
                      <span className="text-[#1D2956] font-bold">Total</span>
                      <span className="text-[#536DFE] text-xl font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  {selectedOrder.order_items?.length > 0 && (
                    <div>
                      <h4 className="text-[#1D2956] text-xs font-bold uppercase tracking-wider mb-2">Items Ordered</h4>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                        {selectedOrder.order_items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                            <div>
                              <p className="text-[#1D2956] font-semibold">{item.name}</p>
                              <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-[#536DFE] font-bold">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {selectedOrder.restaurants?.address && (
                    <div className="flex items-start gap-3 bg-[#536DFE]/5 border border-[#536DFE]/15 rounded-2xl p-4 text-sm">
                      <MapPin className="w-4 h-4 text-[#536DFE] mt-0.5 shrink-0" />
                      <p className="text-gray-500 leading-relaxed">{selectedOrder.restaurants.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Fullscreen QR ── */}
      <Dialog open={!!selectedOrder && fullscreenQR} onOpenChange={(open) => { if (!open) setFullscreenQR(false); }}>
        <DialogContent className="max-w-sm w-full bg-white border-0 p-6 flex flex-col items-center justify-center rounded-3xl shadow-2xl">
          {selectedOrder && (
            <div className="w-full flex flex-col items-center gap-4">
              <p className="text-gray-400 text-xs text-center">Show this QR code to the restaurant staff</p>
              <div className="bg-gray-50 rounded-2xl p-4 w-full flex justify-center border border-gray-200">
                <QRCodeSVG value={selectedOrder.qr_code} size={280} level="H" includeMargin={false} />
              </div>
              <button
                onClick={() => setFullscreenQR(false)}
                className="w-full bg-[#536DFE] hover:bg-[#536DFE]/90 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm transition-all shadow-md shadow-[#536DFE]/30"
              >
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
      </PageTransition>
    </>
  );
};

export default Orders;
