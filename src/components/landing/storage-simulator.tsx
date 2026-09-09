"use client";

import * as React from "react";
import { HardDrive, AlertTriangle, Trash2, Database, ShieldAlert } from "lucide-react";

export function StorageSimulator() {
  const [activeMb, setActiveMb] = React.useState(280);
  const [trashMb, setTrashMb] = React.useState(70);

  const totalUsed = activeMb + trashMb;
  const maxStorage = 500;
  const percentUsed = Math.min(100, Math.round((totalUsed / maxStorage) * 100));
  const isFull = totalUsed >= maxStorage;
  const isWarning = totalUsed >= 400 && !isFull;

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 sm:p-10 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <HardDrive className="h-4 w-4" />
            Interactive Storage Simulator
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            500 MB Storage Allocation & Trash Mechanics
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl">
            Drag the sliders below to simulate how active images and soft-deleted Trash items interact with your 500 MB user limit across both workspaces.
          </p>
        </div>

        {/* Live Usage Pill */}
        <div className="flex flex-col items-end shrink-0">
          <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            {totalUsed} <span className="text-sm font-normal text-zinc-400">/ 500 MB</span>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${
              isFull
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                : isWarning
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            }`}
          >
            {isFull ? "Quota Reached (Uploads Blocked)" : `${500 - totalUsed} MB Remaining`}
          </span>
        </div>
      </div>

      {/* Warning Banners */}
      {isFull && (
        <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-xs text-red-800 dark:text-red-300">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <strong>Storage space full (500 MB reached).</strong> Uploads are blocked. Permanently delete images from Trash to release storage quota.
          </div>
        </div>
      )}

      {isWarning && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <strong>Approaching quota limit ({totalUsed} MB used).</strong> Consider clearing soft-deleted images from the 30-day Trash bin.
          </div>
        </div>
      )}

      {/* Progress Bar Visualization */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Overall Allocation Progress</span>
          <span>{percentUsed}% Used</span>
        </div>
        <div className="h-4 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
          {/* Active Images portion */}
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(activeMb / maxStorage) * 100}%` }}
            title={`Active Images: ${activeMb} MB`}
          />
          {/* Trash portion */}
          <div
            className="h-full bg-amber-500/80 transition-all duration-300"
            style={{ width: `${(trashMb / maxStorage) * 100}%` }}
            title={`Trash (Retained for 30 days): ${trashMb} MB`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            <span>Active Images ({activeMb} MB)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span>Trash Bin ({trashMb} MB - Counts to quota)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <span>Free Space ({Math.max(0, 500 - totalUsed)} MB)</span>
          </div>
        </div>
      </div>

      {/* Sliders Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-blue-500" />
              Active Workspace Images
            </label>
            <span className="font-mono text-zinc-500">{activeMb} MB</span>
          </div>
          <input
            type="range"
            min="0"
            max="450"
            step="10"
            value={activeMb}
            onChange={(e) => setActiveMb(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
          />
          <p className="text-[11px] text-zinc-400">JPG, PNG, WEBP, GIF, HEIC assets across up to 2 workspaces.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5 text-amber-500" />
              Soft-Deleted Images (Trash)
            </label>
            <span className="font-mono text-zinc-500">{trashMb} MB</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={trashMb}
            onChange={(e) => setTrashMb(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
          />
          <p className="text-[11px] text-zinc-400">Recoverable for 30 days by the Owner before permanent deletion releases storage.</p>
        </div>
      </div>
    </div>
  );
}
