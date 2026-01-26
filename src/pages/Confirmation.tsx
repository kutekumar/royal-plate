import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  Check,
  Home,
  Receipt,
  Calendar,
  Clock,
  Users,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface ConfirmationData {
  orderId: string;
  qrCode?: string;
  restaurant: {
    id: string;
    name: string;
    image_url: string;
  };
  orderType: 'dine_in' | 'takeaway';
  totalAmount: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  reservationDate?: string | null;
  reservationTime?: string | null;
  partySize?: number;
}

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const confirmationData = location.state as ConfirmationData;
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (!confirmationData) {
      navigate('/');
      return;
    }

    // Use QR code from order or generate new one as fallback
    if (confirmationData.qrCode) {
      setQrValue(confirmationData.qrCode);
    } else {
      const timestamp = Date.now();
      const qrData = `ALAN-${timestamp}-${confirmationData.restaurant.id}-${confirmationData.orderId}`;
      setQrValue(qrData);
    }

    // Show success toast
    toast.success('Order placed successfully!');
  }, [confirmationData, navigate]);

  if (!confirmationData) {
    return null;
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#1d2956] max-w-[430px] mx-auto overflow-hidden">
      {/* Success Header with Animation */}
      <div className="relative bg-gradient-to-b from-[#caa157]/20 to-transparent pt-12 pb-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#caa157] mb-4 animate-bounce">
            <Check className="w-10 h-10 text-[#1d2956]" />
          </div>
          <h1 className="text-[#caa157] text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-slate-300 text-sm px-6">
            Your order has been placed successfully
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* QR Code Section */}
        <div className="mb-6">
          <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#caa157]" />
              <h2 className="text-[#caa157] text-lg font-bold uppercase tracking-wider">
                Your QR Code
              </h2>
            </div>
            <div className="bg-white p-6 rounded-2xl mb-4">
              {qrValue && (
                <QRCodeSVG
                  value={qrValue}
                  size={256}
                  level="H"
                  includeMargin={true}
                  className="w-full h-auto"
                />
              )}
            </div>
            <p className="text-slate-400 text-sm text-center">
              Show this QR code to the restaurant staff to claim your order
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <h3 className="text-[#caa157] text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Order Details
          </h3>
          
          <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-5 space-y-4">
            {/* Restaurant Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#caa157]/20">
              <img
                src={confirmationData.restaurant.image_url}
                alt={confirmationData.restaurant.name}
                className="w-12 h-12 rounded-lg object-cover border border-[#caa157]/20"
              />
              <div className="flex-1">
                <p className="text-white font-semibold">{confirmationData.restaurant.name}</p>
                <div className="inline-flex items-center gap-2 mt-1 bg-[#caa157]/10 border border-[#caa157]/30 rounded-full px-3 py-1">
                  <ShoppingBag className="w-3 h-3 text-[#caa157]" />
                  <span className="text-[#caa157] text-xs font-semibold uppercase">
                    {confirmationData.orderType === 'dine_in' ? 'Dine In' : 'Take Out'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order ID */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Order ID</span>
              <span className="text-white font-semibold text-sm font-mono">
                #{confirmationData.orderId.slice(0, 8).toUpperCase()}
              </span>
            </div>

            {/* Reservation Details for Dine In */}
            {confirmationData.orderType === 'dine_in' && confirmationData.reservationDate && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </span>
                  <span className="text-white font-semibold text-sm">
                    {formatDate(confirmationData.reservationDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time
                  </span>
                  <span className="text-white font-semibold text-sm">
                    {confirmationData.reservationTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Party Size
                  </span>
                  <span className="text-white font-semibold text-sm">
                    {confirmationData.partySize} {confirmationData.partySize === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
              </>
            )}

            {/* Items */}
            <div className="pt-4 border-t border-[#caa157]/20 space-y-2">
              {confirmationData.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-slate-400 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-[#caa157] font-semibold text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-[#caa157]/20">
              <span className="text-[#caa157] text-lg font-bold">Total Amount</span>
              <span className="text-[#caa157] text-2xl font-bold">
                ${confirmationData.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <div className="bg-[#caa157]/5 border border-[#caa157]/20 rounded-2xl p-5">
            <h4 className="text-[#caa157] font-semibold mb-2">Next Steps:</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              {confirmationData.orderType === 'dine_in' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#caa157] mt-1">•</span>
                    <span>Arrive at the restaurant at your reservation time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#caa157] mt-1">•</span>
                    <span>Show the QR code to the staff at the entrance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#caa157] mt-1">•</span>
                    <span>Enjoy your meal at your reserved table</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#caa157] mt-1">•</span>
                    <span>Visit the restaurant to pick up your order</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#caa157] mt-1">•</span>
                    <span>Show the QR code at the counter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#caa157] mt-1">•</span>
                    <span>Collect your takeout order and enjoy!</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-[#1d2956]/90 backdrop-blur-xl border-t border-[#caa157]/20 space-y-3">
        <button
          onClick={() => navigate('/orders')}
          className="w-full bg-[#caa157] hover:bg-[#caa157]/90 text-[#1d2956] font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(202,161,87,0.2)] uppercase tracking-widest text-sm"
        >
          <Receipt className="w-5 h-5" />
          View My Orders
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#263569]/40 border border-[#caa157]/40 hover:bg-[#263569]/60 text-[#caa157] font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
