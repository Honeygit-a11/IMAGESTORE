import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./loading-indicator";

/** Grid of stat-tile skeletons for dashboard / workspace pages. */
export function StatGridSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="mt-3 h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Rows of member/card list skeletons. */
export function ListSkeleton({
  count = 3,
  className,
  avatar = true,
}: {
  count?: number;
  className?: string;
  avatar?: boolean;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          {avatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Group of section-card skeletons for the profile page. */
export function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Timeline skeleton with dots for the activity page. */
export function TimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="relative space-y-2 pl-10">
      <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-zinc-100 dark:bg-zinc-800" />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="absolute -left-[24px] top-4 h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card-grid skeleton for trash / gallery pages. */
export function GridSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}