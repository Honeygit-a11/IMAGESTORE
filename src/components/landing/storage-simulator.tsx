"use client";

import * as React from "react";
import { HardDrive, Sliders, AlertCircle, CheckCircle2 } from "lucide-react";

export function StorageSimulator() {
  const [activeMb, setActiveMb] = React.useState(280);
  const [trashMb, setTrashMb] = React.useState(70);

  const totalUsed = activeMb + trashMb;
  const maxStorage = 500;
  const percentUsed = Math.min(100, Math.round((totalUsed / maxStorage) * 100));
  const isFull = totalUsed >= maxStorage;
  const isWarning = totalUsed >= 420 && !isFull;
  const freeSpace = Math.max(0, maxStorage - totalUsed);

  return (
    <section id="storage" className="py-24 sm:py-28 lg:py-32 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-wider uppercase text-blue-600 dark:text-blue-400">
            Storage Model
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mt-3 leading-[1.15]">
            Your storage, clearly explained
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
            500 MB shared across your workspaces, including recoverable files in Trash.
          </p>
        </div>

        {/* Primary Storage Allocation Visual */}
        <div className="mt-14 sm:mt-16 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 p-7 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {totalUsed} MB
                </span>
                <span className="text-sm text-zinc-500 font-normal">used of 500 MB</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {freeSpace > 0 ? `${freeSpace} MB available for new uploads` : "Storage quota fully reached"}
              </p>
            </div>

            {/* Refined State Badge (Non-jarring) */}
            <div>
              {isFull ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200/60 dark:border-red-900/60">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Storage space full · Uploads paused</span>
                </div>
              ) : isWarning ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Approaching limit · {freeSpace} MB remaining</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Storage capacity healthy</span>
                </div>
              )}
            </div>
          </div>

          {/* Single Elegant Segmented Progress Bar */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Allocation breakdown</span>
              <span className="font-mono text-zinc-500">{percentUsed}% utilized</span>
            </div>

            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
              {/* Active Images portion */}
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-l-full"
                style={{ width: `${(activeMb / maxStorage) * 100}%` }}
                title={`Active Images: ${activeMb} MB`}
              />
              {/* Trash portion */}
              <div
                className={`h-full transition-all duration-300 ${isFull ? 'bg-red-500' : 'bg-amber-500/80'}`}
                style={{ width: `${(trashMb / maxStorage) * 100}%` }}
                title={`Trash: ${trashMb} MB`}
              />
            </div>

            {/* Clean Segment Legend */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                <span>Active Images: <strong className="font-medium text-zinc-800 dark:text-zinc-200">{activeMb} MB</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Trash (30-day retention): <strong className="font-medium text-zinc-800 dark:text-zinc-200">{trashMb} MB</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                <span>Available: <strong className="font-medium text-zinc-800 dark:text-zinc-200">{freeSpace} MB</strong></span>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls (Quieter area below) */}
          <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 mb-5">
              <Sliders className="h-4 w-4 text-zinc-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Interactive Demonstration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Active Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="active-slider" className="font-medium text-zinc-700 dark:text-zinc-300">
                    Active Workspace Images
                  </label>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300 font-medium">{activeMb} MB</span>
                </div>
                <input
                  id="active-slider"
                  type="range"
                  min="0"
                  max="450"
                  step="10"
                  value={activeMb}
                  onChange={(e) => setActiveMb(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-zinc-400">Live assets across up to 2 distinct workspaces.</p>
              </div>

              {/* Trash Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="trash-slider" className="font-medium text-zinc-700 dark:text-zinc-300">
                    Soft-Deleted Images (Trash)
                  </label>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300 font-medium">{trashMb} MB</span>
                </div>
                <input
                  id="trash-slider"
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={trashMb}
                  onChange={(e) => setTrashMb(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-zinc-400">Recoverable for 30 days. Permanent deletion releases quota.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
