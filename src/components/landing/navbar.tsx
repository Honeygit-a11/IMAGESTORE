"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  HardDrive,
  ShieldCheck,
  Workflow,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Capabilities", href: "/#capabilities", icon: Sparkles },
  { name: "Workflow", href: "/#how-it-works", icon: Workflow },
  { name: "Features", href: "/#features", icon: Layers },
  { name: "Storage", href: "/#storage", icon: HardDrive },
  { name: "Permissions", href: "/#roles", icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();
  const [indicatorStyle, setIndicatorStyle] = React.useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [activeHref, setActiveHref] = React.useState<string>("");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navContainerRef = React.useRef<HTMLDivElement>(null);

  // Close mobile drawer on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  // Track active section on scroll if on the home page
  React.useEffect(() => {
    if (pathname !== "/") {
      setActiveHref("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHref(`/#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    NAV_ITEMS.forEach((item) => {
      const id = item.href.replace("/", "");
      const el = document.querySelector(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  const updateIndicatorToActive = React.useCallback(() => {
    if (!navContainerRef.current) return;
    const activeEl = activeHref
      ? navContainerRef.current.querySelector<HTMLAnchorElement>(`a[href="${activeHref}"]`)
      : null;
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeHref]);

  React.useEffect(() => {
    updateIndicatorToActive();
  }, [activeHref, updateIndicatorToActive]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    setIndicatorStyle({
      left: el.offsetLeft,
      width: el.offsetWidth,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    updateIndicatorToActive();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo (Full Left Side) */}
        <div className="flex items-center justify-start flex-1 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-base sm:text-lg text-zinc-900 dark:text-zinc-50"
          >
            <span className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold shadow-2xs">
              IS
            </span>
            <span>ImageSpace</span>
          </Link>
        </div>

        {/* Desktop Navigation (Centered) */}
        <nav
          ref={navContainerRef}
          onMouseLeave={handleMouseLeave}
          className="hidden md:flex items-center justify-center gap-1 relative h-16 shrink-0"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setActiveHref(item.href)}
                onMouseEnter={handleMouseEnter}
                className={`px-3.5 py-2 text-xs transition-colors ${
                  isActive
                    ? "font-semibold text-zinc-900 dark:text-zinc-50"
                    : "font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {item.name}
              </a>
            );
          })}

          {/* Traveling Hairline Underline Indicator */}
          <span
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-250 ease-out"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
            aria-hidden="true"
          />
        </nav>

        {/* Desktop Actions (Full Right Side) */}
        <div className="hidden md:flex items-center justify-end gap-3 flex-1">
          <ThemeToggle />

          {pathname === "/login" ? (
            <Link href="/register">
              <Button
                size="sm"
                className="rounded-lg text-xs font-medium h-8 px-3.5 shadow-xs"
              >
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : pathname === "/register" ? (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs font-medium h-8 px-3 border-zinc-200 dark:border-zinc-800"
              >
                Sign In
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-xs font-medium h-8 px-3"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="rounded-lg text-xs font-medium h-8 px-3.5 shadow-xs"
                >
                  Get Started
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger & Actions */}
        <div className="flex md:hidden items-center justify-end gap-2 flex-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Open mobile navigation"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Slide-In Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/50 dark:bg-zinc-950/80 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-950 border-l border-zinc-200/80 dark:border-zinc-800/80 p-6 flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300 ease-out animate-in slide-in-from-right">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                    IS
                  </span>
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    ImageSpace
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="mt-6 flex flex-col space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-zinc-400" />
                      <span>{item.name}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2.5">
              {pathname === "/login" ? (
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full justify-center rounded-lg text-xs font-medium h-9 shadow-xs">
                    Get Started
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : pathname === "/register" ? (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-center rounded-lg text-xs font-medium h-9 border-zinc-200 dark:border-zinc-800"
                  >
                    Sign In
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full justify-center rounded-lg text-xs font-medium h-9 border-zinc-200 dark:border-zinc-800"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full justify-center rounded-lg text-xs font-medium h-9 shadow-xs">
                      Get Started
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
