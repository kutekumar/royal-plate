import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, Phone, Mail, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        .select(
          `
          *,
          restaurants (
            name,
            image_url,
            address
          ),
          order_items
        `
        )
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-6 py-6">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full luxury-gradient flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{profile?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateProfile}
                  className="flex-1 luxury-gradient"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{profile?.full_name || 'Not set'}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{profile?.phone || 'Not set'}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Orders History Summary & List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Orders History</h2>

          {/* Highlight total spent */}
          <Card className="p-4 luxury-gradient text-white flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide opacity-80">
                Total Spent
              </p>
              <p className="text-2xl font-semibold">
                {orderHistory.reduce(
                  (sum, o) => sum + (o.total_amount || 0),
                  0
                ).toLocaleString()}{' '}
                MMK
              </p>
            </div>
            <div className="text-right text-[10px] opacity-80">
              <p>Completed orders only</p>
              <p>{orderHistory.length} orders</p>
            </div>
          </Card>

          {orderHistory.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              No completed orders yet. Once your orders are completed, they will appear here.
            </Card>
          ) : (
            <Card className="p-0">
              <ScrollArea className="max-h-72">
                <div className="divide-y">
                  {orderHistory.map((order) => (
                    <div
                      key={order.id}
                      className="px-4 py-3 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={order.restaurants?.image_url}
                          alt={order.restaurants?.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {order.restaurants?.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground capitalize">
                                {order.order_type?.replace('_', ' ')} •{' '}
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-primary">
                                {order.total_amount?.toLocaleString()} MMK
                              </p>
                              <Badge className="mt-1 bg-gray-500 text-white border-0 text-[9px]">
                                Completed
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order items summary */}
                      {Array.isArray(order.order_items) && order.order_items.length > 0 && (
                        <div className="pl-13 text-[10px] text-muted-foreground leading-snug">
                          {order.order_items
                            .map(
                              (item: any) =>
                                `${item.name} x${item.quantity}`
                            )
                            .join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>

        {/* Sign Out Button moved to header */}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
