"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right";

const directionClass: Record<Direction, string> = {
  up: "animate-fade-in-up",
  down: "animate-fade-in-down",
  left: "animate-fade-in-left",
  right: "animate-fade-in-right",
};

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  direction?: Direction;
  duration?: number;
}

/** Animates each direct child in sequence with a fade + slide entrance. */
export function Stagger({
  children,
  className,
  delay = 0,
  stagger = 0.07,
  direction = "up",
  duration = 0.55,
}: StaggerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const typedChild = child as React.ReactElement<{
          className?: string;
          style?: React.CSSProperties;
        }>;
        const delayMs = (delay + index * stagger) * 1000;
        return React.cloneElement(typedChild, {
          style: {
            animationDelay: `${delayMs}ms`,
            animationDuration: `${duration}s`,
            ...(typedChild.props?.style ?? {}),
          },
          className: cn(directionClass[direction], typedChild.props?.className),
        });
      })}
    </div>
  );
}

/** Mount-time entrance for a single element (not scroll triggered). */
export function MountReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.55,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  duration?: number;
}) {
  return (
    <div
      className={cn(directionClass[direction], className)}
      style={{
        animationDelay: `${delay * 1000}ms`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}

/** Scroll-triggered reveal for below-the-fold content. */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.6,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  duration?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(visible ? directionClass[direction] : "opacity-0", className)}
      style={{
        animationDelay: `${delay * 1000}ms`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}