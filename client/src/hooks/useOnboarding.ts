import { useState, useEffect } from 'react';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding-completed');
    const isFirstVisit = !completed;
    
    setHasCompletedOnboarding(!!completed);
    
    // Show onboarding for first-time users after a short delay
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500); // 1.5 second delay to let the page load
      
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
  };

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding-completed');
    setHasCompletedOnboarding(false);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    hasCompletedOnboarding,
    completeOnboarding,
    startOnboarding,
    resetOnboarding
  };
}