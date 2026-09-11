"use client";

import * as React from "react";
import { FolderKanban, UserPlus, UploadCloud, Tag } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Create a workspace",
    description:
      "Set up a shared team environment in seconds. Organize separate client archives or departments with up to 2 workspaces.",
    icon: FolderKanban,
  },
  {
    step: "02",
    title: "Invite your team",
    description:
      "Add up to 3 collaborators per workspace with email invites. Assign Owner, Editor, or Viewer privileges with full control.",
    icon: UserPlus,
  },
  {
    step: "03",
    title: "Upload images",
    description:
      "Drag and drop up to 10 images at once. Files up to 10 MB transfer directly to private storage using secure presigned URLs.",
    icon: UploadCloud,
  },
  {
    step: "04",
    title: "Organize with tags",
    description:
      "Attach up to 20 case-sensitive tags per image. Filter, search, and retrieve assets instantly across your entire gallery.",
    icon: Tag,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-12 sm:py-14 lg:py-16 bg-zinc-50/40 dark:bg-zinc-900/20 w-full"
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Centered Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            From upload to organized in four steps
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            A frictionless path to keep your team aligned and your image library structured.
          </p>
        </div>

        {/* Steps Flow Grid */}
        <div className="mt-8 sm:mt-10 relative">
          {/* Subtle horizontal connecting line on desktop */}
          <div
            className="hidden lg:block absolute top-6 left-12 right-12 h-px bg-gradient-to-r from-blue-500/20 via-indigo-500/30 to-emerald-500/20 dark:from-blue-500/30 dark:via-purple-500/30 dark:to-emerald-500/30 z-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 relative z-10">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group flex flex-col p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 backdrop-blur-xs relative"
                >
                  {/* Step header: Number + Icon with glow */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/60 shadow-2xs">
                      {item.step}
                    </span>
                    <div className="h-9 w-9 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/70 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-all duration-300">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
