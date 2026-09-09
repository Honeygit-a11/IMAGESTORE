import Link from "next/link";
import { FolderKanban, HardDrive, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50/50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-100 dark:border-zinc-800">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-base">
              <span className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black shadow-sm">
                IS
              </span>
              <span>ImageSpace</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <FolderKanban className="h-4 w-4" />
              Workspaces
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <User className="h-4 w-4" />
              Account & Profile
            </Link>
          </nav>
        </div>

        {/* Storage Quota Card (Rule: 500 MB max per user, max 2 workspaces) */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
                Storage Quota
              </span>
              <span>0 MB / 500 MB</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: "0%" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
              <span>0% Used</span>
              <span>0 of 2 Workspaces</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate">Foundation Mode</span>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" />
              Exit
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
