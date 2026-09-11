"use client";

import * as React from "react";
import {
  CloudUpload,
  Tags,
  Users,
  CheckCircle2,
  Lock,
  Search,
  SlidersHorizontal,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";

export function ProductBenefits() {
  return (
    <section id="capabilities" className="w-full py-12 sm:py-16 lg:py-20">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            Everything your workspace needs
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            Store, organize, and share images without losing control of your files.
          </p>
        </div>

        {/* 3 Focused Feature Blocks with Spotlight Glow */}
        <div className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10">
          {/* Block 1: Upload */}
          <GlowCard
            customSize
            glowColor="blue"
            className="group flex flex-col justify-between rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 p-6 sm:p-7 border border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-300 hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10"
          >
            <div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all duration-300">
                <CloudUpload className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                Direct & Secure Ingestion
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Browser-to-cloud uploads using presigned tokens. Transfer files up to 10 MB each without overloading your server.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Direct image uploads with presigned URLs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Encrypted private cloud storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Batch uploads up to 10 files</span>
                </li>
              </ul>
            </div>

            {/* Supporting Micro-visual */}
            {/* <div className="mt-6 pt-5 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center justify-between text-[11px] p-2.5 rounded-lg bg-white dark:bg-zinc-950/80 border border-zinc-200/50 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 group-hover:border-blue-200 dark:group-hover:border-blue-900/60 transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate">asset-2026.webp</span>
                  <span className="text-[10px] text-zinc-400">4.2 MB</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <Lock className="h-3 w-3" /> Presigned
                </span>
              </div>
            </div> */}
          </GlowCard>

          {/* Block 2: Organize */}
          <GlowCard
            customSize
            glowColor="purple"
            className="group flex flex-col justify-between rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 p-6 sm:p-7 border border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-300 hover:border-indigo-500/50 dark:hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <div>
              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-all duration-300">
                <Tags className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                Taxonomy & Quick Search
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Attach case-sensitive tags, search by filename, and sort across thousands of visual assets instantly.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Up to 20 case-sensitive tags per image</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Instant filename search & filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Sorting by upload date, size & name</span>
                </li>
              </ul>
            </div>

            {/* Supporting Micro-visual */}
            {/* <div className="mt-6 pt-5 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-zinc-950/80 border border-zinc-200/50 dark:border-zinc-800/80 group-hover:border-indigo-200 dark:group-hover:border-indigo-900/60 transition-colors">
                <Search className="h-3 w-3 text-zinc-400 ml-1 shrink-0" />
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  #Product
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  #editorial
                </span>
                <span className="text-[10px] text-zinc-400 ml-auto mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="h-2.5 w-2.5" /> 8 matches
                </span>
              </div>
            </div> */}
          </GlowCard>

          {/* Block 3: Collaborate */}
          <GlowCard
            customSize
            glowColor="green"
            className="group flex flex-col justify-between rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 p-6 sm:p-7 border border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-300 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-all duration-300">
                <Users className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                Team Roles & Control
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Manage who can view, upload, or delete assets with 3 explicit tiers and email-based workspace invitations.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Owner, Editor, and Viewer permissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Direct email workspace invitations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Up to 3 total members per workspace</span>
                </li>
              </ul>
            </div>

            {/* Supporting Micro-visual */}
            {/* <div className="mt-6 pt-5 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-950/80 border border-zinc-200/50 dark:border-zinc-800/80 text-[11px] group-hover:border-emerald-200 dark:group-hover:border-emerald-900/60 transition-colors">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <Mail className="h-3 w-3 text-zinc-400" />
                  <span>alex@team.co</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" /> Editor
                </span>
              </div>
            </div> */}
          </GlowCard>
        </div>
      </div>
    </section>
  );
}
