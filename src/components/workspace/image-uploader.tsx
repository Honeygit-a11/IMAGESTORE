"use client";

import * as React from "react";
import {
  UploadCloud,
  X,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  WifiOff,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { toast } from "sonner";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TAGS = 20;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic"];

interface FileUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  errorMessage?: string;
  imageId?: string;
  storageKey?: string;
  uploadUrl?: string;
}

interface ImageUploaderProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export function ImageUploader({
  workspaceId,
  isOpen,
  onClose,
  onUploadSuccess,
}: ImageUploaderProps) {
  const [items, setItems] = React.useState<FileUploadItem[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const isOffline = React.useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => !navigator.onLine,
    () => false
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  // Offline toast notifications
  React.useEffect(() => {
    const handleOnline = () => {
      toast.success("Internet connection restored.");
    };
    const handleOffline = () => {
      toast.error("You are currently offline. Active uploads may be interrupted.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cleanup object URLs on unmount or items clear
  React.useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [items]);

  if (!isOpen) return null;

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Process incoming files from drag-and-drop, camera, or file picker
  const handleAddFiles = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    const currentCount = items.length;

    if (currentCount >= MAX_FILES) {
      toast.warning(`Maximum ${MAX_FILES} images allowed per batch.`);
      return;
    }

    const availableSlots = MAX_FILES - currentCount;
    if (fileArray.length > availableSlots) {
      toast.warning(`Batch limit reached. Only the first ${availableSlots} images were added.`);
    }

    const validFiles = fileArray.slice(0, availableSlots);
    const newItems: FileUploadItem[] = [];

    for (const file of validFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      // Validate format
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`"${file.name}" has an unsupported format. Allowed: JPG, PNG, WEBP, GIF, HEIC.`);
        continue;
      }

      // Validate individual size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 10 MB limit (${formatBytes(file.size)}).`);
        continue;
      }

      // Check if already in queue
      if (items.some((i) => i.file.name === file.name && i.file.size === file.size)) {
        toast.info(`"${file.name}" is already in your upload queue.`);
        continue;
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
        progress: 0,
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  // Remove individual file before or after upload
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  // Tag chip addition
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.length >= MAX_TAGS) {
      toast.warning(`Maximum ${MAX_TAGS} tags allowed.`);
      return;
    }
    if (tags.includes(trimmed)) {
      toast.info(`Tag "${trimmed}" is already added.`);
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Upload single item execution pipeline
  const uploadSingleItem = async (item: FileUploadItem): Promise<boolean> => {
    // 1. Mark item as uploading
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 5, errorMessage: undefined } : i))
    );

    let imageId = item.imageId;

    try {
      // Step A: Obtain Presigned URL if not already obtained
      if (!item.uploadUrl || !imageId) {
        const presignRes = await fetch(`/api/v1/workspaces/${workspaceId}/storage/presign-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: item.file.name,
            fileSize: item.file.size,
            fileType: item.file.type || "application/octet-stream",
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          const errMsg = presignData.error?.message || "Failed to obtain upload authorization.";
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "failed", errorMessage: errMsg, progress: 0 } : i))
          );
          return false;
        }

        imageId = presignData.data.imageId;
        item.uploadUrl = presignData.data.uploadUrl;
        item.imageId = imageId;

        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, imageId, uploadUrl: presignData.data.uploadUrl } : i))
        );
      }

      // Step B: Upload directly to R2 using XMLHttpRequest to monitor progress
      const uploadSuccess = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", item.uploadUrl!);
        xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.min(95, Math.round((evt.loaded / evt.total) * 100));
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress: pct } : i))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            resolve(false);
          }
        };

        xhr.onerror = () => resolve(false);
        xhr.ontimeout = () => resolve(false);

        xhr.send(item.file);
      });

      if (!uploadSuccess) {
        // Report failure to server
        if (imageId) {
          fetch(`/api/v1/workspaces/${workspaceId}/images/${imageId}/failed`, { method: "POST" }).catch(() => {});
        }
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "failed", errorMessage: "Storage upload failed. Please retry.", progress: 0 }
              : i
          )
        );
        return false;
      }

      // Step C: Confirm completion & attach pre-upload tags
      const completeRes = await fetch(`/api/v1/workspaces/${workspaceId}/images/${imageId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "failed", errorMessage: completeData.error?.message || "Failed to finalize upload." }
              : i
          )
        );
        return false;
      }

      // Step D: Completed successfully!
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "completed", progress: 100 } : i))
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during upload.";
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "failed", errorMessage: msg, progress: 0 } : i))
      );
      return false;
    }
  };

  // Start batch upload for all pending or failed items
  const handleStartBatchUpload = async () => {
    if (isOffline) {
      toast.error("Cannot upload while offline. Check your connection.");
      return;
    }

    const itemsToUpload = items.filter((i) => i.status === "pending" || i.status === "failed");
    if (itemsToUpload.length === 0) {
      toast.info("No pending files to upload.");
      return;
    }

    setIsUploading(true);

    let successCount = 0;
    let failureCount = 0;

    // Execute uploads concurrently (up to batch limit of 10)
    const results = await Promise.all(itemsToUpload.map((item) => uploadSingleItem(item)));

    results.forEach((success) => {
      if (success) successCount++;
      else failureCount++;
    });

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} image${successCount > 1 ? "s" : ""} uploaded successfully!`,
        { description: tags.length > 0 ? `Tagged with: ${tags.join(", ")}` : undefined }
      );
      onUploadSuccess?.();
    }

    if (failureCount > 0) {
      toast.error(`${failureCount} image${failureCount > 1 ? "s" : ""} failed to upload. Review errors below.`);
    }
  };

  // Retry individual item
  const handleRetryItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const success = await uploadSingleItem(item);
    if (success) {
      toast.success(`"${item.file.name}" uploaded successfully!`);
      onUploadSuccess?.();
    }
  };

  const completedCount = items.filter((i) => i.status === "completed").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Upload Images
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Max 10 files per batch · Up to 10 MB per image
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isUploading) {
                if (!confirm("Uploads are in progress. Are you sure you want to close?")) return;
              }
              onClose();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border-b border-amber-500/20">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>You are currently offline. Upload operations will be paused until connectivity returns.</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Dropzone & Triggers */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Hidden Mobile Camera Input */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Drag and drop images here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-bold"
                >
                  browse files
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                JPG, PNG, WEBP, GIF, HEIC supported
              </p>

              {/* Mobile Camera Option Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <Camera className="h-3.5 w-3.5 text-blue-500" />
                  <span>Take Photo / Camera</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pre-Upload Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Pre-Upload Tags ({tags.length}/{MAX_TAGS})
              </label>
              <span className="text-[11px] text-zinc-400">
                Case-sensitive · Applied to all images in batch
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="e.g. Nature, Product, Banner (press Enter)"
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= MAX_TAGS}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-100 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Queued Files List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>
                  Queued Images ({items.length}/{MAX_FILES})
                </span>
                <span className="text-[11px] text-zinc-400">
                  {completedCount} completed · {failedCount} failed · {pendingCount} pending
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40"
                  >
                    {/* Thumbnail Preview */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-zinc-400" />
                      )}
                    </div>

                    {/* Meta & Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {item.file.name}
                        </p>
                        <span className="text-[11px] text-zinc-400 shrink-0">
                          {formatBytes(item.file.size)}
                        </span>
                      </div>

                      {/* Progress bar when uploading or completed */}
                      {item.status === "uploading" && (
                        <div className="mt-1.5 space-y-1">
                          <ProgressBar value={item.progress} max={100} showPercent={false} className="space-y-0" />
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Uploading directly to R2...</span>
                            <span>{item.progress}%</span>
                          </div>
                        </div>
                      )}

                      {item.status === "completed" && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Uploaded & Tagged</span>
                        </div>
                      )}

                      {item.status === "failed" && (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 mt-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.errorMessage || "Upload failed"}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.status === "failed" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetryItem(item.id)}
                          className="h-8 px-2 text-xs text-blue-600 dark:text-blue-400"
                          title="Retry upload"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Retry
                        </Button>
                      )}

                      {item.status !== "uploading" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500">
            {completedCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5" />
                {completedCount} uploaded
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isUploading}
            >
              {completedCount > 0 && pendingCount === 0 ? "Done" : "Cancel"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleStartBatchUpload}
              disabled={isUploading || isOffline || (pendingCount === 0 && failedCount === 0)}
              loading={isUploading}
            >
              <UploadCloud className="h-4 w-4 mr-1.5" />
              {isUploading
                ? "Uploading..."
                : failedCount > 0 && pendingCount === 0
                ? `Retry Failed (${failedCount})`
                : `Upload ${pendingCount > 0 ? pendingCount : ""} Images`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
