"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Loader2,
  Clock,
  HardDrive,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { GridSkeleton } from "@/components/ui/skeleton-loaders";
import { Stagger, MountReveal } from "@/components/ui/stagger";
import { toast } from "sonner";

const typeBadgeColor: Record<string, string> = {
  "image/jpeg": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "image/png": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "image/webp": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "image/gif": "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  "image/svg+xml": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

interface TrashItem {
  id: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  thumbnailKey: string | null;
  storageKey: string;
  deletedAt: string | null;
  permanentDeleteAt: string | null;
  daysRemaining: number;
}

export default function TrashPage() {
  const params = useParams<{ id: string }>();

  const [items, setItems] = React.useState<TrashItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modals state
  const [emptyTrashOpen, setEmptyTrashOpen] = React.useState(false);
  const [emptyTrashLoading, setEmptyTrashLoading] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<TrashItem | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);

  const fetchTrash = React.useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/workspaces/${params.id}/trash`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Could not load Trash.");
        return;
      }

      setItems(data.data || []);
    } catch {
      setError("Network error loading Trash items.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleRestore = async (id: string, fileName: string) => {
    try {
      setRestoringId(id);
      const res = await fetch(`/api/v1/workspaces/${params.id}/trash/${id}/restore`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to restore image.");
        return;
      }

      toast.success(`"${fileName}" restored to active workspace!`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Error restoring image.");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(
        `/api/v1/workspaces/${params.id}/trash/${itemToDelete.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to permanently delete image.");
        return;
      }

      toast.success(`"${itemToDelete.fileName}" permanently purged from storage.`);
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch {
      toast.error("Error purging image.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      setEmptyTrashLoading(true);
      const res = await fetch(`/api/v1/workspaces/${params.id}/trash`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to empty Trash.");
        return;
      }

      toast.success("Trash emptied. All deleted assets permanently erased.");
      setItems([]);
      setEmptyTrashOpen(false);
    } catch {
      toast.error("Error emptying Trash.");
    } finally {
      setEmptyTrashLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <div className="h-3 w-20 rounded bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
          <span>/</span>
          <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
        <div className="pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-9 w-52 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
        </div>
        <GridSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Trash Restricted</h2>
        <p className="text-xs text-zinc-500">{error}</p>
        <Link href={`/workspaces/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Workspace
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
          href={`/workspaces/${params.id}`}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspace
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">Trash Bin</span>
      </MountReveal>

      {/* Header Bar */}
      <MountReveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
              <Trash2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
              Trash Bin ({items.length})
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Deleted items remain recoverable for 30 days before permanent automatic purging.
            Assets in Trash continue counting toward your 500 MB storage quota.
          </p>
        </div>

        {items.length > 0 && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setEmptyTrashOpen(true)}
            className="shadow-xs"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Empty Trash ({items.length})
          </Button>
        )}
      </MountReveal>

      {/* Content Body */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-6 w-6 text-zinc-400 animate-float" />}
          title="Trash is empty"
          description="There are no soft-deleted images in this workspace. Deleted assets will appear here for 30 days before permanent purging."
          action={
            <Link href={`/workspaces/${params.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Return to Gallery
              </Button>
            </Link>
          }
        />
      ) : (
        <Stagger stagger={0.07} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const urgent = item.daysRemaining <= 7;
            const critical = item.daysRemaining <= 3;
            const typeClass =
              typeBadgeColor[item.fileType] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
            return (
            <div
              key={item.id}
              className={`group relative overflow-hidden p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md hover:border-amber-300/50 dark:hover:border-amber-700/50 hover:-translate-y-0.5 transition-all duration-200 ${
                critical ? "animate-pulse" : ""
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-70" />
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={item.fileName}>
                    {item.fileName}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      urgent
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {item.daysRemaining}d left
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatBytes(item.fileSize)}
                  </span>
                  <span>·</span>
                  <span className={`uppercase px-1.5 py-0.5 rounded ${typeClass}`}>
                    {item.fileType.split("/")[1] || "IMAGE"}
                  </span>
                </div>

                {item.deletedAt && (
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Deleted on {new Date(item.deletedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(item.id, item.fileName)}
                  disabled={restoringId === item.id}
                  className="text-xs h-8 flex-1 hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-950/40 dark:hover:to-emerald-900/40"
                >
                  {restoringId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                  )}
                  Restore
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setItemToDelete(item)}
                  className="text-xs h-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Forever
                </Button>
              </div>
            </div>
            );
          })}
        </Stagger>
      )}

      {/* Confirmation: Empty Trash */}
      <ConfirmationDialog
        open={emptyTrashOpen}
        onOpenChange={(open) => setEmptyTrashOpen(open)}
        onConfirm={handleEmptyTrash}
        title="Empty Workspace Trash"
        description="Are you sure you want to empty the Trash? All deleted images will be permanently erased from Cloudflare R2 and cannot be recovered. Your storage quota will be freed immediately."
        confirmText="Empty Trash Forever"
        loading={emptyTrashLoading}
      />

      {/* Confirmation: Delete Single Item */}
      <ConfirmationDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handlePermanentDelete}
        title={`Permanently Delete "${itemToDelete?.fileName}"`}
        description="This image will be permanently deleted from Cloudflare R2 object storage immediately. This action cannot be undone."
        confirmText="Delete Permanently"
        loading={deleteLoading}
      />
    </div>
  );
}
