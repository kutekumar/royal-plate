import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Search, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Owner {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  restaurant_id: string | null;
  restaurant_name: string | null;
  restaurant_address: string | null;
}

interface Restaurant {
  id: string;
  name: string;
}

const AdminOwners = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    ownerId: '',
    restaurantId: '',
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      navigate('/auth');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchOwners();
      fetchRestaurants();
    }
  }, [user, userRole]);

  useEffect(() => {
    const filtered = owners.filter((owner) =>
      owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (owner.restaurant_name && owner.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredOwners(filtered);
  }, [searchQuery, owners]);

  const fetchOwners = async () => {
    try {
      // Prefer the server-side view via RPC to ensure we get the OWNER email (not restaurant email)
      // This returns: user_id, full_name, email, phone, restaurant_id, restaurant_name
      const { data: ownersData, error: ownersError } = await supabase.rpc('get_restaurant_owners');
      if (!ownersError && ownersData && ownersData.length > 0) {
        const ownersList = ownersData || [];
        const restaurantIds = Array.from(new Set(ownersList.map((o: any) => o.restaurant_id).filter(Boolean)));
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurants')
          .select('id, address')
          .in('id', restaurantIds);
        if (restaurantsError) {
          console.error('Failed to fetch restaurant addresses:', restaurantsError);
        }
        const addressMap = new Map<string, string | null>((restaurantsData || []).map((r: any) => [r.id, r.address ?? null]));
        const assembledOwners: Owner[] = ownersList.map((row: any) => ({
          user_id: row.user_id,
          full_name: row.full_name ?? 'Unnamed Owner',
          email: row.email ?? 'Email not available',
          phone: row.phone ?? null,
          restaurant_id: row.restaurant_id ?? null,
          restaurant_name: row.restaurant_name ?? null,
          restaurant_address: row.restaurant_id ? (addressMap.get(row.restaurant_id) ?? null) : null,
        }));
        setOwners(assembledOwners);
        setFilteredOwners(assembledOwners);
        return;
      }

      // Fallback path if RPC is missing or returns empty
      console.warn('RPC get_restaurant_owners unavailable or empty; falling back. Error:', ownersError);

      // 1) Get restaurant owner user IDs
      const { data: ownerRoles, error: ownerRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'restaurant_owner');
      if (ownerRolesError) {
        console.error('Failed to load owner roles:', ownerRolesError);
        toast.error('Failed to load owners');
        return;
      }
      const ownerIds = Array.from(new Set((ownerRoles ?? []).map((role) => role.user_id).filter((id): id is string => Boolean(id))));
      if (ownerIds.length === 0) {
        setOwners([]);
        setFilteredOwners([]);
        return;
      }

      // 2) Profiles
      const { data: profileRows, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', ownerIds);
      if (profilesError) {
        console.error('Failed to load owner profiles:', profilesError);
      }

      // 3) Emails via get_user_emails or fallback
      let emailMap = new Map<string, string>();
      try {
        const { data: emailsData, error: emailsError } = await supabase
          .rpc('get_user_emails', { user_ids: ownerIds });
        if (!emailsError && emailsData) {
          emailMap = new Map((emailsData ?? []).filter((row: any) => row.email).map((row: any) => [row.user_id, row.email]));
        } else {
          console.warn('RPC get_user_emails failed, attempting direct fallback:', emailsError);
          const { data: fallbackEmails, error: fallbackError } = await supabase
            .from('user_emails')
            .select('user_id, email')
            .in('user_id', ownerIds);
          if (!fallbackError && fallbackEmails) {
            emailMap = new Map((fallbackEmails ?? []).map((row: any) => [row.user_id, row.email]));
          }
        }
      } catch (e) {
        console.warn('Error getting emails via RPC/fallback:', e);
      }

      // 4) Restaurants and address
      const { data: restaurantRows, error: restaurantsError2 } = await supabase
        .from('restaurants')
        .select('id, name, address, owner_id')
        .in('owner_id', ownerIds);
      if (restaurantsError2) {
        console.error('Failed to load restaurants for owners:', restaurantsError2);
        toast.error('Failed to load owners');
        return;
      }

      const profileMap = new Map(
        (profileRows ?? []).map((profile) => [
          profile.id,
          { fullName: profile.full_name ?? 'Unnamed Owner', phone: profile.phone ?? null },
        ])
      );
      const restaurantMap = new Map<string, { id: string; name: string; address: string | null }>();
      (restaurantRows ?? []).forEach((restaurant: any) => {
        if (restaurant.owner_id) {
          restaurantMap.set(restaurant.owner_id, {
            id: restaurant.id,
            name: restaurant.name ?? 'Unnamed Restaurant',
            address: restaurant.address ?? null,
          });
        }
      });

      const assembledOwners: Owner[] = ownerIds.map((ownerId) => {
        const profile = profileMap.get(ownerId);
        const email = emailMap.get(ownerId) ?? 'Email not available';
        const restaurant = restaurantMap.get(ownerId);
        return {
          user_id: ownerId,
          full_name: profile?.fullName ?? 'Unnamed Owner',
          email,
          phone: profile?.phone ?? null,
          restaurant_id: restaurant?.id ?? null,
          restaurant_name: restaurant?.name ?? null,
          restaurant_address: restaurant?.address ?? null,
        };
      });

      setOwners(assembledOwners);
      setFilteredOwners(assembledOwners);
    } catch (error) {
      console.error('Unexpected error fetching owners:', error);
      toast.error('Failed to load owners');
    }
  };

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name')
      .is('owner_id', null)
      .order('name');

    if (error) {
      console.error('Failed to load restaurants:', error);
      return;
    }

    setRestaurants(data || []);
  };

  const handleLinkOwner = async () => {
    if (!formData.ownerId || !formData.restaurantId) {
      toast.error('Please select both an owner and a restaurant');
      return;
    }

    try {
      // Ensure the selected user has the restaurant_owner role
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', formData.ownerId)
        .eq('role', 'restaurant_owner')
        .maybeSingle();

      if (roleCheckError) {
        console.error('Error checking owner role:', roleCheckError);
        toast.error('Failed to verify owner role');
        return;
      }

      if (!existingRole) {
        const { error: roleInsertError } = await supabase
          .from('user_roles')
          .insert([{ user_id: formData.ownerId, role: 'restaurant_owner' }]);
        if (roleInsertError) {
          toast.error('Failed to assign owner role');
          return;
        }
      }

      // Link restaurant to the existing owner
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({ owner_id: formData.ownerId })
        .eq('id', formData.restaurantId);

      if (restaurantError) {
        toast.error('Failed to link restaurant to owner');
        return;
      }

      toast.success('Owner linked to restaurant successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchOwners();
      fetchRestaurants();
    } catch (error) {
      console.error('Error linking owner:', error);
      toast.error('Failed to link owner');
    }
  };

  const resetForm = () => {
    setFormData({
      ownerId: '',
      restaurantId: '',
    });
  };

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
            <h1 className="text-4xl font-bold text-foreground">Restaurant Owner Management</h1>
            <p className="text-muted-foreground">Manage all restaurant owner accounts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={restaurants.length === 0 || owners.filter(o => !o.restaurant_id).length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Owner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Link Existing Owner to Restaurant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="owner">Owner *</Label>
                  <Select value={formData.ownerId} onValueChange={(value) => setFormData({ ...formData, ownerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner without restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners
                        .filter((o) => !o.restaurant_id)
                        .map((o) => (
                          <SelectItem key={o.user_id} value={o.user_id}>
                            {o.full_name || 'Unnamed Owner'} — {o.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <Select value={formData.restaurantId} onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select restaurant without owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleLinkOwner} className="w-full" disabled={!formData.ownerId || !formData.restaurantId}>
                  Link Owner
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Alert */}
        {restaurants.length === 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-amber-800">
                No restaurants available without owners. Please create restaurants first before adding owners.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Owners Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Restaurant Owners ({filteredOwners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.map((owner) => (
                    <TableRow key={owner.user_id}>
                      <TableCell>
                        {owner.restaurant_name ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {owner.restaurant_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No restaurant</span>
                        )}
                      </TableCell>
                      <TableCell>{owner.restaurant_address || <span className="text-muted-foreground">N/A</span>}</TableCell>
                      <TableCell>{owner.full_name || <span className="text-muted-foreground">Unnamed Owner</span>}</TableCell>
                      <TableCell className="text-muted-foreground">{owner.email}</TableCell>
                      <TableCell>{owner.phone || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOwners;
