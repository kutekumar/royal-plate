import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  TrendingUp
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
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });

  const { loading: loyaltyLoading, summary, badgeLabel, badgeDescription, badgeIcon } = useCustomerLoyalty();

  const getBadgeIconNode = () => {
    const base = 'w-5 h-5';
    switch (badgeIcon) {
      case 'compass':
        return <Compass className={base} />;
      case 'star':
        return <StarIcon className={base} />;
      case 'shield':
        return <Shield className={base} />;
      case 'crown':
        return <Crown className={base} />;
      case 'sparkles':
      default:
        return <Sparkles className={base} />;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOrderHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || ''
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrderHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (
            name,
            image_url,
            address
          ),
          order_items
        `)
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrderHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching order history:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    toast.success('Signed out successfully');
  };

  const totalSpent = orderHistory.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#1d2956] max-w-[430px] mx-auto pb-20">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-b from-[#caa157]/20 to-transparent px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[#caa157] text-2xl font-bold tracking-wide">Profile</h1>
          <button
            onClick={handleSignOut}
            className="bg-[#263569]/40 backdrop-blur-md rounded-full p-2 flex items-center justify-center border border-[#caa157]/20 hover:bg-[#263569]/60 transition-all"
          >
            <LogOut className="w-5 h-5 text-[#caa157]" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#caa157] to-[#8b7039] flex items-center justify-center">
                <User className="w-10 h-10 text-[#1d2956]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1d2956] border-2 border-[#caa157] flex items-center justify-center">
                {getBadgeIconNode()}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-white text-xl font-bold mb-1">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-slate-400 text-sm mb-3">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#caa157]/10 border border-[#caa157]/30">
                  {getBadgeIconNode()}
                  <span className="text-[#caa157] text-xs font-semibold">
                    {loyaltyLoading ? 'Loading...' : badgeLabel || 'Newbie'}
                  </span>
                </div>
                {summary && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#caa157]/10 border border-[#caa157]/30">
                    <Sparkles className="w-3 h-3 text-[#caa157]" />
                    <span className="text-[#caa157] text-xs font-semibold">
                      {summary.total_points} pts
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#caa157] hover:text-[#caa157]/80 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>

          {badgeDescription && (
            <div className="text-xs text-slate-400 bg-[#caa157]/5 rounded-lg px-3 py-2 mb-4">
              {badgeDescription}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-[#caa157] text-xs uppercase tracking-wider">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-[#263569]/30 border-[#caa157]/20 text-white focus:border-[#caa157]/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#caa157] text-xs uppercase tracking-wider">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#263569]/30 border-[#caa157]/20 text-white focus:border-[#caa157]/60"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 bg-[#caa157] hover:bg-[#caa157]/90 text-[#1d2956] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-[#263569]/40 border border-[#caa157]/40 hover:bg-[#263569]/60 text-[#caa157] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm bg-[#263569]/30 rounded-lg p-3">
                <User className="h-4 w-4 text-[#caa157]" />
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-medium">{profile?.full_name || 'Not set'}</span>
              </div>

              <div className="flex items-center gap-3 text-sm bg-[#263569]/30 rounded-lg p-3">
                <Mail className="h-4 w-4 text-[#caa157]" />
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-medium truncate">{user?.email}</span>
              </div>

              <div className="flex items-center gap-3 text-sm bg-[#263569]/30 rounded-lg p-3">
                <Phone className="h-4 w-4 text-[#caa157]" />
                <span className="text-slate-400">Phone:</span>
                <span className="text-white font-medium">{profile?.phone || 'Not set'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-gradient-to-br from-[#caa157] to-[#8b7039] rounded-2xl p-6 text-[#1d2956]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold opacity-80 mb-1">
                Total Spent
              </p>
              <p className="text-3xl font-bold">
                ${totalSpent.toFixed(2)}
              </p>
              <p className="text-xs opacity-80 mt-1">
                {orderHistory.length} completed orders
              </p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-40" />
          </div>
        </div>

        {/* Order History */}
        <div>
          <h2 className="text-[#caa157] text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Order History
          </h2>

          {orderHistory.length === 0 ? (
            <div className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-[#caa157]/30 mx-auto mb-3" />
              <p className="text-slate-400">No completed orders yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Your order history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orderHistory.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#263569]/20 border border-[#caa157]/20 rounded-2xl p-4 hover:border-[#caa157]/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={order.restaurants?.image_url}
                      alt={order.restaurants?.name}
                      className="w-14 h-14 rounded-lg object-cover border border-[#caa157]/20"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold">
                            {order.restaurants?.name}
                          </p>
                          <p className="text-[#caa157]/70 text-xs capitalize">
                            {order.order_type?.replace('_', ' ')} • {' '}
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#caa157] font-bold">
                            ${order.total_amount?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Order items summary */}
                      {Array.isArray(order.order_items) && order.order_items.length > 0 && (
                        <div className="mt-2 text-xs text-slate-400 line-clamp-1">
                          {order.order_items
                            .map((item: any) => `${item.name} x${item.quantity}`)
                            .join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
