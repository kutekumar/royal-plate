import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import RPLogo from '@/imgs/RPLogo.png';
import OnIcon1 from '@/imgs/icons/onbarding1.png';
import OnIcon2 from '@/imgs/icons/onbarding2.png';
import OnIcon3 from '@/imgs/icons/onbarding3.png';
import { useNavigate } from 'react-router-dom';

const onboardingSteps = [
  {
    title: 'Discover Premium Dining',
    description: 'Browse the finest restaurants in Yangon with detailed menus and exclusive offerings',
    image: OnIcon1,
  },
  {
    title: 'Prepay with Ease',
    description: 'Secure your table and meals in advance with convenient payment options',
    image: OnIcon2,
  },
  {
    title: 'Skip the Wait',
    description: 'Show your QR code and enjoy your meal immediately upon arrival',
    image: OnIcon3,
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stepImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline();
    // Animate elements in on first mount and on step change
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: 10, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' },
    )
      .fromTo(
        contentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
        '-=0.15',
      )
      .fromTo(
        stepImageRef.current,
        { opacity: 0, y: 16, rotate: -2 },
        { opacity: 1, y: 0, rotate: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.2',
      );

    return () => {
      tl.kill();
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/auth');
    }
  };

  const handleSkip = () => {
    navigate('/auth');
  };

  const step = onboardingSteps[currentStep];

  return (
    <div ref={containerRef} className="h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10 min-h-0">
        <div className="w-full max-w-md space-y-6">
          {/* Top Logo with elegant presentation */}
          <div className="flex justify-center" ref={headerRef}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-card/80 backdrop-blur-sm p-5 rounded-2xl border border-primary/30 luxury-shadow">
                <img src={RPLogo} alt="Royal Plate Logo" className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3" ref={contentRef}>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {step.title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              {step.description}
            </p>
          </div>

          {/* Step image placed between text and buttons */}
          <div className="flex justify-center" ref={stepImageRef}>
            <div className="w-full flex items-center justify-center">
              <img
                src={step.image}
                alt="Onboarding illustration"
                className="max-h-40 sm:max-h-48 object-contain opacity-90"
              />
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2 pt-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary shadow-lg shadow-primary/50'
                    : 'w-1.5 bg-muted/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer buttons - Fixed at bottom with proper height */}
      <div className="p-6 pb-8 space-y-3 max-w-md mx-auto w-full relative z-10">
        <Button
          onClick={handleNext}
          className="w-full h-14 text-base font-semibold luxury-gradient hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 tracking-wide"
          size="lg"
        >
          {currentStep < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
        
        {currentStep < onboardingSteps.length - 1 && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full h-12 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-card/50"
            size="lg"
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
