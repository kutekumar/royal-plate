import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import LogoImg from '@/imgs/logo.png';
import { useSoundContext } from '@/contexts/SoundContext';

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const easing = [0.22, 1, 0.36, 1] as const;

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'circle' | 'square';
}

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(false);
  const [authFallback, setAuthFallback] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const { play } = useSoundContext();
  const { signUp, signIn, user, userRole, loading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 35 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 35 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (userRole === 'admin') {
      navigate('/admin', { replace: true });
    } else if (userRole === 'restaurant_owner') {
      navigate('/dashboard', { replace: true });
    } else if (userRole === 'customer') {
      navigate('/home', { replace: true });
    }
  }, [user, userRole, navigate]);

  useEffect(() => {
    if (!user) return;
    if (userRole) return;
    const id = setTimeout(() => setAuthFallback(true), 5000);
    return () => clearTimeout(id);
  }, [user, userRole]);

  useEffect(() => {
    if (!user || !authFallback) return;
    navigate('/home', { replace: true });
  }, [user, authFallback, navigate]);

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    confirmPassword: ''
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = (() => {
    const p = signUpData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score += 1;
    if (p.length >= 10) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    return score;
  })();

  const fireConfetti = () => {
    const colors = ['#F59E0B', '#536DFE', '#6B7FFF', '#D97706', '#FBBF24'];
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: i,
        x: randomBetween(-200, 200),
        y: randomBetween(-320, -30),
        rotation: randomBetween(-360, 360),
        scale: randomBetween(0.3, 1.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      });
    }
    setConfetti(particles);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.fullName,
      signUpData.phone
    );

    if (error) {
      play('error');
      toast.error(error.message || 'Failed to sign up');
      setIsLoading(false);
    } else {
      play('success');
      toast.success('Account created! Welcome to Royal Plate');
      fireConfetti();
      setShowSuccess(true);
      setPendingAuth(true);
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      play('error');
      toast.error(error.message || 'Failed to sign in');
      setIsLoading(false);
    } else {
      play('success');
      fireConfetti();
      setShowSuccess(true);
      toast.success('Signing in...');
      setPendingAuth(true);
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  useEffect(() => {
    if (!pendingAuth) return;
    if (mode === 'signup' && user && !userRole) {
      const id = setTimeout(() => navigate('/home', { replace: true }), 3000);
      return () => clearTimeout(id);
    }
  }, [pendingAuth, mode, user, userRole, navigate]);

  const toggleMode = () => {
    play('tap');
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  if (pendingAuth && (user || showSuccess)) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F8F9FF] via-[#F0F2FF] to-[#E8ECFF] font-poppins">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.2, 0.12], x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#536DFE] via-[#6B7FFF] to-[#8895FF] blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08], x: [0, -50, 0], y: [0, 50, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#1D2956] via-[#536DFE] to-[#6B7FFF] blur-[150px]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: easing }}
          className="flex flex-col items-center gap-5 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-2xl shadow-[#536DFE]/30"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <CheckCircle2 className="w-9 h-9 text-white" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <h2 className="text-[#1D2956] text-lg font-bold">
              {mode === 'signin' ? 'Welcome back!' : 'Account Created!'}
            </h2>
            <p className="text-[#1D2956]/50 text-xs mt-1">
              {mode === 'signin' ? 'Redirecting to your dashboard...' : 'Preparing your Royal Plate experience...'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-[#536DFE] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#536DFE] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#536DFE] animate-bounce" style={{ animationDelay: '300ms' }} />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {confetti.map((p) => (
            <motion.div
              key={`confetti-${p.id}`}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: [1, 1, 0], scale: [0, p.scale, p.scale * 0.8], x: p.x, y: p.y, rotate: p.rotation }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
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
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F8F9FF] via-[#F0F2FF] to-[#E8ECFF] font-poppins"
    >
      {/* ── Ambient Orb Layer ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none will-change-transform">
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.12, 0.22, 0.12], x: [0, 70, 0], y: [0, -50, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-28 -right-28 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-[#536DFE]/30 to-[#6B7FFF]/20 blur-[90px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.08, 0.18, 0.08], x: [0, -60, 0], y: [0, 70, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-28 -left-28 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#536DFE]/25 to-[#6B7FFF]/15 blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.06, 0.14, 0.06], x: [0, 40, 0], y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-1/3 left-1/2 w-[350px] h-[350px] rounded-full bg-gradient-to-r from-[#6B7FFF]/20 to-[#536DFE]/15 blur-[70px] -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0, 0.08, 0], rotate: [0, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 8 }}
          className="absolute top-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[#F59E0B]/15 to-transparent blur-[60px]"
        />

        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            className="absolute w-[3px] h-[3px] rounded-full bg-[#536DFE]/30"
            initial={{ x: randomBetween(0, 500), y: randomBetween(0, 900), opacity: 0 }}
            animate={{
              x: [null, randomBetween(-50, 50)],
              y: [null, randomBetween(-160, -40)],
              opacity: [0, 0.5, 0],
              scale: [0, 1.2, 0]
            }}
            transition={{ duration: randomBetween(5, 9), repeat: Infinity, delay: randomBetween(0, 5), ease: "easeOut" }}
          />
        ))}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`gp-${i}`}
            className="absolute w-[3px] h-[3px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(245,158,11,0.8), rgba(245,158,11,0.1))',
              boxShadow: '0 0 6px rgba(245,158,11,0.4)'
            }}
            initial={{ x: randomBetween(0, 500), y: randomBetween(0, 900), opacity: 0 }}
            animate={{
              x: [null, randomBetween(-30, 30)],
              y: [null, randomBetween(-200, -60)],
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ duration: randomBetween(7, 11), repeat: Infinity, delay: randomBetween(1, 6), ease: "easeOut" }}
          />
        ))}
      </div>

      {/* ── Divine Light Follower ── */}
      <motion.div
        className="absolute w-64 h-64 rounded-full pointer-events-none will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(83,109,254,0.07) 0%, rgba(107,127,255,0.03) 40%, transparent 70%)',
          x: useTransform(springX, [0, 1], [-128, (typeof window !== 'undefined' ? window.innerWidth : 400) - 128]),
          y: useTransform(springY, [0, 1], [-128, (typeof window !== 'undefined' ? window.innerHeight : 800) - 128])
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-[400px] mx-auto px-4 py-8">
        {/* ── Back Button ── */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: easing }}
          onClick={() => navigate('/')}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-[#536DFE]/50 hover:text-[#536DFE] text-xs font-semibold transition-colors mb-5 group"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/80 backdrop-blur-sm border border-[#536DFE]/10 shadow-sm group-hover:border-[#536DFE]/20 transition-all">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          </span>
          Back
        </motion.button>

        {/* ── Main Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: easing, delay: 0.1 }}
          className="relative bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-12px_rgba(83,109,254,0.12),0_8px_24px_-8px_rgba(83,109,254,0.06)] border border-white/60 overflow-hidden"
        >
          {/* ── Gold Corner Accents ── */}
          <div className="absolute top-4 left-5 w-8 h-[1.5px] bg-gradient-to-r from-[#F59E0B]/50 to-transparent rounded-full" />
          <div className="absolute top-4 right-5 w-8 h-[1.5px] bg-gradient-to-l from-[#F59E0B]/50 to-transparent rounded-full" />
          <div className="absolute bottom-4 left-5 w-8 h-[1.5px] bg-gradient-to-r from-[#F59E0B]/50 to-transparent rounded-full" />
          <div className="absolute bottom-4 right-5 w-8 h-[1.5px] bg-gradient-to-l from-[#F59E0B]/50 to-transparent rounded-full" />

          {/* ── Card Header ── */}
          <div className="px-7 pt-9 pb-1 text-center relative">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <img src={LogoImg} alt="Royal Plate" className="h-14 sm:h-16 object-contain drop-shadow-2xl" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#536DFE]/20 to-[#6B7FFF]/20 blur-3xl -z-10 rounded-full"
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.4, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: easing, delay: 0.3 }}
              className="text-[#1D2956] text-xl font-bold tracking-tight"
            >
              {mode === 'signin' ? 'Welcome back' : 'Join Royal Plate'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing, delay: 0.38 }}
              className="text-[#1D2956]/45 text-xs mt-1.5"
            >
              {mode === 'signin' ? 'Sign in to continue your journey' : 'Create your account to get started'}
            </motion.p>
          </div>

          {/* ── Tab Toggle ── */}
          <div className="px-7 pt-5 pb-1">
            <div className="relative flex p-1 bg-[#F0F2FF] rounded-xl">
              {(['signin', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={toggleMode}
                  className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-[10px] transition-colors duration-200 ${
                    mode === tab
                      ? 'text-[#536DFE]'
                      : 'text-[#1D2956]/35 hover:text-[#1D2956]/60'
                  }`}
                >
                  {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
              <motion.div
                layoutId="authTabPill"
                className="absolute top-1 bottom-1 rounded-[10px] bg-white shadow-sm shadow-[#536DFE]/8"
                style={{ width: '50%' }}
                animate={{ left: mode === 'signin' ? '0.25rem' : 'calc(50% - 0.125rem)' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </div>
          </div>

          {/* ── Form ── */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.35, ease: easing }}
              onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
              className="px-7 pt-5 pb-7 space-y-4"
            >
              {/* ── Name Field ── */}
              {mode === 'signup' && (
                <FieldWrapper label="Full Name" focused={focusedField === 'name'}>
                  <User
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 ${
                      focusedField === 'name' ? 'text-[#536DFE] scale-110' : 'text-[#536DFE]/25'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.fullName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all duration-300 text-[#1D2956] text-xs placeholder-[#1D2956]/20"
                    required
                  />
                </FieldWrapper>
              )}

              {/* ── Phone Field ── */}
              {mode === 'signup' && (
                <FieldWrapper label="Phone Number" focused={focusedField === 'phone'}>
                  <Phone
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 ${
                      focusedField === 'phone' ? 'text-[#536DFE] scale-110' : 'text-[#536DFE]/25'
                    }`}
                  />
                  <input
                    type="tel"
                    placeholder="+95 9 XXX XXX XXX"
                    value={signUpData.phone}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all duration-300 text-[#1D2956] text-xs placeholder-[#1D2956]/20"
                    required
                  />
                </FieldWrapper>
              )}

              {/* ── Email ── */}
              <FieldWrapper label="Email Address" focused={focusedField === 'email'}>
                <Mail
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 ${
                    focusedField === 'email' ? 'text-[#536DFE] scale-110' : 'text-[#536DFE]/25'
                  }`}
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={mode === 'signin' ? signInData.email : signUpData.email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    if (mode === 'signin') {
                      setSignInData({ ...signInData, email: e.target.value });
                    } else {
                      setSignUpData({ ...signUpData, email: e.target.value });
                    }
                  }}
                  className="w-full pl-9 pr-3 py-3 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all duration-300 text-[#1D2956] text-xs placeholder-[#1D2956]/20"
                  required
                />
              </FieldWrapper>

              {/* ── Password ── */}
              <FieldWrapper label="Password" focused={focusedField === 'password'}>
                <Lock
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 ${
                    focusedField === 'password' ? 'text-[#536DFE] scale-110' : 'text-[#536DFE]/25'
                  }`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={mode === 'signin' ? signInData.password : signUpData.password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    if (mode === 'signin') {
                      setSignInData({ ...signInData, password: e.target.value });
                    } else {
                      setSignUpData({ ...signUpData, password: e.target.value });
                    }
                  }}
                  className="w-full pl-9 pr-9 py-3 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all duration-300 text-[#1D2956] text-xs placeholder-[#1D2956]/20"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536DFE]/35 hover:text-[#536DFE] transition-all duration-300 hover:scale-110"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {mode === 'signup' && signUpData.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    className="absolute bottom-[-6px] left-3.5 right-9 h-[2px] rounded-full overflow-hidden origin-left"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        background: passwordStrength <= 2
                          ? 'linear-gradient(90deg, #EF4444, #F97316)'
                          : passwordStrength <= 4
                            ? 'linear-gradient(90deg, #F59E0B, #EAB308)'
                            : 'linear-gradient(90deg, #22C55E, #10B981)'
                      }}
                    />
                  </motion.div>
                )}
              </FieldWrapper>

              {/* ── Confirm Password ── */}
              {mode === 'signup' && (
                <FieldWrapper label="Confirm Password" focused={focusedField === 'confirm'}>
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 ${
                      focusedField === 'confirm' ? 'text-[#536DFE] scale-110' : 'text-[#536DFE]/25'
                    }`}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signUpData.confirmPassword}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-9 py-3 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all duration-300 text-[#1D2956] text-xs placeholder-[#1D2956]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536DFE]/35 hover:text-[#536DFE] transition-all duration-300 hover:scale-110"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {signUpData.confirmPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute right-9 top-1/2 -translate-y-1/2"
                    >
                      <div className={`w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        signUpData.password === signUpData.confirmPassword
                          ? 'border-[#22C55E] bg-[#22C55E]/10'
                          : 'border-[#EF4444]/40 bg-[#EF4444]/5'
                      }`}>
                        {signUpData.password === signUpData.confirmPassword ? (
                          <motion.svg
                            key="match"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            viewBox="0 0 12 12"
                            className="w-[8px] h-[8px]"
                          >
                            <path d="M2 6l3 3 5-5" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </motion.svg>
                        ) : (
                          <div className="w-[6px] h-[6px] rounded-full bg-[#EF4444]/50" />
                        )}
                      </div>
                    </motion.div>
                  )}
                </FieldWrapper>
              )}

              {/* ── Submit ── */}
              <div className="pt-1">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-3.5 rounded-2xl font-bold text-xs tracking-wide uppercase text-white overflow-hidden group shadow-[0_8px_28px_-4px_rgba(83,109,254,0.4)] hover:shadow-[0_12px_44px_-4px_rgba(83,109,254,0.5)] transition-shadow duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#536DFE] via-[#6B7FFF] to-[#536DFE] bg-[length:200%_100%] group-hover:bg-right-top transition-all duration-1000" />

                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F59E0B]/12 to-transparent skew-x-[-20deg]"
                    animate={{ x: ["-150%", "150%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
                  />

                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.8 }}
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    {isLoading ? (
                      <span className="flex items-center gap-2.5">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-[2px] border-white/30 border-t-white rounded-full"
                        />
                        <span className="drop-shadow-sm">Processing</span>
                      </span>
                    ) : showSuccess ? (
                      <span className="flex items-center gap-2 drop-shadow-sm">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                        Success
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 drop-shadow-sm">
                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                      </span>
                    )}
                  </span>
                </motion.button>
              </div>

              {/* ── Toggle Mode ── */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-center text-xs text-[#1D2956]/40 pt-0.5"
              >
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-1.5 text-[#536DFE] font-semibold hover:text-[#6B7FFF] transition-colors relative group"
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  <span className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-[#536DFE]/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </button>
              </motion.p>
            </motion.form>
          </AnimatePresence>
        </motion.div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: easing }}
          className="flex flex-col items-center gap-2 mt-6"
        >
          <div className="w-14 h-[2px] bg-gradient-to-r from-transparent via-[#536DFE]/30 to-transparent rounded-full" />
          <p className="text-[#1D2956]/25 text-[7px] font-bold tracking-[0.3em] uppercase">Powered By</p>
          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
          >
            <img
              src="https://mingalarmon.com/assets/logo_light.png"
              alt="Mingalar Mon"
              className="h-7 object-contain opacity-40 hover:opacity-60 transition-opacity duration-500 drop-shadow-md"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Confetti Overlay ── */}
      <AnimatePresence>
        {confetti.map((p) => (
          <motion.div
            key={`confetti-${p.id}`}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={{ opacity: [1, 1, 0], scale: [0, p.scale, p.scale * 0.8], x: p.x, y: p.y, rotate: p.rotation }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
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

const FieldWrapper = ({ label, focused, children }: { label: string; focused: boolean; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: easing }}
    className="relative"
  >
    <label className={`block text-[11px] font-medium mb-1.5 transition-all duration-300 ${
      focused ? 'text-[#536DFE] translate-x-0.5' : 'text-[#1D2956]/45'
    }`}>
      {label}
    </label>
    <motion.div
      className="relative rounded-xl"
      animate={focused ? {
        boxShadow: [
          '0 0 0 0 rgba(83,109,254,0.08)',
          '0 0 0 4px rgba(83,109,254,0.06)',
          '0 0 0 0 rgba(83,109,254,0.08)'
        ]
      } : {}}
      transition={{ duration: 1.5, repeat: focused ? Infinity : 0, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  </motion.div>
);

export default Auth;
