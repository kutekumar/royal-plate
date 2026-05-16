import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import LogoImg from '@/imgs/logo.png';
import { useSoundContext } from '@/contexts/SoundContext';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(false);
  const [authFallback, setAuthFallback] = useState(false);
  const { play } = useSoundContext();
  const { signUp, signIn, user, userRole, loading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Navigate once user is authenticated and role is known
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

  // Fallback: navigate to /home if user is set but role not available after timeout
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
      setPendingAuth(true);
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
      toast.success('Signing in...');
      setPendingAuth(true);
      setIsLoading(false);
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

  if (pendingAuth && user && userRole) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F8F9FF] via-[#F0F2FF] to-[#E8ECFF] font-poppins">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-[#536DFE] animate-spin" />
          <p className="text-[#1D2956] text-sm font-semibold">Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F8F9FF] via-[#F0F2FF] to-[#E8ECFF] font-poppins">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.12, 0.2, 0.12],
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#536DFE] via-[#6B7FFF] to-[#8895FF] blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#1D2956] via-[#536DFE] to-[#6B7FFF] blur-[150px]"
        />
        {/* Light overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] mx-auto px-4 py-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[#536DFE]/60 hover:text-[#536DFE] text-xs font-semibold transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#536DFE]/10 border border-white/60 overflow-hidden"
        >
          {/* Card Header */}
          <div className="px-7 pt-8 pb-2 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] p-0.5 shadow-xl shadow-[#536DFE]/40">
                <div className="w-full h-full rounded-[11px] bg-white flex items-center justify-center">
                  <img src={LogoImg} alt="Royal Plate" className="w-9 h-9 object-contain" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-[#1D2956] text-xl font-bold tracking-tight"
            >
              {mode === 'signin' ? 'Welcome back' : 'Join Royal Plate'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="text-[#1D2956]/50 text-xs mt-1"
            >
              {mode === 'signin' ? 'Sign in to continue your journey' : 'Create your account to get started'}
            </motion.p>
          </div>

          {/* Tab Toggle */}
          <div className="px-7 pt-5 pb-2">
            <div className="flex p-0.5 bg-[#F0F2FF] rounded-xl">
              {(['signin', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={toggleMode}
                  className={`flex-1 py-2 text-xs font-bold rounded-[10px] transition-all duration-300 ${
                    mode === tab
                      ? 'bg-white text-[#536DFE] shadow-sm shadow-[#536DFE]/10'
                      : 'text-[#1D2956]/40 hover:text-[#1D2956]/60'
                  }`}
                >
                  {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
              className="px-7 pt-4 pb-6 space-y-3.5"
            >
              {/* Name Field (signup only) */}
              {mode === 'signup' && (
                <FieldWrapper label="Full Name" focused={focusedField === 'name'}>
                  <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${focusedField === 'name' ? 'text-[#536DFE]' : 'text-[#536DFE]/30'}`} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.fullName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all text-[#1D2956] text-xs placeholder-[#1D2956]/25"
                    required
                  />
                </FieldWrapper>
              )}

              {/* Phone Field (signup only) */}
              {mode === 'signup' && (
                <FieldWrapper label="Phone Number" focused={focusedField === 'phone'}>
                  <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${focusedField === 'phone' ? 'text-[#536DFE]' : 'text-[#536DFE]/30'}`} />
                  <input
                    type="tel"
                    placeholder="+95 9 XXX XXX XXX"
                    value={signUpData.phone}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all text-[#1D2956] text-xs placeholder-[#1D2956]/25"
                    required
                  />
                </FieldWrapper>
              )}

              {/* Email */}
              <FieldWrapper label="Email Address" focused={focusedField === 'email'}>
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${focusedField === 'email' ? 'text-[#536DFE]' : 'text-[#536DFE]/30'}`} />
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
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all text-[#1D2956] text-xs placeholder-[#1D2956]/25"
                  required
                />
              </FieldWrapper>

              {/* Password */}
              <FieldWrapper label="Password" focused={focusedField === 'password'}>
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${focusedField === 'password' ? 'text-[#536DFE]' : 'text-[#536DFE]/30'}`} />
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
                  className="w-full pl-9 pr-9 py-2.5 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all text-[#1D2956] text-xs placeholder-[#1D2956]/25"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536DFE]/40 hover:text-[#536DFE] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </FieldWrapper>

              {/* Confirm Password (signup only) */}
              {mode === 'signup' && (
                <FieldWrapper label="Confirm Password" focused={focusedField === 'confirm'}>
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${focusedField === 'confirm' ? 'text-[#536DFE]' : 'text-[#536DFE]/30'}`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signUpData.confirmPassword}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-9 py-2.5 bg-[#F8F9FF] border border-[#E8ECFF] rounded-xl focus:border-[#536DFE] focus:outline-none transition-all text-[#1D2956] text-xs placeholder-[#1D2956]/25"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536DFE]/40 hover:text-[#536DFE] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </FieldWrapper>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white font-bold text-xs tracking-wide shadow-xl shadow-[#536DFE]/30 hover:shadow-2xl hover:shadow-[#536DFE]/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </span>
                )}
              </motion.button>

              {/* Toggle mode */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-xs text-[#1D2956]/40 pt-1"
              >
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-1.5 text-[#536DFE] font-semibold hover:text-[#6B7FFF] transition-colors"
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                </button>
              </motion.p>
            </motion.form>
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center gap-2 mt-6"
        >
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#536DFE]/40 to-transparent rounded-full" />
          <p className="text-[#1D2956]/25 text-[7px] font-semibold tracking-[0.3em] uppercase">Powered By</p>
          <img
            src="https://mingalarmon.com/assets/logo_light.png"
            alt="Mingalar Mon"
            className="h-6 object-contain opacity-40 hover:opacity-60 transition-opacity"
          />
        </motion.div>
      </div>
    </div>
  );
};

const FieldWrapper = ({ label, focused, children }: { label: string; focused: boolean; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <label className={`block text-[11px] font-medium mb-1.5 transition-colors ${focused ? 'text-[#536DFE]' : 'text-[#1D2956]/50'}`}>
      {label}
    </label>
    <div className="relative">
      {children}
    </div>
  </motion.div>
);

export default Auth;
