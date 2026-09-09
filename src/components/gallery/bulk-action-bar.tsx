"use client";

import * as React from "react";
import { Tag as TagIcon, X, Plus, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";

interface BulkActionBarProps {
  workspaceId: string;
  selectedIds: string[];
  maxSelect?: number;
  onClearSelection: () => void;
  onActionComplete: () => void;
  canEditTags: boolean;
  canDelete?: boolean;
}

export function BulkActionBar({
  workspaceId,
  selectedIds,
  maxSelect = 10,
  onClearSelection,
  onActionComplete,
  canEditTags,
  canDelete = false,
}: BulkActionBarProps) {
  const [isTagModalOpen, setIsTagModalOpen] = React.useState(false);
  const [tagInput, setTagInput] = React.useState("");
  const [tagsToAdd, setTagsToAdd] = React.useState<string[]>([]);
  const [applying, setApplying] = React.useState(false);

  // Bulk Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  if (selectedIds.length === 0) return null;

  const handleAddTagToQueue = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tagsToAdd.includes(trimmed)) {
      setTagInput("");
      return;
    }
    setTagsToAdd((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const handleApplyTags = async () => {
    if (tagsToAdd.length === 0) return;
    setApplying(true);

    try {
      for (const imageId of selectedIds) {
        for (const tagName of tagsToAdd) {
          try {
            await fetch(`/api/v1/workspaces/${workspaceId}/images/${imageId}/tags`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tagName }),
            });
          } catch {
            // continue other tags
          }
        }
      }

      toast.success(
        `Applied ${tagsToAdd.length} tag${tagsToAdd.length > 1 ? "s" : ""} to ${
          selectedIds.length
        } image${selectedIds.length > 1 ? "s" : ""}.`
      );
      setIsTagModalOpen(false);
      setTagsToAdd([]);
      onActionComplete();
    } catch {
      toast.error("Failed to apply tags in bulk.");
    } finally {
      setApplying(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/images/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to delete selected images.");
        return;
      }

      toast.success(data.data?.message || "Selected images moved to Trash.");
      setIsDeleteModalOpen(false);
      onActionComplete();
    } catch {
      toast.error("Error moving images to Trash.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-zinc-900/95 dark:bg-zinc-900/95 text-white border border-zinc-700/60 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>
              {selectedIds.length} / {maxSelect} Selected
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          <div className="flex items-center gap-2">
            {canEditTags && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsTagModalOpen(true)}
                className="text-xs h-8 bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 cursor-pointer"
              >
                <TagIcon className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                Add Tags
              </Button>
            )}

            {canDelete && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs h-8 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Move to Trash
              </Button>
            )}

            <button
              type="button"
              onClick={onClearSelection}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Tagging Modal */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-blue-500" />
                Add Tags to {selectedIds.length} Images
              </h3>
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Tags are case-sensitive. Each image can have up to 20 tags.
            </p>

            {/* Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTagToQueue();
                  }
                }}
                placeholder="Type tag and press Enter..."
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddTagToQueue}
                disabled={!tagInput.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Tags Queue */}
            {tagsToAdd.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tagsToAdd.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTagsToAdd((prev) => prev.filter((t) => t !== tag))}
                      className="cursor-pointer hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTagModalOpen(false)}
                disabled={applying}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyTags}
                disabled={tagsToAdd.length === 0 || applying}
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Apply Tags
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation: Bulk Move to Trash */}
      <ConfirmationDialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => setIsDeleteModalOpen(open)}
        onConfirm={handleBulkDelete}
        title={`Move ${selectedIds.length} Images to Trash?`}
        description="Selected items will be moved to the Trash bin for 30 days before permanent purging. Note that items in Trash continue to count toward your storage quota until permanently erased."
        confirmText="Move to Trash"
        loading={deleting}
      />
    </>
  );
}
