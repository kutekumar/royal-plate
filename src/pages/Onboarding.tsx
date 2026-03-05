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
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-white font-poppins">

      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#536DFE] to-transparent z-20" />

      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F0F3FF] via-white to-[#F8F9FF] pointer-events-none" />

      {/* Full layout — three zones distributed across full screen height */}
      <div className="flex flex-col items-center w-full h-full px-8 pt-16 pb-8 z-10 justify-between">

        {/* ZONE 1 — Top: Logo + Tagline */}
        <div className="flex flex-col items-center">
          {/* Logo - animated floating */}
          <div ref={logoRef} className="mb-5 flex items-center justify-center">
            <img src={LogoImg} alt="Royal Plate Logo" className="h-36 object-contain drop-shadow-2xl" />
          </div>

          {/* Tagline */}
          <div ref={textRef} className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#536DFE]/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#536DFE]/60" />
              <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#536DFE]/50" />
            </div>
            <p className="text-[#1D2956]/50 text-[10px] font-medium tracking-[0.35em] leading-normal uppercase">
              Reserve Your Regal Dining Experience
            </p>
          </div>
        </div>

        {/* ZONE 2 — Middle: Image + Buttons */}
        <div className="w-full flex flex-col gap-5">
          {/* Image card */}
          <div ref={imageRef} className="w-full overflow-hidden rounded-3xl shadow-2xl relative">
            <div className="w-full h-44 relative">
              <img
                src={OnIcon1}
                alt="Dining Experience"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(29,41,86,0.65) 0%, rgba(29,41,86,0.25) 55%, rgba(29,41,86,0.05) 100%)'
                }}
              />
              <div className="absolute bottom-4 left-5">
                <p className="text-white/90 text-xs font-semibold tracking-[0.2em] uppercase">Fine Dining · Curated</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div ref={buttonsRef} className="w-full flex flex-col gap-3">
            <button
              onClick={handleGetStarted}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onMouseDown={handleButtonPress}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-14 px-5 bg-[#536DFE] text-white text-sm font-bold leading-normal tracking-[0.2em] shadow-[0_8px_32px_rgba(83,109,254,0.4)] transition-all"
            >
              <span className="truncate uppercase">Get Started</span>
            </button>
            <button
              onClick={handleSignIn}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onMouseDown={handleButtonPress}
              className="flex w-full cursor-pointer items-center justify-center rounded-2xl h-14 px-5 border border-[#536DFE]/30 text-[#536DFE] text-sm font-semibold tracking-[0.15em] bg-white/80 backdrop-blur-sm transition-all uppercase"
            >
              <span className="truncate">Sign In</span>
            </button>
          </div>
        </div>

        {/* ZONE 3 — Bottom: Powered By */}
        <div ref={footerRef} className="flex flex-col items-center gap-2">
          <p className="text-[#1D2956]/30 text-[9px] font-semibold tracking-[0.35em] uppercase">
            Powered By
          </p>
          <img
            src="https://mingalarmon.com/assets/logo_light.png"
            alt="Mingalar Mon"
            className="h-12 object-contain opacity-70"
          />
        </div>

      </div>

      {/* Bottom home indicator bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#1D2956]/10 rounded-full" />
    </div>
  );
};

export default Onboarding;
