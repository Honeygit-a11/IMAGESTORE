"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Edit3,
  Eye,
  Users,
  HardDrive,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Activity,
  Tag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageUploader } from "@/components/workspace/image-uploader";
import { toast } from "sonner";

interface WorkspaceDetail {
  id: string;
  name: string;
  owner: { id: string; name: string | null; email: string };
  isOwner: boolean;
  role: "OWNER" | "EDITOR" | "VIEWER";
  memberCount: number;
  imageCount: number;
  tagCount: number;
  trashCount: number;
  storageUsedBytes: number;
  storageUsedMb: string;
  createdAt: string;
}

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = React.useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = React.useState(false);

  const fetchWorkspace = React.useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/v1/workspaces/${params.id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Workspace not found or unauthorized.");
        return;
      }

      setWorkspace(data.data);
    } catch {
      setError("Network error while loading workspace.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-400">Loading workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Cannot Access Workspace
        </h2>
        <p className="text-xs text-zinc-500">{error || "Workspace not found"}</p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Workspaces
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Link
          href="/dashboard"
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspaces
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold truncate max-w-xs">
          {workspace.name}
        </span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {workspace.name}
            </h1>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                workspace.role === "OWNER"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : workspace.role === "EDITOR"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {workspace.role === "OWNER" && <Crown className="h-3 w-3" />}
              {workspace.role === "EDITOR" && <Edit3 className="h-3 w-3" />}
              {workspace.role === "VIEWER" && <Eye className="h-3 w-3" />}
              {workspace.role}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Owned by {workspace.owner.name || workspace.owner.email} · Created{" "}
            {new Date(workspace.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Quick Actions & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Member Counter Button */}
          <Link href={`/workspaces/${workspace.id}/members`}>
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span>Members ({workspace.memberCount}/3)</span>
            </button>
          </Link>

          {/* Trash Button (Only Owner has trash access) */}
          {workspace.isOwner && (
            <button
              onClick={() =>
                toast.info(
                  `Phase 13: Trash bin has ${workspace.trashCount} soft-deleted items.`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Trash ({workspace.trashCount})</span>
            </button>
          )}

          {/* Upload Button (Owner and Editor only) */}
          {workspace.role !== "VIEWER" && (
            <Button
              onClick={() => setIsUploaderOpen(true)}
              size="sm"
              className="shadow-sm"
            >
              <UploadCloud className="mr-1.5 h-4 w-4" />
              Upload Image (Max 10MB)
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500 font-medium">Active Images</div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            {workspace.imageCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500 font-medium">Storage Used</div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            {workspace.storageUsedMb} MB
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500 font-medium">Unique Tags</div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            {workspace.tagCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500 font-medium">Member Limit</div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            {workspace.memberCount} / 3
          </div>
        </div>
      </div>

      {/* Gallery Section / Empty Workspace State */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Gallery
          </h2>
          <span className="text-xs text-zinc-400">
            {workspace.imageCount} items
          </span>
        </div>

        {workspace.imageCount === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-6 w-6" />}
            title="Workspace is empty"
            description="No images uploaded yet. Upload images (up to 10 MB per file, max 10 batch) directly to Cloudflare R2 object storage."
            action={
              workspace.role !== "VIEWER" ? (
                <Button onClick={() => setIsUploaderOpen(true)}>
                  <UploadCloud className="mr-1.5 h-4 w-4" />
                  Upload First Image
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="p-12 text-center text-xs text-zinc-400">
            Gallery grid rendering in Phase 11.
          </div>
        )}
      </section>

      {/* Interactive Image Uploader Modal */}
      <ImageUploader
        workspaceId={workspace.id}
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUploadSuccess={() => {
          fetchWorkspace();
        }}
      />
    </div>
  );
}
