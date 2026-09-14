import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Root wrapper that adds a mount-time fade-in-up to any page.
 * Apply to the top-level <div> of each page.
 */
export function PageTransition({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("animate-fade-in-up", className)}
      style={{ animationDelay: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}