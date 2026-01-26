import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Printer, Filter } from 'lucide-react';
import { toast } from 'sonner';

// Utility: Format date as M/D/YYYY - h:mm AM/PM (e.g., 11/6/2025 - 3:00 PM)
function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const mm = d.getMonth() + 1; // 1-12
  const dd = d.getDate();
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 -> 12
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${mm}/${dd}/${yyyy} - ${hours}:${minutesStr} ${ampm}`;
}

interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  total_amount: number;
  order_type: string;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  restaurant_name: string;
}

interface Restaurant {
  id: string;
  name: string;
}

interface RestaurantRevenue {
  restaurant_id: string;
  restaurant_name: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

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

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      navigate('/auth');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchOrders();
    }
  }, [user, userRole]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, dateFilter, restaurantFilter, orders]);

  const fetchOrders = async () => {
    console.log('🔄 Fetching orders data...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      toast.error('Failed to load orders');
      return;
    }

    console.log('📊 Orders fetched:', ordersData?.length || 0, 'orders');

    // If no orders exist, return early with empty state
    if (!ordersData || ordersData.length === 0) {
      console.log('⚠️ No orders found in database');
      setOrders([]);
      setFilteredOrders([]);
      
      // Still fetch restaurants for filter dropdown
      const { data: allRestaurants } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name');
      setRestaurants(allRestaurants || []);
      
      toast.info('No orders found in the database');
      return;
    }

    console.log('✅ Found existing orders in database:', ordersData.length);

    // Get unique customer IDs from orders
    const customerIds = [
      ...new Set(
        ordersData
          .map((o) => o.customer_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    console.log(
      '🔍 Looking up customer details for IDs:',
      customerIds.map((id) => id.substring(0, 8))
    );

    // Fetch customer details via Supabase RPC to link orders -> users accurately
    type CustomerRow = { user_id: string; full_name: string | null; email: string | null; phone: string | null };
    let customerDetails: CustomerRow[] = [];

    if (customerIds.length > 0) {
      try {
        // Prefer fallback function if available (handles missing auth.users gracefully)
        let rpc = await supabase.rpc('get_order_customers_fallback', { customer_ids: customerIds });
        if (rpc.error) {
          console.warn('⚠️ get_order_customers_fallback not available or failed, trying get_order_customers:', rpc.error.message);
          rpc = await supabase.rpc('get_order_customers', { customer_ids: customerIds });
        }

        if (rpc.error) {
          console.error('❌ Error fetching customer details via RPC:', rpc.error);
          toast.error('Failed to load customer details');
        } else {
          customerDetails = (rpc.data as CustomerRow[]) || [];
          console.log('✅ Customer details fetched via RPC:', customerDetails.length);
        }
      } catch (e) {
        console.error('❌ Unexpected error fetching customer details:', e);
        toast.error('Failed to load customer details');
      }

      // As a last resort, try profiles for name/phone if RPC returned no rows
      if (customerDetails.length === 0) {
        try {
          const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .in('id', customerIds);

          if (!profileError && profileRows) {
            customerDetails = profileRows.map((p) => ({
              user_id: p.id,
              full_name: p.full_name,
              email: null,
              phone: p.phone,
            }));
            console.log('✅ Fallback to profiles fetched:', customerDetails.length);
          }
        } catch (profileLookupError) {
          console.error('❌ Unexpected error fetching profiles as fallback:', profileLookupError);
        }
      }
    }

    // Create a lookup map for customer details
    const customerMap = new Map(
      customerDetails.map((c) => [
        c.user_id,
        {
          name: c.full_name?.trim() || '',
          email: c.email?.trim() || 'Email not available',
          phone: c.phone?.trim() || '',
        },
      ])
    );

    console.log('👤 Customer mapping (via RPC):', {
      totalCustomers: customerDetails.length,
      customerIds: customerIds.map((id) => id.substring(0, 8)),
      foundCustomers: customerDetails.map((c) => ({
        id: c.user_id.substring(0, 8),
        name: c.full_name,
        email: c.email,
        phone: c.phone,
      })),
    });

    // Fetch all restaurants for the filter dropdown
    const { data: allRestaurants } = await supabase
      .from('restaurants')
      .select('id, name')
      .order('name');

    // Fetch restaurant names for orders
    const restaurantIds = [...new Set(ordersData.map(o => o.restaurant_id))];
    const { data: orderRestaurants } = await supabase
      .from('restaurants')
      .select('id, name')
      .in('id', restaurantIds);

    // Enrich orders with customer and restaurant data
    const enrichedOrders: Order[] = ordersData.map((order) => {
      const customerInfo = customerMap.get(order.customer_id);
      const customerIdSnippet = order.customer_id ? order.customer_id.substring(0, 8) : 'UNKNOWN';

      const resolvedName =
        customerInfo?.name && customerInfo.name.length > 0
          ? customerInfo.name
          : `Customer ${customerIdSnippet}`;

      const resolvedEmail = customerInfo?.email && customerInfo.email.length > 0
        ? customerInfo.email
        : 'Email not available';

      const resolvedPhone =
        customerInfo?.phone && customerInfo.phone.length > 0
          ? customerInfo.phone
          : 'Phone not available';

      return {
        ...order,
        customer_name: resolvedName,
        customer_email: resolvedEmail,
        customer_phone: resolvedPhone,
        restaurant_name:
          orderRestaurants?.find((r) => r.id === order.restaurant_id)?.name ||
          'Unknown Restaurant',
      };
    });

    console.log('📊 Orders enriched with customer data:', {
      totalOrders: enrichedOrders.length,
      ordersWithCustomerNames: enrichedOrders.filter(o => !o.customer_name.startsWith('Customer ')).length,
      sampleOrder: enrichedOrders[0] ? {
        id: enrichedOrders[0].id.substring(0, 8),
        customerName: enrichedOrders[0].customer_name,
        customerEmail: enrichedOrders[0].customer_email,
        customerPhone: enrichedOrders[0].customer_phone
      } : null
    });

    setOrders(enrichedOrders);
    setFilteredOrders(enrichedOrders);
    setRestaurants(allRestaurants || []);
    
    // Calculate restaurant revenues
    calculateRestaurantRevenues(enrichedOrders);
  };

  const calculateRestaurantRevenues = (ordersData: Order[]) => {
    const revenueMap = new Map<string, RestaurantRevenue>();
    
    ordersData.forEach(order => {
      const restaurantId = order.restaurant_id;
      const restaurantName = order.restaurant_name;
      const amount = Number(order.total_amount);
      
      if (revenueMap.has(restaurantId)) {
        const existing = revenueMap.get(restaurantId)!;
        existing.total_orders += 1;
        existing.total_revenue += amount;
        existing.avg_order_value = existing.total_revenue / existing.total_orders;
      } else {
        revenueMap.set(restaurantId, {
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          total_orders: 1,
          total_revenue: amount,
          avg_order_value: amount,
        });
      }
    });
    
    const revenues = Array.from(revenueMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
    setRestaurantRevenues(revenues);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Restaurant filter
    if (restaurantFilter !== 'all') {
      filtered = filtered.filter(order => order.restaurant_id === restaurantFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(order => new Date(order.created_at) >= filterDate);
    }

    setFilteredOrders(filtered);
    
    // Recalculate revenue summary for filtered data
    calculateRestaurantRevenues(filtered);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      paid: 'default',
      preparing: 'secondary',
      ready: 'outline',
      completed: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  if (loading || !user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl print:p-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 print:hidden">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">Orders Report</h1>
            <p className="text-muted-foreground">View and manage all orders</p>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>

        {/* Print Header (Hidden on screen) */}
        <div className="hidden print:block mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">ALAN - Orders Report</h1>
            <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
            {restaurantFilter !== 'all' && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                Restaurant: {restaurants.find(r => r.id === restaurantFilter)?.name || 'Selected Restaurant'}
              </p>
            )}
            {statusFilter !== 'all' && (
              <p className="text-sm text-muted-foreground mt-1">Status Filter: {statusFilter.toUpperCase()}</p>
            )}
            {dateFilter !== 'all' && (
              <p className="text-sm text-muted-foreground mt-1">
                Date Filter: {dateFilter === 'today' ? 'Today' : 
                           dateFilter === 'week' ? 'Last 7 Days' : 
                           dateFilter === 'month' ? 'Last 30 Days' : dateFilter}
              </p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{filteredOrders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} MMK</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length).toLocaleString() : 0} MMK
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 print:hidden">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by restaurant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restaurants</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setRestaurantFilter('all');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Revenue Summary */}
        {restaurantFilter === 'all' && restaurantRevenues.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Restaurant Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurantRevenues.map((restaurant) => (
                  <Card key={restaurant.restaurant_id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 text-blue-900">{restaurant.restaurant_name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Orders:</span>
                          <span className="font-medium">{restaurant.total_orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Revenue:</span>
                          <span className="font-bold text-green-600">{restaurant.total_revenue.toLocaleString()} MMK</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Order Value:</span>
                          <span className="font-medium">{Math.round(restaurant.avg_order_value).toLocaleString()} MMK</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => setRestaurantFilter(restaurant.restaurant_id)}
                      >
                        View Orders
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Restaurant Summary */}
        {restaurantFilter !== 'all' && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    {restaurants.find(r => r.id === restaurantFilter)?.name || 'Selected Restaurant'} Performance
                  </h3>
                  <p className="text-sm text-green-700">Filtered results for selected restaurant</p>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-800">{filteredOrders.length}</p>
                    <p className="text-xs text-green-600">Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-800">{totalRevenue.toLocaleString()} MMK</p>
                    <p className="text-xs text-green-600">Revenue</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-800">
                      {filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length).toLocaleString() : 0} MMK
                    </p>
                    <p className="text-xs text-green-600">Avg Order</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Details</span>
              <span className="text-sm font-normal text-muted-foreground">
                {restaurantFilter !== 'all' 
                  ? `Showing ${filteredOrders.length} orders for ${restaurants.find(r => r.id === restaurantFilter)?.name}`
                  : `Showing ${filteredOrders.length} of ${orders.length} orders`
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{order.customer_name}</div>
                            {order.customer_email !== 'Email not available' && (
                              <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                            )}
                            {order.customer_phone !== 'Phone not available' && (
                              <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{order.restaurant_name}</TableCell>
                        <TableCell className="capitalize">{order.order_type}</TableCell>
                        <TableCell className="font-semibold">{Number(order.total_amount).toLocaleString()} MMK</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatDateTime(order.created_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {restaurantFilter !== 'all' 
                          ? `No orders found for ${restaurants.find(r => r.id === restaurantFilter)?.name || 'selected restaurant'}`
                          : 'No orders found matching the current filters'
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrders;
