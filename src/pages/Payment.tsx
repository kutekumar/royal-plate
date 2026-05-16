import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Wallet, Building2, Check, ShoppingBag, Calendar, Users, Clock, Sparkles, ChevronRight, Crown, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { motion } from 'framer-motion';
import { useSoundContext } from '@/contexts/SoundContext';

interface CartItem { id: string; name: string; price: number; quantity: number; }

interface OrderData {
  restaurant: { id: string; name: string; address: string; image_url: string; };
  cart: CartItem[];
  orderType: 'dine_in' | 'takeaway';
  partySize: number;
  reservationDate: string | null;
  reservationTime: string | null;
  totalAmount: number;
}

const TIP_PRESETS = [15, 20, 25];

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { play } = useSoundContext();
  const orderData = location.state as OrderData;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [emailReceipt, setEmailReceipt] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    fetchLoyaltyPoints();
  }, []);

  const fetchLoyaltyPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('customer_id', user.id);
        const points = (orders || []).reduce((sum, o) => sum + Math.floor((o.total_amount || 0) / 1000), 0);
        setLoyaltyPoints(points);
      }
    } catch {}
  };

  if (!orderData) { navigate('/'); return null; }

  const subtotal = orderData.totalAmount;
  const tipAmount = tipPercent ? Math.round(subtotal * (tipPercent / 100)) : (customTip ? Number(customTip) : 0);
  const serviceCharge = Math.round(subtotal * 0.05);
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tipAmount + serviceCharge + tax;

  const paymentMethods = [
    { id: 'kbzpay', name: 'KBZ Pay', icon: Wallet, color: '#0066ff', gradient: 'from-blue-500 to-blue-600' },
    { id: 'wavepay', name: 'Wave Pay', icon: Wallet, color: '#ff6b00', gradient: 'from-orange-500 to-orange-600' },
    { id: 'mpu', name: 'MPU Card', icon: CreditCard, color: '#d32f2f', gradient: 'from-red-500 to-red-600' },
    { id: 'cash', name: 'Cash on Arrival', icon: Building2, color: '#4caf50', gradient: 'from-emerald-500 to-emerald-600' },
  ];

  const handlePayment = async () => {
    if (!selectedPaymentMethod) { play('error'); toast.error('Please select a payment method'); return; }
    play('payment');
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please login to continue'); navigate('/auth'); return; }

      const timestamp = Date.now();
      const qrCode = `ALAN-${timestamp}-${orderData.restaurant.id}-${user.id}`;
      const orderItemsJson = orderData.cart.map(item => ({ menu_item_id: item.id, name: item.name, quantity: item.quantity, price: item.price }));

      const { data: order, error } = await supabase.from('orders').insert({
        customer_id: user.id, restaurant_id: orderData.restaurant.id, status: 'paid',
        total_amount: grandTotal, payment_method: selectedPaymentMethod,
        order_type: orderData.orderType, party_size: orderData.partySize,
        reservation_date: orderData.reservationDate, reservation_time: orderData.reservationTime,
        qr_code: qrCode, order_items: orderItemsJson,
      }).select().single();

      if (error) throw error;
      play('success');
      toast.success('Order placed successfully!');
      navigate('/confirmation', {
        state: { orderId: order.id, qrCode: order.qr_code, restaurant: orderData.restaurant,
          orderType: orderData.orderType, totalAmount: grandTotal, items: orderData.cart,
          reservationDate: orderData.reservationDate, reservationTime: orderData.reservationTime,
          partySize: orderData.partySize, tipAmount, emailReceipt },
      });
    } catch (error) {
      play('error');
      toast.error('Failed to process payment. Please try again.');
    } finally { setProcessing(false); }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="relative flex h-screen w-full max-w-sm mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="relative px-4 pt-6 pb-3 z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />
        <div className="relative flex items-center gap-3">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 hover:border-[#536DFE]/40 hover:shadow-xl transition-all shadow-lg shadow-black/5 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-[#1D2956]" />
          </motion.button>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <h1 className="text-[#1D2956] text-xl font-bold tracking-tight leading-none mb-1">Checkout</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-medium">Secure payment</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide">
        {/* Restaurant Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 p-4 mb-3"
        >
          <div className="flex items-center gap-3">
            <img src={orderData.restaurant.image_url} alt={orderData.restaurant.name} className="w-14 h-14 rounded-2xl object-cover border border-white/60 shadow-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[#1D2956] text-sm font-bold truncate">{orderData.restaurant.name}</p>
              <p className="text-gray-400 text-[10px] mt-0.5 truncate">{orderData.restaurant.address}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 rounded-xl px-3 py-2 border border-[#536DFE]/20">
              <ShoppingBag className="w-3.5 h-3.5 text-[#536DFE]" />
              <span className="text-[#536DFE] text-[10px] font-bold uppercase">{orderData.orderType === 'dine_in' ? 'Dine In' : 'Take Out'}</span>
            </div>
          </div>
        </motion.div>

        {/* Loyalty Points */}
        {loyaltyPoints > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 rounded-3xl border border-[#F59E0B]/30 p-4 mb-3 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#F59E0B]/30">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[#1D2956] text-xs font-bold">You have {loyaltyPoints} Crown Points</p>
                <p className="text-[#F59E0B] text-[10px] font-medium mt-0.5">Earn {Math.floor(grandTotal / 1000)} more with this order</p>
              </div>
              <div className="bg-white/60 rounded-xl px-3 py-1.5 border border-[#F59E0B]/20">
                <span className="text-[#F59E0B] text-[10px] font-bold">Use</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reservation Details */}
        {orderData.orderType === 'dine_in' && orderData.reservationDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden mb-3"
          >
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                Reservation
              </h3>
            </div>
            {[
              { icon: Calendar, label: 'Date', value: formatDate(orderData.reservationDate) },
              { icon: Clock, label: 'Time', value: orderData.reservationTime },
              { icon: Users, label: 'Party Size', value: `${orderData.partySize} ${orderData.partySize === 1 ? 'Guest' : 'Guests'}` },
            ].map(({ icon: Icon, label, value }, idx) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Icon className="w-4 h-4 text-[#536DFE]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">{label}</p>
                  <p className="text-[#1D2956] text-sm font-bold truncate mt-0.5">{value}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </motion.div>
        )}

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden mb-3"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
              Order Summary
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {orderData.cart.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05, duration: 0.3 }}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-[#1D2956] text-xs font-bold">{item.name}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-[#536DFE] text-xs font-bold">{formatCurrency(item.price * item.quantity)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Add a Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden mb-3"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
              Add a Tip
            </h3>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              {TIP_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => { play('select'); setTipPercent(p); setShowCustomTip(false); setCustomTip(''); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                    tipPercent === p && !showCustomTip
                      ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-lg shadow-[#536DFE]/40 scale-105'
                      : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#1D2956] hover:border-[#536DFE]/40'
                  }`}
                >
                  {p}%
                  <span className="block text-[9px] opacity-70 mt-0.5">{formatCurrency(Math.round(subtotal * p / 100))}</span>
                </button>
              ))}
              <button
                onClick={() => { play('select'); setShowCustomTip(true); setTipPercent(null); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                  showCustomTip
                    ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-lg shadow-[#536DFE]/40 scale-105'
                    : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#1D2956] hover:border-[#536DFE]/40'
                }`}
              >
                Custom
              </button>
            </div>
            {showCustomTip && (
              <div className="flex items-center gap-2 bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] rounded-2xl p-3 border border-gray-100">
                <span className="text-[#1D2956] font-bold text-xs">Ks</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  className="flex-1 bg-transparent text-[#1D2956] text-sm font-bold focus:outline-none placeholder-gray-300"
                  autoFocus
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Order Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden mb-3"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
              Order Notes
            </h3>
          </div>
          <div className="p-4">
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Any special requests for the restaurant..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-gradient-to-br from-[#F5F5F7] to-[#FAFAFA] border border-gray-100 text-[#1D2956] text-xs placeholder-gray-400 focus:outline-none focus:border-[#536DFE]/40 focus:ring-4 focus:ring-[#536DFE]/10 transition-all resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md border border-gray-200 flex items-center justify-center cursor-pointer" onClick={() => setEmailReceipt(!emailReceipt)}>
                  {emailReceipt && <Check className="w-3 h-3 text-[#536DFE]" />}
                </div>
                <span className="text-gray-400 text-[10px] font-medium">Email me a receipt</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Price Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden mb-3"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
              Price Breakdown
            </h3>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Subtotal</span>
              <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Service charge</span>
              <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(serviceCharge)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Tax (5%)</span>
              <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(tax)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs font-medium">Tip {tipPercent ? `(${tipPercent}%)` : ''}</span>
                <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(tipAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between">
              <span className="text-[#536DFE] text-base font-bold">Grand Total</span>
              <motion.span
                key={grandTotal}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-[#536DFE] text-2xl font-bold"
              >
                {formatCurrency(grandTotal)}
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
              Payment Method
            </h3>
          </div>
          <div className="p-2">
            {paymentMethods.map((method, idx) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.id;
              return (
                <motion.button
                  key={method.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.06, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { play('select'); setSelectedPaymentMethod(method.id); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 transition-all text-left ${
                    isSelected ? 'bg-[#536DFE]/5' : ''
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br ${method.gradient} bg-opacity-10`} style={{ opacity: 0.15 }}>
                    <Icon className="w-5 h-5" style={{ color: method.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${isSelected ? 'text-[#536DFE]' : 'text-[#1D2956]'}`}>{method.name}</p>
                    <p className="text-gray-400 text-[9px] mt-0.5 font-medium">
                      {method.id === 'cash' ? 'Pay when you arrive' : 'Secure instant payment'}
                    </p>
                  </div>
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-md shadow-[#536DFE]/30">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm p-4 bg-white/95 backdrop-blur-xl border-t border-white/60 shadow-2xl">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePayment}
          disabled={processing || !selectedPaymentMethod}
          className="w-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] hover:shadow-2xl hover:shadow-[#536DFE]/50 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#536DFE]/40 uppercase tracking-widest text-sm"
        >
          {processing ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
          ) : (
            <><Check className="w-5 h-5" /> Pay {formatCurrency(grandTotal)}</>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default Payment;
