import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakIndicatorProps {
  streak: number;
  emoji: string;
  tier: string;
  justUpdated?: boolean;
  compact?: boolean;
}

export const StreakIndicator = ({ streak, emoji, tier, justUpdated, compact }: StreakIndicatorProps) => {
  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-1.5"
      >
        <motion.div
          animate={streak > 0 ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame className={`w-4 h-4 ${streak >= 3 ? 'text-orange-500' : 'text-gray-400'}`} />
        </motion.div>
        {streak > 0 && (
          <motion.span
            key={streak}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`text-xs font-extrabold ${streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-amber-500' : 'text-gray-400'}`}
          >
            {streak}
          </motion.span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative"
    >
      <AnimatePresence>
        {justUpdated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1.2, y: -20 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 text-orange-500 text-[10px] font-extrabold whitespace-nowrap pointer-events-none z-10"
          >
            +1 day!
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
        streak >= 7
          ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/15 border-orange-500/30 shadow-md shadow-orange-500/20'
          : streak >= 3
          ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20'
          : 'bg-white/80 border-gray-200/60'
      }`}>
        <motion.div
          className="relative"
          animate={streak > 0 ? { scale: [1, 1.1, 1], rotate: [0, -4, 4, 0] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame className={`w-4 h-4 ${streak >= 7 ? 'text-orange-500 drop-shadow-sm' : streak >= 3 ? 'text-amber-400' : 'text-gray-400'}`} />
          {streak >= 7 && (
            <motion.div
              className="absolute inset-0 rounded-full bg-orange-500/30 blur-md"
              animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
        <motion.span
          key={streak}
          initial={{ scale: 1.4, y: -4 }}
          animate={{ scale: 1, y: 0 }}
          className={`text-xs font-extrabold ${streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-amber-500' : 'text-gray-500'}`}
        >
          {streak > 0 ? `${streak}-day streak` : 'Start streak'}
        </motion.span>
        {streak > 0 && (
          <span className={`text-[9px] font-bold uppercase tracking-wider ${streak >= 7 ? 'text-orange-400' : streak >= 3 ? 'text-amber-400' : 'text-gray-400'}`}>
            {tier}
          </span>
        )}
      </div>
    </motion.div>
  );
};
