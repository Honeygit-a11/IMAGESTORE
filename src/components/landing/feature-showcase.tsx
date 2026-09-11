"use client";

import * as React from "react";
import {
  ShieldCheck,
  FolderKanban,
  Tag,
  Trash2,
  Check,
  ArrowRight,
  FileImage,
  Lock,
} from "lucide-react";

export function FeatureShowcase() {
  return (
    <section id="features" className="py-24 sm:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-wider uppercase text-blue-600 dark:text-blue-400">
            Architecture & Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mt-3 leading-[1.15]">
            Engineered for reliable image management
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
            Direct cloud pipelines, isolated workspaces, and automatic retention protection.
          </p>
        </div>

        {/* Primary Feature: Dominant Editorial Layout */}
        <div className="mt-14 sm:mt-16 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-8 sm:p-12 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: Explanation */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                <span>Primary Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Secure image uploads
              </h3>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Images move directly from the browser to private storage without forcing large files through the application server.
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Short-lived presigned tokens authorize each transfer individually. This guarantees upload speeds remain fast and reliable, even when teams upload high-resolution batches simultaneously.
              </p>

              <div className="pt-2 grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400">10 MB max per image with client validation</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400">Batch upload up to 10 files simultaneously</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400">Direct S3-compatible cloud storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400">Zero backend memory load or timeouts</span>
                </div>
              </div>
            </div>

            {/* Right: Realistic Upload & Pipeline Visual */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-xs">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Direct Storage Channel Active
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">Cloudflare R2</span>
                </div>

                {/* Simulated Upload Item 1 */}
                <div className="mt-4 space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2.5">
                        <FileImage className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">campaign-hero-autumn.webp</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Uploaded (6.8 MB)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-full rounded-full" />
                    </div>
                  </div>

                  {/* Simulated Upload Item 2 */}
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2.5">
                        <FileImage className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">lookbook-spread-04.png</span>
                      </div>
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                        92% · 8.4 MB / 9.1 MB
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[92%] rounded-full transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Pipeline Flow Bar */}
                <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Browser</span>
                    <ArrowRight className="h-3 w-3 text-zinc-400" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Presigned Token</span>
                    <ArrowRight className="h-3 w-3 text-zinc-400" />
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Direct R2 Storage</span>
                  </div>
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Supporting Features: 3 Asymmetric Columns */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Feature 1: Two Workspaces */}
          <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <FolderKanban className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Two Workspaces
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Create up to 2 distinct workspaces to isolate projects, client campaigns, or department libraries with isolated access.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 flex items-center justify-between">
              <span>Up to 3 members per workspace</span>
              <span className="font-mono text-zinc-400 text-[11px]">2 Max</span>
            </div>
          </div>

          {/* Feature 2: Up to 20 Tags */}
          <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Tag className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Up to 20 Tags per Image
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Case-sensitive tags provide granular taxonomy. Filter large image libraries by multi-tag queries with sub-second response times.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">#Hero</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">#hero</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">#Brand</span>
            </div>
          </div>

          {/* Feature 3: 30-Day Trash Recovery */}
          <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Trash2 className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                30-Day Trash Recovery
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Soft-deleted images remain safely recoverable by the Owner for 30 days before permanent deletion purges storage.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 flex items-center justify-between">
              <span>Automatic quota release upon purge</span>
              <span className="font-mono text-zinc-400 text-[11px]">30 Days</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
