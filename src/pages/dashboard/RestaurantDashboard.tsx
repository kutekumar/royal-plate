 import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  UtensilsCrossed,
  Receipt,
  ScanLine,
  LayoutList,
  Settings,
  Bell,
  BellDot,
  CheckCircle2,
  BookOpenText
} from 'lucide-react';
import OrdersManagement from '@/components/dashboard/OrdersManagement';
import QRScanner from '@/components/dashboard/QRScanner';
import MenuManagement from '@/components/dashboard/MenuManagement';
import RestaurantSettings from '@/components/dashboard/RestaurantSettings';
import RestaurantBlogManagement from '@/components/dashboard/RestaurantBlogManagement';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useRestaurantBlogNotifications } from '@/hooks/useRestaurantBlogNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const RestaurantDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'orders' | 'scanner' | 'menu' | 'blog' | 'settings'>('orders');

  useEffect(() => {
    // Read tab from URL parameters
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as 'orders' | 'scanner' | 'menu' | 'blog' | 'settings' | null;
    if (tab && ['orders', 'scanner', 'menu', 'blog', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const {
    restaurantId,
    notifications: orderNotifications,
    unreadCount: orderUnreadCount,
    loading: orderNotificationsLoading,
    markAllAsRead: markAllOrdersAsRead,
    markAsRead: markOrderAsRead,
  } = useOrderNotifications({ limit: 50, enableSound: true });

  const {
    notifications: blogNotifications,
    unreadCount: blogUnreadCount,
    loading: blogNotificationsLoading,
    markAllAsRead: markAllBlogAsRead,
    markAsRead: markBlogAsRead,
  } = useRestaurantBlogNotifications({ limit: 50, enableSound: true });

  // Combine notifications and counts
  const notifications = [...orderNotifications, ...blogNotifications];
  
  // Sort notifications with newest first (unread notifications should appear at the top)
  const sortedNotifications = notifications.sort((a, b) => {
    // First sort by unread status (unread first)
    if (a.status !== b.status) {
      return a.status === 'unread' ? -1 : 1;
    }
    // Then sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  const unreadCount = orderUnreadCount + blogUnreadCount;
  const notificationsLoading = orderNotificationsLoading || blogNotificationsLoading;
  
  const markAllAsRead = async () => {
    await Promise.all([
      markAllOrdersAsRead(),
      markAllBlogAsRead()
    ]);
  };

  const markAsRead = async (id: string) => {
    // Try order notifications first, then blog notifications
    const orderNotification = orderNotifications.find(n => n.id === id);
    if (orderNotification) {
      await markOrderAsRead(id);
    } else {
      await markBlogAsRead(id);
    }
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleOpenNotificationOrder = async (notification: any) => {
    if (!notification?.order_id) return;
    setSelectedOrderId(notification.order_id);
    setOrderDetail(null);
    setOrderDetailOpen(true);

    // Mark this notification as read optimistically
    if (notification.id) {
      markAsRead(notification.id);
    }

    // Lazy-load specific order details for modal
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // 1) Fetch the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_items,
          total_amount,
          status,
          created_at,
          order_type,
          customer_id
        `
        )
        .eq('id', notification.order_id)
        .single();

      if (orderError || !orderData) {
        console.error('Failed to load order detail for notification:', orderError);
        return;
      }

      // 2) Fetch customer profile exactly like OrdersManagement does (get_order_customers)
      let customerName: string | null = null;
      let customerPhone: string | null = null;

      if (orderData.customer_id) {
        const { data: customers, error: customersError } = await supabase.rpc(
          'get_order_customers',
          { customer_ids: [orderData.customer_id] }
        );

        if (customersError) {
          console.error('Failed to load customer details for modal:', customersError);
        } else if (customers && customers.length > 0) {
          const customer = customers[0];
          customerName =
            (customer.full_name && String(customer.full_name).trim()) || null;
          customerPhone =
            (customer.phone && String(customer.phone).trim()) || null;
        }
      }

      // 3) Also respect enriched name from notification if present
      if (
        !customerName &&
        notification.customer_name &&
        typeof notification.customer_name === 'string' &&
        notification.customer_name.trim()
      ) {
        customerName = notification.customer_name.trim();
      }

      setOrderDetail({
        ...orderData,
        customer_display_name: customerName,
        customer_display_phone: customerPhone,
      });
    } catch (err) {
      console.error('Error loading order detail module:', err);
    }
  };

  const handleOpenNotificationBlog = async (notification: any) => {
    if (!notification?.blog_post_id) return;
    
    // Mark this notification as read
    if (notification.id) {
      markAsRead(notification.id);
    }

    // Navigate to blog management tab and scroll to the specific post if possible
    navigate('/dashboard?tab=blog');
    
    // Optional: You could add logic here to highlight the specific blog post
    // or scroll to it, but for now we just navigate to the blog tab
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-background pb-20">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl luxury-gradient flex items-center justify-center shadow-gold">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Restaurant Dashboard</h1>
                <p className="text-sm text-gray-500 font-medium">
                  Manage your restaurant
                  {restaurantId && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <span className="text-success">Live notifications active</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Enhanced Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 active-scale"
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[380px] max-h-[480px] p-0 bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden"
                >
                <DropdownMenuLabel className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-gray-900">Notifications</span>
                    <span className="text-sm text-gray-500">
                      {notificationsLoading
                        ? 'Loading...'
                        : notifications.length === 0
                        ? 'No notifications yet'
                        : `${unreadCount} unread of ${notifications.length} total`}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-sm font-medium text-royal-blue hover:text-royal-blue/80 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Enhanced Scrollable notification list */}
                <ScrollArea className="max-h-[380px]">
                  <div className="max-h-[380px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <Bell className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">You'll see new orders and blog comments here</p>
                      </div>
                    ) : (
                      sortedNotifications.map((n) => {
                        // Handle both order and blog comment notifications
                        const isBlogNotification = 'blog_post_id' in n;
                        
                        let title = '';
                        if (isBlogNotification) {
                          title = n.message || `${n.customer_name || 'Someone'} commented on your blog post`;
                        } else {
                          title = n.message && n.message.trim().length > 0
                            ? n.message
                            : n.customer_name && n.total_amount
                            ? `${n.customer_name} placed an order worth $${Number(
                                n.total_amount
                              ).toFixed(2)}`
                            : 'New order received';
                        }

                        const handleNotificationClick = () => {
                          if (isBlogNotification) {
                            handleOpenNotificationBlog(n);
                          } else {
                            handleOpenNotificationOrder(n);
                          }
                        };

                        return (
                          <DropdownMenuItem
                            key={n.id}
                            onClick={handleNotificationClick}
                            className={`
                              w-full px-6 py-4 flex items-start gap-3
                              cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-b-0
                              ${
                                n.status === 'unread'
                                  ? 'bg-blue-50/50 hover:bg-blue-50/80'
                                  : 'hover:bg-gray-50'
                              }
                            `}
                          >
                            {/* Read/unread indicator */}
                            <div className="mt-1 w-2.5 h-2.5 flex-shrink-0">
                              {n.status === 'unread' ? (
                                <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
                              ) : (
                                <span className="block w-2.5 h-2.5 rounded-full border border-gray-300 bg-transparent"></span>
                              )}
                            </div>

                            {/* Text content */}
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div
                                className={`
                                  text-sm text-left leading-relaxed
                                  ${
                                    n.status === 'unread'
                                      ? 'font-semibold text-gray-900'
                                      : 'font-normal text-gray-700'
                                  }
                                `}
                              >
                                {title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(() => {
                                  const d = new Date(n.created_at);
                                  const now = new Date();
                                  const diffMs = now.getTime() - d.getTime();
                                  const diffMins = Math.floor(diffMs / 60000);
                                  const diffHours = Math.floor(diffMs / 3600000);
                                  const diffDays = Math.floor(diffMs / 86400000);
                                  
                                  if (diffMins < 1) return 'Just now';
                                  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                                  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                  
                                  return d.toLocaleDateString();
                                })()}
                              </div>
                            </div>
                            
                            {/* Type indicator */}
                            {isBlogNotification ? (
                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  Blog
                                </span>
                              </div>
                            ) : (
                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                  Order
                                </span>
                              </div>
                            )}
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Enhanced Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 active-scale flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'orders' && <OrdersManagement />}
        {activeTab === 'scanner' && <QRScanner />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'blog' && <RestaurantBlogManagement />}
        {activeTab === 'settings' && <RestaurantSettings />}

        {/* Order Detail Modal for notifications */}
        <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                View details for this order from your notifications.
              </DialogDescription>
            </DialogHeader>
            {!orderDetail ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading order details...
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {/* Order ID */}
                <div className="flex justify-between">
                  <span className="font-medium">Order ID</span>
                  <span className="font-mono text-xs">
                    {String(orderDetail.id).substring(0, 8)}
                  </span>
                </div>

                {/* Customer info: use same mechanism as OrdersManagement (get_order_customers) */}
                <div className="flex justify-between">
                  <span className="font-medium">Customer</span>
                  <span>
                    {(() => {
                      const name =
                        (orderDetail.customer_display_name &&
                          String(orderDetail.customer_display_name).trim()) ||
                        null;
                      const phone =
                        (orderDetail.customer_display_phone &&
                          String(orderDetail.customer_display_phone).trim()) ||
                        null;

                      if (name && phone) return `${name} • ${phone}`;
                      if (name) return name;
                      if (phone) return phone;

                      // If everything fails, neutral fallback:
                      return 'Customer';
                    })()}
                  </span>
                </div>

                {/* Total */}
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-semibold">
                    {Number(orderDetail.total_amount || 0).toLocaleString()} MMK
                  </span>
                </div>

                {/* Status with inline updater that syncs Orders list */}
                <div className="flex justify-between items-center gap-3">
                  <span className="font-medium">Status</span>
                  <select
                    className="text-xs px-2 py-1 border border-border rounded-md bg-background capitalize"
                    value={orderDetail.status || 'paid'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        const { supabase } = await import('@/integrations/supabase/client');
                        const { error } = await supabase
                          .from('orders')
                          .update({ status: newStatus })
                          .eq('id', orderDetail.id);

                        if (error) {
                          console.error('Failed to update order status from modal:', error);
                          return;
                        }

                        // Update local modal state so UI reflects change
                        setOrderDetail((prev: any) =>
                          prev ? { ...prev, status: newStatus } : prev
                        );

                        // Broadcast to OrdersManagement so it updates in-memory without reload
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('orderStatusUpdated', {
                              detail: { orderId: orderDetail.id, status: newStatus },
                            })
                          );
                        }
                      } catch (err) {
                        console.error('Error updating order status from modal:', err);
                      }
                    }}
                  >
                    <option value="paid">Paid</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="served">Served</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type</span>
                  <span className="capitalize">
                    {orderDetail.order_type || 'dine_in'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Placed At</span>
                  <div className="text-xs text-muted-foreground">
                    {orderDetail.created_at
                      ? (() => {
                          const d = new Date(orderDetail.created_at);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          let hours = d.getHours();
                          const minutes = String(d.getMinutes()).padStart(2, '0');
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          hours = hours % 12 || 12;
                          return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
                        })()
                      : ''}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Items</span>
                  <ul className="mt-1 space-y-0.5">
                    {(orderDetail.order_items || []).map(
                      (item: any, idx: number) => (
                        <li
                          key={idx}
                          className="flex justify-between text-xs text-muted-foreground"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          {item.price && (
                            <span>
                              {Number(item.price * item.quantity).toLocaleString()}{' '}
                              MMK
                            </span>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Enhanced Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2">
          <button
            onClick={() => {
              setActiveTab('orders');
              navigate('/dashboard?tab=orders');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-all duration-200 active-scale ${
              activeTab === 'orders' 
                ? 'bg-royal-blue/10 text-royal-blue shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Receipt className="h-6 w-6 mb-1" />
            <span className="text-xs font-semibold">Orders</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('scanner');
              navigate('/dashboard?tab=scanner');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-all duration-200 active-scale ${
              activeTab === 'scanner' 
                ? 'bg-royal-blue/10 text-royal-blue shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ScanLine className="h-6 w-6 mb-1" />
            <span className="text-xs font-semibold">QR Scanner</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('menu');
              navigate('/dashboard?tab=menu');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-all duration-200 active-scale ${
              activeTab === 'menu' 
                ? 'bg-royal-blue/10 text-royal-blue shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutList className="h-6 w-6 mb-1" />
            <span className="text-xs font-semibold">Menu</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('blog');
              navigate('/dashboard?tab=blog');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-all duration-200 active-scale ${
              activeTab === 'blog' 
                ? 'bg-royal-blue/10 text-royal-blue shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpenText className="h-6 w-6 mb-1" />
            <span className="text-xs font-semibold">Blog</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              navigate('/dashboard?tab=settings');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-all duration-200 active-scale ${
              activeTab === 'settings' 
                ? 'bg-royal-blue/10 text-royal-blue shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs font-semibold">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default RestaurantDashboard;
