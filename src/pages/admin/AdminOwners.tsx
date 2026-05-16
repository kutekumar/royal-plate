import { useCallback, useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building2, Users, Mail, Phone, MapPin, Link2, Plus, ChevronLeft, ChevronRight, UserCog, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';

interface Owner {
  user_id: string; full_name: string; email: string; phone: string | null;
  restaurant_id: string | null; restaurant_name: string | null; restaurant_address: string | null;
}

const ITEMS_PER_PAGE = 10;

const AdminOwners = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [fetching, setFetching] = useState(true);
  const [restaurants, setRestaurants] = useState<{id: string; name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'link'>('list');
  const [formData, setFormData] = useState({ ownerId: '', restaurantId: '' });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      if (!user) navigate('/auth', { replace: true });
      else if (userRole === 'restaurant_owner') navigate('/dashboard', { replace: true });
      else navigate('/home', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => { if (user && userRole === 'admin') { fetchOwners(); fetchRestaurants(); } }, [user, userRole]);

  useEffect(() => {
    setFilteredOwners(owners.filter(o =>
      o.email.toLowerCase().includes(searchQuery.toLowerCase()) || (o.restaurant_name && o.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
    setPage(1);
  }, [searchQuery, owners]);

  const fetchOwners = useCallback(async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase.rpc('get_admin_owners');
      if (error) throw error;
      setOwners(data || []);
    } catch (err: any) {
      console.error('Error fetching owners:', err);
      toast.error('Failed to load owners');
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('id, name').is('owner_id', null).order('name');
    setRestaurants(data || []);
  };

  const handleLinkOwner = async () => {
    if (!formData.ownerId || !formData.restaurantId) { toast.error('Please select both an owner and a restaurant'); return; }
    try {
      const { data: existingRole } = await supabase.from('user_roles').select('user_id').eq('user_id', formData.ownerId).eq('role', 'restaurant_owner').maybeSingle();
      if (!existingRole) {
        const { error: roleError } = await supabase.from('user_roles').insert([{ user_id: formData.ownerId, role: 'restaurant_owner' }]);
        if (roleError) { toast.error('Failed to assign owner role'); return; }
      }
      const { error } = await supabase.from('restaurants').update({ owner_id: formData.ownerId }).eq('id', formData.restaurantId);
      if (error) { toast.error('Failed to link restaurant to owner'); return; }
      toast.success('Owner linked to restaurant successfully');
      setView('list'); resetForm(); fetchOwners(); fetchRestaurants();
    } catch (error) { console.error('Error linking owner:', error); toast.error('Failed to link owner'); }
  };

  const resetForm = () => setFormData({ ownerId: '', restaurantId: '' });

  if (loading || !user || userRole !== 'admin') return null;

  const unlinkedOwners = owners.filter(o => !o.restaurant_id);
  const totalPages = Math.max(1, Math.ceil(filteredOwners.length / ITEMS_PER_PAGE));
  const paginatedOwners = filteredOwners.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const linkFormContent = (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">Owner</Label>
        <Select value={formData.ownerId} onValueChange={(v) => setFormData({ ...formData, ownerId: v })}>
          <SelectTrigger className="h-11 border-gray-200 rounded-xl text-sm bg-gray-50/80">
            <SelectValue placeholder="Select owner" />
          </SelectTrigger>
          <SelectContent>
            {unlinkedOwners.map(o => (
              <SelectItem key={o.user_id} value={o.user_id}>
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  {o.full_name} — {o.email}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">Restaurant</Label>
        <Select value={formData.restaurantId} onValueChange={(v) => setFormData({ ...formData, restaurantId: v })}>
          <SelectTrigger className="h-11 border-gray-200 rounded-xl text-sm bg-gray-50/80">
            <SelectValue placeholder="Select restaurant" />
          </SelectTrigger>
          <SelectContent>
            {restaurants.map(r => (
              <SelectItem key={r.id} value={r.id}>
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  {r.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleLinkOwner} disabled={!formData.ownerId || !formData.restaurantId} className="w-full bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-lg shadow-royal-blue/20 hover:shadow-xl hover:shadow-royal-blue/30 rounded-xl h-12 text-sm font-semibold gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100">
        <Link2 className="w-4 h-4" />
        Link Owner to Restaurant
      </Button>
    </div>
  );

  return (
    <AdminLayout title={view === 'link' ? 'Link Owner' : 'Owners'} subtitle={view === 'link' ? 'Assign a restaurant to an owner' : 'Restaurant owner accounts'}>
      {view === 'link' ? (
        <AnimatePresence mode="wait">
          <motion.div key="form" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => { setView('list'); resetForm(); }} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-royal-blue hover:border-royal-blue/20 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center shadow-lg shadow-royal-blue/20">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-royal-blue font-montserrat">Link Owner</p>
                  <p className="text-xs text-gray-500 font-normal">Assign a restaurant to an owner account</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm max-w-lg">
              <div className="px-6 py-5">
                {linkFormContent}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search by owner name or restaurant..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 text-sm bg-white border-gray-200 rounded-xl focus:ring-royal-blue/20" />
            </div>
            <div className="flex items-center gap-2">
              {restaurants.length === 0 && (
                <div className="px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-amber-700 font-medium">No free restaurants</p>
                </div>
              )}
              <Button disabled={restaurants.length === 0 || unlinkedOwners.length === 0} onClick={() => setView('link')}
                className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm shadow-royal-blue/20 hover:shadow-md hover:shadow-royal-blue/30 transition-all rounded-xl h-9 px-4 text-xs font-semibold gap-1.5 disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" />
                Link Owner
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-royal-blue font-montserrat">Owners <span className="text-gray-400 font-normal">({filteredOwners.length})</span></h2>
        </div>
        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-royal-blue animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Loading owners...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Restaurant</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Address</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedOwners.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <UserCog className="w-8 h-8 text-gray-300" />
                          <p className="text-sm text-gray-500 font-medium">No owners found</p>
                        </div>
                      </td></tr>
                    ) : (
                      paginatedOwners.map((owner, idx) => (
                        <motion.tr key={owner.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal-blue/10 to-brand-blue/10 border border-royal-blue/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-royal-blue">{owner.full_name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{owner.full_name}</p>
                                {owner.phone && <p className="text-[11px] text-gray-500">{owner.phone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {owner.email}
                            </p>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {owner.phone || 'N/A'}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {owner.restaurant_name ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700 border border-emerald-200/50">
                                <Building2 className="w-3 h-3" />
                                {owner.restaurant_name}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No restaurant</span>
                            )}
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {owner.restaurant_address || 'N/A'}
                            </p>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400 text-xs">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-[11px] font-bold transition-all shadow-md ${
                          page === p
                            ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105'
                            : 'border border-white/60 bg-white/90 backdrop-blur-md text-gray-600 hover:border-[#536DFE]/50 hover:text-[#536DFE] hover:shadow-lg'
                        }`}
                      >
                        {p}
                      </button>
                    </Fragment>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOwners;
