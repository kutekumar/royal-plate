import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, Clock, Users, X, Sparkles, ShoppingBag, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fullscreenQR, setFullscreenQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to view your orders');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (
            name,
            image_url,
            address
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      }

      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getFilteredOrders = () => {
    const now = new Date();
    if (filter === 'upcoming') {
      return orders.filter(order => 
        order.status !== 'completed' && order.status !== 'cancelled'
      );
    } else {
      return orders.filter(order => 
        order.status === 'completed' || order.status === 'cancelled'
      );
    }
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1d2956] flex items-center justify-center">
        <div className="text-[#caa157] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#1d2956] max-w-[430px] mx-auto">
      {/* Header */}
      <header className="px-6 py-6 flex flex-col items-center border-b border-[#caa157]/10">
        <h1 className="text-[#caa157] text-xl font-semibold tracking-wide">My Orders</h1>
      </header>

      {/* Filter Tabs */}
      <div className="px-6 py-6">
        <div className="flex p-1 bg-[#caa157]/5 rounded-full border border-[#caa157]/20">
          <button
            onClick={() => setFilter('upcoming')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              filter === 'upcoming'
                ? 'bg-[#caa157] text-[#1d2956] shadow-lg'
                : 'text-[#caa157]/60 hover:text-[#caa157]'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              filter === 'past'
                ? 'bg-[#caa157] text-[#1d2956] shadow-lg'
                : 'text-[#caa157]/60 hover:text-[#caa157]'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-[#caa157]/30 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {filter === 'upcoming' ? 'No upcoming orders' : 'No past orders'}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {filter === 'upcoming' 
                ? 'Your active orders will appear here'
                : 'Your completed orders will appear here'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer transition-all hover:border-[#caa157]/60 ${
                filter === 'upcoming'
                  ? 'border-[#caa157]/40 bg-white/5'
                  : 'border-[#caa157]/20 bg-white/[0.02] opacity-80'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-[#caa157] text-lg font-bold leading-tight">
                    {order.restaurants?.name}
                  </h2>
                  <div className="flex flex-col gap-1 mt-2">
                    {order.order_type === 'dine_in' && order.reservation_date ? (
                      <>
                        <div className="flex items-center gap-2 text-[#caa157]/70 text-xs font-light tracking-wide">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.reservation_date)}
                        </div>
                        <div className="flex items-center gap-2 text-[#caa157]/70 text-xs font-light tracking-wide">
                          <Clock className="w-4 h-4" />
                          {order.reservation_time}
                        </div>
                        <div className="flex items-center gap-2 text-[#caa157]/70 text-xs font-light tracking-wide">
                          <Users className="w-4 h-4" />
                          {order.party_size} {order.party_size === 1 ? 'Guest' : 'Guests'}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[#caa157]/70 text-xs font-light tracking-wide">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center gap-2 text-[#caa157]/70 text-xs font-light tracking-wide">
                          <Clock className="w-4 h-4" />
                          {formatTime(order.created_at)}
                        </div>
                        <div className="flex items-center gap-2 text-[#caa157]/70 text-xs font-light tracking-wide">
                          <ShoppingBag className="w-4 h-4" />
                          Take Out
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-16 w-16 rounded-lg overflow-hidden border border-[#caa157]/20">
                  <img
                    alt={order.restaurants?.name}
                    className="h-full w-full object-cover grayscale opacity-80"
                    src={order.restaurants?.image_url}
                  />
                </div>
              </div>
              <button
                className="w-full py-3 mt-2 rounded-lg border border-[#caa157] text-[#caa157] text-xs font-bold uppercase tracking-widest hover:bg-[#caa157]/10 active:scale-[0.98] transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrder(order);
                }}
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder && !fullscreenQR}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setFullscreenQR(false);
          }
        }}
      >
        <DialogContent className="max-w-[400px] max-h-[85vh] bg-[#1d2956] border border-[#caa157]/20 text-white p-0 overflow-hidden flex flex-col [&>button]:hidden">
          {selectedOrder && (
            <>
              {/* Header - Fixed */}
              <div className="bg-gradient-to-b from-[#caa157]/20 to-transparent p-6 border-b border-[#caa157]/20 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#caa157]" />
                    <h2 className="text-[#caa157] text-lg font-bold uppercase tracking-wider">
                      Order Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* QR Code Section */}
                <div className="p-6 border-b border-[#caa157]/20">
                  <div className="bg-white p-4 rounded-2xl">
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => setFullscreenQR(true)}
                    >
                      <QRCodeSVG
                        value={selectedOrder.qr_code}
                        size={240}
                        level="H"
                        includeMargin
                        className="w-full h-auto"
                      />
                    </button>
                  </div>
                  <p className="text-slate-400 text-xs text-center mt-3">
                    Tap QR code to enlarge • Show this to restaurant staff
                  </p>
                </div>

                {/* Restaurant Info */}
                <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedOrder.restaurants?.image_url}
                    alt={selectedOrder.restaurants?.name}
                    className="w-12 h-12 rounded-lg object-cover border border-[#caa157]/20"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold">{selectedOrder.restaurants?.name}</p>
                    <div className="inline-flex items-center gap-2 mt-1 bg-[#caa157]/10 border border-[#caa157]/30 rounded-full px-3 py-1">
                      <ShoppingBag className="w-3 h-3 text-[#caa157]" />
                      <span className="text-[#caa157] text-xs font-semibold uppercase">
                        {selectedOrder.order_type === 'dine_in' ? 'Dine In' : 'Take Out'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Order ID</span>
                    <span className="text-white font-mono font-semibold">
                      #{selectedOrder.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  {selectedOrder.order_type === 'dine_in' && selectedOrder.reservation_date && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#caa157]" />
                          Date
                        </span>
                        <span className="text-white font-semibold">
                          {formatDate(selectedOrder.reservation_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#caa157]" />
                          Time
                        </span>
                        <span className="text-white font-semibold">
                          {selectedOrder.reservation_time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#caa157]" />
                          Party Size
                        </span>
                        <span className="text-white font-semibold">
                          {selectedOrder.party_size} {selectedOrder.party_size === 1 ? 'Guest' : 'Guests'}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Payment</span>
                    <span className="text-white font-semibold uppercase">
                      {selectedOrder.payment_method}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-3 border-t border-[#caa157]/20">
                    <span className="text-[#caa157] font-bold">Total</span>
                    <span className="text-[#caa157] text-lg font-bold">
                      ${selectedOrder.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[#caa157] text-sm font-bold uppercase tracking-wider">
                      Items
                    </h4>
                    <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-xl p-4 space-y-2">
                      {selectedOrder.order_items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex-1">
                            <p className="text-white">{item.name}</p>
                            <p className="text-slate-400 text-xs">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-[#caa157] font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restaurant Address */}
                {selectedOrder.restaurants?.address && (
                  <div className="flex items-start gap-3 text-sm bg-[#caa157]/5 border border-[#caa157]/20 rounded-xl p-4">
                    <MapPin className="w-4 h-4 text-[#caa157] mt-0.5 shrink-0" />
                    <p className="text-slate-300 leading-relaxed">
                      {selectedOrder.restaurants.address}
                    </p>
                  </div>
                )}
              </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen QR Dialog */}
      <Dialog
        open={!!selectedOrder && fullscreenQR}
        onOpenChange={(open) => {
          if (!open) {
            setFullscreenQR(false);
          }
        }}
      >
        <DialogContent className="max-w-sm w-full bg-[#1d2956] border border-[#caa157]/20 p-6 flex flex-col items-center justify-center">
          {selectedOrder && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="text-slate-400 text-xs text-center">
                Show this QR code to the restaurant staff
              </div>
              <div className="bg-white p-4 rounded-2xl w-full flex justify-center">
                <QRCodeSVG
                  value={selectedOrder.qr_code}
                  size={300}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <button
                onClick={() => setFullscreenQR(false)}
                className="w-full bg-[#caa157] hover:bg-[#caa157]/90 text-[#1d2956] font-bold py-3 rounded-xl uppercase tracking-widest text-sm transition-all"
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
