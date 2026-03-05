import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import LogoImg from '@/imgs/logo.png';
import OnIcon1 from '@/imgs/icons/onbarding1.png';

const Onboarding = () => {
  const navigate = useNavigate();
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    // Staggered entrance animations
    tl.fromTo(
      logoRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
    )
    .fromTo(
      textRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(
      imageRef.current,
      { y: 40, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6 },
      '-=0.2'
    )
    .fromTo(
      buttonsRef.current?.children || [],
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
      '-=0.3'
    )
    .fromTo(
      footerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 },
      '-=0.2'
    );

    // Floating animation for logo
    gsap.to(logoRef.current, {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, []);

  const handleGetStarted = () => {
    const tl = gsap.timeline({
      onComplete: () => navigate('/auth?mode=signup')
    });
    
    tl.to([logoRef.current, textRef.current, imageRef.current, buttonsRef.current, footerRef.current], {
      opacity: 0,
      y: -30,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.in'
    });
  };

  const handleSignIn = () => {
    const tl = gsap.timeline({
      onComplete: () => navigate('/auth?mode=signin')
    });
    
    tl.to([logoRef.current, textRef.current, imageRef.current, buttonsRef.current, footerRef.current], {
      opacity: 0,
      y: -30,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.in'
    });
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.02,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleButtonPress = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      scale: 0.96,
      duration: 0.1,
      ease: 'power2.out'
    });
  };

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-[#F5F5F7] font-poppins">
      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 z-10">
        {/* Logo - animated floating */}
        <div ref={logoRef} className="mb-8 flex items-center justify-center">
          <img src={LogoImg} alt="Royal Plate Logo" className="h-32 object-contain drop-shadow-xl" />
        </div>

        {/* Text */}
        <div ref={textRef} className="text-center mb-8">
          <div className="h-[1px] w-16 bg-[#536DFE] mx-auto mb-4 opacity-60"></div>
          <p className="text-[#1D2956]/70 text-xs font-light tracking-[0.3em] leading-normal uppercase">
            Reserve Your Regal Dining Experience
          </p>
        </div>
      </div>

      {/* Image Section */}
      <div className="px-8 pb-16 z-10">
        <div ref={imageRef} className="mb-10 overflow-hidden rounded-2xl border border-gray-200 shadow-xl relative">
          <div className="w-full h-36 relative">
            {/* Background Image */}
            <img 
              src={OnIcon1} 
              alt="Dining Experience" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(29,41,86,0.6) 0%, rgba(29,41,86,0.2) 50%, rgba(29,41,86,0.05) 100%)'
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div ref={buttonsRef} className="flex flex-col gap-4">
          <button 
            onClick={handleGetStarted}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            onMouseDown={handleButtonPress}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-[#536DFE] text-white text-lg font-bold leading-normal tracking-wider shadow-[0_8px_30px_rgba(83,109,254,0.35)] transition-all"
          >
            <span className="truncate uppercase">Get Started</span>
          </button>
          <button 
            onClick={handleSignIn}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            onMouseDown={handleButtonPress}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl h-14 px-5 border-2 border-[#536DFE]/40 text-[#536DFE] text-sm font-semibold tracking-[0.15em] bg-white transition-all uppercase shadow-sm"
          >
            <span className="truncate">Sign In</span>
          </button>
        </div>

        {/* Footer Text */}
        <div ref={footerRef} className="mt-8 text-center">
          <p className="text-[#1D2956]/40 text-[10px] font-semibold tracking-[0.25em] uppercase">
            By Invitation Only
          </p>
        </div>
      </div>

      {/* Bottom Bar Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1 bg-[#536DFE]/20 rounded-full"></div>
    </div>
  );
};

export default Onboarding;
