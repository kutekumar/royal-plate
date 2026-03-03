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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCustomerLoyalty } from '@/hooks/useCustomerLoyalty';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });

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
    await signOut();
    navigate('/auth');
    toast.success('Signed out successfully');
  };

  const totalSpent = orderHistory.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const initials = (profile?.full_name || user?.email || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#F5F5F7] max-w-[430px] mx-auto pb-24 font-poppins">

      {/* ── Top Navy Header Banner ── */}
      <div className="bg-[#1D2956] px-6 pt-12 pb-20">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-white text-2xl font-bold tracking-wide">My Profile</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2 transition-all"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-semibold">Sign Out</span>
          </button>
        </div>
        <p className="text-white/50 text-sm">Manage your account and preferences</p>
      </div>

      {/* ── Profile Card (floats over header) ── */}
      <div className="px-6 -mt-12 mb-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-[#1D2956] flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#536DFE] flex items-center justify-center shadow-md text-white">
                {getBadgeIconNode('w-4 h-4')}
              </div>
            </div>

            {/* Name & badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[#1D2956] text-xl font-bold leading-tight">
                    {profile?.full_name || 'User'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{user?.email}</p>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="text-[#536DFE] hover:text-[#536DFE]/70 transition-colors ml-2 mt-0.5">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-[#1D2956] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
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
            <p className="text-gray-400 text-xs mt-4 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
              {badgeDescription}
            </p>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="px-6 mb-4 grid grid-cols-2 gap-3">
        <div className="bg-[#1D2956] rounded-2xl p-4 flex flex-col justify-between">
          <TrendingUp className="w-6 h-6 text-white/40 mb-3" />
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Total Spent</p>
          <p className="text-white text-2xl font-bold">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-[#536DFE] rounded-2xl p-4 flex flex-col justify-between">
          <ShoppingBag className="w-6 h-6 text-white/40 mb-3" />
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Orders</p>
          <p className="text-white text-2xl font-bold">{orderHistory.length}</p>
        </div>
      </div>

      {/* ── Edit Form ── */}
      {isEditing && (
        <div className="px-6 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 className="text-[#1D2956] font-bold text-sm uppercase tracking-wider">Edit Profile</h3>
            <div className="space-y-2">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="border-gray-200 text-[#1D2956] focus:border-[#536DFE] focus:ring-[#536DFE]/20 rounded-xl"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-gray-200 text-[#1D2956] focus:border-[#536DFE] focus:ring-[#536DFE]/20 rounded-xl"
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleUpdateProfile}
                className="flex-1 bg-[#1D2956] hover:bg-[#1D2956]/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
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

      {/* ── Account Info ── */}
      {!isEditing && (
        <div className="px-6 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-[#1D2956] font-bold text-sm uppercase tracking-wider">Account Info</h3>
            </div>
            {[
              { icon: User, label: 'Name', value: profile?.full_name || 'Not set' },
              { icon: Mail, label: 'Email', value: user?.email || '' },
              { icon: Phone, label: 'Phone', value: profile?.phone || 'Not set' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-[#1D2956]/8 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#1D2956]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-[#1D2956] text-sm font-semibold truncate">{value}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Order History ── */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#1D2956] text-base font-bold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#536DFE]" />
            Order History
          </h2>
          <span className="text-gray-400 text-xs">{orderHistory.length} orders</span>
        </div>

        {orderHistory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#1D2956]/5 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-7 h-7 text-[#1D2956]/30" />
            </div>
            <p className="text-[#1D2956] font-semibold text-sm">No completed orders yet</p>
            <p className="text-gray-400 text-xs mt-1">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderHistory.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-[#536DFE]/20">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <img
                      src={order.restaurants?.image_url}
                      alt={order.restaurants?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1D2956] font-bold text-sm truncate">{order.restaurants?.name}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5 capitalize">
                      {order.order_type?.replace('_', ' ')} • {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {Array.isArray(order.order_items) && order.order_items.length > 0 && (
                      <p className="text-gray-400 text-[10px] mt-1 line-clamp-1">
                        {order.order_items.map((i: any) => `${i.name} ×${i.quantity}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#536DFE] font-bold text-sm">${order.total_amount?.toFixed(2)}</p>
                    <span className="inline-block bg-green-100 text-green-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1">Done</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
