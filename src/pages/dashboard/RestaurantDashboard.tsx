import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  UtensilsCrossed,
  Receipt,
  ScanLine,
  LayoutList,
  Settings,
  Bell,
  BellDot,
  BookOpenText,
  TrendingUp,
  DollarSign,
  Clock,
  ChefHat,
  ShoppingBag,
  Users,
  X,
  ChevronRight,
  Menu,
  Crown,
  Circle,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import OrdersManagement from '@/components/dashboard/OrdersManagement';
import QRScanner from '@/components/dashboard/QRScanner';
import MenuManagement from '@/components/dashboard/MenuManagement';
import RestaurantSettings from '@/components/dashboard/RestaurantSettings';
import RestaurantBlogManagement from '@/components/dashboard/RestaurantBlogManagement';
import { useOrderNotifications, OrderNotification } from '@/hooks/useOrderNotifications';
import { toast } from 'sonner';
import { useRestaurantBlogNotifications, RestaurantBlogNotification } from '@/hooks/useRestaurantBlogNotifications';
import { motion, AnimatePresence, useMotionValue, useTransform, useInView, animate } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface OrderDetail extends OrderNotification {
  customer_display_name?: string | null;
  customer_display_phone?: string | null;
  order_type?: string;
  order_items?: any[];
}

const tabs = [
  { id: 'orders' as const, label: 'Orders', icon: Receipt, desc: 'Manage incoming orders' },
  { id: 'scanner' as const, label: 'QR Scanner', icon: ScanLine, desc: 'Verify customer QR codes' },
  { id: 'menu' as const, label: 'Menu', icon: LayoutList, desc: 'Manage your menu items' },
  { id: 'blog' as const, label: 'Blog', icon: BookOpenText, desc: 'Create & publish posts' },
  { id: 'settings' as const, label: 'Settings', icon: Settings, desc: 'Restaurant profile' },
];

const AnimatedCounter = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 1.5, ease: [0.22, 1, 0.36, 1] });
      const unsubscribe = rounded.on('change', (latest) => setDisplayValue(latest));
      return () => { controls.stop(); unsubscribe(); };
    }
  }, [isInView, value]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
};

