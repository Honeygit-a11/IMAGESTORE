import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero";
import { ProductBenefits } from "@/components/landing/product-benefits";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { StorageSimulator } from "@/components/landing/storage-simulator";
import { RoleMatrix } from "@/components/landing/role-matrix";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer8 } from "@/components/ui/footer-8";

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

      {/* 8. ReactBits Pro Footer-8 with ImageSpace Branding */}
      <Footer8 />
    </div>
  );
}
