import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Shield, User as UserIcon, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  user_id: string;
  full_name: string;
  phone: string | null;
  role: string;
  created_at: string;
}

const AdminUsers = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'restaurant_owner' | 'admin'>('all');

  // Detail and creation dialogs state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailEmail, setDetailEmail] = useState<string>('');
  const [detailRestaurantId, setDetailRestaurantId] = useState<string | null>(null);
  const [detailRestaurantName, setDetailRestaurantName] = useState<string | null>(null);
  const [detailName, setDetailName] = useState<string>('');
  const [detailPhone, setDetailPhone] = useState<string>('');
  const [detailRole, setDetailRole] = useState<string>('customer');

  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState<'customer' | 'restaurant_owner' | 'admin'>('customer');
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRestaurantId, setCreateRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      navigate('/auth');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
   if (user && userRole === 'admin') {
     fetchUsers();
     fetchRestaurants();
   }
 }, [user, userRole]);

  useEffect(() => {
    const search = searchQuery.toLowerCase();

    const filtered = users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(search) ||
        u.role.toLowerCase().includes(search) ||
        (u.phone && u.phone.toLowerCase().includes(search)) ||
        u.user_id.toLowerCase().includes(search);

      const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    console.log('🔍 Fetching users and details via RPC...');

    try {
      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('❌ Error fetching user roles:', rolesError);
        toast.error('Failed to load users');
        return;
      }

      if (!userRoles || userRoles.length === 0) {
        console.log('ℹ️ No users found in user_roles table');
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      const userIds = userRoles.map((r) => r.user_id);

      // Fetch customer/user details via RPC (name, email, phone)
      type UserDetail = { user_id: string; full_name: string | null; email: string | null; phone: string | null };
      let details: UserDetail[] = [];
      try {
        let rpc = await supabase.rpc('get_order_customers_fallback', { customer_ids: userIds });
        if (rpc.error) {
          console.warn('⚠️ get_order_customers_fallback not available, trying get_order_customers:', rpc.error.message);
          rpc = await supabase.rpc('get_order_customers', { customer_ids: userIds });
        }
        if (rpc.error) {
          console.error('❌ Error fetching user details via RPC:', rpc.error);
          toast.error('Failed to load some user details');
        } else {
          details = (rpc.data as UserDetail[]) || [];
        }
      } catch (e) {
        console.error('❌ Unexpected RPC error:', e);
      }

      const detailMap = new Map(details.map((d) => [d.user_id, d]));

      // Create final users data
      const usersData: User[] = userRoles.map((role) => {
        const d = detailMap.get(role.user_id);
        const displayName = d?.full_name?.trim()
          ? d.full_name.trim()
          : `User ${role.user_id.substring(0, 8)}`;

        return {
          user_id: role.user_id,
          full_name: displayName,
          phone: d?.phone || null,
          role: role.role,
          created_at: role.created_at,
        };
      });

      console.log('📊 Final users data (via RPC):', {
        total: usersData.length,
        withRealNames: usersData.filter((u) => !u.full_name.startsWith('User ')).length,
        withPhones: usersData.filter((u) => u.phone).length,
      });

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('❌ Unexpected error in fetchUsers:', error);
      toast.error('An unexpected error occurred while loading users');
    }
  };

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('❌ Error fetching restaurants:', error);
        return;
      }

      setRestaurants(data || []);
    } catch (error) {
      console.error('❌ Unexpected error fetching restaurants:', error);
    }
  };

  const handleViewDetails = async (user: User) => {
    console.log('👁️ Opening user details for:', user.user_id.substring(0, 8));
    setSelectedUser(user);
    setDetailName(user.full_name);
    setDetailPhone(user.phone || '');
    setDetailRole(user.role);

    // Fetch email via RPC
    try {
      let rpc = await supabase.rpc('get_order_customers_fallback', { customer_ids: [user.user_id] });
      if (rpc.error) {
        rpc = await supabase.rpc('get_order_customers', { customer_ids: [user.user_id] });
      }
      if (!rpc.error && rpc.data && rpc.data.length > 0) {
        setDetailEmail(rpc.data[0].email || 'Email not available');
      } else {
        setDetailEmail('Email not available');
      }
    } catch (e) {
      setDetailEmail('Email not available');
    }

    // Fetch linked restaurant if role is restaurant_owner
    setDetailRestaurantId(null);
    setDetailRestaurantName(null);

    if (user.role === 'restaurant_owner') {
      try {
        // First try: use restaurants table where owner_id matches this user
        const { data: ownedRestaurants, error: ownedError } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('owner_id', user.user_id)
          .limit(1)
          .maybeSingle();

        if (!ownedError && ownedRestaurants) {
          setDetailRestaurantId(ownedRestaurants.id);
          setDetailRestaurantName(ownedRestaurants.name || 'Linked Restaurant');
        } else {
          // Fallback: legacy/link-table based relationship via restaurant_owners
          const { data: ownerData, error: relError } = await supabase
            .from('restaurant_owners')
            .select('restaurant_id, restaurants(name)')
            .eq('user_id', user.user_id)
            .maybeSingle();

          if (!relError && ownerData) {
            setDetailRestaurantId(ownerData.restaurant_id);
            setDetailRestaurantName((ownerData.restaurants as any)?.name || 'Linked Restaurant');
          }
        }
      } catch (e) {
        console.error('❌ Error fetching restaurant for owner:', e);
      }
    }

    setIsDetailOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: detailName.trim(),
          phone: detailPhone.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.user_id);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        toast.error('Failed to update user profile');
        return;
      }

      // Update role if changed
      if (detailRole !== selectedUser.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: detailRole })
          .eq('user_id', selectedUser.user_id);

        if (roleError) {
          console.error('❌ Error updating role:', roleError);
          toast.error('Failed to update user role');
          return;
        }

        // Handle restaurant owner role change
        if (detailRole === 'restaurant_owner' && detailRestaurantId) {
          // Add or update restaurant_owners entry
          const { error: ownerError } = await supabase
            .from('restaurant_owners')
            .upsert({
              user_id: selectedUser.user_id,
              restaurant_id: detailRestaurantId,
              created_at: new Date().toISOString()
            });

          if (ownerError) {
            console.error('❌ Error linking restaurant:', ownerError);
            toast.error('Failed to link restaurant');
            return;
          }
        } else if (selectedUser.role === 'restaurant_owner' && detailRole !== 'restaurant_owner') {
          // Remove restaurant_owners entry
          await supabase
            .from('restaurant_owners')
            .delete()
            .eq('user_id', selectedUser.user_id);
        }
      }

      toast.success('User updated successfully');
      setIsDetailOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('❌ Unexpected error updating user:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting user:', selectedUser.user_id.substring(0, 8), 'with role:', selectedUser.role);

      // Delete from restaurant_owners if applicable (check for any restaurant ownership, not just current role)
      console.log('🔄 Checking for restaurant ownership...');
      const { data: ownershipData, error: ownershipCheckError } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('user_id', selectedUser.user_id);

      if (!ownershipCheckError && ownershipData && ownershipData.length > 0) {
        console.log('🔄 Removing restaurant ownership links...');
        const { error: ownerError } = await supabase
          .from('restaurant_owners')
          .delete()
          .eq('user_id', selectedUser.user_id);

        if (ownerError) {
          console.error('❌ Error deleting restaurant ownership:', ownerError);
          toast.error(`Failed to remove restaurant links: ${ownerError.message}`);
          return;
        }
        console.log('✅ Restaurant ownership removed');
      }

      // Delete from user_roles
      console.log('🔄 Deleting user role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (roleError) {
        console.error('❌ Error deleting user role:', roleError);
        toast.error(`Failed to delete user role: ${roleError.message}`);
        return;
      }
      console.log('✅ User role deleted');

      // Delete profile
      console.log('🔄 Deleting user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.user_id);

      if (profileError) {
        console.error('❌ Error deleting profile:', profileError);
        toast.error(`Failed to delete user profile: ${profileError.message}`);
        return;
      }
      console.log('✅ User profile deleted');

      // Optionally delete from auth.users (this might require service role)
      try {
        console.log('🔄 Attempting to delete auth user...');
        const { error: authError } = await supabase.auth.admin.deleteUser(selectedUser.user_id);
        if (authError) {
          console.warn('⚠️ Could not delete auth user (service role required):', authError.message);
          // This is not critical - the user won't appear in admin panel anyway
        } else {
          console.log('✅ Auth user deleted');
        }
      } catch (authDeleteError) {
        console.warn('⚠️ Auth user deletion not available:', authDeleteError);
        // Not critical
      }

      console.log('🎉 User deletion complete');
      toast.success('User deleted successfully');
      setIsDetailOpen(false);
      
      // Give a small delay to ensure database transactions are complete
      setTimeout(() => {
        fetchUsers();
      }, 500);
      
    } catch (error) {
      console.error('❌ Unexpected error deleting user:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleCreateUser = async () => {
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('🔄 Creating user without auth signup to prevent session interference...');
      console.log('🔄 Selected role for new user:', createRole);
      
      // Store current admin session for verification
      const currentSession = await supabase.auth.getSession();
      const adminUser = currentSession.data.session?.user;
      
      if (!adminUser) {
        toast.error('Admin session not found');
        return;
      }

      console.log('👨‍💼 Current admin:', adminUser.email, 'ID:', adminUser.id.substring(0, 8));

      // Call Supabase Edge Function to create user without affecting admin session
      console.log('🔄 Creating user via edge function...');
      const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: createEmail.trim(),
          password: createPassword.trim(),
          full_name: createName.trim(),
          phone: createPhone.trim() || null,
          role: createRole,
          restaurant_id: createRestaurantId,
        },
      });

      if (fnError) {
        console.error('❌ Edge function error:', fnError);
        toast.error(fnError.message || 'Failed to create user');
        return;
      }

      console.log('✅ Edge function result:', fnData);

      // 5. Verify admin session is still intact (should be unchanged)
      const verifySession = await supabase.auth.getSession();
      if (verifySession.data.session?.user?.id === adminUser.id) {
        console.log('✅ Admin session remained intact:', verifySession.data.session.user.email);
      } else {
        console.error('❌ Admin session was somehow changed!');
      }

      console.log('🎉 User creation complete without session interference');
      toast.success(`${createRole.charAt(0).toUpperCase() + createRole.slice(1)} user created successfully`);
      
      // Reset form
      setIsCreateOpen(false);
      setCreateRole('customer');
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreatePhone('');
      setCreateRestaurantId(null);
      
      // Refresh user list
      fetchUsers();

    } catch (error) {
      console.error('❌ Unexpected error creating user:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Creating profile for user:', userId.substring(0, 8));
      
      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: createName.trim(),
          phone: createPhone.trim() || null,
          updated_at: new Date().toISOString()
        })
        .select();

      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
        toast.error(`Failed to create user profile: ${profileError.message}`);
        return;
      }

      console.log('✅ Profile created successfully:', profileData);

      // Create user role
      console.log('🔄 Creating user role:', createRole);
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: createRole,
          created_at: new Date().toISOString()
        })
        .select();

      if (roleError) {
        console.error('❌ Error creating user role:', roleError);
        toast.error(`Failed to assign user role: ${roleError.message}`);
        return;
      }

      console.log('✅ User role created successfully:', roleData);

      // Handle restaurant owner linking
      if (createRole === 'restaurant_owner' && createRestaurantId) {
        console.log('🔄 Linking restaurant:', createRestaurantId);
        const { data: ownerData, error: ownerError } = await supabase
          .from('restaurant_owners')
          .insert({
            user_id: userId,
            restaurant_id: createRestaurantId,
            created_at: new Date().toISOString()
          })
          .select();

        if (ownerError) {
          console.error('❌ Error linking restaurant:', ownerError);
          toast.error('User created but failed to link restaurant');
        } else {
          console.log('✅ Restaurant linked successfully:', ownerData);
        }
      }

      console.log('🎉 User creation complete, refreshing user list...');
      toast.success('User created successfully');
      setIsCreateOpen(false);
      setCreateRole('customer');
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreatePhone('');
      setCreateRestaurantId(null);
      
      // Give a small delay to ensure database transactions are complete
      setTimeout(() => {
        fetchUsers();
      }, 500);
      
    } catch (error) {
      console.error('❌ Unexpected error creating user profile:', error);
      toast.error('An unexpected error occurred while creating user profile');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any } } = {
      admin: { variant: 'destructive', icon: Shield },
      restaurant_owner: { variant: 'default', icon: UserIcon },
      customer: { variant: 'secondary', icon: UserIcon },
    };

    const config = variants[role] || variants.customer;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getRoleStats = () => {
    const admins = users.filter(u => u.role === 'admin').length;
    const owners = users.filter(u => u.role === 'restaurant_owner').length;
    const customers = users.filter(u => u.role === 'customer').length;
    return { admins, owners, customers };
  };

  const stats = getRoleStats();

  if (loading || !user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage all registered users</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Restaurant Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.owners}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-secondary" />
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.customers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Role Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative md:flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="md:w-64">
                
                <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="restaurant_owner">Restaurant Owner</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{u.full_name}</span>
                          <span className="text-xs text-muted-foreground">{u.phone ? u.phone : `ID: ${u.user_id.substring(0, 8)}...`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{u.phone || 'N/A'}</span>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(u)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="detail-name">Full Name</Label>
                    <Input
                      id="detail-name"
                      value={detailName}
                      onChange={(e) => setDetailName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="detail-phone">Phone</Label>
                    <Input
                      id="detail-phone"
                      value={detailPhone}
                      onChange={(e) => setDetailPhone(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="detail-email">Email</Label>
                    <Input
                      id="detail-email"
                      value={detailEmail}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="detail-role">Role</Label>
                    <Select value={detailRole} onValueChange={setDetailRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="restaurant_owner">Restaurant Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {detailRole === 'restaurant_owner' && detailRestaurantId && detailRestaurantName && (
                  <div>
                    <Label>Linked Restaurant</Label>
                    <p className="mt-1 text-sm font-medium">{detailRestaurantName}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">User ID</Label>
                      <p className="font-mono">{selectedUser.user_id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Registration Date</Label>
                      <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditUser} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-name">Full Name *</Label>
                  <Input
                    id="create-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="create-phone">Phone</Label>
                  <Input
                    id="create-phone"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-email">Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="create-password">Password *</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="create-role">Role *</Label>
                <Select value={createRole} onValueChange={(value: any) => setCreateRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="restaurant_owner">Restaurant Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createRole === 'restaurant_owner' && (
                <div>
                  <Label htmlFor="create-restaurant">Link to Restaurant</Label>
                  <Select value={createRestaurantId || ''} onValueChange={setCreateRestaurantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a restaurant (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {restaurant.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can link the user to a restaurant later if needed
                  </p>
                </div>
              )}

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  * Required fields. The user will receive an email confirmation to activate their account.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
