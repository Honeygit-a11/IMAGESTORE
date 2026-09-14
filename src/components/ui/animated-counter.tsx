"use client";

import * as React from "react";
import gsap from "gsap";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/** Animates a number from 0 to its target value on mount using gsap. */
export function AnimatedCounter({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    const proxy = { current: 0 };
    if (!el) return;

    if (value === 0) {
      el.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;
      return;
    }

    const tween = gsap.to(proxy, {
      current: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        // Round for large numbers to avoid jumping decimals
        const pretty =
          value >= 1000
            ? Math.round(proxy.current).toLocaleString()
            : proxy.current.toFixed(decimals);
        el.textContent = `${prefix}${pretty}${suffix}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, duration, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}