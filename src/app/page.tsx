import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero";
import { ProductBenefits } from "@/components/landing/product-benefits";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { StorageSimulator } from "@/components/landing/storage-simulator";
import { RoleMatrix } from "@/components/landing/role-matrix";
import { FinalCta } from "@/components/landing/final-cta";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
      {/* Quiet Hairline Navbar with Traveling Underline & Slide-in Drawer */}
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero Section (Unmodified and Preserved Exactly As Is) */}
        <HeroSection />

        {/* 2. Product Benefits */}
        <ProductBenefits />

        {/* 3. How It Works */}
        <HowItWorks />

        {/* 4. Feature Showcase */}
        <FeatureShowcase />

        {/* 5. Storage Experience Simulator */}
        <StorageSimulator />

        {/* 6. Role Overview & Permissions Matrix */}
        <RoleMatrix />

        {/* 7. Final CTA */}
        <FinalCta />
      </main>

      {/* 8. Minimal Product Footer */}
      <footer className="border-t border-zinc-200/70 dark:border-zinc-800/70 py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50/50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-bold">
                IS
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">ImageSpace</span>
            </div>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">·</span>
            <span>Collaborative image storage and organization for modern teams.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
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
              Get Started
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-zinc-200/40 dark:border-zinc-800/40 text-center text-[11px] text-zinc-400">
          &copy; {new Date().getFullYear()} ImageSpace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
