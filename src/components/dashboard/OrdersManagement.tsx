import { useState, useEffect, Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, ShoppingBag, UtensilsCrossed, Loader2, XCircle, Users, Calendar, ArrowRight, Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, Timer, Phone, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

type OrderStatus = 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'served';

interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  order_items: any;
  order_type: 'dine_in' | 'takeaway';
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  party_size?: number;
  reservation_date?: string;
  reservation_time?: string;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  paid: { label: 'Paid', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200/50', dot: 'bg-purple-500' },
  preparing: { label: 'Preparing', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/50', dot: 'bg-blue-500' },
  ready: { label: 'Ready', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200/50', dot: 'bg-green-500' },
  completed: { label: 'Completed', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200/50', dot: 'bg-slate-400' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200/50', dot: 'bg-red-500' },
  served: { label: 'Served', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/50', dot: 'bg-emerald-500' },
};

const OrdersManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'dine_in' | 'takeaway'>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const ORDERS_PER_PAGE = 9;

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user?.id).single();
      if (!restaurant) return;

      const { data } = await supabase.from('orders').select('*').eq('restaurant_id', restaurant.id).order('created_at', { ascending: false });
      if (!data) return;

      const customerIds = [...new Set(data.map(o => o.customer_id))];
      const { data: customers } = await supabase.rpc('get_order_customers', { customer_ids: customerIds });

      const enrichedOrders: Order[] = data.map(order => {
        const customer = customers?.find((c: any) => c.user_id === order.customer_id);
        return { ...order, customer_name: customer?.full_name || 'Customer', customer_phone: customer?.phone || null };
      });

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      toast.success('Order status updated');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ orderId: string; status: OrderStatus }>;
      const { orderId, status } = custom.detail || ({} as any);
      if (!orderId || !status) return;
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
    };
    window.addEventListener('orderStatusUpdated', handler as EventListener);
    return () => window.removeEventListener('orderStatusUpdated', handler as EventListener);
  }, []);

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filterCount = [typeFilter, statusFilter, dateFilter, searchQuery].filter(v => v !== 'all' && v !== '').length;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesType = typeFilter === 'all' ? true : order.order_type === typeFilter;
    const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter;
    const matchesDate = !dateFilter ? true : new Date(order.created_at).toISOString().slice(0, 10) === dateFilter;
    const matchesSearch = !searchQuery ? true : order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesDate && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-royal-blue font-montserrat">Orders</h2>
          <p className="text-sm text-gray-500">Track and manage all incoming orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              showFilters || filterCount > 0 ? 'bg-royal-blue text-white border-royal-blue shadow-sm shadow-royal-blue/20' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {filterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{filterCount}</span>
            )}
          </button>
          {(filterCount > 0) && (
            <button onClick={clearFilters} className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-all">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Search</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Customer or ID..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue/40 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Type</p>
                  <Select value={typeFilter} onValueChange={(v: 'all' | 'dine_in' | 'takeaway') => { setTypeFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="dine_in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Take Away</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Status</p>
                  <Select value={statusFilter} onValueChange={(v: OrderStatus | 'all') => { setStatusFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Date</p>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue/40 transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-royal-blue rounded-full animate-pulse-soft" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Loading orders...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-700">No orders found</p>
          <p className="text-sm text-gray-400 mt-1">{orders.length === 0 ? 'No orders have been placed yet' : 'Try adjusting your filters'}</p>
          {orders.length > 0 && (
            <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-royal-blue text-white text-sm font-semibold rounded-xl hover:bg-royal-blue-dark transition-all shadow-sm shadow-royal-blue/20">
              Clear Filters
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {paginatedOrders.map((order, idx) => {
                const status = statusConfig[order.status];
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/40 transition-all duration-300 overflow-hidden"
                  >
                    {/* Status bar */}
                    <div className={`h-1 w-full ${status.bg}`} />

                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Header: Customer + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal-blue/10 to-brand-blue/10 border border-royal-blue/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-royal-blue" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{order.customer_name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                              {order.customer_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  {order.customer_phone}
                                </span>
                              )}
                              <span className="text-[8px]">#{order.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${status.bg} ${status.color} border ${status.border} flex items-center gap-1.5 flex-shrink-0`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </div>
                      </div>

                      {/* Meta: Type + Time */}
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1.5">
                          {order.order_type === 'dine_in' ? (
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                          ) : (
                            <ShoppingBag className="w-3.5 h-3.5" />
                          )}
                          <span className="capitalize font-medium">{order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Timer className="w-3 h-3" />
                          {formatTimeAgo(order.created_at)}
                        </span>
                      </div>

                      {/* Dine-in Reservation */}
                      {order.order_type === 'dine_in' && order.party_size && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] font-medium text-amber-800">Party of {order.party_size}</span>
                          {order.reservation_date && (
                            <>
                              <span className="text-amber-300">|</span>
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span className="text-[11px] text-amber-700">
                                {order.reservation_date === 'today' ? 'Today' : order.reservation_date === 'tomorrow' ? 'Tomorrow' : new Date(order.reservation_date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                                {order.reservation_time && ` at ${order.reservation_time}`}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Items</p>
                        <ul className="space-y-0.5">
                          {order.order_items.slice(0, 3).map((item: any, idx: number) => (
                            <li key={idx} className="flex items-center justify-between text-[12px]">
                              <span className="text-gray-700"><span className="font-semibold text-gray-900">{item.quantity}x</span> {item.name}</span>
                              <span className="text-gray-500 text-[11px]">{Number(item.price).toLocaleString()}K</span>
                            </li>
                          ))}
                          {order.order_items.length > 3 && (
                            <li className="text-[11px] text-gray-400 font-medium">+{order.order_items.length - 3} more items</li>
                          )}
                        </ul>
                      </div>

                      {/* Footer: Total + Status Select */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] text-gray-500 font-medium">Total</p>
                          <p className="text-base font-bold text-royal-blue font-montserrat">{order.total_amount.toLocaleString()} <span className="text-[10px] font-medium text-gray-500">MMK</span></p>
                        </div>
                        <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v as OrderStatus)}>
                          <SelectTrigger className="h-9 w-36 text-[11px] bg-gray-50 border-gray-200 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                                  {config.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="text-gray-400 text-xs">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-9 h-9 rounded-xl text-[11px] font-bold transition-all shadow-md ${
                        currentPage === p
                          ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105'
                          : 'border border-white/60 bg-white/90 backdrop-blur-md text-gray-600 hover:border-[#536DFE]/50 hover:text-[#536DFE] hover:shadow-lg'
                      }`}
                    >
                      {p}
                    </button>
                  </Fragment>
                ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersManagement;
