import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import ALANLogo from '@/imgs/ALANLOGO.png';
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
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Top Logo in luxury circle */}
          <div className="flex justify-center" ref={headerRef}>
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full luxury-gradient flex items-center justify-center luxury-shadow overflow-hidden">
              <img src={ALANLogo} alt="ALAN Logo" className="w-16 h-16 object-contain drop-shadow" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4" ref={contentRef}>
            <h1 className="text-3xl font-bold text-foreground">{step.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Step image placed between text and buttons */}
          <div className="flex justify-center" ref={stepImageRef}>
            <div className="w-full flex items-center justify-center">
              <img
                src={step.image}
                alt="Onboarding illustration"
                className="max-h-56 sm:max-h-64 object-contain"
              />
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="p-6 space-y-3 max-w-md mx-auto w-full">
        <Button
          onClick={handleNext}
          className="w-full h-12 text-base font-medium luxury-gradient"
          size="lg"
        >
          {currentStep < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
        
        {currentStep < onboardingSteps.length - 1 && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full h-12 text-base font-medium"
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
