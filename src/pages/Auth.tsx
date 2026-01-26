import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import gsap from 'gsap';
import CrownIcon from '@/imgs/crown.png';
import RPLogo from '@/imgs/logo.png';

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
  const crownRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);

  // Initial entrance animation
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    tl.fromTo(
      crownRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
    )
    .fromTo(
      logoRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      '-=0.4'
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

    // Floating animation for crown
    gsap.to(crownRef.current, {
      y: -8,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Subtle glow pulse
    gsap.to(crownRef.current, {
      boxShadow: '0 0 60px rgba(202,161,87,0.25)',
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
      tl.to([crownRef.current, logoRef.current, titleRef.current, formRef.current, switchRef.current], {
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
      gsap.to([crownRef.current, logoRef.current, titleRef.current, formRef.current, switchRef.current], {
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
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#1d2956] font-poppins">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 z-10">
        {/* Crown Icon and Logo */}
        <div className="flex flex-col items-center pt-12 pb-6">
          <div 
            ref={crownRef}
            className="mb-6 flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#caa157]/40 bg-[#1d2956] shadow-[0_0_50px_rgba(202,161,87,0.15)]"
          >
            <img src={CrownIcon} alt="Crown" className="w-10 h-10 object-contain" />
          </div>
          <div ref={logoRef} className="flex justify-center mb-4">
            <img src={RPLogo} alt="Royal Plate Logo" className="h-10 object-contain" />
          </div>
          <div className="h-[1px] w-16 bg-[#caa157] mx-auto mb-3 opacity-60"></div>
          <h2 ref={titleRef} className="text-[#caa157] text-xl font-bold tracking-[0.15em] uppercase">
            {mode === 'signin' ? 'Welcome Back' : 'Join Us'}
          </h2>
        </div>

        {/* Form */}
        {mode === 'signin' ? (
          <form ref={formRef} onSubmit={handleSignIn} className="space-y-5 pb-8">
            <div className="space-y-2">
              <label htmlFor="signin-email" className="text-[#caa157]/90 text-sm font-semibold tracking-wider uppercase">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                required
                className="w-full h-12 px-4 bg-[#1d2956] border border-[#caa157]/30 rounded-lg text-[#caa157] placeholder-[#caa157]/40 focus:outline-none focus:border-[#caa157] focus:ring-1 focus:ring-[#caa157]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signin-password" className="text-[#caa157]/90 text-sm font-semibold tracking-wider uppercase">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                required
                className="w-full h-12 px-4 bg-[#1d2956] border border-[#caa157]/30 rounded-lg text-[#caa157] placeholder-[#caa157]/40 focus:outline-none focus:border-[#caa157] focus:ring-1 focus:ring-[#caa157]/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onMouseDown={handleButtonPress}
              className="w-full h-14 px-5 bg-[#caa157] text-[#1d2956] text-lg font-bold leading-normal tracking-wider rounded-lg shadow-[0_8px_30px_rgba(202,161,87,0.3)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#1d2956]/30 border-t-[#1d2956] rounded-full animate-spin"></div>
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
                className="text-[#caa157]/70 text-sm font-semibold tracking-wider hover:text-[#caa157] transition-colors uppercase"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form ref={formRef} onSubmit={handleSignUp} className="space-y-5 pb-8">
            <div className="space-y-2">
              <label htmlFor="signup-name" className="text-[#caa157]/90 text-sm font-semibold tracking-wider uppercase">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={signUpData.fullName}
                onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                required
                className="w-full h-12 px-4 bg-[#1d2956] border border-[#caa157]/30 rounded-lg text-[#caa157] placeholder-[#caa157]/40 focus:outline-none focus:border-[#caa157] focus:ring-1 focus:ring-[#caa157]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-phone" className="text-[#caa157]/90 text-sm font-semibold tracking-wider uppercase">
                Phone Number
              </label>
              <input
                id="signup-phone"
                type="tel"
                placeholder="+95 9 XXX XXX XXX"
                value={signUpData.phone}
                onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                required
                className="w-full h-12 px-4 bg-[#1d2956] border border-[#caa157]/30 rounded-lg text-[#caa157] placeholder-[#caa157]/40 focus:outline-none focus:border-[#caa157] focus:ring-1 focus:ring-[#caa157]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-[#caa157]/90 text-sm font-semibold tracking-wider uppercase">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                required
                className="w-full h-12 px-4 bg-[#1d2956] border border-[#caa157]/30 rounded-lg text-[#caa157] placeholder-[#caa157]/40 focus:outline-none focus:border-[#caa157] focus:ring-1 focus:ring-[#caa157]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-[#caa157]/90 text-sm font-semibold tracking-wider uppercase">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a strong password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                required
                className="w-full h-12 px-4 bg-[#1d2956] border border-[#caa157]/30 rounded-lg text-[#caa157] placeholder-[#caa157]/40 focus:outline-none focus:border-[#caa157] focus:ring-1 focus:ring-[#caa157]/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onMouseDown={handleButtonPress}
              className="w-full h-14 px-5 bg-[#caa157] text-[#1d2956] text-lg font-bold leading-normal tracking-wider rounded-lg shadow-[0_8px_30px_rgba(202,161,87,0.3)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#1d2956]/30 border-t-[#1d2956] rounded-full animate-spin"></div>
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
                className="text-[#caa157]/70 text-sm font-semibold tracking-wider hover:text-[#caa157] transition-colors uppercase"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom Bar Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1 bg-[#caa157]/20 rounded-full z-10"></div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]"></div>
    </div>
  );
};

export default Auth;
