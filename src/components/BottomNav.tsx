import { Home, Receipt, BookOpenText, User } from 'lucide-react';
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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1d2956] backdrop-blur-xl border-t-2 border-[#caa157]/20 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-md mx-auto">
        {/* Safe area padding for iOS devices */}
        <div className="pb-safe-or-0">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all duration-300 relative group ${
                    active 
                      ? 'text-[#caa157]' 
                      : 'text-[#caa157]/40 hover:text-[#caa157]/70'
                  }`}
                >
                  {/* Active indicator background */}
                  {active && (
                    <div className="absolute inset-x-2 top-0 h-1 bg-[#caa157] rounded-full shadow-[0_0_10px_rgba(202,161,87,0.5)]"></div>
                  )}
                  
                  {/* Icon container with enhanced styling */}
                  <div className={`relative mb-1 transition-all duration-300 ${
                    active 
                      ? 'scale-110' 
                      : 'group-hover:scale-105'
                  }`}>
                    {/* Subtle glow effect for active item */}
                    {active && (
                      <div className="absolute inset-0 bg-[#caa157]/20 rounded-full blur-lg"></div>
                    )}
                    
                    <Icon 
                      className={`h-6 w-6 relative z-10 transition-all duration-300 ${
                        active 
                          ? 'text-[#caa157] drop-shadow-[0_0_8px_rgba(202,161,87,0.5)]' 
                          : 'text-current'
                      }`} 
                    />
                    
                    {/* Active dot indicator */}
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#caa157] rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Label with enhanced typography */}
                  <span className={`text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                    active 
                      ? 'text-[#caa157]' 
                      : 'text-current'
                  }`}>
                    {active ? item.activeLabel : item.label}
                  </span>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-[#caa157]/0 group-hover:bg-[#caa157]/5 rounded-xl transition-all duration-300"></div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
