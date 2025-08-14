import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseInactivityTimerOptions {
  timeout?: number; // Timeout in milliseconds
  onTimeout?: () => void;
  onWarning?: (timeLeft: number) => void;
  warningTime?: number; // Show warning this many ms before timeout
}

export function useInactivityTimer({
  timeout = 30 * 60 * 1000, // 30 minutes default
  onTimeout,
  onWarning,
  warningTime = 2 * 60 * 1000, // 2 minutes warning default
}: UseInactivityTimerOptions = {}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setIsWarning(false);
    setTimeLeft(null);

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setIsWarning(true);
      setTimeLeft(warningTime);
      onWarning?.(warningTime);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (!prev || prev <= 1000) {
            // Clear the interval when countdown reaches zero
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, timeout - warningTime);

    // Set final timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      // Invalidate all queries to force re-authentication
      queryClient.clear();
      onTimeout?.();
      setIsWarning(false);
      setTimeLeft(null);
    }, timeout);
  };

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [timeout, warningTime, onTimeout, onWarning, queryClient]);

  const extendSession = () => {
    resetTimer();
  };

  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isWarning,
    timeLeft,
    timeLeftFormatted: timeLeft ? formatTimeLeft(timeLeft) : null,
    extendSession,
    resetTimer,
  };
}