import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Crown, MapPin } from 'lucide-react';
import LogoImg from '@/imgs/logo.png';
import MascotImg from '@/imgs/mascot.png';
import { useSoundContext } from '@/contexts/SoundContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const { play } = useSoundContext();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const screens = [
    {
      icon: Crown,
      title: "Welcome to Royal Plate",
      subtitle: "Your Gateway to Elite Dining",
      description: "Experience the finest restaurants at your fingertips. Reserve tables, explore menus, and indulge in culinary excellence.",
      gradient: "from-[#536DFE] to-[#6B7FFF]",
      accentColor: "#536DFE",
      particles: 10
    },
    {
      icon: Sparkles,
      title: "Discover & Reserve",
      subtitle: "Effortless Elegance",
      description: "Browse curated restaurants, view real-time availability, and secure your perfect table with just a few taps.",
      gradient: "from-[#536DFE] to-[#6B7FFF]",
      accentColor: "#536DFE",
      particles: 12
    },
    {
      icon: MapPin,
      title: "Your Culinary Journey",
      subtitle: "Begins Here",
      description: "Track your reservations, earn rewards, and unlock exclusive dining experiences. Your table awaits.",
      gradient: "from-[#536DFE] to-[#6B7FFF]",
      accentColor: "#536DFE",
      particles: 14
    }
  ];

  const currentScreenData = screens[currentScreen];
  const IconComponent = currentScreenData.icon;

  const handleNext = useCallback(() => {
    play('tap');
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleGetStarted();
    }
  }, [currentScreen, play]);

  const handleSkip = useCallback(() => {
    play('tap');
    handleGetStarted();
  }, [play]);

  const handleGetStarted = useCallback(() => {
    play('success');
    navigate('/auth?mode=signup');
  }, [navigate, play]);

  const handleSignIn = useCallback(() => {
    play('tap');
    navigate('/auth?mode=signin');
  }, [navigate, play]);

  return (
    <>
      <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F8FAFF] via-[#F0F4FF] to-[#E8EDFF] font-poppins">
          
          {/* ── Subtle Top Bar with Gradient ── */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 h-0.5 z-50"
          >
            <div className="h-full bg-gradient-to-r from-transparent via-[#536DFE]/40 to-transparent" />
          </motion.div>

          {/* ── Animated Background Orbs - Light Mode ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Main gradient orb - top right */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.15, 0.25, 0.15],
                x: [0, 60, 0],
                y: [0, -40, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#536DFE]/30 to-[#6B7FFF]/20 blur-[80px]"
            />
            
            {/* Secondary orb - bottom left */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.1, 0.2, 0.1],
                x: [0, -50, 0],
                y: [0, 60, 0]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
              className="absolute -bottom-24 -left-24 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#536DFE]/25 to-[#6B7FFF]/15 blur-[100px]"
            />

            {/* Accent orb - center */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.08, 0.15, 0.08],
                x: [0, 30, 0],
                y: [0, -30, 0]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5
              }}
              className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-[#6B7FFF]/20 to-[#536DFE]/15 blur-[60px] -translate-x-1/2 -translate-y-1/2"
            />

            {/* Floating particles */}
            {[...Array(currentScreenData.particles)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#536DFE]/40"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                  opacity: 0
                }}
                animate={{
                  y: [null, Math.random() * -150 - 50],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.2, 0]
                }}
                transition={{
                  duration: 5 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 6,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* ── Interactive Mouse Follower - Subtle ── */}
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-[#536DFE]/10 to-[#6B7FFF]/10 blur-2xl pointer-events-none"
            animate={{
              x: mousePosition.x - 96,
              y: mousePosition.y - 96
            }}
            transition={{
              type: "spring",
              damping: 40,
              stiffness: 150
            }}
          />

          {/* ── Content Container ── */}
          <div className="relative z-10 flex flex-col h-full px-5 sm:px-6 pt-10 pb-6 safe-area-inset">
            
            {/* ── Top Bar - Logo + Skip ── */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="flex items-center justify-between mb-6"
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileFocus={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.img
                  src={LogoImg}
                  alt="Royal Plate"
                  className="h-10 sm:h-12 object-contain drop-shadow-lg focus:outline-none"
                  animate={{
                    y: [-3, 3, -3],
                    filter: [
                      "drop-shadow(0 8px 20px rgba(83, 109, 254, 0.3))",
                      "drop-shadow(0 12px 30px rgba(83, 109, 254, 0.4))",
                      "drop-shadow(0 8px 20px rgba(83, 109, 254, 0.3))"
                    ]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  tabIndex={0}
                />
                {/* Subtle glow behind logo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/20 to-[#6B7FFF]/20 blur-xl -z-10 rounded-full"
                  animate={{
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
              
              {currentScreen < screens.length - 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  onClick={handleSkip}
                  whileHover={{ scale: 1.05, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-4 py-1.5 text-[#536DFE]/50 text-[10px] sm:text-xs font-medium tracking-wider uppercase overflow-hidden group"
                >
                  <span className="relative z-10">Skip</span>
                </motion.button>
              )}
            </motion.div>

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, x: 100, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.92 }}
                  transition={{
                    duration: 0.7,
                    ease: [0.32, 0.72, 0, 1]
                  }}
                  className="w-full flex flex-col items-center"
                >
                  {/* ── Mascot with Premium Effects ── */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.9,
                      ease: [0.34, 1.56, 0.64, 1],
                      delay: 0.3
                    }}
                    className="relative mb-6"
                  >
                    {/* Outer glow ring */}
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-[#536DFE]/30 to-[#6B7FFF]/30 blur-xl -z-10"
                    />

                    {/* Mascot container with float animation */}
                    <motion.div
                      animate={{
                        y: [-12, 12, -12],
                        rotate: [-4, 4, -4]
                      }}
                      transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      {/* Decorative ring around mascot */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 25,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="absolute inset-0 rounded-full border-2 border-dashed border-[#536DFE]/20"
                        style={{ width: '220px', height: '220px', top: '-15px', left: '-15px' }}
                      />

                      <motion.img
                        src={MascotImg}
                        alt="Royal Plate Mascot"
                        className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain drop-shadow-xl mx-auto"
                        animate={{
                          filter: [
                            "drop-shadow(0 20px 40px rgba(83, 109, 254, 0.3))",
                            "drop-shadow(0 25px 50px rgba(83, 109, 254, 0.4))",
                            "drop-shadow(0 20px 40px rgba(83, 109, 254, 0.3))"
                          ]
                        }}
                        transition={{
                          duration: 5,
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
                        className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-xl border-3 border-white/50 backdrop-blur-sm"
                      >
                        <motion.div
                          animate={{
                            rotate: [0, 8, -8, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <IconComponent className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                        </motion.div>
                        
                        {/* Badge glow */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] blur-lg opacity-40 -z-10" />
                      </motion.div>
                    </motion.div>

                    {/* Orbiting decorative elements */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] shadow-md"
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 0.8, 0.3]
                        }}
                        transition={{
                          rotate: {
                            duration: 18,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 1
                          },
                          scale: {
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.5
                          },
                          opacity: {
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.5
                          }
                        }}
                        style={{
                          left: '50%',
                          top: '50%',
                          marginLeft: '-3px',
                          marginTop: '-3px',
                          transformOrigin: `${Math.cos((i * Math.PI) / 2.5) * 130}px ${Math.sin((i * Math.PI) / 2.5) * 130}px`
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* ── Text Content with Premium Typography ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.5
                    }}
                    className="text-center px-4 sm:px-5"
                  >
                    {/* Decorative line above title */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.7, delay: 0.6 }}
                      className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#536DFE] to-transparent mx-auto mb-3"
                    />

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.6
                      }}
                      className="text-[#1D2956] text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight tracking-tight"
                    >
                      {currentScreenData.title}
                    </motion.h1>
                    
                    <motion.p
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.7
                      }}
                      className="text-[#536DFE] text-xs sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.25em] uppercase mb-3"
                    >
                      {currentScreenData.subtitle}
                    </motion.p>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.8
                      }}
                      className="text-[#1D2956]/70 text-sm sm:text-base leading-relaxed max-w-sm mx-auto"
                    >
                      {currentScreenData.description}
                    </motion.p>

                    {/* Decorative line below description */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.7, delay: 0.9 }}
                      className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#536DFE]/30 to-transparent mx-auto mt-4"
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Bottom Section - Pagination + Buttons + Branding ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-4 mt-auto"
              >
              
              {/* ── Premium Pagination Dots ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center justify-center gap-2.5"
              >
                  {screens.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => { play('tap'); setCurrentScreen(index); }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{
                        width: currentScreen === index ? 40 : 10,
                        height: currentScreen === index ? 5 : 5,
                        backgroundColor: currentScreen === index ? '#536DFE' : 'rgba(83, 109, 254, 0.2)'
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
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] shadow-md shadow-[#536DFE]/30"
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

              {/* ── Premium Action Buttons ── */}
              <div className="space-y-3">
                {currentScreen === screens.length - 1 ? (
                  <>
                    {/* Get Started Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.0 }}
                      onClick={handleGetStarted}
                      whileHover={{ scale: 1.03, y: -4, boxShadow: "0 25px 50px rgba(83, 109, 254, 0.5)" }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full h-14 sm:h-16 rounded-xl bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white font-bold text-xs sm:text-sm tracking-[0.15em] uppercase shadow-xl flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                      {/* Animated background gradient */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#6B7FFF] via-[#536DFE] to-[#6B7FFF]"
                        animate={{
                          x: ["-100%", "100%"]
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{ backgroundSize: "200% 100%" }}
                      />
                      
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                        animate={{
                          x: ["-100%", "100%"]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "linear",
                          delay: 1.5
                        }}
                      />
                      
                      <motion.span
                        className="relative z-10 flex items-center gap-2"
                        animate={{ x: [0, 6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
                      >
                        Get Started
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      </motion.span>
                    </motion.button>

                    {/* Sign In Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                      onClick={handleSignIn}
                      whileHover={{ scale: 1.02, y: -3, backgroundColor: 'rgba(83, 109, 254, 0.08)', boxShadow: "0 15px 30px rgba(83, 109, 254, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-14 sm:h-16 rounded-xl border-2 border-[#536DFE]/30 text-[#536DFE] font-bold text-xs sm:text-sm tracking-[0.15em] uppercase bg-white/80 backdrop-blur-sm shadow-lg relative overflow-hidden group"
                    >
                      {/* Animated border glow */}
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-transparent"
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(83, 109, 254, 0)",
                            "0 0 0 10px rgba(83, 109, 254, 0.1)",
                            "0 0 0 0 rgba(83, 109, 254, 0)"
                          ]
                        }}
                        transition={{
                          duration: 3,
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
                    transition={{ duration: 0.5, delay: 1.0 }}
                    onClick={handleNext}
                    whileHover={{ scale: 1.02, y: -3, boxShadow: "0 20px 40px rgba(83, 109, 254, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-14 sm:h-16 rounded-xl bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white font-bold text-xs sm:text-sm tracking-[0.15em] uppercase shadow-xl flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    {/* Animated background gradient */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#6B7FFF] via-[#536DFE] to-[#6B7FFF]"
                      animate={{
                        x: ["-100%", "100%"]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{ backgroundSize: "200% 100%" }}
                    />
                    
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                      animate={{
                        x: ["-100%", "100%"]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 1.5
                      }}
                    />
                    
                    <motion.span
                      className="relative z-10 flex items-center gap-2"
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      Next
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    </motion.span>
                  </motion.button>
                )}
              </div>

              {/* ── Premium Powered By Section ── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-col items-center gap-2 pt-3 pb-1"
              >
                {/* Decorative top line */}
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#536DFE]/40 to-transparent rounded-full" />
                
                <p className="text-[#1D2956]/40 text-[9px] font-semibold tracking-[0.2em] uppercase">
                  Powered By
                </p>
                
                {/* Bigger brand logo with shadow */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="relative"
                >
                  <img
                    src="https://mingalarmon.com/assets/logo_light.png"
                    alt="Mingalar Mon"
                    className="h-10 object-contain opacity-60 hover:opacity-80 transition-opacity drop-shadow-lg"
                  />
                  {/* Subtle glow */}
                  <div className="absolute inset-0 bg-white/10 blur-xl -z-10 rounded-full" />
                </motion.div>
                
                {/* Decorative bottom line */}
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#536DFE]/20 to-transparent rounded-full" />
              </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
    </>
  );
};

export default Onboarding;
