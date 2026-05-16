import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, User as UserIcon, Plus, Edit, Trash2, Building2, Shield, ChevronLeft, ChevronRight, Loader2, Mail, Phone as PhoneIcon, Key, UserCircle, CalendarDays, ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';

interface User {
  user_id: string; full_name: string; phone: string | null; role: string; created_at: string; email?: string;
}

const roleConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  admin: { label: 'Admin', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200/50', dot: 'bg-red-500' },
  restaurant_owner: { label: 'Owner', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/50', dot: 'bg-blue-500' },
  customer: { label: 'Customer', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/50', dot: 'bg-emerald-500' },
};

const ITEMS_PER_PAGE = 10;

const AdminUsers = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'restaurant_owner' | 'admin'>('all');
  const [page, setPage] = useState(1);

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailEmail, setDetailEmail] = useState<string>('');
  const [detailRestaurantId, setDetailRestaurantId] = useState<string | null>(null);
  const [detailRestaurantName, setDetailRestaurantName] = useState<string | null>(null);
  const [detailName, setDetailName] = useState<string>('');
  const [detailPhone, setDetailPhone] = useState<string>('');
  const [detailRole, setDetailRole] = useState<string>('customer');

  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [createRole, setCreateRole] = useState<'customer' | 'restaurant_owner' | 'admin'>('customer');
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRestaurantId, setCreateRestaurantId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      if (!user) navigate('/auth');
      else if (userRole === 'restaurant_owner') navigate('/dashboard');
      else navigate('/home');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => { if (user && userRole === 'admin') { fetchUsers(); fetchRestaurants(); } }, [user, userRole]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredUsers(users.filter(u =>
      (u.full_name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || (u.phone && u.phone.toLowerCase().includes(q)) || u.user_id.toLowerCase().includes(q)) &&
      (roleFilter === 'all' || u.role === roleFilter)
    ));
    setPage(1);
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setFetching(true);
      const { data: userRoles } = await supabase.from('user_roles').select('user_id, role, created_at').order('created_at', { ascending: false });
      if (!userRoles || userRoles.length === 0) { setUsers([]); return; }

      const userIds = userRoles.map(r => r.user_id);
      let details: any[] = [];
      let rpc = await supabase.rpc('get_order_customers_fallback', { customer_ids: userIds });
      if (rpc.error) rpc = await supabase.rpc('get_order_customers', { customer_ids: userIds });
      if (!rpc.error) details = (rpc.data as any[]) || [];

      const detailMap = new Map(details.map((d: any) => [d.user_id, d]));
      setUsers(userRoles.map(role => {
        const d = detailMap.get(role.user_id);
        return { user_id: role.user_id, full_name: d?.full_name?.trim() || `User ${role.user_id.substring(0, 8)}`, phone: d?.phone || null, role: role.role, created_at: role.created_at };
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally { setFetching(false); }
  };

  const fetchRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('id, name').order('name');
    setRestaurants(data || []);
  };

  const handleViewDetails = async (u: User) => {
    setSelectedUser(u); setDetailName(u.full_name); setDetailPhone(u.phone || ''); setDetailRole(u.role);

    try {
      let rpc = await supabase.rpc('get_order_customers_fallback', { customer_ids: [u.user_id] });
      if (rpc.error) rpc = await supabase.rpc('get_order_customers', { customer_ids: [u.user_id] });
      setDetailEmail(!rpc.error && rpc.data?.[0]?.email ? rpc.data[0].email : 'Email not available');
    } catch { setDetailEmail('Email not available'); }

    setDetailRestaurantId(null); setDetailRestaurantName(null);
    if (u.role === 'restaurant_owner') {
      const { data: owned } = await supabase.from('restaurants').select('id, name').eq('owner_id', u.user_id).limit(1).maybeSingle();
      if (owned) { setDetailRestaurantId(owned.id); setDetailRestaurantName(owned.name); }
    }
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedUser(null);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ full_name: detailName.trim(), phone: detailPhone.trim() || null, updated_at: new Date().toISOString() }).eq('id', selectedUser.user_id);
      if (detailRole !== selectedUser.role) {
        const { error: roleError } = await supabase.from('user_roles').update({ role: detailRole }).eq('user_id', selectedUser.user_id);
        if (roleError) { toast.error('Failed to update user role'); setSaving(false); return; }
      }
      toast.success('User updated successfully');
      setView('list'); setSelectedUser(null); fetchUsers();
    } catch { toast.error('Failed to update user'); }
    finally { setSaving(false); }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !confirm('Are you sure? This cannot be undone.')) return;
    try {
      await supabase.from('restaurant_owners').delete().eq('user_id', selectedUser.user_id);
      await supabase.from('user_roles').delete().eq('user_id', selectedUser.user_id);
      await supabase.from('profiles').delete().eq('id', selectedUser.user_id);
      await supabase.auth.admin.deleteUser(selectedUser.user_id).catch(() => {});
      toast.success('User deleted successfully');
      setView('list'); setSelectedUser(null); setTimeout(() => fetchUsers(), 500);
    } catch { toast.error('Failed to delete user'); }
  };

  const handleCreateUser = async () => {
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) { toast.error('Please fill in all required fields'); return; }
    try {
      const { error: fnError } = await supabase.functions.invoke('admin-create-user', {
        body: { email: createEmail.trim(), password: createPassword.trim(), full_name: createName.trim(), phone: createPhone.trim() || null, role: createRole, restaurant_id: createRestaurantId },
      });
      if (fnError) { toast.error(fnError.message || 'Failed to create user'); return; }
      toast.success('User created successfully');
      setIsCreateOpen(false);
      setCreateRole('customer'); setCreateName(''); setCreateEmail(''); setCreatePassword(''); setCreatePhone(''); setCreateRestaurantId(null);
      fetchUsers();
    } catch { toast.error('Failed to create user'); }
  };

  if (loading || !user || userRole !== 'admin') return null;

  const stats = {
    admins: users.filter(u => u.role === 'admin').length,
    owners: users.filter(u => u.role === 'restaurant_owner').length,
    customers: users.filter(u => u.role === 'customer').length,
  };

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const listView = (
    <>
      {/* Role Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><Shield className="w-[16px] h-[16px] text-red-600" /></div>
            <p className="text-xs font-semibold text-gray-500">Administrators</p>
          </div>
          <p className="text-2xl font-bold text-royal-blue font-montserrat">{stats.admins}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><UserIcon className="w-[16px] h-[16px] text-blue-600" /></div>
            <p className="text-xs font-semibold text-gray-500">Owners</p>
          </div>
          <p className="text-2xl font-bold text-royal-blue font-montserrat">{stats.owners}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center"><UserIcon className="w-[16px] h-[16px] text-emerald-600" /></div>
            <p className="text-xs font-semibold text-gray-500">Customers</p>
          </div>
          <p className="text-2xl font-bold text-royal-blue font-montserrat">{stats.customers}</p>
        </motion.div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name, email or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 text-sm bg-white border-gray-200 rounded-xl focus:ring-royal-blue/20" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
            <SelectTrigger className="w-full sm:w-44 h-10 text-sm bg-white border-gray-200 rounded-xl"><SelectValue placeholder="Filter by role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="restaurant_owner">Owner</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm shadow-royal-blue/20 hover:shadow-md hover:shadow-royal-blue/30 transition-all rounded-xl h-10 px-4 text-xs font-semibold gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-2xl border-gray-100/80 shadow-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
              <div className="relative bg-gradient-to-br from-royal-blue/5 via-transparent to-brand-blue/5 px-6 pt-6 pb-5 border-b border-royal-blue/10">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-royal-blue via-brand-blue to-gold" />
                <DialogHeader>
                  <DialogTitle className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center shadow-lg shadow-royal-blue/20 shrink-0">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-royal-blue font-montserrat">New User</p>
                      <p className="text-xs text-gray-500 font-normal mt-0.5">Create a new platform account</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-royal-blue to-brand-blue" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Personal Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Full Name <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Enter full name" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Phone</Label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="Enter phone number" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Account Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Email <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="Enter email address" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Password <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Enter password" className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Role &amp; Access</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Role <span className="text-red-400">*</span></Label>
                    <Select value={createRole} onValueChange={(v: any) => setCreateRole(v)}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-xl text-sm bg-gray-50/80"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="restaurant_owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {createRole === 'restaurant_owner' && (
                    <div className="mt-4 space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Link to Restaurant</Label>
                      <Select value={createRestaurantId || ''} onValueChange={setCreateRestaurantId}>
                        <SelectTrigger className="h-11 border-gray-200 rounded-xl text-sm bg-gray-50/80"><SelectValue placeholder="Select a restaurant (optional)" /></SelectTrigger>
                        <SelectContent>
                          {restaurants.map(r => (<SelectItem key={r.id} value={r.id}><span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />{r.name}</span></SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1 rounded-xl h-12 text-sm border-gray-200 font-semibold hover:bg-gray-50 transition-all">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} className="flex-1 bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-lg shadow-royal-blue/20 hover:shadow-xl hover:shadow-royal-blue/30 rounded-xl h-12 text-sm font-semibold gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]">
                    <Plus className="w-4 h-4" />Create User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-royal-blue font-montserrat">All Users <span className="text-gray-400 font-normal">({filteredUsers.length})</span></h2>
        </div>
        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-royal-blue animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Loading users...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Name', 'Phone', 'Role', 'Registered', ''].map(h => (
                      <th key={h} className={`text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <UserIcon className="w-8 h-8 text-gray-300" />
                          <p className="text-sm text-gray-500 font-medium">No users found</p>
                        </div>
                      </td></tr>
                    ) : (
                      paginatedUsers.map((u, idx) => {
                        const role = roleConfig[u.role] || roleConfig.customer;
                        return (
                          <motion.tr key={u.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal-blue/10 to-brand-blue/10 border border-royal-blue/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-royal-blue">{u.full_name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{u.full_name}</p>
                                  <p className="text-[10px] font-mono text-gray-400">ID: {u.user_id.substring(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4"><span className="text-xs text-gray-600">{u.phone || <span className="text-gray-400">N/A</span>}</span></td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold ${role.bg} ${role.color} border ${role.border}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${role.dot}`} />
                                {role.label}
                              </span>
                            </td>
                            <td className="px-5 py-4"><span className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></td>
                            <td className="px-5 py-4 text-right">
                              <button onClick={() => handleViewDetails(u)} className="text-xs font-semibold text-royal-blue hover:text-royal-blue/70 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100">
                                View Details
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

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
  );

  const role = selectedUser ? (roleConfig[selectedUser.role] || roleConfig.customer) : roleConfig.customer;

  const detailView = selectedUser && (
    <motion.div key="detail" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={handleBack} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-royal-blue hover:border-royal-blue/20 transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center shadow-lg shadow-royal-blue/20 shrink-0">
            <span className="text-lg font-bold text-white">{selectedUser.full_name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-royal-blue font-montserrat">User Details</p>
            <p className="text-xs text-gray-500 font-normal">View and edit user information</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm max-w-2xl">
        <div className="px-6 py-5 space-y-6">
          {/* Role Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center shadow-sm">
                <span className="text-base font-bold text-white">{selectedUser.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-royal-blue font-montserrat">{selectedUser.full_name}</p>
                <p className="text-[11px] text-gray-500">{detailEmail || selectedUser.user_id.substring(0, 8)}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${role.bg} ${role.color} border ${role.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${role.dot}`} />
              {role.label}
            </span>
          </div>

          <div className="border-t border-gray-100" />

          {/* Personal Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-royal-blue to-brand-blue" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Personal Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input value={detailName} onChange={(e) => setDetailName(e.target.value)} className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Phone</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input value={detailPhone} onChange={(e) => setDetailPhone(e.target.value)} className="h-11 pl-10 text-sm bg-gray-50/80 border-gray-200 rounded-xl focus:bg-white focus:border-royal-blue/30 transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Account Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Account</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input value={detailEmail} disabled className="h-11 pl-10 text-sm bg-gray-100 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Role</Label>
                <Select value={detailRole} onValueChange={setDetailRole}>
                  <SelectTrigger className="h-11 border-gray-200 rounded-xl text-sm bg-gray-50/80"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="restaurant_owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {detailRole === 'restaurant_owner' && detailRestaurantName && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Linked Restaurant</span>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-800">{detailRestaurantName}</p>
                      <p className="text-[11px] text-blue-600/70">Active restaurant link</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-gray-100" />

          {/* Meta */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-400 to-purple-500" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">Metadata</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <UserCircle className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User ID</p>
                </div>
                <p className="text-xs font-mono font-medium text-gray-700 truncate">{selectedUser.user_id}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Registered</p>
                </div>
                <p className="text-xs font-medium text-gray-700">{new Date(selectedUser.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button variant="destructive" onClick={handleDeleteUser} className="rounded-xl h-12 px-4 text-sm font-semibold gap-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 transition-all flex-1 sm:flex-none">
              <Trash2 className="w-4 h-4" />Delete
            </Button>
            <div className="flex gap-2 flex-1 sm:flex-none justify-end">
              <Button variant="outline" onClick={handleBack} className="rounded-xl h-12 px-6 text-sm border-gray-200 font-semibold hover:bg-gray-50 transition-all">
                <X className="w-4 h-4" />Cancel
              </Button>
              <Button onClick={handleEditUser} disabled={saving} className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-lg shadow-royal-blue/20 hover:shadow-xl hover:shadow-royal-blue/30 rounded-xl h-12 px-6 text-sm font-semibold gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AdminLayout title={view === 'detail' ? 'User Details' : 'Users'} subtitle={view === 'detail' ? 'View and edit user information' : 'Manage all users'}>
      <AnimatePresence mode="wait">
        {view === 'detail' ? detailView : listView}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminUsers;
