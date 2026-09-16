"use client";

import dynamic from "next/dynamic";

// Reserves the simulator section's vertical space while recharts loads,
// so deferring it does not cause layout shift.
function StorageSectionPlaceholder() {
  return (
    <div id="storage" className="bg-zinc-50/40 dark:bg-zinc-900/20">
      <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 lg:py-16 px-4 text-left">
        <div className="h-8 sm:h-10 max-w-4xl rounded bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse" />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-8 w-16 rounded bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse" />
              <div className="mt-2 h-3 w-24 rounded bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-72 sm:h-80 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse" />
      </div>
    </div>
  );
}

// Below-the-fold heavy section (recharts bar chart). Kept out of the initial
// JS payload and loaded only after mount so the chart library doesn't load on
// every landing visit.
const StorageSimulator = dynamic(
  () => import("./storage-simulator"),
  {
    ssr: false,
    loading: () => <StorageSectionPlaceholder />,
  }
);

export default function StorageSimulatorLazy() {
  return <StorageSimulator />;
}