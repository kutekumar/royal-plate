import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Check, Home, Receipt, Calendar, Clock, Users, ShoppingBag, Gem, ChevronRight, Share2, Download, PartyPopper, Crown, Flame } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { motion } from 'framer-motion';
import { useSoundContext } from '@/contexts/SoundContext';
import { useStreak } from '@/hooks/useStreak';

interface ConfirmationData {
  orderId: string;
  qrCode?: string;
  restaurant: { id: string; name: string; image_url: string; };
  orderType: 'dine_in' | 'takeaway';
  totalAmount: number;
  items: Array<{ id: string; name: string; quantity: number; price: number; }>;
  reservationDate?: string | null;
  reservationTime?: string | null;
  partySize?: number;
  tipAmount?: number;
  emailReceipt?: boolean;
}

const generateICS = (data: ConfirmationData) => {
  if (!data.reservationDate || !data.reservationTime) return '';
  const [hours, minutes] = data.reservationTime.split(':').map(Number);
  const startDate = new Date(data.reservationDate);
  startDate.setHours(hours, minutes, 0);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  const formatICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatICS(startDate)}`,
    `DTEND:${formatICS(endDate)}`,
    `SUMMARY:Reservation at ${data.restaurant.name}`,
    `DESCRIPTION:Dining reservation for ${data.partySize} guests`,
    `LOCATION:${data.restaurant.name}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Reservation at ${data.restaurant.name}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

