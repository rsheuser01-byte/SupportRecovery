import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, Star, Heart, Zap } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  character: 'guide' | 'expert' | 'helper';
  characterMessage: string;
}

const characters = {
  guide: {
    emoji: '🧑‍⚕️',
    name: 'Dr. Guide',
    personality: 'friendly and encouraging'
  },
  expert: {
    emoji: '👩‍💼',
    name: 'Sarah Expert',
    personality: 'professional and knowledgeable'
  },
  helper: {
    emoji: '🤖',
    name: 'Helper Bot',
    personality: 'cheerful and supportive'
  }
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Support Recovery LLC! 🎉',
    content: 'Hi there! I\'m Dr. Guide, and I\'m excited to show you around our healthcare management platform. Let\'s take a quick tour together!',
    targetSelector: '.gradient-header',
    position: 'bottom',
    character: 'guide',
    characterMessage: 'Ready to explore? This platform will help you manage everything efficiently!'
  },
  {
    id: 'navigation',
    title: 'Navigation Made Easy 🧭',
    content: 'These sidebar buttons are your command center! Click on Revenue Entry to track income, Payouts to manage staff payments, and more.',
    targetSelector: 'nav .space-y-1',
    position: 'right',
    character: 'expert',
    characterMessage: 'Pro tip: Each section has powerful filtering and reporting features!'
  },
  {
    id: 'dashboard',
    title: 'Your Financial Overview 📊',
    content: 'This is your dashboard - your financial command center! See total revenue, expenses, and key metrics at a glance.',
    targetSelector: '.grid.grid-cols-1.md\\:grid-cols-2',
    position: 'top',
    character: 'helper',
    characterMessage: 'I love how these cards give you instant insights into your business health!'
  },
  {
    id: 'calendar',
    title: 'Interactive Calendar 📅',
    content: 'Click on any date to see detailed revenue entries! The green dollar signs show days with recorded revenue.',
    targetSelector: '.mb-8.animate-slide-up',
    position: 'bottom',
    character: 'guide',
    characterMessage: 'The calendar makes it super easy to track daily performance!'
  },
  {
    id: 'filters',
    title: 'Smart Filtering ⚡',
    content: 'Use this dropdown to filter your data by time periods. Choose "This Month", "Last Month", or even "Last Check" for specific insights.',
    targetSelector: 'header .flex.items-center.space-x-3',
    position: 'left',
    character: 'expert',
    characterMessage: 'Filtering is key to getting the exact data you need for decision-making!'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🌟',
    content: 'Congratulations! You\'ve completed the tour. Start by adding your first revenue entry or exploring the different sections. Happy managing!',
    targetSelector: '.gradient-header',
    position: 'bottom',
    character: 'guide',
    characterMessage: 'You\'re going to do amazing things with this platform. I believe in you!'
  }
];

interface OnboardingWalkthroughProps {
  onComplete?: () => void;
}

export function OnboardingWalkthrough({ onComplete }: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentStepData = onboardingSteps[currentStep];
  const character = characters[currentStepData.character];

  useEffect(() => {
    const updateTooltipPosition = () => {
      const targetElement = document.querySelector(currentStepData.targetSelector);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        const tooltipWidth = 320; // w-80 = 20rem = 320px
        const tooltipHeight = 300; // Reduced estimated height
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 20;
        
        let top = rect.top + scrollTop;
        let left = rect.left + scrollLeft;
        let position = currentStepData.position;

        // Calculate initial position
        switch (position) {
          case 'top':
            top = rect.top + scrollTop - tooltipHeight - margin;
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + scrollTop + margin;
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.left + scrollLeft - tooltipWidth - margin;
            break;
          case 'right':
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + scrollLeft + margin;
            break;
        }

        // Check bounds and adjust if necessary
        const rightEdge = left + tooltipWidth;
        const bottomEdge = top + tooltipHeight;

        // Horizontal bounds checking
        if (left < margin) {
          left = margin;
        } else if (rightEdge > viewportWidth - margin) {
          left = viewportWidth - tooltipWidth - margin;
        }

        // Vertical bounds checking  
        if (top < scrollTop + margin) {
          // If tooltip would be above viewport, position it below target
          if (position === 'top') {
            top = rect.bottom + scrollTop + margin;
          } else {
            top = scrollTop + margin;
          }
        } else if (bottomEdge > scrollTop + viewportHeight - margin) {
          // If tooltip would be below viewport, position it above target
          if (position === 'bottom') {
            top = rect.top + scrollTop - tooltipHeight - margin;
          } else {
            top = scrollTop + viewportHeight - tooltipHeight - margin;
          }
        }

        // Final safety check - if still out of bounds, center in viewport
        if (left < margin || left + tooltipWidth > viewportWidth - margin) {
          left = Math.max(margin, (viewportWidth - tooltipWidth) / 2);
        }
        
        if (top < scrollTop + margin || top + tooltipHeight > scrollTop + viewportHeight - margin) {
          top = Math.max(scrollTop + margin, scrollTop + (viewportHeight - tooltipHeight) / 2);
        }

        setTooltipPosition({ top, left });

        // Scroll element into view
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Add delay to ensure DOM is ready
    const timer = setTimeout(updateTooltipPosition, 200);
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition);
    };
  }, [currentStep, currentStepData]);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };

  const skipTour = () => {
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Spotlight effect for target element */}
      <style>{`
        ${currentStepData.targetSelector} {
          position: relative;
          z-index: 41;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          border-radius: 8px;
        }
      `}</style>

      {/* Tooltip */}
      <div
        className="fixed z-50 animate-bounce-in"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        <Card className="w-80 bg-white shadow-2xl border-2 border-blue-200">
          <CardContent className="p-0">
            {/* Character Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{character.emoji}</div>
                <div>
                  <h3 className="font-bold text-lg">{character.name}</h3>
                  <p className="text-blue-100 text-sm opacity-90">Your {character.personality} guide</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="ml-auto text-white hover:bg-white/20 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h4 className="font-bold text-lg mb-3 text-gray-800">{currentStepData.title}</h4>
              <p className="text-gray-600 mb-4 leading-relaxed">{currentStepData.content}</p>
              
              {/* Character Message */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-4 border-l-4 border-blue-400">
                <p className="text-sm text-gray-700 italic">"{currentStepData.characterMessage}"</p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-1">
                  {onboardingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {currentStep + 1} of {onboardingSteps.length}
                </span>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center space-x-2"
                >
                  <span>{currentStep === onboardingSteps.length - 1 ? 'Finish' : 'Next'}</span>
                  {currentStep === onboardingSteps.length - 1 ? (
                    <Star className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}