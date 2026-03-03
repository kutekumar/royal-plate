import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, Clock, Users, X, Sparkles, ShoppingBag, MapPin, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  preparing:  { label: 'Preparing',  color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  ready:      { label: 'Ready',      color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  completed:  { label: 'Completed',  color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fullscreenQR, setFullscreenQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => { fetchOrders(); }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#536DFE]/30 border-t-[#536DFE] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#F5F5F7] max-w-[430px] mx-auto font-poppins">

      {/* ── Header ── */}
      <div className="bg-[#1D2956] px-6 pt-12 pb-6">
        <h1 className="text-white text-2xl font-bold tracking-wide">My Orders</h1>
        <p className="text-white/50 text-sm mt-1">Track and manage your reservations</p>

        {/* Filter Tabs */}
        <div className="flex mt-5 p-1 bg-white/10 rounded-2xl border border-white/10">
          {(['upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all capitalize ${
                filter === tab
                  ? 'bg-white text-[#1D2956] shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders List ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#1D2956]/8 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-[#1D2956]/25" />
            </div>
            <p className="text-[#1D2956] font-semibold text-base">
              {filter === 'upcoming' ? 'No upcoming orders' : 'No past orders'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'upcoming' ? 'Your active orders will appear here' : 'Completed orders will appear here'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const isDineIn = order.order_type === 'dine_in';

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                style={{ minHeight: 180 }}
              >
                {/* ── Full-color restaurant image as background ── */}
                {order.restaurants?.image_url ? (
                  <img
                    src={order.restaurants.image_url}
                    alt={order.restaurants?.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#1D2956]" />
                )}

                {/* ── Dark overlay for contrast ── */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1D2956]/90 via-[#1D2956]/50 to-[#1D2956]/20" />

                {/* ── Content ── */}
                <div className="relative z-10 p-5 flex flex-col h-full" style={{ minHeight: 180 }}>
                  {/* Top row: status + type */}
                  <div className="flex items-center justify-between mb-auto">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border backdrop-blur-sm ${status.bg} ${status.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {status.label}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border border-white/20">
                      {isDineIn ? <UtensilsCrossed className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                      {isDineIn ? 'Dine In' : 'Take Out'}
                    </span>
                  </div>

                  {/* Restaurant name */}
                  <div className="mt-8">
                    <h2 className="text-white text-xl font-bold leading-tight drop-shadow-md">
                      {order.restaurants?.name}
                    </h2>

                    {/* Order meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      {isDineIn && order.reservation_date ? (
                        <>
                          <div className="flex items-center gap-1.5 text-white/75 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(order.reservation_date)}
                          </div>
                          <div className="flex items-center gap-1.5 text-white/75 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            {order.reservation_time}
                          </div>
                          <div className="flex items-center gap-1.5 text-white/75 text-xs">
                            <Users className="w-3.5 h-3.5" />
                            {order.party_size} {order.party_size === 1 ? 'Guest' : 'Guests'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-white/75 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(order.created_at)}
                          </div>
                          <div className="flex items-center gap-1.5 text-white/75 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(order.created_at)}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom: total + view details */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-white font-bold text-lg drop-shadow">
                        ${order.total_amount?.toFixed(2)}
                      </p>
                      <button
                        className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/30 transition-all"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Order Details Dialog ── */}
      <Dialog open={!!selectedOrder && !fullscreenQR} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setFullscreenQR(false); } }}>
        <DialogContent className="max-w-[400px] max-h-[88vh] bg-white border-0 text-[#1D2956] p-0 overflow-hidden flex flex-col [&>button]:hidden rounded-3xl shadow-2xl">
          {selectedOrder && (
            <>
              {/* Dialog hero image */}
              <div className="relative h-36 flex-shrink-0 overflow-hidden">
                {selectedOrder.restaurants?.image_url ? (
                  <img src={selectedOrder.restaurants.image_url} alt={selectedOrder.restaurants?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1D2956]" />
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
                    <div className="flex items-center justify-between px-4 py-4 bg-[#1D2956]/5">
                      <span className="text-[#1D2956] font-bold">Total</span>
                      <span className="text-[#536DFE] text-xl font-bold">${selectedOrder.total_amount?.toFixed(2)}</span>
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
                            <p className="text-[#536DFE] font-bold">${(item.price * item.quantity).toFixed(2)}</p>
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
                className="w-full bg-[#1D2956] hover:bg-[#1D2956]/90 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm transition-all"
              >
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Orders;
