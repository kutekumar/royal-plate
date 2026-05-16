import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronRight, Compass, Crown, MapPin } from 'lucide-react';
import LogoImg from '@/imgs/logo.png';
import MascotImg from '@/imgs/mascot.png';
import { useSoundContext } from '@/contexts/SoundContext';

const GOLD = '#F59E0B';
const BRAND_BLUE = '#536DFE';
const BRAND_LIGHT = '#6B7FFF';
const ROYAL_NAVY = '#1D2956';

const screens = [
  {
    icon: Crown,
    title: "Welcome to Royal Plate",
    subtitle: "Your Gateway to Elite Dining",
    description: "Experience the finest restaurants at your fingertips. Reserve tables, explore menus, and indulge in culinary excellence.",
    gradient: "from-[#536DFE] to-[#6B7FFF]",
    particleDensity: 14,
    goldParticles: 4,
    mascotScale: 0.85
  },
  {
    icon: Compass,
    title: "Discover & Reserve",
    subtitle: "Effortless Elegance",
    description: "Browse curated restaurants, view real-time availability, and secure your perfect table with just a few taps.",
    gradient: "from-[#536DFE] to-[#6B7FFF]",
    particleDensity: 16,
    goldParticles: 6,
    mascotScale: 0.88
  },
  {
    icon: MapPin,
    title: "Your Culinary Journey",
    subtitle: "Begins Here",
    description: "Track your reservations, earn rewards, and unlock exclusive dining experiences. Your table awaits.",
    gradient: "from-[#536DFE] to-[#6B7FFF]",
    particleDensity: 18,
    goldParticles: 8,
    mascotScale: 0.9
  }
];

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const easing = [0.22, 1, 0.36, 1] as const;
const springBouncy = { type: "spring" as const, stiffness: 300, damping: 18 };
const smoothSpring = { type: "spring" as const, stiffness: 150, damping: 25 };

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'circle' | 'square';
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { play } = useSoundContext();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenEnterTime = useRef(Date.now());

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 30 });

  const cardRotateX = useTransform(springY, [0, 1], [4, -4]);
  const cardRotateY = useTransform(springX, [0, 1], [-4, 4]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x, y });
        mouseX.set(x);
        mouseY.set(y);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const currentScreenData = screens[currentScreen];
  const IconComponent = currentScreenData.icon;
  const isLastScreen = currentScreen === screens.length - 1;

  const handleNext = useCallback(() => {
    play('tap');
    if (currentScreen < screens.length - 1) {
      screenEnterTime.current = Date.now();
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
    const particles: ConfettiParticle[] = [];
    const colors = ['#F59E0B', '#536DFE', '#6B7FFF', '#D97706', '#FBBF24'];
    for (let i = 0; i < 36; i++) {
      particles.push({
        id: i,
        x: randomBetween(-180, 180),
        y: randomBetween(-300, -20),
        rotation: randomBetween(-360, 360),
        scale: randomBetween(0.4, 1.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      });
    }
    setConfetti(particles);
    setTimeout(() => navigate('/auth?mode=signup'), 1000);
  }, [navigate, play]);

  const handleSignIn = useCallback(() => {
    play('tap');
    navigate('/auth?mode=signin');
  }, [navigate, play]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F8FAFF] via-[#F0F4FF] to-[#E8EDFF] font-poppins"
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: easing }}
        className="absolute top-0 left-0 right-0 h-[3px] z-50"
      >
        <div className="h-full bg-gradient-to-r from-transparent via-[#536DFE]/60 to-transparent" />
      </motion.div>

      {/* ── Ambient Orb Layer ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none will-change-transform">
        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.12, 0.22, 0.12],
            x: [0, 70, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-28 -right-28 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-[#536DFE]/30 to-[#6B7FFF]/20 blur-[90px]"
        />

        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.08, 0.18, 0.08],
            x: [0, -60, 0],
            y: [0, 70, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-28 -left-28 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#536DFE]/25 to-[#6B7FFF]/15 blur-[110px]"
        />

        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.06, 0.14, 0.06],
            x: [0, 40, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-1/3 left-1/2 w-[350px] h-[350px] rounded-full bg-gradient-to-r from-[#6B7FFF]/20 to-[#536DFE]/15 blur-[70px] -translate-x-1/2 -translate-y-1/2"
        />

        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0, 0.08, 0],
            rotate: [0, 360]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 8 }}
          className="absolute top-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[#F59E0B]/15 to-transparent blur-[60px]"
        />
      </div>

      {/* ── Floating Particle Layer ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none will-change-transform">
        {[...Array(currentScreenData.particleDensity)].map((_, i) => (
          <motion.div
            key={`bp-${i}`}
            className="absolute w-[3px] h-[3px] rounded-full bg-[#536DFE]/40"
            initial={{
              x: randomBetween(0, 400),
              y: randomBetween(0, 900),
              opacity: 0
            }}
            animate={{
              x: [null, randomBetween(-60, 60)],
              y: [null, randomBetween(-180, -60)],
              opacity: [0, 0.5 + Math.random() * 0.3, 0],
              scale: [0, 1.2, 0]
            }}
            transition={{
              duration: randomBetween(5, 9),
              repeat: Infinity,
              delay: randomBetween(0, 6),
              ease: "easeOut"
            }}
          />
        ))}

        {[...Array(currentScreenData.goldParticles)].map((_, i) => (
          <motion.div
            key={`gp-${i}`}
            className="absolute w-[3px] h-[3px] rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(245,158,11,0.8), rgba(245,158,11,0.1))`,
              boxShadow: '0 0 6px rgba(245,158,11,0.4)'
            }}
            initial={{
              x: randomBetween(0, 400),
              y: randomBetween(0, 900),
              opacity: 0
            }}
            animate={{
              x: [null, randomBetween(-40, 40)],
              y: [null, randomBetween(-200, -80)],
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: randomBetween(7, 11),
              repeat: Infinity,
              delay: randomBetween(1, 7),
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* ── Divine Light Follower ── */}
      <motion.div
        className="absolute w-56 h-56 rounded-full pointer-events-none will-change-transform"
        style={{
          background: `radial-gradient(circle, rgba(83,109,254,0.08) 0%, rgba(107,127,255,0.04) 40%, transparent 70%)`,
          x: useTransform(springX, [0, 1], [-112, (typeof window !== 'undefined' ? window.innerWidth : 400) - 112]),
          y: useTransform(springY, [0, 1], [-112, (typeof window !== 'undefined' ? window.innerHeight : 800) - 112])
        }}
      />

      {/* ── Main Content ── */}
      <div className="relative z-10 flex flex-col h-full px-5 sm:px-6 pt-6 pb-6 safe-area-inset">
        {/* ── Top Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easing, delay: 0.15 }}
          className="flex items-center justify-between mb-4"
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.06 }}
            whileFocus={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <motion.img
              src={LogoImg}
              alt="Royal Plate"
              className="h-11 sm:h-[52px] object-contain drop-shadow-xl focus:outline-none"
              animate={{
                y: [-3, 4, -3],
                filter: [
                  "drop-shadow(0 8px 24px rgba(83, 109, 254, 0.25)) brightness(1)",
                  "drop-shadow(0 14px 36px rgba(83, 109, 254, 0.35)) brightness(1.02)",
                  "drop-shadow(0 8px 24px rgba(83, 109, 254, 0.25)) brightness(1)"
                ]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              tabIndex={0}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/15 to-[#6B7FFF]/15 blur-2xl -z-10 rounded-full"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {!isLastScreen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              onClick={handleSkip}
              whileHover={{ scale: 1.05, x: 3 }}
              whileTap={{ scale: 0.92 }}
              className="relative px-4 py-2 text-[#536DFE]/40 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase overflow-hidden group rounded-lg"
            >
              <span className="relative z-10 group-hover:text-[#536DFE]/70 transition-colors duration-300">Skip</span>
              <motion.div
                className="absolute inset-0 bg-[#536DFE]/5 rounded-lg"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          )}
        </motion.div>

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-4 sm:-mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: -30 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              style={{
                rotateX: cardRotateX,
                rotateY: cardRotateY,
                perspective: 1200
              }}
              className="w-full flex flex-col items-center will-change-transform"
            >
              {/* ── Glass Card Container ── */}
              <div className="relative w-full max-w-[340px] rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_8px_40px_-8px_rgba(83,109,254,0.08)] px-6 sm:px-8 pt-10 sm:pt-12 pb-8 sm:pb-10">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

                {/* ── Mascot Section ── */}
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
                  className="relative mb-5"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.12, 1],
                      opacity: [0.15, 0.3, 0.15]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#536DFE]/25 to-[#6B7FFF]/25 blur-2xl -z-10"
                    style={{ width: '210px', height: '210px', top: '-22px', left: '-22px' }}
                  />

                  <motion.div
                    animate={{
                      y: [-10, 12, -10],
                      rotate: [-3, 4, -3]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="absolute rounded-full border border-dashed"
                      style={{
                        width: '218px',
                        height: '218px',
                        top: '-22px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderColor: 'rgba(83,109,254,0.12)'
                      }}
                    />

                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="absolute rounded-full border border-dashed"
                      style={{
                        width: '232px',
                        height: '232px',
                        top: '-29px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderColor: 'rgba(245,158,11,0.08)'
                      }}
                    />

                    <motion.img
                      src={MascotImg}
                      alt="Royal Plate Mascot"
                      className="w-[150px] h-[150px] sm:w-[165px] sm:h-[165px] object-contain drop-shadow-2xl mx-auto relative z-10"
                      animate={{
                        scale: [1, 1.015, 1],
                        filter: [
                          "drop-shadow(0 20px 50px rgba(83, 109, 254, 0.25))",
                          "drop-shadow(0 28px 60px rgba(83, 109, 254, 0.35))",
                          "drop-shadow(0 20px 50px rgba(83, 109, 254, 0.25))"
                        ]
                      }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const angle = (i * Math.PI * 2) / 6;
                      const radius = 122;
                      return (
                        <motion.div
                          key={i}
                          className="absolute w-[5px] h-[5px] rounded-full"
                          style={{
                            background: i % 2 === 0
                              ? 'rgba(83,109,254,0.5)'
                              : 'rgba(245,158,11,0.4)',
                            boxShadow: i % 2 === 0
                              ? '0 0 8px rgba(83,109,254,0.3)'
                              : '0 0 8px rgba(245,158,11,0.2)',
                            left: '50%',
                            top: '50%',
                            marginLeft: '-2.5px',
                            marginTop: '-2.5px',
                            transformOrigin: `${Math.cos(angle) * radius}px ${Math.sin(angle) * radius}px`
                          }}
                          animate={{
                            scale: [1, 1.6, 1],
                            opacity: [0.3, 0.8, 0.3]
                          }}
                          transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.4
                          }}
                        />
                      );
                    })}

                    {/* ── Icon Badge ── */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.45 }}
                      className="absolute -top-3 -right-3 sm:-top-3.5 sm:-right-3.5 w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-xl border-[3px] border-white/60 backdrop-blur-sm z-20"
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 6, -6, 0],
                          scale: [1, 1.08, 1]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <IconComponent className="w-8 h-8 sm:w-[34px] sm:h-[34px] text-white" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] blur-xl opacity-40 -z-10"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* ── Text Section ── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: easing, delay: 0.4 }}
                  className="text-center relative z-10"
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="w-10 h-[2px] bg-gradient-to-r from-transparent via-[#536DFE] to-transparent mx-auto mb-3"
                  />

                  <motion.h1
                    initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, ease: easing, delay: 0.45 }}
                    className="text-[#1D2956] text-[22px] sm:text-[26px] md:text-[30px] font-bold leading-tight tracking-[-0.02em]"
                  >
                    {currentScreenData.title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 8, letterSpacing: "0.5em" }}
                    animate={{ opacity: 1, y: 0, letterSpacing: "0.15em" }}
                    transition={{ duration: 0.7, ease: easing, delay: 0.55 }}
                    className="text-[#536DFE] text-[11px] sm:text-xs font-bold uppercase mb-2.5"
                  >
                    {currentScreenData.subtitle}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: easing, delay: 0.65 }}
                    className="text-[#1D2956]/60 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto"
                  >
                    {currentScreenData.description}
                  </motion.p>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="w-14 h-[2px] bg-gradient-to-r from-transparent via-[#536DFE]/25 to-transparent mx-auto mt-4"
                  />
                </motion.div>

                {/* ── Decorative Gold Corner Accents ── */}
                <div className="absolute top-3 left-4 w-6 h-[1px] bg-gradient-to-r from-[#F59E0B]/40 to-transparent" />
                <div className="absolute top-3 right-4 w-6 h-[1px] bg-gradient-to-l from-[#F59E0B]/40 to-transparent" />
                <div className="absolute bottom-3 left-4 w-6 h-[1px] bg-gradient-to-r from-[#F59E0B]/40 to-transparent" />
                <div className="absolute bottom-3 right-4 w-6 h-[1px] bg-gradient-to-l from-[#F59E0B]/40 to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom Section ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bottom-${currentScreen}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-5 mt-auto"
          >
            {/* ── Pagination ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center justify-center gap-3"
            >
              {screens.map((_, index) => {
                const isActive = currentScreen === index;
                return (
                  <motion.button
                    key={index}
                    onClick={() => { play('tap'); screenEnterTime.current = Date.now(); setCurrentScreen(index); }}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.85 }}
                    className="relative flex items-center justify-center"
                    style={{ width: isActive ? 38 : 8, height: 8 }}
                  >
                    <motion.div
                      animate={{
                        width: isActive ? 38 : 8,
                        height: 8,
                        backgroundColor: isActive ? BRAND_BLUE : 'rgba(83, 109, 254, 0.18)'
                      }}
                      transition={{ duration: 0.4, ease: easing }}
                      className="rounded-full"
                    />
                    {isActive && (
                      <motion.div
                        layoutId="activeDot"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] shadow-lg shadow-[#536DFE]/30"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(83, 109, 254, 0.3)",
                            "0 0 0 8px rgba(83, 109, 254, 0)",
                            "0 0 0 0 rgba(83, 109, 254, 0)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* ── Action Buttons ── */}
            <div className="space-y-3">
              {isLastScreen ? (
                <>
                  {/* ── Get Started Button ── */}
                  <motion.button
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    onClick={handleGetStarted}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative w-full h-14 sm:h-16 rounded-2xl font-bold text-xs sm:text-sm tracking-[0.15em] uppercase text-white flex items-center justify-center gap-2 overflow-hidden group shadow-[0_8px_32px_-4px_rgba(83,109,254,0.4)] hover:shadow-[0_12px_48px_-4px_rgba(83,109,254,0.5)] transition-shadow duration-500"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE] via-[#6B7FFF] to-[#536DFE] bg-[length:200%_100%] group-hover:bg-right-top transition-all duration-1000" />

                    {/* Gold shimmer sweep */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F59E0B]/15 to-transparent skew-x-[-20deg]"
                      animate={{ x: ["-150%", "150%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
                    />

                    {/* Spotlight shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.8 }}
                    />

                    <motion.span
                      className="relative z-10 flex items-center gap-2.5"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
                    >
                      <span className="text-white drop-shadow-sm">Get Started</span>
                      <motion.div
                        animate={{ x: [0, 4, 0], rotate: [0, 0, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
                        className="flex items-center"
                      >
                        <ChevronRight className="w-4 h-4 text-white drop-shadow-sm" />
                      </motion.div>
                    </motion.span>
                  </motion.button>

                  {/* ── Sign In Button ── */}
                  <motion.button
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    onClick={handleSignIn}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full h-14 sm:h-16 rounded-2xl border-2 border-[#536DFE]/20 text-[#536DFE] font-bold text-xs sm:text-sm tracking-[0.15em] uppercase bg-white/70 backdrop-blur-md shadow-lg overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-transparent"
                      animate={{
                        boxShadow: [
                          "inset 0 0 0 0 rgba(83, 109, 254, 0)",
                          "inset 0 0 0 2px rgba(83, 109, 254, 0.08)",
                          "inset 0 0 0 0 rgba(83, 109, 254, 0)"
                        ]
                      }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut" }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Sign In
                      <motion.span
                        className="inline-block"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                      >
                        →
                      </motion.span>
                    </span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  onClick={handleNext}
                  whileHover={{ scale: 1.02, y: -3, boxShadow: "0 20px 50px rgba(83, 109, 254, 0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full h-14 sm:h-16 rounded-2xl font-bold text-xs sm:text-sm tracking-[0.15em] uppercase text-white flex items-center justify-center gap-2.5 overflow-hidden group shadow-[0_8px_32px_-4px_rgba(83,109,254,0.35)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE] via-[#6B7FFF] to-[#536DFE] bg-[length:200%_100%] group-hover:bg-right-top transition-all duration-1000" />

                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />

                  <motion.span
                    className="relative z-10 flex items-center gap-2"
                    animate={{ x: [0, 5, 0] }}
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

            {/* ── Powered By ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col items-center gap-2 pt-1 pb-2"
            >
              <div className="w-14 h-[2px] bg-gradient-to-r from-transparent via-[#536DFE]/30 to-transparent rounded-full" />

              <p className="text-[#1D2956]/30 text-[8px] font-bold tracking-[0.25em] uppercase">
                Powered By
              </p>

              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ type: "spring", stiffness: 400, damping: 12 }}
                className="relative"
              >
                <img
                  src="https://mingalarmon.com/assets/logo_light.png"
                  alt="Mingalar Mon"
                  className="h-[38px] object-contain opacity-50 hover:opacity-70 transition-opacity duration-500 drop-shadow-md"
                />
                <motion.div
                  className="absolute inset-0 bg-white/5 blur-xl -z-10 rounded-full"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>

              <div className="w-[34px] h-[2px] bg-gradient-to-r from-transparent via-[#536DFE]/15 to-transparent rounded-full" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Confetti Overlay ── */}
      <AnimatePresence>
        {confetti.map((p) => (
          <motion.div
            key={`confetti-${p.id}`}
            initial={{
              opacity: 1,
              scale: 0,
              x: 0,
              y: 0,
              rotate: 0
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, p.scale, p.scale * 0.8],
              x: p.x,
              y: p.y,
              rotate: p.rotation
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: p.shape === 'circle' ? 6 : 5,
              height: p.shape === 'circle' ? 6 : 8,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              background: p.color,
              boxShadow: `0 0 6px ${p.color}40`,
              marginLeft: -3,
              marginTop: -4
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
