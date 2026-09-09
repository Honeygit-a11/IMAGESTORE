"use client";

import * as React from "react";
import {
  Download,
  Maximize2,
  Tag as TagIcon,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";

export interface GalleryImage {
  id: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  thumbnailKey: string | null;
  storageKey: string;
  createdAt: string | null;
  uploadedBy: { id: string; name: string | null; email: string } | null;
  tags: string[];
}

interface ImageCardProps {
  workspaceId: string;
  image: GalleryImage;
  onClick: () => void;
  onDownload?: () => void;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function ImageCard({
  workspaceId,
  image,
  onClick,
  onDownload,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelect,
}: ImageCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);
  const [loadingThumb, setLoadingThumb] = React.useState(true);
  const [errorThumb, setErrorThumb] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadThumb() {
      try {
        const res = await fetch(`/api/v1/workspaces/${workspaceId}/images/${image.id}/thumbnail-url`);
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.data?.thumbnailUrl) {
            setThumbnailUrl(data.data.thumbnailUrl);
          } else {
            setErrorThumb(true);
          }
        }
      } catch {
        if (isMounted) setErrorThumb(true);
      } finally {
        if (isMounted) setLoadingThumb(false);
      }
    }

    loadThumb();
    return () => {
      isMounted = false;
    };
  }, [workspaceId, image.id]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCardClick = () => {
    if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect(image.id);
    } else {
      onClick();
    }
  };

  const handleQuickDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
      return;
    }
    try {
      toast.info(`Preparing download for "${image.fileName}"...`);
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/images/${image.id}/download-url`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Could not retrieve download link.");
        return;
      }
      const a = document.createElement("a");
      a.href = data.data.downloadUrl;
      a.download = image.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded "${image.fileName}"`);
    } catch {
      toast.error("Download failed.");
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${
        isSelected
          ? "border-blue-600 ring-2 ring-blue-500 shadow-md bg-blue-50/20 dark:bg-blue-950/20"
          : "border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs hover:shadow-md"
      }`}
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden flex items-center justify-center">
        {loadingThumb ? (
          <div className="flex items-center justify-center text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : errorThumb || !thumbnailUrl ? (
          <div className="flex flex-col items-center justify-center gap-1 text-zinc-400">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px]">Preview unavailable</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={image.fileName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* Multi-Select Checkbox Badge */}
        {isMultiSelectMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(image.id);
            }}
            className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-black/40 backdrop-blur-xs text-white hover:scale-110 transition-transform cursor-pointer"
          >
            {isSelected ? (
              <CheckCircle2 className="h-4 w-4 text-blue-400 fill-blue-500/20" />
            ) : (
              <Circle className="h-4 w-4 text-white/80" />
            )}
          </div>
        )}

        {/* Hover Overlay with Actions (only when not multi-selecting) */}
        {!isMultiSelectMode && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="p-2 rounded-xl bg-white/90 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-100 hover:scale-110 transition-transform shadow-lg cursor-pointer"
              title="Open Lightbox"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleQuickDownload}
              className="p-2 rounded-xl bg-white/90 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-100 hover:scale-110 transition-transform shadow-lg cursor-pointer"
              title="Download Image"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* File Size Badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white tracking-wide">
          {formatBytes(image.fileSize)}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={image.fileName}>
            {image.fileName}
          </h4>
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">
            {image.fileType.split("/")[1] || "IMAGE"}
          </p>
        </div>

        {/* Tags */}
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            {image.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              >
                <TagIcon className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
            {image.tags.length > 2 && (
              <span className="text-[10px] text-zinc-400 font-medium">
                +{image.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
