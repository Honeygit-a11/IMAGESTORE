"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="py-28 sm:py-36 relative overflow-hidden border-t border-zinc-200/60 dark:border-zinc-800/60">
      {/* Subtle Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[260px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/15 dark:via-purple-600/15 dark:to-emerald-500/10 blur-[100px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          Ready to organize your image assets?
        </h2>
        <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Create your workspace and start organizing your images in minutes.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link href="/register">
            <Button
              size="lg"
              className="w-full sm:w-auto h-11 px-6 rounded-lg text-sm font-medium shadow-xs"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-11 px-6 rounded-lg text-sm font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Sign In
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
          500 MB free quota · Up to 2 workspaces · No credit card required
        </p>
      </div>
    </section>
  );
}
