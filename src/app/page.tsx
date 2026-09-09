import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/hero";
import { BentoGrid } from "@/components/landing/bento-grid";
import { StorageSimulator } from "@/components/landing/storage-simulator";
import { RoleMatrix } from "@/components/landing/role-matrix";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg">
            <span className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black shadow-sm">
              IS
            </span>
            <span>ImageSpace</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Platform Features
            </a>
            <a href="#storage" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              500 MB Simulator
            </a>
            <a href="#roles" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Role Matrix
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with GSAP Animations */}
        <HeroSection />

        {/* Bento Grid Feature Showcase */}
        <section id="features" className="py-20 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Core Specifications
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-2">
                Built For Speed, Privacy, and Control
              </p>
              <p className="text-xs sm:text-sm text-zinc-500 mt-2">
                Direct-to-storage architecture with strict zero-trust authorization on every image.
              </p>
            </div>

            <BentoGrid />
          </div>
        </section>

        {/* Live Interactive Storage Simulator */}
        <section id="storage" className="py-20 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <StorageSimulator />
          </div>
        </section>

        {/* Interactive Role & Permission Matrix */}
        <section id="roles" className="py-20 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RoleMatrix />
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-24 border-t border-zinc-200/80 dark:border-zinc-800/80 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-zinc-900/90 p-10 sm:p-16 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                  Ready to organize your image assets?
                </h2>
                <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
                  Create your first workspace in seconds. 500 MB free storage, up to 3 members per workspace, and seamless Cloudflare R2 direct uploads.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 shadow-md">
                      Create Your Free Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="border-zinc-700 text-white hover:bg-zinc-800">
                      Sign In to Existing Workspaces
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Responsive Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-black">
              IS
            </span>
            <span className="font-bold text-zinc-900 dark:text-white">ImageSpace</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Features
            </a>
            <a href="#storage" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Storage
            </a>
            <a href="#roles" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Permissions
            </a>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
