"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  HardDrive,
  User,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [storageInfo, setStorageInfo] = React.useState<{
    usedFormatted: string;
    maxFormatted: string;
    percentUsed: number;
    currentWorkspaces: number;
    maxWorkspaces: number;
  }>({
    usedFormatted: "0 MB",
    maxFormatted: "500 MB",
    percentUsed: 0,
    currentWorkspaces: 0,
    maxWorkspaces: 2,
  });

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setStorageInfo({
            usedFormatted: data.data.storage?.usedFormatted || "0 MB",
            maxFormatted: data.data.storage?.maxFormatted || "500 MB",
            percentUsed: Math.min(100, Math.round(data.data.storage?.percentUsed || 0)),
            currentWorkspaces: data.data.workspaces?.currentCount || 0,
            maxWorkspaces: data.data.workspaces?.maxCount || 2,
          });
        }
      })
      .catch(() => {});
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
      {/* ────────── Mobile Top Bar ────────── */}
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
            <span className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black shadow-xs hover:scale-105 transition-transform">
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

      {/* ────────── Mobile Backdrop + Drawer ────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between shadow-2xl md:hidden",
          "transition-[transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
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
                  className={cn(
                    "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    link.active
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  {link.active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

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
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
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

      {/* ────────── Desktop Sidebar ────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800",
          "bg-gradient-to-b from-white via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          collapsed ? "w-[68px] p-3" : "w-64 p-4"
        )}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div
            className={cn(
              "flex items-center border-b border-zinc-100 dark:border-zinc-800",
              collapsed ? "justify-center pb-5 mb-5" : "justify-between pb-6 mb-6"
            )}
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-bold tracking-tight text-base group"
            >
              <span className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                IS
              </span>
              {!collapsed && <span>ImageSpace</span>}
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={collapsed ? link.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                    link.active
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  {link.active && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                  {link.active && collapsed && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 mx-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      "truncate transition-all duration-200",
                      collapsed && "w-0 overflow-hidden opacity-0"
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer pinned at bottom */}
        <div
          className={cn(
            "mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3",
            collapsed && "border-t-0 pt-0 space-y-2"
          )}
        >
          {/* Storage card */}
          {!collapsed ? (
            <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
                  Storage Quota
                </span>
                <span>{storageInfo.maxFormatted} Max</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, storageInfo.percentUsed)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
                <span>{storageInfo.usedFormatted} used ({storageInfo.percentUsed}%)</span>
                <span>{storageInfo.currentWorkspaces}/{storageInfo.maxWorkspaces} Workspaces</span>
              </div>
            </div>
          ) : (
            <Link
              href="/dashboard"
              title={`Storage: ${storageInfo.usedFormatted} / ${storageInfo.maxFormatted}`}
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800"
            >
              <HardDrive className="h-4 w-4 text-zinc-500" />
            </Link>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex items-center justify-center w-full gap-1.5 rounded-xl px-2 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span className="transition-opacity duration-200">Collapse</span>
              </>
            )}
          </button>

          {/* Sign out + version */}
          {!collapsed && (
            <div className="flex items-center justify-between px-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="truncate">v1.0</span>
              <Link
                href="/login"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Link>
            </div>
          )}
          {collapsed && (
            <Link
              href="/login"
              title="Sign Out"
              className="flex items-center justify-center p-2 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          )}
        </div>
      </aside>

      {/* ────────── Main Content Area ────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
              {pathname === "/profile" ? "Account & Security" : "Workspace Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}