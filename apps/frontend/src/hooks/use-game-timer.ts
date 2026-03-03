import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/game';

export function useGameTimer() {
  const { timerSeconds, decrementTimer, currentQuestionId } = useGameStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentQuestionId || timerSeconds <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentQuestionId, timerSeconds, decrementTimer]);

  return timerSeconds;
}
