"use client";

import * as React from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FolderKanban,
  HardDrive,
  Users,
  Search,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", {
        opacity: 0,
        y: -15,
        duration: 0.6,
      })
        .from(
          ".hero-title",
          {
            opacity: 0,
            y: 25,
            duration: 0.8,
          },
          "-=0.3"
        )
        .from(
          ".hero-desc",
          {
            opacity: 0,
            y: 20,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          ".hero-cta",
          {
            opacity: 0,
            scale: 0.95,
            duration: 0.5,
          },
          "-=0.4"
        )
        .from(
          ".hero-mockup",
          {
            opacity: 0,
            y: 40,
            duration: 1,
          },
          "-=0.3"
        );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-36 text-center"
    >
      {/* Background Ambient Aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/10 via-indigo-500/15 to-purple-600/10 dark:from-blue-500/20 dark:via-purple-600/20 dark:to-emerald-500/10 blur-[100px] -z-10 rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated Badge */}
        <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 px-4 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-8 backdrop-blur-md shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
          <span>ImageSpace Engine · 500 MB Storage · 2 Workspaces</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.08]">
          Curate, collaborate, and store images with precision.
        </h1>

        {/* Subtitle */}
        <p className="hero-desc mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          The collaborative image storage platform for teams. Create up to 2 workspaces, organize with case-sensitive tags, manage 3-tier role permissions, and upload directly to Cloudflare R2.
        </p>

        {/* Action CTAs */}
        <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg">
              Start Free Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In to Workspaces
            </Button>
          </Link>
        </div>

        {/* Interactive Workspace Mockup Card */}
        <div className="hero-mockup mt-16 max-w-5xl mx-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl text-left">
          {/* Mockup Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                IS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Studio Alpha Workspace
                  </h2>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    OWNER
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">3 of 3 Members · 128 MB used</p>
              </div>
            </div>

            {/* Filter Bar in Mockup */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-400">
                <Search className="h-3.5 w-3.5" />
                <span>Search by filename...</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <Tag className="h-3 w-3" />
                <span>Product (8)</span>
              </div>
            </div>
          </div>

          {/* Gallery Grid Preview in Mockup */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
            {[
              { name: "hero-landscape.jpg", size: "3.8 MB", tag: "Landscape", color: "from-blue-500/20 to-indigo-500/30" },
              { name: "product-editorial.png", size: "2.4 MB", tag: "Product", color: "from-purple-500/20 to-pink-500/30" },
              { name: "brand-mockup-v2.webp", size: "1.9 MB", tag: "Branding", color: "from-emerald-500/20 to-teal-500/30" },
              { name: "campaign-shoot.png", size: "4.1 MB", tag: "Campaign", color: "from-amber-500/20 to-orange-500/30" },
            ].map((img, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-950 transition-all hover:shadow-md"
              >
                <div
                  className={`h-28 w-full bg-gradient-to-tr ${img.color} flex items-center justify-center`}
                >
                  <ImageIcon className="h-8 w-8 text-zinc-400/80 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="p-2.5 bg-white dark:bg-zinc-900">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {img.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                    <span>{img.size}</span>
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.2 rounded font-medium">
                      {img.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mockup Footer Stats */}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Direct Cloudflare R2 Uploads Active
              </span>
              <span>· Max 10MB/image</span>
            </div>
            <span className="font-mono text-zinc-400">128 MB / 500 MB Quota</span>
          </div>
        </div>
      </div>
    </section>
  );
}
