"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextScatterProps {
  text: string;
  className?: string;
  velocity?: number; // Scatter distance in px
  rotation?: number; // Max rotation in degrees
  scale?: number; // Letter scale during scatter
  duration?: number; // Transition duration in seconds
  returnAfter?: number; // Delay in ms before returning
  scatterRadius?: number; // Radius around cursor that triggers scatter (px)
  as?: "span" | "div" | "h1" | "h2" | "h3" | "p";
}

interface LetterState {
  char: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  isScattered: boolean;
}

export function TextScatter({
  text,
  className,
  velocity = 60,
  rotation = 35,
  scale = 1.2,
  duration = 0.5,
  returnAfter = 650,
  as: Component = "span",
}: TextScatterProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const letterRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const timeoutsRef = React.useRef<(NodeJS.Timeout | null)[]>([]);

  const chars = React.useMemo(() => text.split(""), [text]);

  const [letterStates, setLetterStates] = React.useState<LetterState[]>(() =>
    chars.map((char) => ({
      char,
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      isScattered: false,
    }))
  );

  // Clear pending return timers on unmount
  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => {
        if (t) clearTimeout(t);
      });
    };
  }, []);

  const triggerScatter = React.useCallback(
    (index: number, mouseX?: number, mouseY?: number) => {
      const letterEl = letterRefs.current[index];
      let moveX = 0;
      let moveY = 0;

      if (letterEl && mouseX !== undefined && mouseY !== undefined) {
        const rect = letterEl.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2;
        const letterCenterY = rect.top + rect.height / 2;
        const dirX = letterCenterX - mouseX;
        const dirY = letterCenterY - mouseY;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY) || 1;

        // Push away from cursor
        const force = (Math.random() * 0.5 + 0.8) * velocity;
        moveX = (dirX / dist) * force;
        moveY = (dirY / dist) * force;
      } else {
        // Random organic radial explosion
        const angle = Math.random() * Math.PI * 2;
        const r = (Math.random() * 0.6 + 0.6) * velocity;
        moveX = Math.cos(angle) * r;
        moveY = Math.sin(angle) * r;
      }

      const rot = (Math.random() * 2 - 1) * rotation;
      const s = scale;

      setLetterStates((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          x: moveX,
          y: moveY,
          rotate: rot,
          scale: s,
          isScattered: true,
        };
        return updated;
      });

      // Clear existing return timeout for this letter
      if (timeoutsRef.current[index]) {
        clearTimeout(timeoutsRef.current[index]!);
      }

      // Schedule spring-back return
      timeoutsRef.current[index] = setTimeout(() => {
        setLetterStates((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            isScattered: false,
          };
          return updated;
        });
      }, returnAfter);
    },
    [velocity, rotation, scale, returnAfter]
  );

  // Scatter all on container hover
  const handlePointerMove = (e: React.PointerEvent) => {
    letterRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Trigger if cursor is within active radius
      if (dist < 80 && !letterStates[i]?.isScattered) {
        triggerScatter(i, e.clientX, e.clientY);
      }
    });
  };

  return (
    <Component
      ref={containerRef as any}
      onPointerMove={handlePointerMove}
      className={cn(
        "inline-flex flex-wrap items-center cursor-default select-none",
        className
      )}
      aria-label={text}
    >
      {chars.map((char, index) => {
        const st = letterStates[index];
        const isSpace = char === " ";

        if (isSpace) {
          return (
            <span
              key={`space-${index}`}
              className="inline-block"
              style={{ width: "0.28em" }}
              aria-hidden="true"
            >
              &nbsp;
            </span>
          );
        }

        return (
          <span
            key={`char-${index}-${char}`}
            ref={(el) => {
              letterRefs.current[index] = el;
            }}
            onMouseEnter={(e) => triggerScatter(index, e.clientX, e.clientY)}
            className="inline-block will-change-transform transform-gpu"
            style={{
              transform: st?.isScattered
                ? `translate3d(${st.x}px, ${st.y}px, 0) rotate(${st.rotate}deg) scale(${st.scale})`
                : "translate3d(0, 0, 0) rotate(0deg) scale(1)",
              transition: st?.isScattered
                ? `transform ${duration * 0.6}s cubic-bezier(0.2, 0.9, 0.3, 1)`
                : `transform ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
            }}
            aria-hidden="true"
          >
            {char}
          </span>
        );
      })}
    </Component>
  );
}
