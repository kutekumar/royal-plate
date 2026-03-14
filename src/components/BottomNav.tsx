import { Home, Receipt, BookOpenText, User, UtensilsCrossed } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import BrandLoader from './BrandLoader';
import { motion, AnimatePresence } from 'framer-motion';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    if (location.pathname === path) return; // Don't navigate if already on page

    // Set clicked item for ripple effect
    setClickedItem(path);

    // Start transition with anticipation
    setIsTransitioning(true);

    // Navigate after showing loader
    setTimeout(() => {
      navigate(path);
      setTimeout(() => {
        setIsTransitioning(false);
        setClickedItem(null);
      }, 200);
    }, 1000); // Show loader for 1 second for that premium feel
  };

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
    <>
      <BrandLoader isLoading={isTransitioning} />
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 z-50 shadow-[0_-2px_24px_rgba(29,41,86,0.08)]">
        <div className="max-w-md mx-auto">
          <div className="pb-safe-or-0">
            <div className="flex justify-around items-center h-16 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isClicked = clickedItem === item.path;

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative group overflow-hidden`}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {/* Ripple effect on click */}
                    <AnimatePresence>
                      {isClicked && (
                        <motion.div
                          className="absolute inset-0 bg-[#536DFE]/20 rounded-2xl"
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Active pill background with animation */}
                    <AnimatePresence>
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-x-1 inset-y-1 bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 rounded-2xl border border-[#536DFE]/20"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Icon with enhanced animation */}
                    <motion.div
                      className={`relative mb-0.5 transition-all duration-300`}
                      animate={{
                        scale: active ? 1.15 : 1,
                        y: active ? -2 : 0
                      }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Icon
                        className={`h-5 w-5 relative z-10 transition-all duration-300 ${
                          active ? 'text-[#536DFE]' : 'text-[#1D2956]/35 group-hover:text-[#1D2956]/60'
                        }`}
                      />

                      {/* Glow effect on active */}
                      {active && (
                        <motion.div
                          className="absolute inset-0 bg-[#536DFE]/30 rounded-full blur-md"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      )}
                    </motion.div>

                    {/* Label with stagger animation */}
                    <motion.span
                      className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 relative z-10 ${
                        active ? 'text-[#536DFE]' : 'text-[#1D2956]/35 group-hover:text-[#1D2956]/60'
                      }`}
                      animate={{
                        y: active ? 0 : 0,
                        opacity: active ? 1 : 0.7
                      }}
                    >
                      {active ? item.activeLabel : item.label}
                    </motion.span>

                    {/* Active dot with bounce */}
                    <AnimatePresence>
                      {active && (
                        <motion.div
                          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#536DFE] rounded-full"
                          initial={{ scale: 0, y: -10 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0, y: -10 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
