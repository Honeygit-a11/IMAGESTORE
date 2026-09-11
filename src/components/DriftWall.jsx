"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './DriftWall.css';

// Seeded PRNG for consistent SSR and client hydration
const mulberry32 = (seed) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleArray = (array, seed) => {
  const rand = mulberry32(seed);
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const PICSUM_DEFAULT_IDS = [
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 25, 28, 29, 36, 42, 48, 54, 60, 106,
  110, 119, 133, 164, 175, 180, 192, 200, 211, 219,
  237, 244, 250, 1011, 1015, 1016, 1018, 1025, 1035, 1039,
  1043, 1044, 1050, 1059, 1062, 1069, 1074, 1080, 1084
];

/**
 * @type {Array<{image: string, title?: string, href?: string}>}
 */
const DEFAULT_ITEMS = PICSUM_DEFAULT_IDS.map((id, i) => ({
  image: `https://picsum.photos/id/${id}/600/400`,
  title: `Tile ${i + 1}`,
  href: undefined
}));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index, variance) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

/**
 * @param {Object} props
 * @param {Array<{image: string, title?: string, href?: string}>} [props.items]
 * @param {number} [props.columns]
 * @param {number} [props.tileWidth]
 * @param {number} [props.tileHeight]
 * @param {number} [props.gap]
 * @param {number} [props.radius]
 * @param {number} [props.tilt]
 * @param {number} [props.turn]
 * @param {number} [props.roll]
 * @param {number} [props.perspective]
 * @param {number} [props.depth]
 * @param {number} [props.speed]
 * @param {string} [props.direction]
 * @param {number} [props.variance]
 * @param {number} [props.fade]
 * @param {number} [props.dim]
 * @param {number} [props.overlayOpacity]
 * @param {boolean} [props.grayscale]
 * @param {string} [props.overlayColor]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
const DriftWall = ({
  items = DEFAULT_ITEMS,
  columns = 5,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = 'up',
  variance = 0.45,
  fade = 0.3,
  dim = 0.85,
  overlayOpacity = 0.15,
  grayscale = false,
  overlayColor = '#060010',
  className = '',
  style
}) => {
  const containerRef = useRef(null);
  const planeRef = useRef(null);
  const trackRefs = useRef([]);
  const rafRef = useRef(null);

  const offsetsRef = useRef([]);
  const velocitiesRef = useRef([]);
  const lastTsRef = useRef(null);

  const [containerHeight, setContainerHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(1920);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = e => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const colCount = useMemo(() => {
    const unit = tileWidth + gap;
    // Calculate columns needed to fully cover container width with 45% margin for 3D rotation angles
    const needed = Math.ceil((containerWidth * 1.45) / unit) + 2;
    return Math.max(columns, needed);
  }, [columns, containerWidth, tileWidth, gap]);

  const columnItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const pool = items.length >= 8 ? items : DEFAULT_ITEMS;
    const itemsPerCol = Math.max(8, Math.min(pool.length, 14));

    return Array.from({ length: colCount }, (_, c) => {
      // Deterministically shuffle with unique prime seeds per column
      const shuffled = shuffleArray(pool, (c + 1) * 7919 + 1337);
      return shuffled.slice(0, itemsPerCol);
    });
  }, [items, colCount]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight || 600);
        setContainerWidth(containerRef.current.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1920));
      }
    };
    updateSize();
    const ro = new ResizeObserver(([entry]) => {
      if (entry?.contentRect) {
        setContainerHeight(entry.contentRect.height || 600);
        setContainerWidth(entry.contentRect.width || (typeof window !== 'undefined' ? window.innerWidth : 1920));
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo(() => {
    const dirSign = direction === 'up' ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  useEffect(() => {
    if (planeRef.current) {
      planeRef.current.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt}deg) rotateY(${turn}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    }
  }, [tilt, turn, roll, depth]);

  useEffect(() => {
    const animate = ts => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const target = baseVelocities[c];

          const ease = 1 - Math.exp(-dt / 0.28);
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          const meta = columnMeta[c];
          if (el && meta) el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [baseVelocities, columnMeta, reduced]);

  const cssVars = useMemo(
    () => ({
      '--dw-tile-w': `${tileWidth}px`,
      '--dw-tile-h': `${tileHeight}px`,
      '--dw-gap': `${gap}px`,
      '--dw-radius': `${radius}px`,
      '--dw-perspective': `${perspective}px`,
      '--dw-dim': dim,
      '--dw-gray': grayscale ? 1 : 0,
      '--dw-overlay': overlayColor,
      '--dw-overlay-opacity': overlayOpacity,
      '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
      ...style
    }),
    [tileWidth, tileHeight, gap, radius, perspective, dim, grayscale, overlayColor, overlayOpacity, fade, style]
  );

  const renderTile = (item, id) => {
    return (
      <div key={id} className="drift-wall__tile">
        <span className="drift-wall__inner">
          <img src={item.image} alt={item.title ?? ''} loading="lazy" decoding="async" draggable={false} />
          <span className="drift-wall__overlay" aria-hidden="true" />
        </span>
      </div>
    );
  };

  const rootClass = ['drift-wall', reduced ? 'drift-wall--reduced' : '', className].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={cssVars}
      role="presentation"
      aria-hidden="true"
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((col, c) => {
          const meta = columnMeta[c];
          const copies = Array.from({ length: meta.copies });
          return (
            <div className="drift-wall__col" key={`col-${c}`}>
              <div className="drift-wall__track" ref={el => (trackRefs.current[c] = el)}>
                {copies.map((_, copyIndex) =>
                  col.map((item, itemIndex) => renderTile(item, `${c}-${copyIndex}-${itemIndex}`))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriftWall;
