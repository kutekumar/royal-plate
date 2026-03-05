import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import gsap from 'gsap';
import LogoImg from '@/imgs/logo.png';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, user, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get mode from URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Refs for animations
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);

  // Initial entrance animation
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    tl.fromTo(
      logoRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
    )
    .fromTo(
      titleRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(
      formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      '-=0.3'
    )
    .fromTo(
      switchRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 },
      '-=0.2'
    );

    // Floating animation for logo
    gsap.to(logoRef.current, {
      y: -8,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, []);

  // Mode switch animation
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
    }
  }, [mode]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'restaurant_owner') {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    }
  }, [user, userRole, navigate]);

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
      // Smooth exit animation
      const tl = gsap.timeline({
        onComplete: () => navigate('/home')
      });
      tl.to([logoRef.current, titleRef.current, formRef.current, switchRef.current], {
        opacity: 0,
        y: -30,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.in'
      });
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
      // Smooth exit animation - navigation handled by useEffect
      gsap.to([logoRef.current, titleRef.current, formRef.current, switchRef.current], {
        opacity: 0,
        y: -30,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.in'
      });
    }
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoading) {
      gsap.to(e.currentTarget, {
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleButtonPress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoading) {
      gsap.to(e.currentTarget, {
        scale: 0.96,
        duration: 0.1,
        ease: 'power2.out'
      });
    }
  };

  const handleModeSwitch = (newMode: 'signin' | 'signup') => {
    if (switchRef.current) {
      gsap.to(switchRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.out',
        onComplete: () => {
          setMode(newMode);
          gsap.to(switchRef.current, {
            scale: 1,
            duration: 0.2,
            ease: 'back.out(2)'
          });
        }
      });
    }
  };

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#F5F5F7] font-poppins">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 z-10">
        {/* Logo */}
        <div className="flex flex-col items-center pt-10 pb-6">
          <div ref={logoRef} className="flex justify-center mb-5">
            <img src={LogoImg} alt="Royal Plate Logo" className="h-24 object-contain drop-shadow-lg" />
          </div>
          <div className="h-[1px] w-16 bg-[#536DFE] mx-auto mb-3 opacity-60"></div>
          <h2 ref={titleRef} className="text-[#1D2956] text-xl font-bold tracking-[0.15em] uppercase">
            {mode === 'signin' ? 'Welcome Back' : 'Join Us'}
          </h2>
        </div>

        {/* Form */}
        {mode === 'signin' ? (
          <form ref={formRef} onSubmit={handleSignIn} className="space-y-5 pb-8">
            <div className="space-y-2">
              <label htmlFor="signin-email" className="text-[#1D2956]/80 text-sm font-semibold tracking-wider uppercase">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                required
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[#1D2956] placeholder-gray-400 focus:outline-none focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/20 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signin-password" className="text-[#1D2956]/80 text-sm font-semibold tracking-wider uppercase">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                required
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[#1D2956] placeholder-gray-400 focus:outline-none focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/20 transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onMouseDown={handleButtonPress}
              className="w-full h-14 px-5 bg-[#536DFE] text-white text-lg font-bold leading-normal tracking-wider rounded-xl shadow-[0_8px_30px_rgba(83,109,254,0.35)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center pt-4">
              <button
                ref={switchRef}
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="text-[#536DFE]/70 text-sm font-semibold tracking-wider hover:text-[#536DFE] transition-colors uppercase"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form ref={formRef} onSubmit={handleSignUp} className="space-y-5 pb-8">
            <div className="space-y-2">
              <label htmlFor="signup-name" className="text-[#1D2956]/80 text-sm font-semibold tracking-wider uppercase">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={signUpData.fullName}
                onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                required
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[#1D2956] placeholder-gray-400 focus:outline-none focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/20 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-phone" className="text-[#1D2956]/80 text-sm font-semibold tracking-wider uppercase">
                Phone Number
              </label>
              <input
                id="signup-phone"
                type="tel"
                placeholder="+95 9 XXX XXX XXX"
                value={signUpData.phone}
                onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                required
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[#1D2956] placeholder-gray-400 focus:outline-none focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/20 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-[#1D2956]/80 text-sm font-semibold tracking-wider uppercase">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                required
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[#1D2956] placeholder-gray-400 focus:outline-none focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/20 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-[#1D2956]/80 text-sm font-semibold tracking-wider uppercase">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a strong password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                required
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[#1D2956] placeholder-gray-400 focus:outline-none focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/20 transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onMouseDown={handleButtonPress}
              className="w-full h-14 px-5 bg-[#536DFE] text-white text-lg font-bold leading-normal tracking-wider rounded-xl shadow-[0_8px_30px_rgba(83,109,254,0.35)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center pt-4">
              <button
                ref={switchRef}
                type="button"
                onClick={() => handleModeSwitch('signin')}
                className="text-[#536DFE]/70 text-sm font-semibold tracking-wider hover:text-[#536DFE] transition-colors uppercase"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom Bar Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1 bg-[#536DFE]/20 rounded-full z-10"></div>
    </div>
  );
};

export default Auth;
