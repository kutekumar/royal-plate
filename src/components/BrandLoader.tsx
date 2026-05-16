import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import LogoImg from '@/imgs/logo.png';

interface BrandLoaderProps {
  isLoading: boolean;
  instant?: boolean;
}

const ringVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: (i: number) => ({
    scale: [0.8, 1.3, 0.8],
    opacity: [0, 0.3, 0],
    transition: { duration: 2.5 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 },
  }),
};

const BrandLoader = memo(({ isLoading, instant = false }: BrandLoaderProps) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: instant ? 0.15 : 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #F5F5F7 0%, #FAFAFA 50%, #F0F0F2 100%)' }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#536DFE]/20 to-[#6B7FFF]/10 blur-[100px]"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#536DFE]/15 to-[#6B7FFF]/10 blur-[100px]"
            />
          </div>

          <div className="relative flex flex-col items-center z-10">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={ringVariants}
                initial="initial"
                animate="animate"
                className="absolute rounded-full border"
                style={{
                  width: 160 + i * 50,
                  height: 160 + i * 50,
                  borderColor: `rgba(83, 109, 254, ${0.12 - i * 0.03})`,
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              <motion.div
                className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-[#536DFE]/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.img
                  src={LogoImg}
                  alt="Royal Plate"
                  className="w-20 h-20 object-contain"
                  animate={{
                    filter: [
                      'drop-shadow(0 0 0px rgba(83, 109, 254, 0))',
                      'drop-shadow(0 0 20px rgba(83, 109, 254, 0.4))',
                      'drop-shadow(0 0 0px rgba(83, 109, 254, 0))',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-12 text-center"
            >
              <motion.p
                className="text-[#1D2956] text-lg font-bold tracking-tight"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Royal Plate
              </motion.p>
              <motion.p
                className="text-[#536DFE]/50 text-[10px] uppercase tracking-[0.3em] font-semibold mt-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Loading
              </motion.p>
            </motion.div>

            <div className="mt-8 w-40 h-1.5 bg-gray-200/60 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #536DFE, #6B7FFF, #536DFE)', backgroundSize: '200% 100%' }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

BrandLoader.displayName = 'BrandLoader';

export default BrandLoader;
