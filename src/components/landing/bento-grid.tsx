import * as React from "react";
import {
  CloudUpload,
  Tag,
  Trash2,
  FolderKanban,
  Lock,
} from "lucide-react";

export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Box 1: Direct Cloudflare R2 Uploads (Large - 2 cols) */}
      <div className="md:col-span-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CloudUpload className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Cloudflare R2 Direct-to-Storage
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Zero Server Bottlenecks with Presigned URLs
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
            Large image uploads never burden your Next.js application server. The browser requests a short-lived cryptographically signed token, and transfers high-resolution files directly to private Cloudflare R2 object storage.
          </p>
        </div>

        {/* Visual pipeline diagram */}
        <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            Client Browser
          </div>
          <span className="text-zinc-400 font-mono text-[11px]">&rarr; 1. Signed URL &rarr;</span>
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
            ImageSpace API
          </div>
          <span className="text-zinc-400 font-mono text-[11px]">&rarr; 2. Direct S3 Upload &rarr;</span>
          <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Private R2 Bucket
          </div>
        </div>
      </div>

      {/* Box 2: 2 Workspaces Max (1 col) */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 shadow-sm flex flex-col justify-between">
        <div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <FolderKanban className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Workspace Quota
          </span>
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            2 Workspaces Max
          </h3>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Create up to 2 distinct team workspaces with duplicate name support and destructive GitHub-style deletion confirmation.
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500">
          3 Members Max per Workspace
        </div>
      </div>

      {/* Box 3: Case-Sensitive Tags (1 col) */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 shadow-sm flex flex-col justify-between">
        <div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <Tag className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Organization
          </span>
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            Case-Sensitive Tags
          </h3>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Attach up to 20 case-sensitive tags per image during upload or later. &quot;Design&quot; and &quot;design&quot; are treated as distinct tags.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">#Hero</span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">#hero</span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">#Editorial</span>
        </div>
      </div>

      {/* Box 4: 30-Day Trash & Recovery (2 cols) */}
      <div className="md:col-span-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Trash2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Soft Deletion & Protection
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            30-Day Trash Recovery with Automatic Quota Release
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
            Accidentally deleted an asset? Images in Trash remain recoverable by the Workspace Owner for 30 days. Trashed images count toward your 500 MB quota until permanent deletion completely cleans up R2 storage keys and releases user quota.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">10 MB</div>
            <div className="text-[10px] text-zinc-400">Max File Size</div>
          </div>
          <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">10 Files</div>
            <div className="text-[10px] text-zinc-400">Batch Upload Limit</div>
          </div>
          <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">6 Formats</div>
            <div className="text-[10px] text-zinc-400">JPG, PNG, WEBP, GIF, HEIC</div>
          </div>
          <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">30 Days</div>
            <div className="text-[10px] text-zinc-400">Trash Retention</div>
          </div>
        </div>
      </div>
    </div>
  );
}
