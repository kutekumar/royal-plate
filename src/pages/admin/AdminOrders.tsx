import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Printer, Filter, ShoppingBag, DollarSign, TrendingUp, Building2, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';

function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface Order {
  id: string; customer_id: string; restaurant_id: string; total_amount: number;
  order_type: string; status: string; created_at: string;
  customer_name: string; customer_email: string; customer_phone: string; restaurant_name: string;
}

interface Restaurant { id: string; name: string; }

interface RestaurantRevenue {
  restaurant_id: string; restaurant_name: string; total_orders: number; total_revenue: number; avg_order_value: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: 'Paid', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200/50' },
  preparing: { label: 'Preparing', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200/50' },
  ready: { label: 'Ready', color: 'text-green-700', bg: 'bg-green-50 border-green-200/50' },
  completed: { label: 'Completed', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200/50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200/50' },
  served: { label: 'Served', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/50' },
};

const ITEMS_PER_PAGE = 10;

const AdminOrders = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantRevenues, setRestaurantRevenues] = useState<RestaurantRevenue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      if (!user) navigate('/auth', { replace: true });
      else if (userRole === 'restaurant_owner') navigate('/dashboard', { replace: true });
      else navigate('/home', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => { if (user && userRole === 'admin') fetchOrders(); }, [user, userRole]);

  useEffect(() => { applyFilters(); setPage(1); }, [searchQuery, statusFilter, dateFilter, restaurantFilter, orders]);

  const fetchOrders = async () => {
    try {
      setFetching(true);
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!ordersData || ordersData.length === 0) {
        setOrders([]); setFilteredOrders([]);
        const { data: allRestaurants } = await supabase.from('restaurants').select('id, name').order('name');
        setRestaurants(allRestaurants || []);
        return;
      }

      const customerIds = [...new Set(ordersData.map(o => o.customer_id).filter(Boolean))];
      let customerDetails: any[] = [];
      if (customerIds.length > 0) {
        let rpc = await supabase.rpc('get_order_customers_fallback', { customer_ids: customerIds });
        if (rpc.error) rpc = await supabase.rpc('get_order_customers', { customer_ids: customerIds });
        if (!rpc.error) customerDetails = (rpc.data as any[]) || [];
      }

      const customerMap = new Map(customerDetails.map((c: any) => [c.user_id, { name: c.full_name?.trim() || '', email: c.email?.trim() || 'Email not available', phone: c.phone?.trim() || '' }]));
      const { data: allRestaurants } = await supabase.from('restaurants').select('id, name').order('name');
      const restaurantIds = [...new Set(ordersData.map(o => o.restaurant_id))];
      const { data: orderRestaurants } = await supabase.from('restaurants').select('id, name').in('id', restaurantIds);

      const enrichedOrders: Order[] = ordersData.map(order => {
        const c = customerMap.get(order.customer_id);
        const idSnippet = order.customer_id?.substring(0, 8) || 'UNKNOWN';
        return {
          ...order, customer_name: c?.name || `Customer ${idSnippet}`, customer_email: c?.email || 'Email not available',
          customer_phone: c?.phone || 'Phone not available',
          restaurant_name: orderRestaurants?.find((r: any) => r.id === order.restaurant_id)?.name || 'Unknown Restaurant',
        };
      });

      setOrders(enrichedOrders);
      setFilteredOrders(enrichedOrders);
      setRestaurants(allRestaurants || []);
      calculateRestaurantRevenues(enrichedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally { setFetching(false); }
  };

  const calculateRestaurantRevenues = (ordersData: Order[]) => {
    const revenueMap = new Map<string, RestaurantRevenue>();
    ordersData.forEach(order => {
      const amount = Number(order.total_amount);
      if (revenueMap.has(order.restaurant_id)) {
        const e = revenueMap.get(order.restaurant_id)!;
        e.total_orders += 1; e.total_revenue += amount; e.avg_order_value = e.total_revenue / e.total_orders;
      } else {
        revenueMap.set(order.restaurant_id, { restaurant_id: order.restaurant_id, restaurant_name: order.restaurant_name, total_orders: 1, total_revenue: amount, avg_order_value: amount });
      }
    });
    setRestaurantRevenues(Array.from(revenueMap.values()).sort((a, b) => b.total_revenue - a.total_revenue));
  };

  const applyFilters = () => {
    let filtered = [...orders];
    if (searchQuery) filtered = filtered.filter(o => o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || o.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery));
    if (restaurantFilter !== 'all') filtered = filtered.filter(o => o.restaurant_id === restaurantFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
    if (dateFilter !== 'all') {
      const now = new Date(); const d = new Date();
      if (dateFilter === 'today') d.setHours(0, 0, 0, 0);
      else if (dateFilter === 'week') d.setDate(now.getDate() - 7);
      else if (dateFilter === 'month') d.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(o => new Date(o.created_at) >= d);
    }
    setFilteredOrders(filtered);
    calculateRestaurantRevenues(filtered);
  };

  const handlePrint = () => window.print();

  if (loading || !user || userRole !== 'admin') return null;

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const filterCount = [searchQuery, statusFilter !== 'all' ? statusFilter : '', dateFilter !== 'all' ? dateFilter : '', restaurantFilter !== 'all' ? restaurantFilter : ''].filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <AdminLayout title="Orders" subtitle="Platform order reports">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm"><ShoppingBag className="w-[18px] h-[18px] text-white" /></div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
          </div>
          <p className="text-2xl font-bold text-royal-blue font-montserrat">{filteredOrders.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm"><DollarSign className="w-[18px] h-[18px] text-white" /></div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-royal-blue font-montserrat">{totalRevenue.toLocaleString()} <span className="text-xs font-medium text-gray-500">MMK</span></p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm"><TrendingUp className="w-[18px] h-[18px] text-white" /></div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Avg Order</p>
          </div>
          <p className="text-2xl font-bold text-royal-blue font-montserrat">{filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length).toLocaleString() : 0} <span className="text-xs font-medium text-gray-500">MMK</span></p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setShowFilters(!showFilters)}
          className={`rounded-xl h-9 px-3 text-xs font-semibold gap-1.5 transition-all ${showFilters || filterCount > 0 ? 'bg-royal-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
          <Filter className="w-3.5 h-3.5" />
          Filters
          {filterCount > 0 && <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">{filterCount}</span>}
        </Button>
        <Button onClick={handlePrint} variant="outline" className="rounded-xl h-9 px-3 text-xs font-semibold gap-1.5 border-gray-200">
          <Printer className="w-3.5 h-3.5" />Print
        </Button>
        {(filterCount > 0) && (
          <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); setRestaurantFilter('all'); }} className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input placeholder="Search by customer or restaurant..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 rounded-xl focus:ring-royal-blue/20" />
                </div>
                <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
                  <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200 rounded-xl"><SelectValue placeholder="Restaurant" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Restaurants</SelectItem>
                    {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200 rounded-xl"><SelectValue placeholder="Date" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restaurant Revenue Summary */}
      {restaurantFilter === 'all' && restaurantRevenues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-royal-blue" />
            <h3 className="text-sm font-bold text-royal-blue font-montserrat">Restaurant Performance</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {restaurantRevenues.slice(0, 6).map((r, idx) => (
              <motion.div key={r.restaurant_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{r.restaurant_name}</p>
                  <button onClick={() => setRestaurantFilter(r.restaurant_id)} className="text-[10px] text-royal-blue font-semibold hover:underline flex-shrink-0 ml-2">View</button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold text-royal-blue font-montserrat">{r.total_orders}</p><p className="text-[9px] text-gray-500">Orders</p></div>
                  <div><p className="text-lg font-bold text-royal-blue font-montserrat">{r.total_revenue.toLocaleString()}</p><p className="text-[9px] text-gray-500">Revenue</p></div>
                  <div><p className="text-lg font-bold text-royal-blue font-montserrat">{Math.round(r.avg_order_value).toLocaleString()}</p><p className="text-[9px] text-gray-500">Avg</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-royal-blue font-montserrat">Order Details</h3>
          <span className="text-[11px] text-gray-500">{restaurantFilter !== 'all' ? `Showing ${filteredOrders.length} orders` : `${filteredOrders.length} of ${orders.length}`}</span>
        </div>
        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-royal-blue animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Loading orders...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Order', 'Customer', 'Restaurant', 'Type', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedOrders.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                          <p className="text-sm text-gray-500 font-medium">No orders found</p>
                        </div>
                      </td></tr>
                    ) : (
                      paginatedOrders.map((order, idx) => (
                        <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4"><span className="font-mono text-[11px] font-medium text-gray-700">#{order.id.substring(0, 8)}</span></td>
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-gray-900">{order.customer_name}</p>
                            <p className="text-[10px] text-gray-500">{order.customer_email}</p>
                          </td>
                          <td className="px-5 py-4"><span className="text-xs text-gray-700">{order.restaurant_name}</span></td>
                          <td className="px-5 py-4"><span className="text-[11px] capitalize text-gray-600">{order.order_type.replace('_', ' ')}</span></td>
                          <td className="px-5 py-4"><span className="text-xs font-bold text-royal-blue">{Number(order.total_amount).toLocaleString()} MMK</span></td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold ${statusConfig[order.status]?.bg || 'bg-gray-50'} ${statusConfig[order.status]?.color || 'text-gray-700'} border`}>
                              {statusConfig[order.status]?.label || order.status}
                            </span>
                          </td>
                          <td className="px-5 py-4"><span className="text-[11px] text-gray-500">{formatDateTime(order.created_at)}</span></td>
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
    </AdminLayout>
  );
};

export default AdminOrders;
