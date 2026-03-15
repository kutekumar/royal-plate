import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LogOut,
  User,
  Phone,
  Mail,
  Edit2,
  Sparkles,
  Compass,
  Star as StarIcon,
  Shield,
  Crown,
  Check,
  X,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  Settings,
  Award,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCustomerLoyalty } from '@/hooks/useCustomerLoyalty';
import { formatCurrency } from '@/utils/currency';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { loading: loyaltyLoading, summary, badgeLabel, badgeDescription, badgeIcon } = useCustomerLoyalty();

  const getBadgeIconNode = (size = 'w-4 h-4') => {
    switch (badgeIcon) {
      case 'compass': return <Compass className={size} />;
      case 'star': return <StarIcon className={size} />;
      case 'shield': return <Shield className={size} />;
      case 'crown': return <Crown className={size} />;
      default: return <Sparkles className={size} />;
    }
  };

  useEffect(() => {
    if (user) { fetchProfile(); fetchOrderHistory(); }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      if (error) throw error;
      setProfile(data);
      setFormData({ full_name: data.full_name || '', phone: data.phone || '' });
    } catch (e) { console.error(e); }
  };

  const fetchOrderHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurants(name, image_url, address), order_items')
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrderHistory(data || []);
    } catch (e) { console.error(e); }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase.from('profiles').update({ full_name: formData.full_name, phone: formData.phone }).eq('id', user?.id);
      if (error) throw error;
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (e) { toast.error('Failed to update profile'); }
  };

  const handleSignOut = async () => {
    setIsTransitioning(true);
    await signOut();
    // Wait for exit animation to complete before navigating
    setTimeout(() => {
      navigate('/auth');
    }, 600); // Match the exit animation duration
    toast.success('Signed out successfully');
  };

  const totalSpent = orderHistory.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const initials = (profile?.full_name || user?.email || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently';

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <PageTransition>
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">

      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.1
        }}
        style={{ willChange: 'transform, opacity' }}
        className="relative px-5 pt-8 pb-4 z-10"
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />

        <div className="relative flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-[#1D2956] text-2xl font-bold tracking-tight leading-none mb-1">
              My Account
            </h1>
            <p className="text-gray-400 text-[11px] uppercase tracking-[0.3em] font-medium">
              Member since {memberSince}
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 hover:border-[#536DFE]/40 hover:shadow-xl transition-all shadow-lg shadow-black/5 flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-[#1D2956]" />
          </motion.button>
        </div>
      </motion.div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">

        {/* Premium Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.4
          }}
          style={{ willChange: 'transform, opacity' }}
          className="px-5 mb-5"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 p-6">
            <div className="flex items-start gap-5">
              {/* Avatar with Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.7,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.5
                }}
                className="relative flex-shrink-0"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-xl shadow-[#536DFE]/40 border-2 border-white">
                  <span className="text-white text-3xl font-bold drop-shadow">{initials}</span>
                </div>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.7
                  }}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-xl shadow-[#536DFE]/50 text-white border-2 border-white"
                >
                  {getBadgeIconNode('w-5 h-5')}
                </motion.div>
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <h2 className="text-[#1D2956] text-xl font-bold leading-tight">
                      {profile?.full_name || 'User'}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1 truncate">{user?.email}</p>
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 hover:from-[#536DFE]/25 hover:to-[#6B7FFF]/25 flex items-center justify-center transition-all shadow-md"
                  >
                    <Edit2 className="w-4.5 h-4.5 text-[#536DFE]" />
                  </motion.button>
                </div>

                {/* Premium Badges */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg shadow-[#536DFE]/40 border border-white/20"
                  >
                    {getBadgeIconNode('w-3.5 h-3.5')}
                    {loyaltyLoading ? 'Loading...' : badgeLabel || 'Newbie'}
                  </motion.span>
                  {summary && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="inline-flex items-center gap-2 bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 text-[#536DFE] text-[11px] font-bold px-4 py-2 rounded-full border border-[#536DFE]/30 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {summary.total_points} pts
                    </motion.span>
                  )}
                </div>
              </div>
            </div>

            {badgeDescription && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="text-gray-500 text-xs mt-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl px-4 py-3.5 leading-relaxed border border-gray-100"
              >
                {badgeDescription}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Premium Stats Row */}
        <div className="px-5 mb-5 grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 1.1
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            style={{ willChange: 'transform' }}
            className="bg-gradient-to-br from-[#1D2956] to-[#1D2956]/90 rounded-3xl p-5 shadow-xl shadow-[#1D2956]/30 border border-white/10"
          >
            <TrendingUp className="w-7 h-7 text-white/50 mb-3" />
            <p className="text-white/70 text-[11px] uppercase tracking-[0.25em] font-bold mb-1">Total Spent</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 1.2
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            style={{ willChange: 'transform' }}
            className="bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] rounded-3xl p-5 shadow-xl shadow-[#536DFE]/40 border border-white/20"
          >
            <ShoppingBag className="w-7 h-7 text-white/50 mb-3" />
            <p className="text-white/80 text-[11px] uppercase tracking-[0.25em] font-bold mb-1">Orders</p>
            <p className="text-white text-2xl font-bold">{orderHistory.length}</p>
          </motion.div>
        </div>

        {/* Premium Edit Form */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="px-5 mb-5 overflow-hidden"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 border border-white/60 p-6 space-y-5">
                <h3 className="text-[#1D2956] font-bold text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                  Edit Profile
                </h3>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2.5"
                >
                  <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Full Name</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="border-gray-200 text-[#1D2956] focus:border-[#536DFE] focus:ring-4 focus:ring-[#536DFE]/10 rounded-2xl h-12 shadow-sm"
                    placeholder="Your name"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2.5"
                >
                  <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-gray-200 text-[#1D2956] focus:border-[#536DFE] focus:ring-4 focus:ring-[#536DFE]/10 rounded-2xl h-12 shadow-sm"
                    placeholder="+1 234 567 890"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-3 pt-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] hover:shadow-2xl hover:shadow-[#536DFE]/50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#536DFE]/40"
                  >
                    <Check className="w-4.5 h-4.5" /> Save Changes
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <X className="w-4.5 h-4.5" /> Cancel
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="px-5 space-y-4">

          {/* Premium Account Info */}
          <AnimatePresence>
            {!isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 1.3
                }}
                style={{ willChange: 'transform, opacity' }}
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 border border-white/60 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                    Account Info
                  </h3>
                </div>
                {[
                  { icon: User, label: 'Name', value: profile?.full_name || 'Not set' },
                  { icon: Mail, label: 'Email', value: user?.email || '' },
                  { icon: Phone, label: 'Phone', value: profile?.phone || 'Not set' },
                  { icon: Calendar, label: 'Member Since', value: memberSince },
                ].map(({ icon: Icon, label, value }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 1.4 + index * 0.06
                    }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(83, 109, 254, 0.02)' }}
                    style={{ willChange: 'transform' }}
                    className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 transition-all cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Icon className="w-5 h-5 text-[#536DFE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">{label}</p>
                      <p className="text-[#1D2956] text-sm font-bold truncate mt-0.5">{value}</p>
                    </div>
                    <ChevronRight className="w-4.5 h-4.5 text-gray-300 flex-shrink-0" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 1.7
            }}
            style={{ willChange: 'transform, opacity' }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 border border-white/60 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
                Quick Actions
              </h3>
            </div>
            {[
              { icon: Award, label: 'Loyalty Rewards', desc: 'View your points & badges', action: () => {} },
              { icon: MapPin, label: 'Saved Addresses', desc: 'Manage delivery locations', action: () => {} },
              { icon: Settings, label: 'Preferences', desc: 'App settings & notifications', action: () => {} },
            ].map(({ icon: Icon, label, desc, action }, index) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 1.8 + index * 0.06
                }}
                whileHover={{ x: 4, backgroundColor: 'rgba(83, 109, 254, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                style={{ willChange: 'transform' }}
                onClick={action}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1D2956]/15 to-[#1D2956]/10 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Icon className="w-5 h-5 text-[#1D2956]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1D2956] text-sm font-bold">{label}</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4.5 h-4.5 text-gray-300 flex-shrink-0" />
              </motion.button>
            ))}
          </motion.div>

          {/* Premium Order History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 2.0
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                delay: 2.1
              }}
              className="flex items-center justify-between mb-4"
            >
              <h2 className="text-[#1D2956] text-lg font-bold flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE]/15 to-[#6B7FFF]/15 flex items-center justify-center shadow-md">
                  <ShoppingBag className="w-5 h-5 text-[#536DFE]" />
                </div>
                Order History
              </h2>
              <span className="text-gray-400 text-xs font-semibold">{orderHistory.length} orders</span>
            </motion.div>

            {orderHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 2.2
                }}
                className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 p-10 text-center shadow-xl shadow-black/5"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <ShoppingBag className="w-10 h-10 text-[#536DFE]/40" />
                </div>
                <p className="text-[#1D2956] font-bold text-base mb-1">No Completed Orders Yet</p>
                <p className="text-gray-400 text-sm">Your order history will appear here</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {orderHistory.slice(0, 5).map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 2.2 + index * 0.08
                    }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ willChange: 'transform' }}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-[#536DFE]/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-white/60 shadow-lg brand-image-filter">
                        <img
                          src={order.restaurants?.image_url || '/placeholder.svg'}
                          alt={order.restaurants?.name}
                          className="w-full h-full object-cover brand-image-fade"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1D2956] font-bold text-sm truncate">{order.restaurants?.name}</p>
                        <p className="text-gray-400 text-[11px] mt-1 flex items-center gap-2">
                          <span className="capitalize font-medium">{order.order_type?.replace('_', ' ')}</span>
                          <span>·</span>
                          <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </p>
                        {Array.isArray(order.order_items) && order.order_items.length > 0 && (
                          <p className="text-gray-400 text-[10px] mt-1 line-clamp-1">
                            {order.order_items.slice(0, 2).map((i: any) => i.name).join(', ')}
                            {order.order_items.length > 2 && ` +${order.order_items.length - 2} more`}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#536DFE] font-bold text-base">{formatCurrency(order.total_amount)}</p>
                        <span className="inline-block bg-gradient-to-r from-green-100 to-green-50 text-green-600 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full mt-1.5 border border-green-200">Done</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {orderHistory.length > 5 && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 2.6
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 text-[#536DFE] text-xs font-bold uppercase tracking-[0.2em] hover:text-[#6B7FFF] transition-colors bg-white/95 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg hover:shadow-xl"
                  >
                    View All Orders →
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <BottomNav />
    </div>
      </PageTransition>
    </>
  );
};

export default Profile;
