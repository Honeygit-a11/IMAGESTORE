import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";

interface StatTileProps {
  label: string;
  /** Number to animate with a count-up. Mutually exclusive with `display`. */
  value?: number;
  /** Static text rendered instead of an animated counter. */
  display?: string;
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
  /** Optional element rendered at the far right of the header row. */
  headerRight?: React.ReactNode;
  /** Renders a small progress bar at the bottom of the tile. */
  progress?: { value: number; max: number } | null;
  accent?: "blue" | "green" | "purple" | "amber" | "red";
  decimals?: number;
  className?: string;
  valueClassName?: string;
}

const accentMap = {
  blue: {
    border: "bg-gradient-to-r from-blue-500 to-indigo-500",
    pill: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  },
  green: {
    border: "bg-gradient-to-r from-emerald-500 to-teal-500",
    pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  purple: {
    border: "bg-gradient-to-r from-violet-500 to-purple-500",
    pill: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  },
  amber: {
    border: "bg-gradient-to-r from-amber-500 to-orange-500",
    pill: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  },
  red: {
    border: "bg-gradient-to-r from-red-500 to-rose-500",
    pill: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
  },
};

/** Animated stat card with gradient top accent and icon pill. */
export function StatTile({
  label,
  value,
  display,
  suffix = "",
  prefix = "",
  icon,
  headerRight,
  progress,
  accent = "blue",
  decimals = 0,
  className,
  valueClassName,
}: StatTileProps) {
  const a = accentMap[accent];
  const percent = progress
    ? Math.min(100, Math.max(0, Math.round((progress.value / progress.max) * 100)))
    : 0;
  const barColor =
    percent >= 90
      ? "bg-red-500"
      : percent >= 75
      ? "bg-amber-400"
      : "bg-gradient-to-r from-emerald-500 to-teal-500";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700",
        className
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5", a.border)} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        {headerRight}
        {icon && !headerRight && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
              a.pill
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50",
          valueClassName
        )}
      >
        {display !== undefined ? (
          <span>{display}</span>
        ) : (
          <AnimatedCounter value={value ?? 0} prefix={prefix} suffix={suffix} decimals={decimals} />
        )}
      </div>
      {progress && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-zinc-400 tabular-nums">{percent}%</span>
        </div>
      )}
    </div>
  );
}