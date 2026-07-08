"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  duration?: number; // ms
}

// Counts from the previous value to the new one with an ease-out curve.
// Respects prefers-reduced-motion by jumping straight to the target.
export function AnimatedNumber({ value, format, duration = 900 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(0); // first render animates up from 0
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(from + (value - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{format(display)}</>;
}
