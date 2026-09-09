"use client";

import * as React from "react";
import { ImageCard, GalleryImage } from "./image-card";
import { ImageLightbox } from "./image-lightbox";
import { GalleryToolbar } from "./gallery-toolbar";
import { BulkActionBar } from "./bulk-action-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface ImageGalleryProps {
  workspaceId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  onOpenUploader?: () => void;
  refreshToken?: number;
}

export function ImageGallery({
  workspaceId,
  role,
  onOpenUploader,
  refreshToken = 0,
}: ImageGalleryProps) {
  const [images, setImages] = React.useState<GalleryImage[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);

  // Search, Filter, Sort state
  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState("newest");

  // Multi-Select state (Cap: 10 images max)
  const [isMultiSelectMode, setIsMultiSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const fetchImages = React.useCallback(
    async (cursor?: string, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams({ limit: "20", sort });
        if (cursor) params.set("cursor", cursor);
        if (search.trim()) params.set("search", search.trim());
        if (selectedTag) params.set("tag", selectedTag);

        const url = `/api/v1/workspaces/${workspaceId}/images?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error?.message || "Failed to load images.");
          return;
        }

        const newItems: GalleryImage[] = data.data || [];
        setImages((prev) => (append ? [...prev, ...newItems] : newItems));
        setNextCursor(data.meta?.nextCursor || null);
      } catch {
        toast.error("Network error while loading images.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [workspaceId, search, selectedTag, sort]
  );

  React.useEffect(() => {
    fetchImages();
  }, [fetchImages, refreshToken]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchImages(nextCursor, true);
    }
  };

  // Multi-select toggle handler
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 10) {
        toast.warning("Maximum 10 images can be selected at one time.");
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-6">
      {/* Gallery Toolbar: Search, Tag Filter, Sorting, Multi-Select Trigger */}
      <GalleryToolbar
        workspaceId={workspaceId}
        search={search}
        onSearchChange={(val) => setSearch(val)}
        selectedTag={selectedTag}
        onTagSelect={(t) => setSelectedTag(t)}
        sort={sort}
        onSortChange={(s) => setSort(s)}
        isMultiSelectMode={isMultiSelectMode}
        onToggleMultiSelect={() => {
          setIsMultiSelectMode((prev) => !prev);
          setSelectedIds([]);
        }}
        selectedCount={selectedIds.length}
      />

      {/* Skeletons when initial loading */}
      {loading && images.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden animate-pulse flex flex-col"
            >
              <div className="aspect-4/3 w-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                <div className="h-2 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<ImageIcon className="h-6 w-6" />}
          title={
            search || selectedTag
              ? "No matching images found"
              : "Workspace is empty"
          }
          description={
            search || selectedTag
              ? "No images match your search or filter criteria. Try clearing tags or query."
              : "No active images in this workspace. Upload images (up to 10 MB per file, max 10 batch) directly to Cloudflare R2 object storage."
          }
          action={
            search || selectedTag ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedTag(null);
                }}
              >
                Clear Filters
              </Button>
            ) : role !== "VIEWER" && onOpenUploader ? (
              <Button onClick={onOpenUploader}>
                <UploadCloud className="mr-1.5 h-4 w-4" />
                Upload First Image
              </Button>
            ) : undefined
          }
        />
      ) : (
        /* Responsive Gallery Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, idx) => (
            <ImageCard
              key={image.id}
              workspaceId={workspaceId}
              image={image}
              onClick={() => setSelectedImageIndex(idx)}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedIds.includes(image.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      )}

      {/* Cursor Pagination: Load More */}
      {nextCursor && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-xl px-6"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              "Load More Images"
            )}
          </Button>
        </div>
      )}

      {/* Floating Multi-Select Bulk Action Bar */}
      <BulkActionBar
        workspaceId={workspaceId}
        selectedIds={selectedIds}
        maxSelect={10}
        onClearSelection={() => setSelectedIds([])}
        onActionComplete={() => {
          fetchImages();
          setSelectedIds([]);
        }}
        canEditTags={role !== "VIEWER"}
        canDelete={role !== "VIEWER"}
      />

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
        <ImageLightbox
          workspaceId={workspaceId}
          images={images}
          currentIndex={selectedImageIndex}
          isOpen={selectedImageIndex !== null}
          onClose={() => setSelectedImageIndex(null)}
          onNavigate={(newIdx) => setSelectedImageIndex(newIdx)}
          role={role}
          onDeleteImage={() => fetchImages()}
        />
      )}
    </div>
  );
}
