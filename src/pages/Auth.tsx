import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';
import LogoImg from '@/imgs/logo.png';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { signUp, signIn, user, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get mode from URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in
  if (user && userRole) {
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'restaurant_owner') {
      navigate('/dashboard');
    } else {
      navigate('/home');
    }
  }

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
      toast.error(error.message || 'Failed to sign up');
      setIsLoading(false);
    } else {
      toast.success('Account created! Welcome to Royal Plate');
      // Trigger exit animation
      setIsExiting(true);
      // Wait for exit animation to complete before navigating
      setTimeout(() => {
        navigate('/home');
      }, 600); // Match the exit animation duration
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      toast.error(error.message || 'Failed to sign in');
      setIsLoading(false);
    } else {
      toast.success('Signing in...');
      // Trigger exit animation
      setIsExiting(true);
      // Wait for exit animation to complete before navigating
      setTimeout(() => {
        navigate('/home');
      }, 600); // Match the exit animation duration
    }
  };

  return (
    <>
      <BrandLoader isLoading={isLoading || isExiting} />
      <PageTransition>
        <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col overflow-y-auto bg-white font-poppins">

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
          <div className="relative z-10 flex flex-col min-h-screen px-6 sm:px-8 pt-8 sm:pt-10 pb-6 safe-area-inset">

            {/* Top Bar - Back Button */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="mb-6 sm:mb-8"
            >
              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-[#536DFE] text-xs sm:text-sm font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </motion.button>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col justify-start">

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="text-center mb-6 sm:mb-8"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.1
                  }}
                  className="flex justify-center mb-3 sm:mb-4"
                >
                  <motion.img
                    src={LogoImg}
                    alt="Royal Plate Logo"
                    className="h-16 sm:h-20 object-contain drop-shadow-2xl"
                    animate={{
                      y: [-3, 3, -3]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-[#1D2956] text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2"
                >
                  {mode === 'signin' ? 'Welcome Back' : 'Join Royal Plate'}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-[#1D2956]/60 text-sm sm:text-base"
                >
                  {mode === 'signin' ? 'Sign in to continue your experience' : 'Create your account to begin your journey'}
                </motion.p>
              </motion.div>

              {/* Auth Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
                  className="space-y-4 sm:space-y-5"
                >

                  {/* Name Field (only for signup) */}
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <label className="block text-xs sm:text-sm font-medium text-[#1D2956]/70 mb-1.5 sm:mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#536DFE]/50" />
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border-2 border-[#E2E8F0] rounded-xl sm:rounded-2xl focus:border-[#536DFE] focus:outline-none transition-colors text-[#1D2956] text-sm sm:text-base placeholder-[#1D2956]/40"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Phone Field (only for signup) */}
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <label className="block text-xs sm:text-sm font-medium text-[#1D2956]/70 mb-1.5 sm:mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#536DFE]/50" />
                        <input
                          type="tel"
                          placeholder="+95 9 XXX XXX XXX"
                          value={signUpData.phone}
                          onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border-2 border-[#E2E8F0] rounded-xl sm:rounded-2xl focus:border-[#536DFE] focus:outline-none transition-colors text-[#1D2956] text-sm sm:text-base placeholder-[#1D2956]/40"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: mode === 'signup' ? 0.6 : 0.4 }}
                  >
                    <label className="block text-xs sm:text-sm font-medium text-[#1D2956]/70 mb-1.5 sm:mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#536DFE]/50" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={mode === 'signin' ? signInData.email : signUpData.email}
                        onChange={(e) => {
                          if (mode === 'signin') {
                            setSignInData({ ...signInData, email: e.target.value });
                          } else {
                            setSignUpData({ ...signUpData, email: e.target.value });
                          }
                        }}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border-2 border-[#E2E8F0] rounded-xl sm:rounded-2xl focus:border-[#536DFE] focus:outline-none transition-colors text-[#1D2956] text-sm sm:text-base placeholder-[#1D2956]/40"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: mode === 'signup' ? 0.7 : 0.5 }}
                  >
                    <label className="block text-xs sm:text-sm font-medium text-[#1D2956]/70 mb-1.5 sm:mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#536DFE]/50" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={mode === 'signin' ? signInData.password : signUpData.password}
                        onChange={(e) => {
                          if (mode === 'signin') {
                            setSignInData({ ...signInData, password: e.target.value });
                          } else {
                            setSignUpData({ ...signUpData, password: e.target.value });
                          }
                        }}
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white border-2 border-[#E2E8F0] rounded-xl sm:rounded-2xl focus:border-[#536DFE] focus:outline-none transition-colors text-[#1D2956] text-sm sm:text-base placeholder-[#1D2956]/40"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-[#536DFE]/60 hover:text-[#536DFE] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Confirm Password Field (only for signup) */}
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      <label className="block text-xs sm:text-sm font-medium text-[#1D2956]/70 mb-1.5 sm:mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#536DFE]/50" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white border-2 border-[#E2E8F0] rounded-xl sm:rounded-2xl focus:border-[#536DFE] focus:outline-none transition-colors text-[#1D2956] text-sm sm:text-base placeholder-[#1D2956]/40"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-[#536DFE]/60 hover:text-[#536DFE] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: mode === 'signup' ? 0.9 : 0.6 }}
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02, y: -2, boxShadow: "0 20px 40px rgba(83, 109, 254, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white font-bold text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase shadow-2xl flex items-center justify-center gap-2 relative overflow-hidden"
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
                    <span className="relative z-10">
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        mode === 'signin' ? 'Sign In' : 'Create Account'
                      )}
                    </span>
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Toggle Mode */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 1.0 : 0.7 }}
                className="mt-4 sm:mt-6 text-center"
              >
                <p className="text-[#1D2956]/60 text-xs sm:text-sm">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="ml-2 text-[#536DFE] font-semibold hover:underline transition-colors"
                  >
                    {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </motion.div>
            </div>

            {/* Bottom branding */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col items-center gap-2 pt-4"
            >
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#536DFE] to-transparent rounded-full" />
              <p className="text-[#1D2956]/40 text-[8px] font-semibold tracking-[0.2em] uppercase">
                Powered By
              </p>
              <img
                src="https://mingalarmon.com/assets/logo_light.png"
                alt="Mingalar Mon"
                className="h-8 object-contain opacity-70"
              />
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default Auth;
