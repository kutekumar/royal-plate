import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, ShoppingBag, DollarSign, TrendingUp, Crown, ChevronRight, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion, useMotionValue, useTransform, useInView, animate } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';

interface Stats {
  totalRestaurants: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}

const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
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

  return <span ref={ref}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalRestaurants: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      toast.error('Admin access required');
      if (!user) navigate('/auth', { replace: true });
      else if (userRole === 'restaurant_owner') navigate('/dashboard', { replace: true });
      else navigate('/home', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') fetchStats();
  }, [user, userRole]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const [{ count: restaurantsCount }, { data: orders, count: ordersCount }, { count: customersCount }] = await Promise.all([
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount', { count: 'exact' }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      ]);
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      setStats({ totalRestaurants: restaurantsCount || 0, totalOrders: ordersCount || 0, totalCustomers: customersCount || 0, totalRevenue });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally { setStatsLoading(false); }
  };

  if (loading || !user || userRole !== 'admin') return null;

  const statCards = [
    { label: 'Total Revenue', gradient: 'from-emerald-400 to-emerald-600', icon: DollarSign, value: stats.totalRevenue, isCurrency: true },
    { label: 'Total Orders', gradient: 'from-blue-400 to-blue-600', icon: ShoppingBag, value: stats.totalOrders, isCurrency: false },
    { label: 'Restaurants', gradient: 'from-violet-400 to-violet-600', icon: Building2, value: stats.totalRestaurants, isCurrency: false },
    { label: 'Customers', gradient: 'from-amber-400 to-amber-600', icon: Users, value: stats.totalCustomers, isCurrency: false },
  ];

  const navCards = [
    { label: 'Restaurants', value: stats.totalRestaurants, icon: Building2, path: '/admin/restaurants', gradient: 'from-blue-500 to-blue-600', desc: 'Manage all restaurants' },
    { label: 'Owners', icon: Shield, path: '/admin/owners', gradient: 'from-violet-500 to-violet-600', desc: 'Manage owner accounts' },
    { label: 'Orders', value: stats.totalOrders, icon: ShoppingBag, path: '/admin/orders', gradient: 'from-emerald-500 to-emerald-600', desc: 'View platform orders' },
    { label: 'Users', value: stats.totalCustomers, icon: Users, path: '/admin/users', gradient: 'from-amber-500 to-amber-600', desc: 'Manage all users' },
  ];

  return (
    <AdminLayout title="Overview" subtitle="Platform insights">
      {statsLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-royal-blue rounded-full animate-pulse-soft" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Loading admin panel...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
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
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-[#1D2956] font-montserrat">
                    {card.isCurrency && <span className="text-lg text-gray-400 mr-1">MMK</span>}
                    <AnimatedCounter value={card.value} />
                  </p>
                  <p className="text-gray-500 text-xs font-medium mt-1">{card.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-gold" />
              <h2 className="text-base font-bold text-royal-blue font-montserrat">Quick Navigation</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {navCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 + 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(card.path)}
                    className="group relative bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-lg hover:shadow-gray-200/40 hover:border-gray-200 transition-all duration-300 overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient}/10 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6`} style={{ color: card.gradient.includes('blue') ? '#3B82F6' : card.gradient.includes('violet') ? '#8B5CF6' : card.gradient.includes('emerald') ? '#10B981' : '#F59E0B' }} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-lg font-bold text-royal-blue font-montserrat">{card.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
