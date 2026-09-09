import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // in bytes or MB
  max: number; // in bytes or MB
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  sublabel,
  showPercent = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  // Threshold colors
  let barColor = "bg-blue-600 dark:bg-blue-500";
  if (percentage >= 90) {
    barColor = "bg-red-600 dark:bg-red-500";
  } else if (percentage >= 75) {
    barColor = "bg-amber-500 dark:bg-amber-400";
  }

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label && <span>{label}</span>}
          {showPercent && <span>{percentage}%</span>}
        </div>
      )}

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {sublabel && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{sublabel}</p>
      )}
    </div>
  );
}
