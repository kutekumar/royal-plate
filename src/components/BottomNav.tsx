import { Home, Receipt, BookOpenText, User, UtensilsCrossed } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundContext } from '@/contexts/SoundContext';
import { useNavigationContext } from '@/contexts/NavigationContext';

const navItems = [
  { path: '/home', icon: Home, label: 'Home', activeLabel: 'Discover' },
  { path: '/food', icon: UtensilsCrossed, label: 'Food', activeLabel: 'Menu' },
  { path: '/orders', icon: Receipt, label: 'Orders', activeLabel: 'My Orders', badge: true },
  { path: '/blog', icon: BookOpenText, label: 'Blog', activeLabel: 'Updates' },
  { path: '/profile', icon: User, label: 'Profile', activeLabel: 'Account' },
];

const navItemPaths = navItems.map(item => item.path);

const NavItem = memo(({ item, isActive, onClick, hasActiveOrder }: {
  item: typeof navItems[0];
  isActive: boolean;
  onClick: () => void;
  hasActiveOrder: boolean;
}) => {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl relative group"
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {isActive && (
        <motion.div
          layoutId="navPill"
          className="absolute inset-x-1 inset-y-1 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(83,109,254,0.12), rgba(107,127,255,0.08))',
            border: '1px solid rgba(83,109,254,0.2)',
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        />
      )}

      <motion.div
        className="relative mb-0.5"
        animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Icon
          className="h-5 w-5 relative z-10 transition-colors duration-200"
          style={{
            color: isActive ? 'hsl(232, 98%, 65%)' : 'rgba(29,41,86,0.35)',
          }}
        />
        {item.badge && hasActiveOrder && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 z-20"
            style={{ boxShadow: '0 0 6px rgba(244,63,94,0.6)' }}
          />
        )}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full blur-md"
            style={{ background: 'rgba(83,109,254,0.3)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>

      <motion.span
        className="text-[9px] font-bold uppercase tracking-wider relative z-10 transition-colors duration-200"
        style={{
          color: isActive ? 'hsl(232, 98%, 65%)' : 'rgba(29,41,86,0.35)',
        }}
      >
        {isActive ? item.activeLabel : item.label}
      </motion.span>
    </motion.button>
  );
});

NavItem.displayName = 'NavItem';

export const BottomNav = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { play } = useSoundContext();
  const { setDirection } = useNavigationContext();
  const [hasActiveOrder] = useState(() => localStorage.getItem('royal-plate-active-order') === 'true');

  const handleNavigation = useCallback((path: string) => {
    if (location.pathname === path) return;

    const currentIndex = navItemPaths.indexOf(location.pathname);
    const targetIndex = navItemPaths.indexOf(path);

    if (currentIndex !== -1 && targetIndex !== -1) {
      setDirection(targetIndex > currentIndex ? 'left' : 'right');
    } else {
      setDirection('up');
    }

    play('tap');
    navigate(path);
  }, [location.pathname, navigate, play, setDirection]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 -2px 24px rgba(29,41,86,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              hasActiveOrder={hasActiveOrder}
            />
          ))}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
