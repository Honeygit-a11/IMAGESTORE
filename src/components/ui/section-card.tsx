import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  hover?: boolean;
}

/** Consistent card wrapper with optional gradient-featured icon header. */
export function SectionCard({
  children,
  className,
  icon,
  iconBg = "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  title,
  description,
  headerAction,
  noPadding = false,
  hover = false,
}: SectionCardProps) {
  const hasHeader = icon || title || description || headerAction;
  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60",
        hover &&
          "transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700",
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            {icon && (
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset ring-black/5",
                  iconBg
                )}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      <div className={cn(!noPadding && "p-5")}>{children}</div>
    </section>
  );
}