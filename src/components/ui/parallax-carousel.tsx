"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselImageItem {
  url: string;
  title?: string;
  tag?: string;
  size?: string;
  author?: string;
}

export interface ParallaxCarouselProps {
  images: (string | CarouselImageItem)[];
  imageWidth?: number;
  imageHeight?: number;
  gap?: number;
  parallaxIntensity?: number;
  uvScale?: number;
  lerp?: number;
  wheelSensitivity?: number;
  dragSensitivity?: number;
  loop?: boolean;
  borderRadius?: number;
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
  showProgress?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface ParallaxCarouselRef {
  scrollToIndex: (index: number) => void;
  reset: () => void;
  next: () => void;
  prev: () => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const ParallaxCarousel = React.forwardRef<
  ParallaxCarouselRef,
  ParallaxCarouselProps
>(
  (
    {
      images,
      imageWidth = 250,
      imageHeight = 330,
      gap = 14,
      parallaxIntensity = 0.0,
      uvScale = 0.71,
      lerp = 0.05,
      wheelSensitivity = 0.8,
      dragSensitivity = 0.8,
      loop = true,
      borderRadius = 16,
      autoplaySpeed = 155,
      pauseOnHover = true,
      showProgress = false,
      className,
      style,
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const imgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
    const progressRef = React.useRef<HTMLDivElement>(null);

    const isHovered = React.useRef(false);
    const isDragging = React.useRef(false);
    const startX = React.useRef(0);
    const lastTimestamp = React.useRef<number | null>(null);
    const rafId = React.useRef<number | null>(null);
    const initializedRef = React.useRef(false);

    // Normalize incoming items
    const normalizedItems: CarouselImageItem[] = React.useMemo(() => {
      return images.map((item) => {
        if (typeof item === "string") {
          return { url: item };
        }
        return item;
      });
    }, [images]);

    const step = imageWidth + gap;
    const singleSetWidth = normalizedItems.length * step;

    // For infinite seamless looping: clone sets so the conveyor belt flows forever with 0px visual jump
    const displayItems: CarouselImageItem[] = React.useMemo(() => {
      if (!loop || normalizedItems.length === 0) return normalizedItems;
      // 3 identical sets: Set 0 (left buffer), Set 1 (active center), Set 2 (right buffer)
      return [...normalizedItems, ...normalizedItems, ...normalizedItems];
    }, [normalizedItems, loop]);

    const scrollState = React.useRef({
      current: loop && singleSetWidth > 0 ? singleSetWidth : 0,
      target: loop && singleSetWidth > 0 ? singleSetWidth : 0,
      limit: 0,
    });

    const config = React.useRef({
      lerp,
      wheelSensitivity,
      dragSensitivity,
      autoplaySpeed,
      loop,
      pauseOnHover,
      imageWidth,
      gap,
      step,
      singleSetWidth,
      count: normalizedItems.length,
      parallaxIntensity,
      uvScale,
    });

    React.useEffect(() => {
      config.current = {
        lerp,
        wheelSensitivity,
        dragSensitivity,
        autoplaySpeed,
        loop,
        pauseOnHover,
        imageWidth,
        gap,
        step,
        singleSetWidth,
        count: normalizedItems.length,
        parallaxIntensity,
        uvScale,
      };
    }, [
      lerp,
      wheelSensitivity,
      dragSensitivity,
      autoplaySpeed,
      loop,
      pauseOnHover,
      imageWidth,
      gap,
      step,
      singleSetWidth,
      normalizedItems.length,
      parallaxIntensity,
      uvScale,
    ]);

    // Recalculate limit for non-loop mode
    const updateLimit = React.useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const totalWidth = normalizedItems.length * (imageWidth + gap) - gap;
      const viewWidth = container.clientWidth;
      scrollState.current.limit = loop ? Infinity : Math.max(0, totalWidth - viewWidth);
    }, [normalizedItems.length, imageWidth, gap, loop]);

    React.useEffect(() => {
      updateLimit();
      const container = containerRef.current;
      if (!container || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(updateLimit);
      ro.observe(container);
      return () => ro.disconnect();
    }, [updateLimit]);

    // Animation & Infinite Loop
    React.useEffect(() => {
      const animate = (timestamp: number) => {
        const state = scrollState.current;
        const cfg = config.current;
        const last = lastTimestamp.current ?? timestamp;
        const dt = Math.max(0, (timestamp - last) / 1000);
        lastTimestamp.current = timestamp;

        // Initialize to Set 1 once singleSetWidth is ready
        if (cfg.loop && cfg.singleSetWidth > 0 && !initializedRef.current) {
          state.current = cfg.singleSetWidth;
          state.target = cfg.singleSetWidth;
          initializedRef.current = true;
        }

        // Autoplay drift forward
        if (
          cfg.autoplaySpeed > 0 &&
          !isDragging.current &&
          !(cfg.pauseOnHover && isHovered.current)
        ) {
          state.target += cfg.autoplaySpeed * dt;
        }

        // Clamp non-loop targets
        if (!cfg.loop) {
          state.target = clamp(state.target, 0, state.limit);
        }

        // Smooth Lerp
        const lerpFactor = clamp(cfg.lerp, 0.01, 1);
        state.current += (state.target - state.current) * lerpFactor;

        // SEAMLESS INFINITE LOOP:
        // When state.current moves past Set 2 (2 * singleSetWidth), shift BOTH current and target back by 1 set.
        // Because Set 1 and Set 2 contain identical items, this shift causes ZERO pixel change and ZERO lerp reversal!
        if (cfg.loop && cfg.singleSetWidth > 0) {
          while (state.current >= 2 * cfg.singleSetWidth) {
            state.current -= cfg.singleSetWidth;
            state.target -= cfg.singleSetWidth;
          }
          while (state.current < cfg.singleSetWidth) {
            state.current += cfg.singleSetWidth;
            state.target += cfg.singleSetWidth;
          }
        }

        // Update progress bar (non-loop)
        if (progressRef.current && !cfg.loop && state.limit > 0) {
          const ratio = clamp(state.current / state.limit, 0, 1);
          progressRef.current.style.transform = `scaleX(${ratio})`;
        }

        // Update card positions
        const containerW = containerRef.current?.clientWidth || 1200;

        displayItems.forEach((_, idx) => {
          const itemEl = itemRefs.current[idx];
          const imgEl = imgRefs.current[idx];
          if (!itemEl) return;

          // Pure linear conveyor coordinate without disruptive individual modulo:
          const posX = idx * cfg.step - state.current;
          itemEl.style.transform = `translate3d(${posX}px, 0, 0)`;

          // Inner parallax shift (if intensity > 0)
          if (imgEl) {
            if (cfg.parallaxIntensity > 0) {
              const centerDist = posX + cfg.imageWidth / 2 - containerW / 2;
              const normDist = clamp(
                centerDist / (containerW / 2),
                -cfg.uvScale,
                cfg.uvScale
              );
              const parallaxShift = -normDist * (cfg.parallaxIntensity * 60);
              const zoomScale = 1 + cfg.parallaxIntensity * 0.3;
              imgEl.style.transform = `scale(${zoomScale}) translate3d(${parallaxShift}px, 0, 0)`;
            } else {
              imgEl.style.transform = "none";
            }
          }
        });

        rafId.current = requestAnimationFrame(animate);
      };

      rafId.current = requestAnimationFrame(animate);
      return () => {
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        lastTimestamp.current = null;
      };
    }, [displayItems]);

    // Drag, Touch & Wheel Handlers
    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
        const cfg = config.current;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        scrollState.current.target += delta * cfg.wheelSensitivity;
      };

      const handlePointerDown = (e: PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        try {
          container.setPointerCapture(e.pointerId);
        } catch {}
        container.style.cursor = "grabbing";
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging.current) return;
        const cfg = config.current;
        const delta = e.clientX - startX.current;
        startX.current = e.clientX;
        scrollState.current.target -= delta * cfg.dragSensitivity;
      };

      const handlePointerUp = (e: PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {}
        container.style.cursor = "grab";
      };

      const handleMouseEnter = () => {
        isHovered.current = true;
      };

      const handleMouseLeave = () => {
        isHovered.current = false;
      };

      container.addEventListener("wheel", handleWheel, { passive: true });
      container.addEventListener("pointerdown", handlePointerDown);
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerup", handlePointerUp);
      container.addEventListener("pointercancel", handlePointerUp);
      container.addEventListener("pointerleave", handlePointerUp);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("pointerdown", handlePointerDown);
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerup", handlePointerUp);
        container.removeEventListener("pointercancel", handlePointerUp);
        container.removeEventListener("pointerleave", handlePointerUp);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, []);

