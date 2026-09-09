"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Clock,
  HardDrive,
  ImageIcon,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

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
  const router = useRouter();

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-400">Loading Trash items...</p>
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
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Link
          href={`/workspaces/${params.id}`}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspace
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">Trash Bin</span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
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
      </div>

      {/* Content Body */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-6 w-6 text-zinc-400" />}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={item.fileName}>
                    {item.fileName}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
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
                  <span className="uppercase">{item.fileType.split("/")[1] || "IMAGE"}</span>
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
                  className="text-xs h-8 flex-1"
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
          ))}
        </div>
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