const ConfettiPiece = ({ index }: { index: number }) => {
  const colors = ['#536DFE', '#6B7FFF', '#F59E0B', '#D97706', '#FBBF24', '#34D399', '#60A5FA'];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 2 + Math.random() * 2;
  const size = 4 + Math.random() * 8;
  return (
    <div
      className="absolute top-0 animate-confetti"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 1.5,
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        opacity: 0.8,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  );
};

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { play } = useSoundContext();
  const playedRef = useRef(false);
  const { streak, markActive, getStreakEmoji, getStreakTier } = useStreak();
  const confirmationData = location.state as ConfirmationData;
  const [qrValue, setQrValue] = useState('');
  const [showConfetti, setShowConfetti] = useState(true);
  const [progressStep, setProgressStep] = useState(0);
  const [chefTip, setChefTip] = useState('');

  const chefTips = [
    'Pair your meal with a matching beverage for the full experience 🍷',
    'Leave a review and help fellow foodies discover great spots ⭐',
    'Try our chef\'s special on your next visit for a surprise 🌟',
    'Early bird reservations get the best tables 🕐',
    'Share your dining experience and earn bonus points 📸',
    'Weekend brunch is our hidden gem — reserve ahead! 🥂',
  ];

  useEffect(() => {
    if (!confirmationData) { navigate('/'); return; }
    if (!playedRef.current) { play('success'); playedRef.current = true; markActive(); }
    if (confirmationData.qrCode) setQrValue(confirmationData.qrCode);
    else {
      const timestamp = Date.now();
      setQrValue(`ALAN-${timestamp}-${confirmationData.restaurant.id}-${confirmationData.orderId}`);
    }
    toast.success('Order confirmed successfully!');
    localStorage.setItem('royal-plate-active-order', 'true');
    setChefTip(chefTips[Math.floor(Math.random() * chefTips.length)]);

    // Progress animation
    const t1 = setTimeout(() => setProgressStep(1), 600);
    const t2 = setTimeout(() => setProgressStep(2), 2000);
    const t3 = setTimeout(() => setProgressStep(3), 3500);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(confettiTimer); };
  }, [confirmationData, navigate]);

  const handleShare = useCallback(async () => {
    const text = `I'm dining at ${confirmationData?.restaurant.name}! 🍽️${confirmationData?.reservationDate ? ` Reserved for ${confirmationData?.reservationDate} at ${confirmationData?.reservationTime}` : ''}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Royal Plate', text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  }, [confirmationData]);

  const handleAddToCalendar = useCallback(() => {
    if (!confirmationData) return;
    const ics = generateICS(confirmationData);
    if (!ics) { toast.error('No reservation date set'); return; }
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservation-${confirmationData.restaurant.name.replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Calendar event downloaded!');
  }, [confirmationData]);

  if (!confirmationData) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const orderNumber = `#${confirmationData.orderId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="relative flex h-screen w-full max-w-sm mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      {/* Streak Celebration */}
      {streak.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/90 to-amber-500/90 backdrop-blur-xl text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-2xl border border-white/30">
            <Flame className="w-3.5 h-3.5 animate-streak-fire" />
            {streak.count}-day streak!
            <span className="text-white/70 text-[9px] font-medium ml-1">{getStreakTier()}</span>
          </div>
        </motion.div>
      )}
      {streak.count === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-40"
        >
          <span className="bg-white/80 backdrop-blur-xl text-gray-500 text-[9px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/60">
            🎉 First order! Start your streak
          </span>
        </motion.div>
      )}

      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="relative pt-10 pb-4 z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />
        <div className="relative text-center px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/30"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-[#1D2956] text-2xl font-bold mb-1"
          >
            Order Confirmed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-400 text-xs"
          >
            Your culinary journey awaits
          </motion.p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-[#536DFE] text-sm font-bold font-mono mt-2 tracking-wider"
          >
            {orderNumber}
          </motion.p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide" style={{ contentVisibility: 'auto' }}>
        {/* Order Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 p-4 mb-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em]">Order Status</h3>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-full">Confirmed</span>
          </div>
          <div className="flex items-center justify-between">
            {[
              { label: 'Confirmed', time: 'Now' },
              { label: 'Preparing', time: progressStep >= 1 ? 'Soon' : '' },
              { label: 'Ready', time: progressStep >= 2 ? 'Almost' : '' },
              { label: 'Enjoy', time: progressStep >= 3 ? 'Bon Appétit' : '' },
            ].map((step, idx) => (
              <div key={step.label} className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-all duration-500 ${
                  progressStep >= idx
                    ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/40'
                    : 'bg-gray-100 text-gray-300'
                }`}>
                  {progressStep > idx ? <Check className="w-5 h-5" /> : idx === 3 ? <PartyPopper className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                </div>
                <p className={`text-[9px] font-bold mt-1.5 ${progressStep >= idx ? 'text-[#1D2956]' : 'text-gray-300'}`}>{step.label}</p>
                {step.time && <p className="text-[8px] text-gray-400 mt-0.5">{step.time}</p>}
              </div>
            ))}
          </div>
          <div className="relative mt-3">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${(progressStep / 3) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-[#536DFE] to-emerald-400 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 p-4 mb-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <Gem className="w-4 h-4 text-[#536DFE]" />
            <h2 className="text-[#1D2956] text-xs font-bold uppercase tracking-[0.2em]">Your QR Code</h2>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-100">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
              className="animate-qr-draw"
            >
              {qrValue && <QRCodeSVG value={qrValue} size={220} level="H" includeMargin className="w-full h-auto" />}
            </motion.div>
          </div>
          <p className="text-gray-400 text-[10px] text-center mt-2 font-medium">Show this to staff to claim your order</p>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden mb-3"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
              Order Details
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <img src={confirmationData.restaurant.image_url} alt={confirmationData.restaurant.name} className="w-12 h-12 rounded-2xl object-cover border border-white/60 shadow-md" />
              <div className="flex-1 min-w-0">
                <p className="text-[#1D2956] text-sm font-bold truncate">{confirmationData.restaurant.name}</p>
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 rounded-full px-2.5 py-1 mt-1 border border-[#536DFE]/20">
                  <ShoppingBag className="w-3 h-3 text-[#536DFE]" />
                  <span className="text-[#536DFE] text-[9px] font-bold uppercase">{confirmationData.orderType === 'dine_in' ? 'Dine In' : 'Take Out'}</span>
                </div>
              </div>
            </div>

            {confirmationData.orderType === 'dine_in' && confirmationData.reservationDate && (
              <>
                {[{ icon: Calendar, label: 'Date', value: formatDate(confirmationData.reservationDate) },
                  { icon: Clock, label: 'Time', value: confirmationData.reservationTime },
                  { icon: Users, label: 'Party Size', value: `${confirmationData.partySize} ${confirmationData.partySize === 1 ? 'Guest' : 'Guests'}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[#536DFE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[9px] uppercase tracking-[0.2em] font-bold">{label}</p>
                      <p className="text-[#1D2956] text-xs font-bold mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="pt-3 border-t border-gray-100 space-y-2">
              {confirmationData.items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[#1D2956] text-xs font-medium">{item.name}</p>
                    <p className="text-gray-400 text-[9px]">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-[#536DFE] text-xs font-bold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {confirmationData.tipAmount && confirmationData.tipAmount > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-400 text-[10px] font-medium">Tip</span>
                <span className="text-[#1D2956] text-xs font-bold">{formatCurrency(confirmationData.tipAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-[#1D2956] text-sm font-bold">Total Amount</span>
              <span className="text-[#536DFE] text-xl font-bold">{formatCurrency(confirmationData.totalAmount)}</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          className="flex gap-3 mb-3"
        >
          <button
            onClick={handleAddToCalendar}
            className="flex-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-4 flex flex-col items-center gap-2 hover:shadow-xl hover:border-[#536DFE]/20 transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#536DFE]" />
            </div>
            <span className="text-[#1D2956] text-[10px] font-bold">Add to Calendar</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-4 flex flex-col items-center gap-2 hover:shadow-xl hover:border-[#536DFE]/20 transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/10 to-emerald-500/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-[#1D2956] text-[10px] font-bold">Share Order</span>
          </button>
          <button
            onClick={() => {
              if (qrValue) {
                const svg = document.querySelector('.animate-qr-draw svg');
                if (svg) {
                  const html = svg.outerHTML;
                  navigator.clipboard.writeText(html).then(() => toast.success('QR code copied!'));
                }
              }
            }}
            className="flex-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-4 flex flex-col items-center gap-2 hover:shadow-xl hover:border-[#536DFE]/20 transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="text-[#1D2956] text-[10px] font-bold">Save QR</span>
          </button>
        </motion.div>

        {/* Chef's Tip */}
        {chefTip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="bg-gradient-to-br from-[#F59E0B]/5 to-amber-500/5 rounded-3xl border border-[#F59E0B]/20 p-4 mb-3"
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Crown className="w-5 h-5 text-[#F59E0B] mt-0.5" />
              </motion.div>
              <div>
                <p className="text-[#F59E0B] text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Chef's Tip</p>
                <p className="text-gray-600 text-xs leading-relaxed">{chefTip}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 p-4"
        >
          <h4 className="text-[#1D2956] text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <div className="w-1 h-3 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
            Next Steps
          </h4>
          <ul className="space-y-2.5">
            {(confirmationData.orderType === 'dine_in' ? [
              { icon: Calendar, text: 'Arrive at your reserved time' },
              { icon: ShoppingBag, text: 'Show QR code at the entrance' },
              { icon: PartyPopper, text: 'Enjoy your culinary experience!' },
            ] : [
              { icon: Clock, text: 'Visit the restaurant to pick up' },
              { icon: ShoppingBag, text: 'Show QR code at the counter' },
              { icon: PartyPopper, text: 'Collect & enjoy your meal!' },
            ]).map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-3.5 h-3.5 text-[#536DFE]" />
                </div>
                <span className="text-gray-500 text-xs leading-relaxed pt-0.5">{step.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm p-4 bg-white/95 backdrop-blur-xl border-t border-white/60 shadow-2xl space-y-2.5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/orders')}
          className="w-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] hover:shadow-2xl hover:shadow-[#536DFE]/50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#536DFE]/40 uppercase tracking-widest text-sm"
        >
          <Receipt className="w-5 h-5" />
          View My Orders
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/home')}
          className="w-full bg-white border border-gray-200 hover:border-[#536DFE]/30 text-[#1D2956] font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg uppercase tracking-widest text-sm"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </motion.button>
      </div>
    </div>
  );
};

export default Confirmation;
