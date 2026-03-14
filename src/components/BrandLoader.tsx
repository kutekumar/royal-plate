import { motion, AnimatePresence } from 'framer-motion';
import LogoImg from '@/imgs/logo.png';

interface BrandLoaderProps {
  isLoading: boolean;
}

const BrandLoader = ({ isLoading }: BrandLoaderProps) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2]"
        >
      {/* Animated background particles - More dynamic */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-[#536DFE]/30 to-[#6B7FFF]/30 blur-sm"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.5 + 0.3,
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              scale: [
                Math.random() * 0.5 + 0.5,
                Math.random() * 1.5 + 0.8,
                Math.random() * 0.5 + 0.5,
              ],
              opacity: [
                Math.random() * 0.5 + 0.3,
                Math.random() * 0.9 + 0.2,
                Math.random() * 0.5 + 0.3,
              ],
            }}
            transition={{
              duration: Math.random() * 10 + 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Breathing wave effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute rounded-full border"
            style={{
              width: 200 + i * 60,
              height: 200 + i * 60,
              borderColor: `rgba(83, 109, 254, ${0.15 - i * 0.02})`,
              borderWidth: 2,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      {/* Orbital rings - Multiple layers */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2"
            style={{
              width: 160 + i * 40,
              height: 160 + i * 40,
              borderColor: i === 0 ? 'rgba(83, 109, 254, 0.3)' : i === 1 ? 'rgba(107, 127, 255, 0.2)' : 'rgba(83, 109, 254, 0.15)',
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: i % 2 === 0 ? [0, 360] : [360, 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Pulsing glow behind logo - Enhanced with multiple layers */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-[#536DFE]/30 to-[#6B7FFF]/30 blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.7, 0.4],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-[#6B7FFF]/20 to-[#536DFE]/20 blur-2xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.6, 0.3],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main loader container */}
      <div className="relative flex flex-col items-center z-10">
        {/* Logo container with advanced gradient border */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="relative"
        >
          {/* Rotating gradient border - Multiple layers with depth */}
          <motion.div
            className="w-40 h-40 rounded-3xl p-[4px] relative"
            style={{
              background: 'linear-gradient(135deg, #536DFE, #6B7FFF, #536DFE, #6B7FFF)',
              backgroundSize: '300% 300%',
            }}
            animate={{
              rotate: 360,
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              },
              backgroundPosition: {
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#536DFE]/40 to-[#6B7FFF]/40 blur-2xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Inner glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#536DFE]/60 to-[#6B7FFF]/60 blur-xl" />

            {/* White background with shadow */}
            <div className="relative w-full h-full rounded-[22px] bg-white flex items-center justify-center shadow-2xl shadow-[#536DFE]/20">
              {/* Logo with advanced pulse and breathing */}
              <motion.img
                src={LogoImg}
                alt="Royal Plate"
                className="w-28 h-28 object-contain relative z-10"
                animate={{
                  scale: [1, 1.1, 1],
                  filter: [
                    'drop-shadow(0 0 0px rgba(83, 109, 254, 0))',
                    'drop-shadow(0 0 30px rgba(83, 109, 254, 0.6))',
                    'drop-shadow(0 0 0px rgba(83, 109, 254, 0))',
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Shimmer effect across logo */}
              <motion.div
                className="absolute inset-0 rounded-[22px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.5,
                }}
              />
            </div>
          </motion.div>

          {/* Orbiting dots around logo - Enhanced with trails */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] shadow-lg shadow-[#536DFE]/50"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [
                  Math.cos((i * Math.PI) / 3) * 90,
                  Math.cos((i * Math.PI) / 3 + Math.PI * 2) * 90,
                ],
                y: [
                  Math.sin((i * Math.PI) / 3) * 90,
                  Math.sin((i * Math.PI) / 3 + Math.PI * 2) * 90,
                ],
                scale: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.15,
              }}
            />
          ))}

          {/* Star burst particles */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute w-1 h-1 rounded-full bg-[#536DFE]"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI) / 4) * 120],
                y: [0, Math.sin((i * Math.PI) / 4) * 120],
                scale: [0, 1, 0],
                opacity: [1, 0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.1,
                repeatDelay: 1,
              }}
            />
          ))}
        </motion.div>

        {/* Loading text with advanced animation */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="mt-16 text-center"
        >
          <motion.h3
            className="text-[#1D2956] text-2xl font-bold mb-2 tracking-tight"
            animate={{
              opacity: [1, 0.7, 1],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Royal Plate
          </motion.h3>
          <motion.p
            className="text-gray-400 text-xs uppercase tracking-[0.3em] font-semibold"
            animate={{
              opacity: [0.5, 1, 0.5],
              letterSpacing: ['0.3em', '0.35em', '0.3em'],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Preparing Excellence
          </motion.p>

          {/* Subtitle with typing effect feel */}
          <motion.p
            className="text-[#536DFE]/60 text-[10px] mt-2 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              times: [0, 0.2, 0.8, 1],
            }}
          >
            Crafting your experience...
          </motion.p>
        </motion.div>

        {/* Advanced loading bar with wave effect */}
        <div className="mt-10 w-56 h-2 bg-gray-200/50 rounded-full overflow-hidden relative shadow-inner">
          {/* Background shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Main progress bar */}
          <motion.div
            className="h-full bg-gradient-to-r from-[#536DFE] via-[#6B7FFF] to-[#536DFE] rounded-full relative"
            style={{
              backgroundSize: '200% 100%',
            }}
            animate={{
              x: ['-100%', '100%'],
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              x: {
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              backgroundPosition: {
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
          >
            {/* Glow effect on bar */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </div>

        {/* Floating dots - More sophisticated with wave motion */}
        <div className="flex gap-3 mt-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] shadow-lg shadow-[#536DFE]/40"
              animate={{
                y: [0, -16, 0],
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Progress percentage (visual feedback) */}
        <motion.div
          className="mt-6 text-[#536DFE] text-sm font-bold"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.span
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          >
            •
          </motion.span>
        </motion.div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandLoader;

