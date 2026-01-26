import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Building2,
  Check,
  ShoppingBag,
  Calendar,
  Users,
  Clock,
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  restaurant: {
    id: string;
    name: string;
    address: string;
    image_url: string;
  };
  cart: CartItem[];
  orderType: 'dine_in' | 'takeaway';
  partySize: number;
  reservationDate: string | null;
  reservationTime: string | null;
  totalAmount: number;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state as OrderData;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  if (!orderData) {
    navigate('/');
    return null;
  }

  const paymentMethods = [
    { id: 'kbzpay', name: 'KBZ Pay', icon: Wallet, color: '#0066ff' },
    { id: 'wavepay', name: 'Wave Pay', icon: Wallet, color: '#ff6b00' },
    { id: 'mpu', name: 'MPU Card', icon: CreditCard, color: '#d32f2f' },
    { id: 'cash', name: 'Cash on Arrival', icon: Building2, color: '#4caf50' },
  ];

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login to continue');
        navigate('/auth');
        return;
      }

      // Generate QR code
      const timestamp = Date.now();
      const qrCode = `ALAN-${timestamp}-${orderData.restaurant.id}-${user.id}`;
      
      // Prepare order items as JSONB
      const orderItemsJson = orderData.cart.map((item) => ({
        menu_item_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: orderData.restaurant.id,
          status: 'paid',
          total_amount: orderData.totalAmount,
          payment_method: selectedPaymentMethod,
          order_type: orderData.orderType,
          party_size: orderData.partySize,
          reservation_date: orderData.reservationDate,
          reservation_time: orderData.reservationTime,
          qr_code: qrCode,
          order_items: orderItemsJson,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      toast.success('Order placed successfully!');
      
      // Navigate to confirmation with order details
      navigate('/confirmation', {
        state: {
          orderId: order.id,
          qrCode: order.qr_code,
          restaurant: orderData.restaurant,
          orderType: orderData.orderType,
          totalAmount: orderData.totalAmount,
          items: orderData.cart,
          reservationDate: orderData.reservationDate,
          reservationTime: orderData.reservationTime,
          partySize: orderData.partySize,
        },
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#1d2956] max-w-[430px] mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1d2956] border-b border-[#caa157]/20 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#263569]/40 backdrop-blur-md rounded-full p-2 flex items-center justify-center border border-[#caa157]/20 hover:bg-[#263569]/60 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-[#caa157] text-2xl font-bold">Payment</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Restaurant Info */}
        <div className="p-4">
          <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-4 flex items-center gap-4">
            <img
              src={orderData.restaurant.image_url}
              alt={orderData.restaurant.name}
              className="w-16 h-16 rounded-xl object-cover border border-[#caa157]/20"
            />
            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg">{orderData.restaurant.name}</h2>
              <p className="text-slate-400 text-sm">{orderData.restaurant.address}</p>
            </div>
          </div>
        </div>

        {/* Order Type Badge */}
        <div className="px-4 pb-4">
          <div className="inline-flex items-center gap-2 bg-[#caa157]/10 border border-[#caa157]/30 rounded-full px-4 py-2">
            <ShoppingBag className="w-4 h-4 text-[#caa157]" />
            <span className="text-[#caa157] text-sm font-semibold uppercase">
              {orderData.orderType === 'dine_in' ? 'Dine In' : 'Take Out'}
            </span>
          </div>
        </div>

        {/* Reservation Details - Only for Dine In */}
        {orderData.orderType === 'dine_in' && orderData.reservationDate && (
          <div className="px-4 pb-6">
            <h3 className="text-[#caa157] text-sm font-bold uppercase tracking-wider mb-4">
              Reservation Details
            </h3>
            <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#caa157]" />
                <div>
                  <p className="text-slate-400 text-xs">Date</p>
                  <p className="text-white font-semibold">{formatDate(orderData.reservationDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#caa157]" />
                <div>
                  <p className="text-slate-400 text-xs">Time</p>
                  <p className="text-white font-semibold">{orderData.reservationTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#caa157]" />
                <div>
                  <p className="text-slate-400 text-xs">Party Size</p>
                  <p className="text-white font-semibold">{orderData.partySize} {orderData.partySize === 1 ? 'Guest' : 'Guests'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="px-4 pb-6">
          <h3 className="text-[#caa157] text-sm font-bold uppercase tracking-wider mb-4">
            Order Summary
          </h3>
          <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-4 space-y-3">
            {orderData.cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-slate-400 text-sm">Qty: {item.quantity}</p>
                </div>
                <p className="text-[#caa157] font-bold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="border-t border-[#caa157]/20 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-[#caa157] text-lg font-bold">Total</span>
                <span className="text-[#caa157] text-2xl font-bold">
                  ${orderData.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="px-4 pb-6">
          <h3 className="text-[#caa157] text-sm font-bold uppercase tracking-wider mb-4">
            Payment Method
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-[#caa157]/10 border-2 border-[#caa157]'
                      : 'bg-[#263569]/20 border border-[#caa157]/20 hover:border-[#caa157]/40'
                  }`}
                >
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl"
                    style={{ backgroundColor: `${method.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: method.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{method.name}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#caa157] flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#1d2956]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-[#1d2956]/90 backdrop-blur-xl border-t border-[#caa157]/20">
        <button
          onClick={handlePayment}
          disabled={processing || !selectedPaymentMethod}
          className="w-full bg-[#caa157] hover:bg-[#caa157]/90 disabled:bg-[#caa157]/30 disabled:cursor-not-allowed text-[#1d2956] font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(202,161,87,0.2)] uppercase tracking-widest text-sm"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-[#1d2956]/30 border-t-[#1d2956] rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Confirm Payment - ${orderData.totalAmount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Payment;
