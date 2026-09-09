"use client";

import * as React from "react";
import {
  Search,
  X,
  Tag as TagIcon,
  ArrowUpDown,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WorkspaceTag {
  id: string;
  name: string;
  imageCount: number;
}

interface GalleryToolbarProps {
  workspaceId: string;
  search: string;
  onSearchChange: (val: string) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  isMultiSelectMode: boolean;
  onToggleMultiSelect: () => void;
  selectedCount: number;
}

export function GalleryToolbar({
  workspaceId,
  search,
  onSearchChange,
  selectedTag,
  onTagSelect,
  sort,
  onSortChange,
  isMultiSelectMode,
  onToggleMultiSelect,
  selectedCount,
}: GalleryToolbarProps) {
  const [tags, setTags] = React.useState<WorkspaceTag[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchTags() {
      try {
        const res = await fetch(`/api/v1/workspaces/${workspaceId}/tags`);
        const data = await res.json();
        if (isMounted && res.ok) {
          setTags(data.data || []);
        }
      } catch {
        // silent error
      }
    }

    fetchTags();
    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  return (
    <div className="space-y-3">
      {/* Search, Sort & Multi-Select Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search images by filename..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Multi-Select Buttons */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="text-xs pl-8 pr-7 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none shadow-2xs font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="size_asc">Size (Smallest)</option>
              <option value="size_desc">Size (Largest)</option>
            </select>
          </div>

          {/* Multi-Select Toggle */}
          <Button
            type="button"
            size="sm"
            variant={isMultiSelectMode ? "default" : "outline"}
            onClick={onToggleMultiSelect}
            className="text-xs h-9"
          >
            {isMultiSelectMode ? (
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Square className="h-3.5 w-3.5 mr-1.5" />
            )}
            <span>Select{selectedCount > 0 ? ` (${selectedCount})` : ""}</span>
          </Button>
        </div>
      </div>

      {/* Tag Filter Pills */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="h-3 w-3" />
            Tags:
          </span>

          <button
            type="button"
            onClick={() => onTagSelect(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              selectedTag === null
                ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            All
          </button>

          {tags.map((tag) => {
            const isSelected = selectedTag === tag.name;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onTagSelect(isSelected ? null : tag.name)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900/40"
                }`}
              >
                <TagIcon className="h-2.5 w-2.5" />
                <span>#{tag.name}</span>
                <span className={`text-[10px] ml-0.5 opacity-70`}>({tag.imageCount})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
