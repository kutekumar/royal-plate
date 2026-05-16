import { motion } from 'framer-motion';
import { Crown, Star, Shield, Gem, Compass } from 'lucide-react';

interface TierProgressProps {
  completedOrders: number;
  totalPoints: number;
  compact?: boolean;
}

const TIERS = [
  { name: 'Newbie', minOrders: 0, icon: Gem, color: 'text-gray-400', barColor: 'bg-gray-300' },
  { name: 'Explorer', minOrders: 1, icon: Compass, color: 'text-blue-400', barColor: 'bg-blue-400' },
  { name: 'Preferred', minOrders: 5, icon: Star, color: 'text-amber-500', barColor: 'bg-amber-500' },
  { name: 'Loyal Customer', minOrders: 10, icon: Shield, color: 'text-purple-500', barColor: 'bg-purple-500' },
  { name: 'Super Customer', minOrders: 30, icon: Crown, color: 'text-[#F59E0B]', barColor: 'bg-gradient-to-r from-[#F59E0B] to-[#D97706]' },
];

export const TierProgress = ({ completedOrders, totalPoints, compact }: TierProgressProps) => {
  const currentTierIndex = TIERS.findLastIndex(t => completedOrders >= t.minOrders);
  const currentTier = TIERS[currentTierIndex] || TIERS[0];
  const nextTier = TIERS[Math.min(currentTierIndex + 1, TIERS.length - 1)];
  const isMaxTier = currentTierIndex === TIERS.length - 1;

  const nextMinOrders = nextTier.minOrders;
  const prevMinOrders = currentTier.minOrders;
  const range = nextMinOrders - prevMinOrders;
  const progress = isMaxTier ? 1 : range > 0 ? (completedOrders - prevMinOrders) / range : 0;

  const CurrentIcon = currentTier.icon;
  const NextIcon = nextTier.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CurrentIcon className={`w-4 h-4 ${currentTier.color}`} />
            <span className={`text-xs font-bold ${currentTier.color}`}>{currentTier.name}</span>
          </div>
          <span className="text-gray-400 text-[10px] font-semibold">{totalPoints} pts</span>
        </div>
        {!isMaxTier && (
          <>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${currentTier.barColor}`}
              />
            </div>
            <p className="text-gray-400 text-[9px] mt-1.5 font-medium">
              {nextTier.minOrders - completedOrders} more orders to {nextTier.name}
            </p>
          </>
        )}
        {isMaxTier && (
          <p className="text-[#F59E0B] text-[9px] mt-1.5 font-bold">★ Elite tier unlocked</p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#1D2956] text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-[#536DFE] to-[#6B7FFF] rounded-full" />
          Loyalty Tier
        </h3>
        <span className="text-gray-400 text-[10px] font-semibold">{totalPoints} pts</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        {TIERS.map((tier, i) => {
          const Icon = tier.icon;
          const isActive = i <= currentTierIndex;
          const isCurrent = i === currentTierIndex;
          return (
            <div key={tier.name} className="flex flex-col items-center relative">
              <motion.div
                initial={isCurrent ? { scale: 0 } : {}}
                animate={isCurrent ? { scale: [0, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? isCurrent
                      ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-md shadow-[#536DFE]/30 scale-110'
                      : 'bg-[#536DFE]/10 text-[#536DFE]'
                    : 'bg-gray-100 text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
              <span className={`text-[7px] font-bold mt-1 text-center leading-tight ${
                isActive ? 'text-[#1D2956]' : 'text-gray-300'
              }`}>
                {tier.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {!isMaxTier && (
        <>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className={`h-full rounded-full ${currentTier.barColor}`}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-[10px] mt-2 font-medium text-center"
          >
            {nextTier.minOrders - completedOrders} more {nextTier.minOrders - completedOrders === 1 ? 'order' : 'orders'} to reach <span className="text-[#1D2956] font-bold">{nextTier.name}</span>
          </motion.p>
        </>
      )}
      {isMaxTier && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-center py-2"
        >
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/10 text-[#F59E0B] text-xs font-bold px-4 py-2 rounded-full border border-[#F59E0B]/30">
            <Crown className="w-3.5 h-3.5" />
            Elite Member — Thank you for your loyalty!
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
