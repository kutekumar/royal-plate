import { Home, Receipt, BookOpenText, User, UtensilsCrossed } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      path: '/home',
      icon: Home,
      label: 'Home',
      activeLabel: 'Discover'
    },
    {
      path: '/food',
      icon: UtensilsCrossed,
      label: 'Food',
      activeLabel: 'Food'
    },
    {
      path: '/orders',
      icon: Receipt,
      label: 'Orders',
      activeLabel: 'My Orders'
    },
    {
      path: '/blog',
      icon: BookOpenText,
      label: 'Blog',
      activeLabel: 'Updates'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile',
      activeLabel: 'Account'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 z-50 shadow-[0_-2px_24px_rgba(29,41,86,0.08)]">
      <div className="max-w-md mx-auto">
        <div className="pb-safe-or-0">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative group`}
                >
                  {/* Active pill background */}
                  {active && (
                    <div className="absolute inset-x-1 inset-y-1 bg-[#536DFE]/10 rounded-2xl border border-[#536DFE]/20" />
                  )}

                  {/* Icon */}
                  <div className={`relative mb-0.5 transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                    <Icon
                      className={`h-5 w-5 relative z-10 transition-all duration-300 ${
                        active ? 'text-[#536DFE]' : 'text-[#1D2956]/35 group-hover:text-[#1D2956]/60'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 relative z-10 ${
                    active ? 'text-[#536DFE]' : 'text-[#1D2956]/35 group-hover:text-[#1D2956]/60'
                  }`}>
                    {active ? item.activeLabel : item.label}
                  </span>

                  {/* Active dot */}
                  {active && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#536DFE] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
