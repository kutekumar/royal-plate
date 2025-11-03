import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, CreditCard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const onboardingSteps = [
  {
    icon: Sparkles,
    title: 'Discover Premium Dining',
    description: 'Browse the finest restaurants in Yangon with detailed menus and exclusive offerings'
  },
  {
    icon: CreditCard,
    title: 'Prepay with Ease',
    description: 'Secure your table and meals in advance with convenient payment options'
  },
  {
    icon: Clock,
    title: 'Skip the Wait',
    description: 'Show your QR code and enjoy your meal immediately upon arrival'
  }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

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
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full luxury-gradient flex items-center justify-center luxury-shadow">
              <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">{step.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {step.description}
            </p>
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