    // Imperative ref API
    const scrollToIndex = React.useCallback(
      (idx: number) => {
        const cfg = config.current;
        if (cfg.loop && cfg.singleSetWidth > 0) {
          const targetIndex = cfg.count + (idx % cfg.count);
          scrollState.current.target = targetIndex * cfg.step;
        } else {
          const targetPos = idx * cfg.step;
          scrollState.current.target = clamp(targetPos, 0, scrollState.current.limit);
        }
      },
      []
    );

    const reset = React.useCallback(() => {
      const cfg = config.current;
      const initial = cfg.loop && cfg.singleSetWidth > 0 ? cfg.singleSetWidth : 0;
      scrollState.current.target = initial;
      scrollState.current.current = initial;
    }, []);

    const next = React.useCallback(() => {
      const cfg = config.current;
      scrollState.current.target += cfg.step;
    }, []);

    const prev = React.useCallback(() => {
      const cfg = config.current;
      scrollState.current.target -= cfg.step;
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        scrollToIndex,
        reset,
        next,
        prev,
      }),
      [scrollToIndex, reset, next, prev]
    );

    return (
      <div
        ref={containerRef}
        className={cn(
          "group relative w-full overflow-hidden select-none touch-pan-y py-4",
          className
        )}
        style={{ cursor: "grab", ...style }}
      >
        {/* Navigation Buttons */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 backdrop-blur-md shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-white dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 backdrop-blur-md shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-white dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Slides Track */}
        <div
          ref={trackRef}
          className="relative w-full h-full flex items-center"
          style={{ height: imageHeight }}
        >
          {displayItems.map((item, index) => (
            <div
              key={`carousel-card-${index}-${item.url}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width: imageWidth,
                height: imageHeight,
              }}
            >
              <div
                className="group/card relative w-full h-full overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900 shadow-lg transition-shadow duration-300 hover:shadow-2xl"
                style={{ borderRadius }}
              >
                {/* Image Element */}
                <img
                  ref={(el) => {
                    imgRefs.current[index] = el;
                  }}
                  src={item.url}
                  alt={item.title || `Visual asset ${index + 1}`}
                  draggable={false}
                  loading={index < 8 ? "eager" : "lazy"}
                  className="w-full h-full object-cover pointer-events-none will-change-transform"
                />

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent pointer-events-none opacity-85 transition-opacity duration-300 group-hover/card:opacity-95" />

                {/* Card Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col justify-end text-left pointer-events-none z-10">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    {item.tag && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
                        {item.tag}
                      </span>
                    )}
                    {item.size && (
                      <span className="text-[10px] font-mono text-zinc-300 font-medium bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-md">
                        {item.size}
                      </span>
                    )}
                  </div>

                  {item.title && (
                    <h3 className="text-sm font-semibold text-white tracking-tight leading-snug drop-shadow-sm truncate">
                      {item.title}
                    </h3>
                  )}

                  {item.author && (
                    <p className="text-[11px] text-zinc-300/80 mt-0.5 truncate">
                      by {item.author}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar (Non-loop mode) */}
        {showProgress && !loop && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 h-[2px] w-36 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <div
              ref={progressRef}
              className="h-full w-full bg-blue-600 dark:bg-blue-400 origin-left"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        )}
      </div>
    );
  }
);

ParallaxCarousel.displayName = "ParallaxCarousel";
