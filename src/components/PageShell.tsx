import { motion } from 'framer-motion';
import { ReactNode, memo } from 'react';
import type { NavDirection } from '@/contexts/NavigationContext';

interface PageShellProps {
  children: ReactNode;
  direction: NavDirection;
  className?: string;
}

const PageShell = memo(({ children, direction, className = '' }: PageShellProps) => {
  const isHorizontal = direction === 'left' || direction === 'right';

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: direction === 'left' ? 60 : direction === 'right' ? -60 : 0,
        y: direction === 'up' ? 20 : 0,
        scale: isHorizontal ? 0.98 : 1,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
        y: direction === 'up' ? -20 : 0,
        scale: isHorizontal ? 0.97 : 1,
        transition: { duration: 0.15 },
      }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

PageShell.displayName = 'PageShell';

export default PageShell;