const RestaurantDashboard = () => {
  const { signOut, user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'restaurant_owner')) {
      toast.error('Restaurant owner access required');
      if (!user) navigate('/auth', { replace: true });
      else if (userRole === 'admin') navigate('/admin', { replace: true });
      else navigate('/home', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  if (loading || !user || userRole !== 'restaurant_owner') {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-royal-blue rounded-full animate-pulse-soft" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium tracking-wide">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'orders' | 'scanner' | 'menu' | 'blog' | 'settings'>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    totalMenuItems: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as typeof activeTab | null;
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user?.id)
          .single();

        if (!restaurant) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [{ count: todayOrders }, { data: todayRevenueData }, { count: activeOrders }, { count: menuItems }] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id).gte('created_at', today.toISOString()),
          supabase.from('orders').select('total_amount').eq('restaurant_id', restaurant.id).gte('created_at', today.toISOString()),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id).in('status', ['paid', 'preparing', 'ready']),
          supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
        ]);

        const revenue = (todayRevenueData || []).reduce((sum, o: any) => sum + Number(o.total_amount || 0), 0);

        setStats({
          todayOrders: todayOrders || 0,
          todayRevenue: revenue,
          activeOrders: activeOrders || 0,
          totalMenuItems: menuItems || 0,
        });
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    };

    fetchStats();
  }, [user]);

  const {
    restaurantId,
    notifications: orderNotifications,
    unreadCount: orderUnreadCount,
    loading: orderNotificationsLoading,
    markAllAsRead: markAllOrdersAsRead,
    markAsRead: markOrderAsRead,
  } = useOrderNotifications({ limit: 50, enableSound: true });

  const { notifications: blogNotifications, unreadCount: blogUnreadCount, loading: blogNotificationsLoading, markAllAsRead: markAllBlogAsRead, markAsRead: markBlogAsRead } = useRestaurantBlogNotifications({ limit: 50, enableSound: true });

  const notifications = [...orderNotifications, ...blogNotifications];
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'unread' ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const unreadCount = orderUnreadCount + blogUnreadCount;
  const notificationsLoading = orderNotificationsLoading || blogNotificationsLoading;

  const markAllAsRead = async () => {
    await Promise.all([markAllOrdersAsRead(), markAllBlogAsRead()]);
  };

  const markAsRead = async (id: string) => {
    const orderNotification = orderNotifications.find(n => n.id === id);
    if (orderNotification) await markOrderAsRead(id);
    else await markBlogAsRead(id);
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleOpenNotificationOrder = async (notification: OrderNotification) => {
    if (!notification?.order_id) return;
    setSelectedOrderId(notification.order_id);
    setOrderDetail(null);
    setOrderDetailOpen(true);

    if (notification.id) markAsRead(notification.id);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, order_items, total_amount, status, created_at, order_type, customer_id')
        .eq('id', notification.order_id)
        .single();

      if (orderError || !orderData) return;

      let customerName: string | null = null;
      let customerPhone: string | null = null;

      if (orderData.customer_id) {
        const { data: customers } = await supabase.rpc('get_order_customers', { customer_ids: [orderData.customer_id] });
        if (customers?.length > 0) {
          customerName = customers[0].full_name?.trim() || null;
          customerPhone = customers[0].phone?.trim() || null;
        }
      }

      if (!customerName && notification.customer_name?.trim()) {
        customerName = notification.customer_name.trim();
      }

      setOrderDetail({ ...orderData, customer_display_name: customerName, customer_display_phone: customerPhone });
    } catch (err) {
      console.error('Error loading order detail:', err);
    }
  };

  const handleOpenNotificationBlog = (notification: RestaurantBlogNotification) => {
    if (notification.id) markAsRead(notification.id);
    navigate('/dashboard?tab=blog');
  };

  const tabsList = [
    { id: 'orders', label: 'Orders', icon: Receipt, count: stats.activeOrders },
    { id: 'scanner', label: 'Scan', icon: ScanLine },
    { id: 'menu', label: 'Menu', icon: LayoutList },
    { id: 'blog', label: 'Blog', icon: BookOpenText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const statCards = [
    { label: "Today's Revenue", gradient: 'from-emerald-400 to-emerald-600', icon: DollarSign, isCurrency: true },
    { label: 'Today Orders', gradient: 'from-blue-400 to-blue-600', icon: ShoppingBag, isCurrency: false },
    { label: 'Active Orders', gradient: 'from-amber-400 to-amber-600', icon: Clock, isCurrency: false },
    { label: 'Menu Items', gradient: 'from-violet-400 to-violet-600', icon: ChefHat, isCurrency: false },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#F8F7F4] overflow-hidden">
      {/* Premium Header */}
      <header className="shrink-0 sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-royal-blue hover:bg-gray-100 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-blue to-royal-blue-dark flex items-center justify-center shadow-lg shadow-royal-blue/20">
                  <Crown className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-royal-blue tracking-tight font-montserrat">Royal Plate</h1>
                  <p className="text-[11px] text-gray-500 font-medium -mt-0.5">Owner Dashboard</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
                <span className="text-[11px] font-medium text-emerald-700 tracking-wide">Live</span>
              </div>

              {/* Notification Bell */}
              <div className="relative group">
                <button
                  onClick={() => {}} 
                  className="relative w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 flex items-center justify-center transition-all"
                >
                  {unreadCount > 0 ? (
                    <BellDot className="w-[18px] h-[18px] text-gray-600" />
                  ) : (
                    <Bell className="w-[18px] h-[18px] text-gray-600" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <div className="absolute right-0 top-12 w-[400px] sm:w-[440px] opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0 z-50">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-900/10 overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                        <p className="text-[11px] text-gray-500">
                          {notificationsLoading ? 'Loading...' : notifications.length === 0 ? 'No notifications yet' : `${unreadCount} unread of ${notifications.length} total`}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[11px] font-semibold text-royal-blue hover:text-royal-blue/70 transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>

                    <ScrollArea className="max-h-[400px]">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium">All caught up!</p>
                          <p className="text-[11px] text-gray-400 mt-1">New orders and blog comments will appear here</p>
                        </div>
                      ) : (
                        <div className="py-2">
                          {sortedNotifications.map((n, idx) => {
                            const isBlogNotification = 'blog_post_id' in n;
                            let title = '';
                            if (isBlogNotification) {
                              title = n.message || `${n.customer_name || 'Someone'} commented on your blog post`;
                            } else {
                              title = n.message?.trim() || (n.customer_name && n.total_amount ? `${n.customer_name} placed an order worth ${Number(n.total_amount).toLocaleString()} MMK` : 'New order received');
                            }

                            return (
                              <button
                                key={n.id}
                                onClick={() => isBlogNotification ? handleOpenNotificationBlog(n) : handleOpenNotificationOrder(n)}
                                className={`w-full px-5 py-3.5 flex items-start gap-3 text-left transition-all duration-150 border-b border-gray-50 last:border-b-0 ${n.status === 'unread' ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-gray-50/50'}`}
                              >
                                <div className="mt-1 flex-shrink-0">
                                  {isBlogNotification ? (
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                                      <MessageCircle className="w-4 h-4 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center shadow-sm">
                                      <ShoppingBag className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[13px] leading-snug ${n.status === 'unread' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{title}</p>
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    {(() => {
                                      const d = new Date(n.created_at);
                                      const now = new Date();
                                      const diffMs = now.getTime() - d.getTime();
                                      const diffMins = Math.floor(diffMs / 60000);
                                      const diffHours = Math.floor(diffMs / 3600000);
                                      const diffDays = Math.floor(diffMs / 86400000);
                                      if (diffMins < 1) return 'Just now';
                                      if (diffMins < 60) return `${diffMins}m ago`;
                                      if (diffHours < 24) return `${diffHours}h ago`;
                                      if (diffDays < 7) return `${diffDays}d ago`;
                                      return d.toLocaleDateString();
                                    })()}
                                  </p>
                                </div>
                                {n.status === 'unread' && (
                                  <div className="w-2 h-2 rounded-full bg-royal-blue flex-shrink-0 mt-2 shadow-sm shadow-royal-blue/30" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>

              {/* Avatar + Logout */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{user.email?.[0]?.toUpperCase() || 'O'}</span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-600 max-w-[100px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 flex items-center justify-center transition-all group"
                >
                  <LogOut className="w-[16px] h-[16px] text-gray-500 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-white/70 backdrop-blur-xl border-r border-gray-100 sticky top-20">
          <nav className="flex-1 px-3 py-6 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(`/dashboard?tab=${tab.id}`);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-royal-blue/10 to-royal-blue/5 text-royal-blue shadow-sm border border-royal-blue/10'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'bg-gradient-to-br from-royal-blue to-brand-blue shadow-sm shadow-royal-blue/20' : 'bg-gray-50 group-hover:bg-gray-100'
                  }`}>
                    <Icon className={`w-[16px] h-[16px] ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isActive ? 'text-royal-blue' : 'text-gray-700'}`}>{tab.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{tab.desc}</p>
                  </div>
                  {isActive && (
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-royal-blue to-brand-blue" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-3 pb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-royal-blue/5 to-gold/5 border border-royal-blue/10">
              <Crown className="w-5 h-5 text-gold mb-2" />
              <p className="text-[11px] font-medium text-royal-blue">Premium Dashboard</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Manage your restaurant with elegance</p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:hidden"
              >
                <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal-blue to-royal-blue-dark flex items-center justify-center">
                      <Crown className="w-4 h-4 text-gold" />
                    </div>
                    <span className="font-bold text-royal-blue font-montserrat">Royal Plate</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <nav className="px-3 py-4 space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          navigate(`/dashboard?tab=${tab.id}`);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                          isActive ? 'bg-gradient-to-r from-royal-blue/10 to-royal-blue/5 text-royal-blue border border-royal-blue/10' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-gradient-to-br from-royal-blue to-brand-blue' : 'bg-gray-50'
                        }`}>
                          <Icon className={`w-[16px] h-[16px] ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isActive ? 'text-royal-blue' : 'text-gray-700'}`}>{tab.label}</p>
                          <p className="text-[10px] text-gray-400">{tab.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-24 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((card, idx) => {
                const Icon = card.icon;
                const cardValue = idx === 0 ? stats.todayRevenue : idx === 1 ? stats.todayOrders : idx === 2 ? stats.activeOrders : stats.totalMenuItems;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(83,109,254,0.15)' }}
                    className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 p-5 shadow-lg"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} bg-opacity-10 flex items-center justify-center mb-3 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-[#1D2956] font-montserrat">
                      {card.isCurrency && <span className="text-lg text-gray-400 mr-1">MMK</span>}
                      <AnimatedCounter value={cardValue} />
                    </p>
                    <p className="text-gray-500 text-xs font-medium mt-1">{card.label}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'orders' && <OrdersManagement />}
                {activeTab === 'scanner' && <QRScanner />}
                {activeTab === 'menu' && <MenuManagement />}
                {activeTab === 'blog' && <RestaurantBlogManagement />}
                {activeTab === 'settings' && <RestaurantSettings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Premium Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-40 lg:hidden pb-safe">
        <div className="flex items-center justify-around h-[72px] px-2">
          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(`/dashboard?tab=${tab.id}`);
                }}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-royal-blue' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive ? 'bg-gradient-to-br from-royal-blue/10 to-royal-blue/5' : ''
                }`}>
                  <Icon className={`w-[18px] h-[18px] transition-all duration-200 ${
                    isActive ? 'text-royal-blue' : ''
                  }`} />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[8px] font-bold text-white flex items-center justify-center shadow-sm">
                      {tab.count > 9 ? '9+' : tab.count}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${
                  isActive ? 'text-royal-blue' : 'text-gray-400'
                }`}>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-royal-blue to-brand-blue"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {orderDetailOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setOrderDetailOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-royal-blue font-montserrat">Order Details</h3>
                  <p className="text-[11px] text-gray-500">View and manage this order</p>
                </div>
                <button onClick={() => setOrderDetailOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="px-6 py-5">
                {!orderDetail ? (
                  <div className="py-8 text-center">
                    <div className="w-8 h-8 border-2 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-3">Loading order details...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Order ID</p>
                        <p className="text-xs font-mono font-semibold text-gray-900 mt-1">#{String(orderDetail.id).substring(0, 8)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Type</p>
                        <p className="text-xs font-semibold text-gray-900 mt-1 capitalize">{orderDetail.order_type || 'dine_in'}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-royal-blue/5 border border-royal-blue/10">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Customer</p>
                      <p className="text-sm font-semibold text-royal-blue mt-1">
                        {(() => {
                          const name = orderDetail.customer_display_name?.trim() || null;
                          const phone = orderDetail.customer_display_phone?.trim() || null;
                          if (name && phone) return `${name}  ${phone}`;
                          if (name) return name;
                          if (phone) return phone;
                          return 'Customer';
                        })()}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Status</p>
                      <select
                        className="mt-1 w-full text-sm font-semibold bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-gray-900"
                        value={orderDetail.status || 'paid'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderDetail.id);
                            if (error) return;
                            setOrderDetail((prev: any) => prev ? { ...prev, status: newStatus } : prev);
                            window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId: orderDetail.id, status: newStatus } }));
                          } catch (err) { console.error(err); }
                        }}
                      >
                        {['paid', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map(s => (
                          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total Amount</p>
                      <p className="text-lg font-bold text-royal-blue font-montserrat mt-1">{Number(orderDetail.total_amount || 0).toLocaleString()} MMK</p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Placed At</p>
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        {orderDetail.created_at ? (() => {
                          const d = new Date(orderDetail.created_at);
                          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} - ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
                        })() : ''}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-2">Items</p>
                      <ul className="space-y-1.5">
                        {(orderDetail.order_items || []).map((item: any, idx: number) => (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700"><span className="font-semibold text-gray-900">{item.quantity}x</span> {item.name}</span>
                            <span className="font-semibold text-gray-900">{Number(item.price * item.quantity).toLocaleString()} MMK</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDashboard;
