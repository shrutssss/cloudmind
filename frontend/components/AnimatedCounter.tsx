"use client";

import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  className?: string;
};

export default function AnimatedCounter({
  value,
  duration = 900,
  formatValue = (currentValue) => currentValue.toLocaleString(),
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min(1, (timestamp - startTime) / duration);
      setDisplayValue(value * progress);

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return <span className={className}>{formatValue(displayValue)}</span>;
}