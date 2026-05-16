import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Building2, Users, ShoppingBag, Shield, LogOut, Crown, Menu, X,
  UserCog, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin', desc: 'Platform insights' },
  { id: 'restaurants', label: 'Restaurants', icon: Building2, path: '/admin/restaurants', desc: 'Manage restaurants' },
  { id: 'owners', label: 'Owners', icon: UserCog, path: '/admin/owners', desc: 'Restaurant owners' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users', desc: 'All platform users' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, path: '/admin/orders', desc: 'Order reports' },
];

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-xs">
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
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-royal-blue tracking-tight font-montserrat">Royal Plate</h1>
                  <p className="text-[11px] text-gray-500 font-medium -mt-0.5">Admin Panel</p>
                </div>
              </div>
              <div className="lg:hidden">
                <h1 className="text-base font-bold text-royal-blue font-montserrat">{title}</h1>
                {subtitle && <p className="text-[10px] text-gray-500 -mt-0.5">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-royal-blue/5 rounded-full border border-royal-blue/10">
                <div className="w-1.5 h-1.5 rounded-full bg-royal-blue animate-pulse-soft" />
                <span className="text-[11px] font-medium text-royal-blue tracking-wide">Administrator</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-royal-blue to-brand-blue flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{user?.email?.[0]?.toUpperCase() || 'A'}</span>
                </div>
                <span className="text-[11px] font-medium text-gray-600 max-w-[100px] truncate hidden sm:block">{user?.email}</span>
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
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white/70 backdrop-blur-xl border-r border-gray-100 min-h-[calc(100vh-5rem)] sticky top-20">
          <nav className="flex-1 px-3 py-6 space-y-1">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    navigate(tab.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    active
                      ? 'bg-gradient-to-r from-royal-blue/10 to-royal-blue/5 text-royal-blue shadow-sm border border-royal-blue/10'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    active ? 'bg-gradient-to-br from-royal-blue to-brand-blue shadow-sm shadow-royal-blue/20' : 'bg-gray-50 group-hover:bg-gray-100'
                  }`}>
                    <Icon className={`w-[16px] h-[16px] ${active ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${active ? 'text-royal-blue' : 'text-gray-700'}`}>{tab.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{tab.desc}</p>
                  </div>
                  {active && (
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-royal-blue to-brand-blue" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-3 pb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-royal-blue/5 to-gold/5 border border-royal-blue/10">
              <Crown className="w-5 h-5 text-gold mb-2" />
              <p className="text-[11px] font-medium text-royal-blue">Platform Admin</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Full system control</p>
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
                      <Shield className="w-4 h-4 text-gold" />
                    </div>
                    <span className="font-bold text-royal-blue font-montserrat">Admin Panel</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <nav className="px-3 py-4 space-y-1">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.path);
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigate(tab.path);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                          active ? 'bg-gradient-to-r from-royal-blue/10 to-royal-blue/5 text-royal-blue border border-royal-blue/10' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          active ? 'bg-gradient-to-br from-royal-blue to-brand-blue' : 'bg-gray-50'
                        }`}>
                          <Icon className={`w-[16px] h-[16px] ${active ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${active ? 'text-royal-blue' : 'text-gray-700'}`}>{tab.label}</p>
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
        <main className="flex-1 min-w-0 pb-24 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-40 lg:hidden pb-safe">
        <div className="flex items-center justify-around h-[72px] px-2">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  navigate(tab.path);
                  setSidebarOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
                  active ? 'text-royal-blue' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  active ? 'bg-gradient-to-br from-royal-blue/10 to-royal-blue/5' : ''
                }`}>
                  <Icon className={`w-[18px] h-[18px] transition-all duration-200 ${
                    active ? 'text-royal-blue' : ''
                  }`} />
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${
                  active ? 'text-royal-blue' : 'text-gray-400'
                }`}>{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="adminActiveTab"
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-royal-blue to-brand-blue"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
