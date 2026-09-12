"use client";

import * as React from "react";
import {
  Crown,
  Edit3,
  Eye,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type RoleType = "OWNER" | "EDITOR" | "VIEWER";

interface PermissionRule {
  feature: string;
  owner: boolean;
  editor: boolean;
  viewer: boolean;
}

const permissionsList: PermissionRule[] = [
  { feature: "View and browse images in gallery", owner: true, editor: true, viewer: true },
  { feature: "Lightbox preview & single image download", owner: true, editor: true, viewer: true },
  { feature: "Filter by tags & search by filename", owner: true, editor: true, viewer: true },
  { feature: "Upload new images (max 10MB, up to 10 batch)", owner: true, editor: true, viewer: false },
  { feature: "Edit or remove tags on images", owner: true, editor: true, viewer: false },
  { feature: "Delete own uploaded images", owner: true, editor: true, viewer: false },
  { feature: "Delete any member's image", owner: true, editor: false, viewer: false },
  { feature: "Access Trash bin & restore deleted images", owner: true, editor: false, viewer: false },
  { feature: "View uploader identity & upload timestamp", owner: true, editor: false, viewer: false },
  { feature: "Invite & remove workspace members (max 3)", owner: true, editor: false, viewer: false },
  { feature: "Change member roles (Editor ↔ Viewer)", owner: true, editor: false, viewer: false },
  { feature: "Initiate ownership transfer to member", owner: true, editor: false, viewer: false },
  { feature: "View workspace audit activity logs", owner: true, editor: false, viewer: false },
  { feature: "Destructive workspace deletion", owner: true, editor: false, viewer: false },
];

export function RoleMatrix() {
  const [showFullMatrix, setShowFullMatrix] = React.useState(false);
  const [activeRole, setActiveRole] = React.useState<RoleType>("OWNER");

  return (
    <section id="roles" className="py-12 sm:py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            Simple roles. Clear control.
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
            Every workspace supports up to 3 total members with three straightforward access tiers.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Owner Card */}
          <div
            onClick={() => setActiveRole("OWNER")}
            className={`rounded-2xl p-7 transition-all border cursor-pointer ${
              activeRole === "OWNER"
                ? "bg-white dark:bg-zinc-900 border-amber-500/50 dark:border-amber-500/40 shadow-xs"
                : "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Crown className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                Full Control
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Owner
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
              Full workspace control and member governance.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Manage settings & initiate ownership transfer</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Invite and remove members (up to 3 total)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Access Trash to restore or permanently purge files</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Inspect full workspace audit activity logs</span>
              </li>
            </ul>
          </div>

          {/* Editor Card */}
          <div
            onClick={() => setActiveRole("EDITOR")}
            className={`rounded-2xl p-7 transition-all border cursor-pointer ${
              activeRole === "EDITOR"
                ? "bg-white dark:bg-zinc-900 border-blue-500/50 dark:border-blue-500/40 shadow-xs"
                : "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Edit3 className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                Contributor
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Editor
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
              Upload and manage own visual assets.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Upload images (up to 10 files per batch, 10MB each)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Add, update, or remove tags on image assets</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Delete own uploaded images</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Browse, filter, and download all gallery images</span>
              </li>
            </ul>
          </div>

          {/* Viewer Card */}
          <div
            onClick={() => setActiveRole("VIEWER")}
            className={`rounded-2xl p-7 transition-all border cursor-pointer ${
              activeRole === "VIEWER"
                ? "bg-white dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 shadow-xs"
                : "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
                <Eye className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                Read Only
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Viewer
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
              Browse galleries and download image assets.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Browse and inspect all images across the workspace</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>High-resolution lightbox preview</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Filter by tags and search by filename</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Download images directly to local device</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Progressive Disclosure Toggle */}
        <div className="mt-10 flex flex-col items-center">
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowFullMatrix(!showFullMatrix)}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            {showFullMatrix ? "Hide full permission matrix" : "View full permissions"}
            {showFullMatrix ? (
              <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Expandable Detailed 14-Row Capability Matrix */}
        {showFullMatrix && (
          <div className="mt-8 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 shadow-xs overflow-hidden transition-all duration-300">
            <div className="mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Comprehensive Capability Matrix
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  14 explicit authorization boundaries enforced across the ImageSpace API.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
                <span className="text-amber-600 dark:text-amber-400">Owner</span>
                <span className="text-blue-600 dark:text-blue-400">Editor</span>
                <span className="text-zinc-500 dark:text-zinc-400">Viewer</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-medium">
                    <th className="pb-3 px-3 font-medium">Permission / Capability</th>
                    <th className="pb-3 px-3 text-center font-medium w-24">Owner</th>
                    <th className="pb-3 px-3 text-center font-medium w-24">Editor</th>
                    <th className="pb-3 px-3 text-center font-medium w-24">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {permissionsList.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300">
                        {item.feature}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.owner ? (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.editor ? (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.viewer ? (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
