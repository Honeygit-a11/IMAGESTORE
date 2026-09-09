import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-zinc-600 dark:text-zinc-400", sizeClasses[size], className)}
    />
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80",
        className
      )}
      {...props}
    />
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
