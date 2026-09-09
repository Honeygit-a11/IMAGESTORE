"use client";

import * as React from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Tag as TagIcon,
  User,
  Calendar,
  HardDrive,
  FileType,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { GalleryImage } from "./image-card";
import { toast } from "sonner";

interface ImageLightboxProps {
  workspaceId: string;
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  role?: "OWNER" | "EDITOR" | "VIEWER";
  onDeleteImage?: (id: string) => void;
}

export function ImageLightbox({
  workspaceId,
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  role = "VIEWER",
  onDeleteImage,
}: ImageLightboxProps) {
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [loadingHighRes, setLoadingHighRes] = React.useState(true);
  const [showInfo, setShowInfo] = React.useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const currentImage = images[currentIndex];

  const [prevImageId, setPrevImageId] = React.useState<string | null>(null);
  if (currentImage && currentImage.id !== prevImageId) {
    setPrevImageId(currentImage.id);
    setLoadingHighRes(true);
    setDownloadUrl(null);
  }

  // Fetch full resolution download URL whenever currentImage changes
  React.useEffect(() => {
    if (!isOpen || !currentImage) return;

    let isMounted = true;

    async function fetchFullImage() {
      try {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceId}/images/${currentImage.id}/download-url`
        );
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.data?.downloadUrl) {
            setDownloadUrl(data.data.downloadUrl);
          } else {
            toast.error(data.error?.message || "Failed to load full image.");
          }
        }
      } catch {
        if (isMounted) toast.error("Error loading image preview.");
      } finally {
        if (isMounted) setLoadingHighRes(false);
      }
    }

    fetchFullImage();
    return () => {
      isMounted = false;
    };
  }, [workspaceId, currentImage, isOpen]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onNavigate, onClose]);

  if (!isOpen || !currentImage) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    toast.info(`Downloading "${currentImage.fileName}"...`);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = currentImage.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded "${currentImage.fileName}"`);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(
        `/api/v1/workspaces/${workspaceId}/images/${currentImage.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to delete image.");
        return;
      }

      toast.success(`"${currentImage.fileName}" moved to Trash.`);
      setDeleteModalOpen(false);
      onDeleteImage?.(currentImage.id);

      if (images.length <= 1) {
        onClose();
      } else if (currentIndex >= images.length - 1) {
        onNavigate(currentIndex - 1);
      }
    } catch {
      toast.error("Error moving image to Trash.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
        {/* Top Action Bar */}
        <div className="absolute top-0 inset-x-0 h-16 px-6 flex items-center justify-between text-white/90 z-20 bg-linear-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/90 backdrop-blur-xs">
              {currentIndex + 1} / {images.length}
            </span>
            <h3 className="text-sm font-semibold truncate max-w-xs md:max-w-md text-white">
              {currentImage.fileName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Metadata Panel */}
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-xl border border-white/10 transition-colors cursor-pointer ${
                showInfo ? "bg-white/20 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
              title="Image Details"
            >
              <Info className="h-4 w-4" />
            </button>

            {/* Move to Trash Button */}
            {role !== "VIEWER" && (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                title="Move to Trash"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Download Single Image */}
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={!downloadUrl || loadingHighRes}
              className="bg-white text-zinc-900 hover:bg-white/90 font-semibold text-xs h-9 px-3 cursor-pointer"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>

            {/* Close Lightbox */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer border border-white/10"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Stage */}
        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden">
          {/* Navigation: Previous */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-xs transition-all hover:scale-105 cursor-pointer border border-white/10"
              title="Previous image (Left Arrow)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Center High-Res Image Display */}
          <div className="relative max-w-full max-h-[85vh] flex items-center justify-center">
            {loadingHighRes && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-white/50" />
              </div>
            )}

            {downloadUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={downloadUrl}
                alt={currentImage.fileName}
                className={`max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl transition-opacity duration-300 ${
                  loadingHighRes ? "opacity-30" : "opacity-100"
                }`}
              />
            )}
          </div>

          {/* Navigation: Next */}
          {currentIndex < images.length - 1 && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-xs transition-all hover:scale-105 cursor-pointer border border-white/10"
              title="Next image (Right Arrow)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Metadata Sidebar / Info Overlay */}
          {showInfo && (
            <div className="absolute right-4 bottom-4 md:bottom-auto md:top-20 z-20 w-80 max-h-[75vh] overflow-y-auto rounded-2xl bg-zinc-900/90 border border-white/10 p-5 text-zinc-200 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Image Information
                </h4>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[11px] text-zinc-500 font-medium">Filename</p>
                  <p className="font-semibold text-zinc-100 break-all">{currentImage.fileName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      File Size
                    </p>
                    <p className="font-medium text-zinc-200 mt-0.5">
                      {formatBytes(currentImage.fileSize)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                      <FileType className="h-3 w-3" />
                      Format
                    </p>
                    <p className="font-medium text-zinc-200 uppercase mt-0.5">
                      {currentImage.fileType.split("/")[1] || currentImage.fileType}
                    </p>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="pt-2">
                  <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mb-1.5">
                    <TagIcon className="h-3 w-3" />
                    Tags ({currentImage.tags.length})
                  </p>
                  {currentImage.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {currentImage.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-900"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">No tags assigned</p>
                  )}
                </div>

                {/* Privacy-gated Uploader Details: Visible ONLY to Owner */}
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  {currentImage.uploadedBy ? (
                    <>
                      <div>
                        <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-amber-400" />
                          Uploaded By (Owner View)
                        </p>
                        <p className="font-semibold text-zinc-200 mt-0.5">
                          {currentImage.uploadedBy.name || currentImage.uploadedBy.email}
                        </p>
                        {currentImage.uploadedBy.name && (
                          <p className="text-[11px] text-zinc-400">{currentImage.uploadedBy.email}</p>
                        )}
                      </div>

                      {currentImage.createdAt && (
                        <div>
                          <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-amber-400" />
                            Uploaded At
                          </p>
                          <p className="text-zinc-300 mt-0.5">
                            {new Date(currentImage.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-[11px] text-zinc-400">
                      <ShieldAlert className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span>Uploader identity and exact upload time are visible to Workspace Owner only.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation: Move Single Image to Trash */}
      <ConfirmationDialog
        open={deleteModalOpen}
        onOpenChange={(open) => setDeleteModalOpen(open)}
        onConfirm={handleDelete}
        title={`Move "${currentImage.fileName}" to Trash?`}
        description="This image will be moved to the Trash bin for 30 days. It will remain recoverable during this period, and continues to count toward your storage quota until permanently deleted."
        confirmText="Move to Trash"
        loading={deleting}
      />
    </>
  );
}
