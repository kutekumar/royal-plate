import { useEffect, useState, useRef } from 'react';
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
import gsap from 'gsap';
import { formatCurrency } from '@/utils/currency';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });

  const { loading: loyaltyLoading, summary, badgeLabel, badgeDescription, badgeIcon } = useCustomerLoyalty();

  const headerRef = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Entrance animations
  useEffect(() => {
    if (!profile) return;
    
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    tl.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 }
    )
    .fromTo(
      profileCardRef.current,
      { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(
      statsRef.current?.children || [],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
      '-=0.2'
    )
    .fromTo(
      contentRef.current?.children || [],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 },
      '-=0.2'
    );
  }, [profile]);

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
    await signOut();
    navigate('/auth');
    toast.success('Signed out successfully');
  };

  const totalSpent = orderHistory.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const initials = (profile?.full_name || user?.email || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently';

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#F5F5F7] font-poppins">

      {/* ── Header ── */}
      <div ref={headerRef} className="flex items-center justify-between px-5 pt-6 pb-3 z-10 bg-[#F5F5F7]">
        <div>
          <h1 className="text-[#1D2956] text-xl font-bold tracking-tight leading-none">Account</h1>
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.25em] mt-0.5">Manage your profile</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-[#536DFE]/10 hover:bg-[#536DFE]/20 border border-[#536DFE]/20 rounded-2xl px-3.5 py-2 transition-all"
        >
          <LogOut className="w-4 h-4 text-[#536DFE]" />
          <span className="text-[#536DFE] text-xs font-bold">Sign Out</span>
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">

        {/* ── Profile Card ── */}
        <div ref={profileCardRef} className="px-5 mb-4">
          <div className="bg-white rounded-3xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#1D2956] flex items-center justify-center shadow-lg shadow-[#536DFE]/30">
                  <span className="text-white text-2xl font-bold">{initials}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-[#536DFE] flex items-center justify-center shadow-md shadow-[#536DFE]/30 text-white">
                  {getBadgeIconNode('w-4 h-4')}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[#1D2956] text-xl font-bold leading-tight">
                      {profile?.full_name || 'User'}
                    </h2>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="w-9 h-9 rounded-xl bg-[#536DFE]/10 hover:bg-[#536DFE]/20 flex items-center justify-center transition-all"
                  >
                    <Edit2 className="w-4 h-4 text-[#536DFE]" />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#536DFE] to-[#1D2956] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md shadow-[#536DFE]/30">
                    {getBadgeIconNode('w-3 h-3')}
                    {loyaltyLoading ? 'Loading...' : badgeLabel || 'Newbie'}
                  </span>
                  {summary && (
                    <span className="inline-flex items-center gap-1.5 bg-[#536DFE]/10 text-[#536DFE] text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#536DFE]/20">
                      <Sparkles className="w-3 h-3" />
                      {summary.total_points} pts
                    </span>
                  )}
                </div>
              </div>
            </div>

            {badgeDescription && (
              <p className="text-gray-400 text-xs mt-4 bg-gray-50 rounded-2xl px-4 py-3 leading-relaxed">
                {badgeDescription}
              </p>
            )}
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div ref={statsRef} className="px-5 mb-4 grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#1D2956] to-[#1D2956]/90 rounded-2xl p-4 shadow-lg shadow-[#1D2956]/20">
            <TrendingUp className="w-6 h-6 text-white/40 mb-3" />
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Total Spent</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="bg-gradient-to-br from-[#536DFE] to-[#536DFE]/90 rounded-2xl p-4 shadow-lg shadow-[#536DFE]/20">
            <ShoppingBag className="w-6 h-6 text-white/40 mb-3" />
            <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Orders</p>
            <p className="text-white text-2xl font-bold">{orderHistory.length}</p>
          </div>
        </div>

        {/* ── Edit Form ── */}
        {isEditing && (
          <div className="px-5 mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="text-[#1D2956] font-bold text-sm uppercase tracking-wider">Edit Profile</h3>
              <div className="space-y-2">
                <Label className="text-gray-500 text-xs uppercase tracking-wider">Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="border-gray-200 text-[#1D2956] focus:border-[#536DFE] focus:ring-[#536DFE]/20 rounded-xl h-11"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500 text-xs uppercase tracking-wider">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-gray-200 text-[#1D2956] focus:border-[#536DFE] focus:ring-[#536DFE]/20 rounded-xl h-11"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 bg-[#536DFE] hover:bg-[#536DFE]/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#536DFE]/30"
                >
                  <Check className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div ref={contentRef} className="px-5 space-y-4">
          
          {/* ── Account Info ── */}
          {!isEditing && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-wider">Account Info</h3>
              </div>
              {[
                { icon: User, label: 'Name', value: profile?.full_name || 'Not set' },
                { icon: Mail, label: 'Email', value: user?.email || '' },
                { icon: Phone, label: 'Phone', value: profile?.phone || 'Not set' },
                { icon: Calendar, label: 'Member Since', value: memberSince },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#536DFE]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#536DFE]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">{label}</p>
                    <p className="text-[#1D2956] text-sm font-semibold truncate">{value}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-[#1D2956] font-bold text-xs uppercase tracking-wider">Quick Actions</h3>
            </div>
            {[
              { icon: Award, label: 'Loyalty Rewards', desc: 'View your points & badges', action: () => {} },
              { icon: MapPin, label: 'Saved Addresses', desc: 'Manage delivery locations', action: () => {} },
              { icon: Settings, label: 'Preferences', desc: 'App settings & notifications', action: () => {} },
            ].map(({ icon: Icon, label, desc, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1D2956]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#1D2956]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1D2956] text-sm font-semibold">{label}</p>
                  <p className="text-gray-400 text-[11px]">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* ── Order History ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#1D2956] text-base font-bold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#536DFE]" />
                Order History
              </h2>
              <span className="text-gray-400 text-xs">{orderHistory.length} orders</span>
            </div>

            {orderHistory.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#536DFE]/10 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-7 h-7 text-[#536DFE]/40" />
                </div>
                <p className="text-[#1D2956] font-semibold text-sm">No completed orders yet</p>
                <p className="text-gray-400 text-xs mt-1">Your order history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderHistory.slice(0, 5).map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-[#536DFE]/20 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 p-3.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                        <img
                          src={order.restaurants?.image_url || '/placeholder.svg'}
                          alt={order.restaurants?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1D2956] font-bold text-sm truncate">{order.restaurants?.name}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                          <span className="capitalize">{order.order_type?.replace('_', ' ')}</span>
                          <span>·</span>
                          <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </p>
                        {Array.isArray(order.order_items) && order.order_items.length > 0 && (
                          <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">
                            {order.order_items.slice(0, 2).map((i: any) => i.name).join(', ')}
                            {order.order_items.length > 2 && ` +${order.order_items.length - 2} more`}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#536DFE] font-bold text-sm">{formatCurrency(order.total_amount)}</p>
                        <span className="inline-block bg-green-100 text-green-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1">Done</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {orderHistory.length > 5 && (
                  <button className="w-full py-3 text-[#536DFE] text-xs font-bold uppercase tracking-wider hover:text-[#536DFE]/70 transition-colors">
                    View All Orders →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
