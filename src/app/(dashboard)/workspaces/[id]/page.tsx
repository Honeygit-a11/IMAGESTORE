"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Edit3,
  Eye,
  Users,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { StatGridSkeleton } from "@/components/ui/skeleton-loaders";
import { Stagger, MountReveal } from "@/components/ui/stagger";
import { ImageUploader } from "@/components/workspace/image-uploader";
import { ImageGallery } from "@/components/gallery/image-gallery";

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
  const [workspace, setWorkspace] = React.useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);

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
      <div className="space-y-8 animate-fade-in-up">
        <div className="h-4 w-40 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="h-10 w-64 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
            <div className="mt-2 h-3 w-72 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            <div className="h-8 w-28 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
        </div>
        <StatGridSkeleton count={4} className="sm:grid-cols-2 lg:grid-cols-4" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4 animate-scale-in">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto animate-float">
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
      <MountReveal direction="left" className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Link
          href="/dashboard"
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspaces
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold truncate max-w-xs">
          {workspace.name}
        </span>
      </MountReveal>

      {/* Header Bar */}
      <MountReveal className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
              {workspace.name}
            </h1>
            <span
              className={`animate-scale-in inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                workspace.role === "OWNER"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
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
          <Link href={`/workspaces/${workspace.id}/members`}>
            <Button variant="outline" size="sm">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              Members ({workspace.memberCount}/3)
            </Button>
          </Link>

          <Link href={`/workspaces/${workspace.id}/activity`}>
            <Button variant="outline" size="sm">
              <Activity className="h-3.5 w-3.5 text-blue-500" />
              Activity
            </Button>
          </Link>

          {workspace.isOwner && (
            <Link href={`/workspaces/${workspace.id}/trash`}>
              <Button variant="outline" size="sm">
                <Trash2 className="h-3.5 w-3.5 text-amber-500" />
                Trash ({workspace.trashCount})
              </Button>
            </Link>
          )}

          {workspace.role !== "VIEWER" && (
            <Button
              onClick={() => setIsUploaderOpen(true)}
              size="sm"
              className="shadow-sm"
            >
              <UploadCloud className="mr-1.5 h-4 w-4" />
              Upload Images
            </Button>
          )}
        </div>
      </MountReveal>

      {/* Metrics Banner */}
      <Stagger stagger={0.09} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile
          label="Active Images"
          value={workspace.imageCount}
          icon={<ImageIcon className="h-4 w-4" />}
          accent="blue"
          valueClassName="text-2xl"
        />
        <StatTile
          label="Storage Used"
          display={`${workspace.storageUsedMb} MB`}
          icon={<Activity className="h-4 w-4" />}
          accent="green"
          valueClassName="text-2xl"
        />
        <StatTile
          label="Unique Tags"
          value={workspace.tagCount}
          icon={<Activity className="h-4 w-4" />}
          accent="purple"
          valueClassName="text-2xl"
        />
        <StatTile
          label="Member Limit"
          value={workspace.memberCount}
          suffix=" / 3"
          icon={<Users className="h-4 w-4" />}
          accent="amber"
          valueClassName="text-2xl"
        />
      </Stagger>

      {/* Gallery Section */}
      <section className="space-y-4">
        <MountReveal className="flex items-center justify-between">
          <h2 className="text-base font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            Image Gallery
          </h2>
          <span className="text-xs text-zinc-400">
            {workspace.imageCount} items
          </span>
        </MountReveal>

        <ImageGallery
          workspaceId={workspace.id}
          role={workspace.role}
          onOpenUploader={() => setIsUploaderOpen(true)}
          refreshToken={refreshToken}
        />
      </section>

      {/* Interactive Image Uploader Modal */}
      <ImageUploader
        workspaceId={workspace.id}
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUploadSuccess={() => {
          fetchWorkspace();
          setRefreshToken((r) => r + 1);
        }}
      />
    </div>
  );
}