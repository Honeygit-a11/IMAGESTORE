"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 p-1 text-zinc-600 dark:text-zinc-400">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-full p-1.5 transition-all ${
          theme === "light"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
            : "hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
        title="Light Mode"
        aria-label="Light Mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-full p-1.5 transition-all ${
          theme === "dark"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
            : "hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
        title="Dark Mode"
        aria-label="Dark Mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`rounded-full p-1.5 transition-all ${
          theme === "system"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
            : "hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
        title="System Preference"
        aria-label="System Preference"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
