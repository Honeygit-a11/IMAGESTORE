"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, HardDrive, User, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close drawer on path change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      href: "/dashboard",
      label: "Workspaces",
      icon: FolderKanban,
      active: pathname.startsWith("/dashboard") || pathname.startsWith("/workspaces"),
    },
    {
      href: "/profile",
      label: "Account & Profile",
      icon: User,
      active: pathname === "/profile",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50/50 dark:bg-zinc-950">
      {/* Mobile Top Navigation Bar (< md) */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-sm">
            <span className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black shadow-xs">
              IS
            </span>
            <span>ImageSpace</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in-0 duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between shadow-2xl transition-transform duration-200 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-base">
              <span className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black shadow-sm">
                IS
              </span>
              <span>ImageSpace</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    link.active
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Storage Quota Card */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
                Storage Quota
              </span>
              <span>500 MB Limit</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                style={{ width: "10%" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
              <span>Max 2 Workspaces</span>
              <span>3 Members / WS</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate">ImageSpace v1.0</span>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Link>
          </div>
        </div>
      </aside>

      {/* Desktop Persistent Sidebar (>= md) */}
      <aside className="hidden md:flex md:w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-100 dark:border-zinc-800">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-base">
              <span className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black shadow-sm">
                IS
              </span>
              <span>ImageSpace</span>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    link.active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Storage Quota Card */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
                Storage Quota
              </span>
              <span>500 MB Max</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: "10%" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
              <span>Max 2 Workspaces</span>
              <span>3 Members / WS</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate">ImageSpace v1.0</span>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
