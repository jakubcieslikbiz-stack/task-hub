import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to animate numbers rolling up (counter effect)
 * e.g., from 0 to 14,500 zł with a silky-smooth ease-out deceleration curve.
 */
export function useAnimatedCounter(
  targetValue: number,
  duration: number = 1000
): number {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const previousTargetRef = useRef<number>(0);

  useEffect(() => {
    const startVal = previousTargetRef.current;
    const endVal = Number(targetValue) || 0;
    const diff = endVal - startVal;

    if (diff === 0) {
      setDisplayValue(endVal);
      return;
    }

    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Snappy start with smooth logarithmic deceleration (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 3.5);
      const current = Math.round(startVal + diff * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
        previousTargetRef.current = endVal;
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [targetValue, duration]);

  return displayValue;
}
