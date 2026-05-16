import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Store, MapPin, Phone, ChefHat, Star, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';

interface Restaurant {
  id: string; name: string; address: string; description: string | null; phone: string | null;
  cuisine_type: string | null; owner_id: string | null; image_url: string | null; open_hours: string | null; rating: number | null;
}

const ITEMS_PER_PAGE = 10;

const AdminRestaurants = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', description: '', phone: '', cuisine_type: '', image_url: '', open_hours: '', rating: '' });
  const [fetching, setFetching] = useState(true);

  const OPENING_START_OPTIONS = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];
  const OPENING_END_OPTIONS = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'];

  const parseOpenHours = (value: string | null) => {
    if (!value || !value.includes(' - ')) return { start: '', end: '' };
    const [start, end] = value.split(' - ').map(v => v.trim());
    return { start: OPENING_START_OPTIONS.includes(start) ? start : '', end: OPENING_END_OPTIONS.includes(end) ? end : '' };
  };

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      if (!user) navigate('/auth', { replace: true });
      else if (userRole === 'restaurant_owner') navigate('/dashboard', { replace: true });
      else navigate('/home', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => { if (user && userRole === 'admin') fetchRestaurants(); }, [user, userRole]);

  useEffect(() => {
    setFilteredRestaurants(restaurants.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.address.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    setPage(1);
  }, [searchQuery, restaurants]);

  const fetchRestaurants = async () => {
    try {
      setFetching(true);
      const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
      setRestaurants(data || []);
      setFilteredRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally { setFetching(false); }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address) { toast.error('Name and address are required'); return; }
    const openHoursValue = formData.open_hours?.includes(' - ') ? formData.open_hours : null;

    if (editingRestaurant) {
      const { error } = await supabase.from('restaurants').update({ ...formData, open_hours: openHoursValue, rating: formData.rating ? Number(formData.rating) : null }).eq('id', editingRestaurant.id);
      if (error) { toast.error('Failed to update restaurant'); return; }
      toast.success('Restaurant updated successfully');
    } else {
      const { error } = await supabase.from('restaurants').insert([{ ...formData, open_hours: openHoursValue, rating: formData.rating ? Number(formData.rating) : null }]);
      if (error) { toast.error('Failed to create restaurant'); return; }
      toast.success('Restaurant created successfully');
    }
    setView('list'); resetForm(); fetchRestaurants();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;
    const { error } = await supabase.from('restaurants').delete().eq('id', id);
    if (error) { toast.error('Failed to delete restaurant'); return; }
    toast.success('Restaurant deleted successfully');
    fetchRestaurants();
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    const parsed = parseOpenHours(restaurant.open_hours);
    setFormData({
      name: restaurant.name, address: restaurant.address, description: restaurant.description || '', phone: restaurant.phone || '',
      cuisine_type: restaurant.cuisine_type || '', image_url: restaurant.image_url || '',
      open_hours: parsed.start && parsed.end ? `${parsed.start} - ${parsed.end}` : (restaurant.open_hours || ''),
      rating: restaurant.rating !== null ? String(restaurant.rating) : '',
    });
    setView('edit');
  };

  const resetForm = () => {
    setEditingRestaurant(null);
    setFormData({ name: '', address: '', description: '', phone: '', cuisine_type: '', image_url: '', open_hours: '', rating: '' });
  };

  if (loading || !user || userRole !== 'admin') return null;

  const totalPages = Math.max(1, Math.ceil(filteredRestaurants.length / ITEMS_PER_PAGE));
  const paginatedRestaurants = filteredRestaurants.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleBack = () => { setView('list'); resetForm(); };

  const formContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-royal-blue to-brand-blue" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Basic Information</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Name <span className="text-red-400">*</span></Label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter restaurant name" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone number" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Address <span className="text-red-400">*</span></Label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Enter restaurant address" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Details</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Cuisine Type</Label>
            <div className="relative">
              <ChefHat className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input value={formData.cuisine_type} onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })} placeholder="e.g., Italian" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Rating</Label>
            <div className="relative">
              <Star className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} placeholder="4.5" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Media</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Image URL</Label>
          <div className="relative">
            <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
          </div>
          {formData.image_url && (
            <div className="relative h-36 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50 group">
              <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-gray-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-400 to-purple-500" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Description</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">About this restaurant</Label>
          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Tell customers what makes this restaurant special..." rows={3} className="bg-gray-50/80 border-gray-200 rounded-xl text-sm resize-none focus:bg-white focus:border-royal-blue/30 transition-all" />
        </div>
      </div>
      <div className="border-t border-gray-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Operating Hours</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Opening Hours</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <select value={parseOpenHours(formData.open_hours).start} onChange={(e) => {
                const end = parseOpenHours(formData.open_hours).end;
                setFormData({ ...formData, open_hours: e.target.value && end ? `${e.target.value} - ${end}` : e.target.value || end || '' });
              }} className="w-full h-11 pl-10 text-sm bg-gray-50/80 border border-gray-200 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:bg-white transition-all">
                <option value="">Open time</option>
                {OPENING_START_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <select value={parseOpenHours(formData.open_hours).end} onChange={(e) => {
                const start = parseOpenHours(formData.open_hours).start;
                setFormData({ ...formData, open_hours: start && e.target.value ? `${start} - ${e.target.value}` : start || e.target.value || '' });
              }} className="w-full h-11 pl-10 text-sm bg-gray-50/80 border border-gray-200 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:bg-white transition-all">
                <option value="">Close time</option>
                {OPENING_END_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 text-sm border-gray-200 font-semibold hover:bg-gray-50 transition-all">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-lg shadow-royal-blue/20 hover:shadow-xl hover:shadow-royal-blue/30 rounded-xl h-12 text-sm font-semibold gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]">
          {editingRestaurant ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editingRestaurant ? 'Update Restaurant' : 'Create Restaurant'}
        </Button>
      </div>
    </div>
  );

  return (
    <AdminLayout title={view !== 'list' ? (editingRestaurant ? 'Edit Restaurant' : 'New Restaurant') : 'Restaurants'} subtitle={view !== 'list' ? (editingRestaurant ? 'Update restaurant details' : 'Fill in restaurant information') : 'Manage all restaurants'}>
      {view !== 'list' ? (
        <AnimatePresence mode="wait">
          <motion.div key="form" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
            {/* Back button + Header */}
            <div className="flex items-center gap-4 mb-6">
              <button onClick={handleBack} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-royal-blue hover:border-royal-blue/20 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center shadow-lg shadow-royal-blue/20">
                  {editingRestaurant ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-lg font-bold text-royal-blue font-montserrat">{editingRestaurant ? 'Edit Restaurant' : 'New Restaurant'}</p>
                  <p className="text-xs text-gray-500 font-normal">{editingRestaurant ? 'Update the restaurant details below' : 'Fill in the details to add a new restaurant'}</p>
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm">
              <div className="px-6 py-5">
                {formContent}
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
              <Input placeholder="Search restaurants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 text-sm bg-white border-gray-200 rounded-xl focus:ring-royal-blue/20" />
            </div>
            <Button onClick={() => { resetForm(); setView('add'); }} className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm shadow-royal-blue/20 hover:shadow-md hover:shadow-royal-blue/30 transition-all rounded-xl h-9 px-4 text-xs font-semibold gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Restaurant
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-royal-blue font-montserrat">All Restaurants <span className="text-gray-400 font-normal">({filteredRestaurants.length})</span></h2>
            </div>
            {fetching ? (
              <div className="flex justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-royal-blue animate-spin" />
                  <p className="text-sm text-gray-500 font-medium">Loading restaurants...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Restaurant</th>
                        <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Location</th>
                        <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                        <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cuisine</th>
                        <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {paginatedRestaurants.length === 0 ? (
                          <tr><td colSpan={5} className="px-5 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Store className="w-8 h-8 text-gray-300" />
                              <p className="text-sm text-gray-500 font-medium">No restaurants found</p>
                            </div>
                          </td></tr>
                        ) : (
                          paginatedRestaurants.map((restaurant, idx) => (
                            <motion.tr key={restaurant.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                    {restaurant.image_url ? (
                                      <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center"><Store className="w-5 h-5 text-gray-400" /></div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{restaurant.name}</p>
                                    {restaurant.rating && (
                                      <span className="text-[11px] text-amber-600 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{restaurant.rating}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 hidden sm:table-cell">
                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-[200px]">{restaurant.address}</span>
                                </p>
                              </td>
                              <td className="px-5 py-4 hidden md:table-cell">
                                {restaurant.phone ? (
                                  <p className="text-xs text-gray-600 flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400" />{restaurant.phone}</p>
                                ) : <span className="text-xs text-gray-400">N/A</span>}
                              </td>
                              <td className="px-5 py-4 hidden lg:table-cell">
                                {restaurant.cuisine_type ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-royal-blue/5 text-[10px] font-medium text-royal-blue border border-royal-blue/10">
                                    <ChefHat className="w-3 h-3" />{restaurant.cuisine_type}
                                  </span>
                                ) : <span className="text-xs text-gray-400">N/A</span>}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => handleEdit(restaurant)} className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-royal-blue hover:border-royal-blue/20 transition-all">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(restaurant.id)} className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-50">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400 text-xs">...</span>}
                          <button onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-xl text-[11px] font-bold transition-all shadow-md ${page === p ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105' : 'border border-white/60 bg-white/90 backdrop-blur-md text-gray-600 hover:border-[#536DFE]/50 hover:text-[#536DFE] hover:shadow-lg'}`}>
                            {p}
                          </button>
                        </Fragment>
                      ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md">
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

export default AdminRestaurants;
