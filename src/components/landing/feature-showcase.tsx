"use client";

import * as React from "react";
import {
  CloudUpload,
  FolderKanban,
  Tag,
  Trash2,
  ShieldCheck,
  Check,
  Zap,
  Lock,
  Cpu,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";

interface FeatureTab {
  id: string;
  tabLabel: string;
  icon: React.ElementType;
  badge: string;
  title: string;
  subtitle: string;
  summary: string;
  pointsLeft: string[];
  secondaryTitle: string;
  secondaryCopy: string;
  pointsRight: { title: string; desc: string }[];
}

const featuresData: FeatureTab[] = [
  {
    id: "ingestion",
    tabLabel: "Direct Pipeline",
    icon: CloudUpload,
    badge: "Cloud-Native Protocol",
    title: "Zero-Intermediary Presigned Ingestion",
    subtitle: "High-throughput uploads streaming directly from browser to cloud storage",
    summary:
      "Your application server never buffers heavy binary payloads. Upload transfers stream directly from the client browser straight into private S3-compatible cloud vaults using single-use, time-restricted cryptographic signatures.",
    pointsLeft: [
      "10 MB max per image with strict client-side validation",
      "Concurrent batch uploads up to 10 files simultaneously",
      "Cryptographically signed short-lived presigned tokens",
      "Zero backend memory load, worker stalls, or network timeouts",
    ],
    secondaryTitle: "Edge-Validated Security & Throughput",
    secondaryCopy:
      "Traditional file uploads exhaust server bandwidth and create costly memory spikes during concurrent uploads. ImageSpace provisions authenticated presigned PUT endpoints in under 40ms, allowing direct-to-storage streaming with near-instant client responsiveness.",
    pointsRight: [
      {
        title: "Sub-40ms Token Generation",
        desc: "Instant pre-flight cryptographic handshakes generated on-demand.",
      },
      {
        title: "Per-Asset Quarantine",
        desc: "Strict MIME verification rejects corrupted or forged files before upload completes.",
      },
      {
        title: "Zero Compute Spikes",
        desc: "Background transfers run independently of core API server threads.",
      },
    ],
  },
  {
    id: "workspaces",
    tabLabel: "Isolated Spaces",
    icon: FolderKanban,
    badge: "Multi-Tenant Boundaries",
    title: "Sandboxed Team Workspaces",
    subtitle: "Complete organizational isolation for distinct client campaigns and creative archives",
    summary:
      "Isolate internal brand assets from client deliverables. Each workspace maintains its own autonomous 500 MB quota, dedicated member directory, and independent permission boundary with zero data bleed.",
    pointsLeft: [
      "Up to 2 completely isolated team workspaces per account",
      "Independent 500 MB storage quota per workspace container",
      "Dedicated member rosters with granular email invitations",
      "Zero cross-workspace visibility or accidental file leaks",
    ],
    secondaryTitle: "Autonomous Tenant Architecture",
    secondaryCopy:
      "Every asset query, member lookup, and quota computation is scoped at the database index level. Creative teams can freely collaborate with freelance contractors or external clients without risking visibility into sensitive internal projects.",
    pointsRight: [
      {
        title: "Strict Partitioning",
        desc: "Indexed tenant keys enforce deterministic data isolation on every read and write.",
      },
      {
        title: "Dynamic Quota Metering",
        desc: "Live storage consumption computed accurately down to the byte in real-time.",
      },
      {
        title: "Effortless Switching",
        desc: "Jump across workspace contexts with smooth, state-preserved sidebar switching.",
      },
    ],
  },
  {
    id: "taxonomy",
    tabLabel: "Smart Taxonomy",
    icon: Tag,
    badge: "Sub-Second Discovery",
    title: "Multi-Dimensional Tag Taxonomy",
    subtitle: "Transform sprawling visual assets into an instantly queryable creative repository",
    summary:
      "File naming conventions break down as libraries scale. ImageSpace equips every asset with up to 20 case-sensitive tags, allowing multi-tag intersections, instantaneous filename filtering, and fluid sorting across your entire asset catalog.",
    pointsLeft: [
      "Up to 20 granular, case-sensitive tags on every image",
      "Instant client-side multi-tag query intersections",
      "Real-time filename search with debounced index lookups",
      "Chronological and dimensional sorting by upload date, size & name",
    ],
    secondaryTitle: "High-Precision Asset Retrieval",
    secondaryCopy:
      "Finding the right asset shouldn't require digging through nested folders. By decoupling visual assets from rigid folder hierarchies, your team can search dynamically by campaign tag, aspect ratio, or shoot name with sub-millisecond retrieval speeds.",
    pointsRight: [
      {
        title: "Faceted Filtering",
        desc: "Combine multiple tags seamlessly to isolate precise asset subsets instantly.",
      },
      {
        title: "Case-Preserved Keys",
        desc: "Differentiate exact production tags like #Hero vs #hero without collisions.",
      },
      {
        title: "Zero-Latency Caching",
        desc: "Optimized response envelopes keep gallery interactions silky-smooth.",
      },
    ],
  },
  {
    id: "retention",
    tabLabel: "Resilient Retention",
    icon: Trash2,
    badge: "Accident Protection",
    title: "30-Day Resilient Trash Vault",
    subtitle: "Enterprise-grade soft deletion with automated lifecycle protection and one-click recovery",
    summary:
      "Accidental deletions never result in immediate permanent loss. Soft-deleted assets are quarantined safely in the Trash vault for 30 full days, enabling the Owner to inspect, restore, or permanently purge storage whenever needed.",
    pointsLeft: [
      "30-day safety quarantine for all deleted workspace assets",
      "One-click lossless restoration preserving all metadata and tags",
      "Owner-governed permanent purge privileges for storage reclamation",
      "Automated lifecycle expiration without manual maintenance required",
    ],
    secondaryTitle: "Disaster-Proof Creative Continuity",
    secondaryCopy:
      "Creative production is fast-paced and prone to misclicks. The Trash vault ensures accidental file removals are non-destructive, while giving workspace Owners absolute administrative control over permanent deletion and quota recovery.",
    pointsRight: [
      {
        title: "Lossless Rollback",
        desc: "Restored images return to their exact original workspace location with tags intact.",
      },
      {
        title: "Owner Authority",
        desc: "Only workspace Owners possess destructive permissions to permanently purge files.",
      },
      {
        title: "Transparent Quotas",
        desc: "Quarantined files don't lock your active gallery, keeping your workspace uncluttered.",
      },
    ],
  },
];

export function FeatureShowcase() {
  const [activeTabId, setActiveTabId] = React.useState<string>("ingestion");

  const activeFeature =
    featuresData.find((f) => f.id === activeTabId) || featuresData[0];

  return (
    <section id="features" className="py-14 sm:py-20 lg:py-24 w-full">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Centered Section Header without 'Architecture & Features' label */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            Engineered for reliable image management
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            Direct cloud pipelines, isolated workspaces, and automatic retention protection.
          </p>
        </div>

        {/* Features-4 Interactive Tab Switcher Bar */}
        <div className="mt-10 sm:mt-12 flex items-center justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md shadow-xs">
            {featuresData.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTabId;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTabId(item.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200/60 dark:border-zinc-700/60"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  />
                  <span>{item.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Feature Block: Text-Focused Two-Column Architecture (No Chart) */}
        <div className="mt-8 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-6 sm:p-10 lg:p-12 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Primary Architecture & Direct Flow */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                <activeFeature.icon className="h-3.5 w-3.5 text-blue-500" />
                <span>{activeFeature.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {activeFeature.title}
              </h3>

              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                {activeFeature.summary}
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {activeFeature.pointsLeft.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-600 dark:text-zinc-400">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: In-Depth Engineering Details (Text-Driven, Chart Removed) */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/70 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {activeFeature.secondaryTitle}
                    </h4>
                    <p className="text-[11px] text-zinc-400">Technical Deep Dive</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {activeFeature.secondaryCopy}
                </p>

                <div className="space-y-3 pt-1">
                  {activeFeature.pointsRight.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 flex items-start gap-3"
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Supporting Grid: 3 Clean Architectural Columns */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: Two Workspaces */}
          <div className="group rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-6 sm:p-7 flex flex-col justify-between hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300">
            <div>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                <FolderKanban className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Two Workspaces
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Create up to 2 distinct workspaces to isolate client productions, editorial campaigns, or department archives with isolated quotas.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 flex items-center justify-between">
              <span>Up to 3 members per workspace</span>
              <span className="font-mono text-zinc-400 text-[11px]">2 Max</span>
            </div>
          </div>

          {/* Card 2: Up to 20 Tags */}
          <div className="group rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-6 sm:p-7 flex flex-col justify-between hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300">
            <div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                <Tag className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Up to 20 Tags per Image
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Case-sensitive tags provide multi-dimensional taxonomy. Filter massive galleries with instant compound tag queries and zero lag.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                #Product
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                #editorial
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                #Summer2026
              </span>
            </div>
          </div>

          {/* Card 3: 30-Day Trash Recovery */}
          <div className="group rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300">
            <div>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                <Trash2 className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                30-Day Trash Recovery
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Soft-deleted images remain safely restorable for 30 days before permanent deletion purges storage and frees quota automatically.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 flex items-center justify-between">
              <span>Automatic quota release upon purge</span>
              <span className="font-mono text-zinc-400 text-[11px]">30 Days</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
