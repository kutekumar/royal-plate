import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Crown, MapPin } from 'lucide-react';
import LogoImg from '@/imgs/logo.png';
import MascotImg from '@/imgs/mascot.png';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const screens = [
    {
      icon: Crown,
      title: "Welcome to Royal Plate",
      subtitle: "Your Gateway to Elite Dining",
      description: "Experience the finest restaurants at your fingertips. Reserve tables, explore menus, and indulge in culinary excellence.",
      gradient: "from-[#536DFE] to-[#6B7FFF]",
      accentColor: "#536DFE"
    },
    {
      icon: Sparkles,
      title: "Discover & Reserve",
      subtitle: "Effortless Elegance",
      description: "Browse curated restaurants, view real-time availability, and secure your perfect table with just a few taps.",
      gradient: "from-[#536DFE] to-[#6B7FFF]",
      accentColor: "#536DFE"
    },
    {
      icon: MapPin,
      title: "Your Culinary Journey",
      subtitle: "Begins Here",
      description: "Track your reservations, earn rewards, and unlock exclusive dining experiences. Your table awaits.",
      gradient: "from-[#536DFE] to-[#6B7FFF]",
      accentColor: "#536DFE"
    }
  ];

  const currentScreenData = screens[currentScreen];
  const IconComponent = currentScreenData.icon;

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    setIsTransitioning(true);
    // Wait for exit animation to complete before navigating
    setTimeout(() => {
      navigate('/auth?mode=signup');
    }, 600); // Match the exit animation duration
  };

  const handleSignIn = async () => {
    setIsTransitioning(true);
    // Wait for exit animation to complete before navigating
    setTimeout(() => {
      navigate('/auth?mode=signin');
    }, 600); // Match the exit animation duration
  };

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <PageTransition>
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-white font-poppins">

          {/* Animated background gradient orbs - Brand Blue */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.15, 0.25, 0.15],
                x: [0, 50, 0],
                y: [0, -30, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.2, 0.1],
                x: [0, -40, 0],
                y: [0, 40, 0]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-[#536DFE] to-[#6B7FFF] blur-3xl"
            />
          </div>

          {/* Content Container */}
          <div className="relative z-10 flex flex-col h-full px-6 sm:px-8 pt-8 pb-6 safe-area-inset">

            {/* Top Bar - Logo + Skip */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="flex items-center justify-between mb-4 sm:mb-6"
            >
              <motion.img
                src={LogoImg}
                alt="Royal Plate"
                className="h-10 sm:h-12 object-contain drop-shadow-2xl"
                animate={{
                  y: [-3, 3, -3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {currentScreen < screens.length - 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  onClick={handleSkip}
                  whileHover={{ scale: 1.05, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-[#536DFE] text-xs sm:text-sm font-semibold tracking-wider uppercase"
                >
                  Skip
                </motion.button>
              )}
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, x: 100, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.95 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="w-full flex flex-col items-center"
                >
                  {/* Mascot with Icon Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.8,
                      ease: [0.34, 1.56, 0.64, 1],
                      delay: 0.2
                    }}
                    className="relative mb-6 sm:mb-8"
                  >
                    {/* Mascot Image with Float Animation */}
                    <motion.div
                      animate={{
                        y: [-10, 10, -10],
                        rotate: [-3, 3, -3]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      <motion.img
                        src={MascotImg}
                        alt="Royal Plate Mascot"
                        className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain drop-shadow-2xl mx-auto"
                        animate={{
                          filter: [
                            "drop-shadow(0 20px 40px rgba(83, 109, 254, 0.3))",
                            "drop-shadow(0 25px 50px rgba(83, 109, 254, 0.4))",
                            "drop-shadow(0 20px 40px rgba(83, 109, 254, 0.3))"
                          ]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />

                      {/* Floating Icon Badge */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          duration: 0.7,
                          ease: [0.34, 1.56, 0.64, 1],
                          delay: 0.5
                        }}
                        className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-2xl border-3 sm:border-4 border-white"
                      >
                        <motion.div
                          animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* Pulsing Glow Effect */}
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] blur-3xl -z-10"
                    />

                    {/* Orbiting Particles */}
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] shadow-lg"
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                          rotate: {
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5
                          },
                          scale: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3
                          },
                          opacity: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3
                          }
                        }}
                        style={{
                          left: '50%',
                          top: '50%',
                          marginLeft: '-6px',
                          marginTop: '-6px',
                          transformOrigin: `${Math.cos((i * Math.PI) / 2) * 140}px ${Math.sin((i * Math.PI) / 2) * 140}px`
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Text Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.4
                    }}
                    className="text-center px-2 sm:px-4"
                  >
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.5
                      }}
                      className="text-[#1D2956] text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 leading-tight"
                    >
                      {currentScreenData.title}
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.6
                      }}
                      className="text-[#536DFE] text-xs sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.25em] uppercase mb-3 sm:mb-4"
                    >
                      {currentScreenData.subtitle}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.7
                      }}
                      className="text-[#1D2956]/70 text-sm sm:text-base leading-relaxed max-w-sm mx-auto"
                    >
                      {currentScreenData.description}
                    </motion.p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Section - Pagination + Buttons + Branding - Properly structured */}
            <div className="space-y-3 sm:space-y-4 mt-auto">
              {/* Pagination Dots - Brand Blue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex items-center justify-center gap-2 sm:gap-3"
              >
                {screens.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentScreen(index)}
                    whileHover={{ scale: 1.4 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{
                        width: currentScreen === index ? 44 : 12,
                        height: currentScreen === index ? 4 : 4,
                        backgroundColor: currentScreen === index ? '#536DFE' : '#E2E8F0'
                      }}
                      transition={{
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      className="rounded-full"
                    />
                    {currentScreen === index && (
                      <motion.div
                        layoutId="activeDot"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] shadow-lg shadow-[#536DFE]/25"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25
                        }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>

              {/* Action Buttons - Brand Blue */}
              <div className="space-y-3 sm:space-y-4">
                {currentScreen === screens.length - 1 ? (
                  <>
                    <motion.button
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      onClick={handleGetStarted}
                      whileHover={{ scale: 1.03, y: -3, boxShadow: "0 25px 50px rgba(83, 109, 254, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white font-bold text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase shadow-2xl flex items-center justify-center gap-2 relative overflow-hidden"
                    >
                      {/* Animated background gradient */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#6B7FFF] to-[#536DFE]"
                        animate={{
                          x: ["-100%", "100%"]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{ backgroundSize: "200% 100%" }}
                      />
                      <motion.span
                        className="relative z-10"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                      >
                        Get Started
                      </motion.span>
                      <motion.div
                        className="relative z-10"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.0 }}
                      onClick={handleSignIn}
                      whileHover={{ scale: 1.03, y: -3, backgroundColor: 'rgba(83, 109, 254, 0.1)', boxShadow: "0 15px 35px rgba(83, 109, 254, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl border-2 border-[#536DFE]/40 text-[#536DFE] font-bold text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase bg-white shadow-lg relative overflow-hidden"
                    >
                      {/* Animated border glow */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-transparent"
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(83, 109, 254, 0)",
                            "0 0 0 10px rgba(83, 109, 254, 0.1)",
                            "0 0 0 0 rgba(83, 109, 254, 0)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                      <span className="relative z-10">Sign In</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    onClick={handleNext}
                    whileHover={{ scale: 1.03, y: -3, boxShadow: "0 25px 50px rgba(83, 109, 254, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white font-bold text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase shadow-2xl flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {/* Animated background gradient */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#6B7FFF] to-[#536DFE]"
                      animate={{
                        x: ["-100%", "100%"]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{ backgroundSize: "200% 100%" }}
                    />
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Next
                    </motion.span>
                    <motion.div
                      className="relative z-10"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                )}
              </div>

              {/* Powered By - Properly positioned */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex flex-col items-center gap-1.5 sm:gap-2 pt-2 pb-safe"
              >
                <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-transparent via-[#536DFE] to-transparent rounded-full" />
                <p className="text-[#1D2956]/40 text-[7px] sm:text-[8px] font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                  Powered By
                </p>
                <img
                  src="https://mingalarmon.com/assets/logo_light.png"
                  alt="Mingalar Mon"
                  className="h-5 sm:h-6 object-contain opacity-60"
                />
              </motion.div>
            </div>
          </div>

          {/* Bottom home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#1D2956]/10 rounded-full z-20" />
        </div>
      </PageTransition>
    </>
  );
};

export default Onboarding;
