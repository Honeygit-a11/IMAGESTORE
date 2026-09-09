"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  UploadCloud,
  Trash2,
  RotateCcw,
  Tag as TagIcon,
  UserPlus,
  UserMinus,
  Shield,
  Mail,
  Sparkles,
  Loader2,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

interface ActivityItem {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string } | null;
  isActorMasked: boolean;
}

export default function WorkspaceActivityPage() {
  const params = useParams<{ id: string }>();
  const [logs, setLogs] = React.useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [category, setCategory] = React.useState<"all" | "images" | "members" | "tags">("all");

  const fetchLogs = React.useCallback(
    async (cursor?: string, append = false) => {
      if (!params.id) return;
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const url = `/api/v1/workspaces/${params.id}/activity-logs?limit=25&category=${category}${
          cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
        }`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error?.message || "Failed to load activity logs.");
          return;
        }

        const newItems: ActivityItem[] = data.data || [];
        setLogs((prev) => (append ? [...prev, ...newItems] : newItems));
        setNextCursor(data.meta?.nextCursor || null);
      } catch {
        toast.error("Network error loading activity logs.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [params.id, category]
  );

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchLogs(nextCursor, true);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "IMAGE_UPLOADED":
        return {
          icon: <UploadCloud className="h-4 w-4 text-blue-500" />,
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          label: "Image Uploaded",
        };
      case "IMAGE_DELETED":
        return {
          icon: <Trash2 className="h-4 w-4 text-amber-500" />,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          label: "Moved to Trash",
        };
      case "IMAGE_RESTORED":
        return {
          icon: <RotateCcw className="h-4 w-4 text-emerald-500" />,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          label: "Image Restored",
        };
      case "IMAGE_PERMANENTLY_DELETED":
      case "TRASH_EMPTIED":
        return {
          icon: <Trash2 className="h-4 w-4 text-red-500" />,
          color: "bg-red-500/10 text-red-600 dark:text-red-400",
          label: "Permanently Purged",
        };
      case "MEMBER_INVITED":
        return {
          icon: <Mail className="h-4 w-4 text-purple-500" />,
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          label: "Invitation Sent",
        };
      case "MEMBER_JOINED":
      case "INVITATION_ACCEPTED":
        return {
          icon: <UserPlus className="h-4 w-4 text-emerald-500" />,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          label: "Member Joined",
        };
      case "MEMBER_REMOVED":
      case "MEMBER_LEFT":
        return {
          icon: <UserMinus className="h-4 w-4 text-red-500" />,
          color: "bg-red-500/10 text-red-600 dark:text-red-400",
          label: "Member Departed",
        };
      case "ROLE_CHANGED":
      case "OWNERSHIP_TRANSFERRED":
        return {
          icon: <Shield className="h-4 w-4 text-amber-500" />,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          label: "Role / Ownership",
        };
      case "TAG_ADDED":
      case "TAG_REMOVED":
        return {
          icon: <TagIcon className="h-4 w-4 text-indigo-500" />,
          color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          label: "Tag Modified",
        };
      case "WORKSPACE_CREATED":
        return {
          icon: <Sparkles className="h-4 w-4 text-amber-500" />,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          label: "Workspace Created",
        };
      default:
        return {
          icon: <Activity className="h-4 w-4 text-zinc-500" />,
          color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
          label: action.replace(/_/g, " "),
        };
    }
  };

  const renderDescription = (log: ActivityItem) => {
    const meta = log.metadata || {};
    const fileName = typeof meta.fileName === "string" ? meta.fileName : undefined;
    const tagName = typeof meta.tagName === "string" ? meta.tagName : undefined;
    const email = typeof meta.email === "string" ? meta.email : undefined;

    switch (log.action) {
      case "IMAGE_UPLOADED":
        return (
          <span>
            Uploaded image <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{fileName || "file"}</strong>
          </span>
        );
      case "IMAGE_DELETED":
        return (
          <span>
            Moved <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{fileName || "image"}</strong> to Trash
          </span>
        );
      case "IMAGE_RESTORED":
        return (
          <span>
            Restored <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{fileName || "image"}</strong> from Trash
          </span>
        );
      case "IMAGE_PERMANENTLY_DELETED":
        return (
          <span>
            Permanently deleted <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{fileName || "image"}</strong>
          </span>
        );
      case "TRASH_EMPTIED":
        return <span>Emptied all soft-deleted assets from Trash</span>;
      case "TAG_ADDED":
        return (
          <span>
            Added tag <code className="px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-mono text-[11px]">#{tagName}</code> to image
          </span>
        );
      case "TAG_REMOVED":
        return (
          <span>
            Removed tag <code className="px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">#{tagName}</code> from image
          </span>
        );
      case "MEMBER_INVITED":
        return (
          <span>
            Invited <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</strong> to join workspace
          </span>
        );
      case "ROLE_CHANGED":
        return <span>Changed member role</span>;
      case "OWNERSHIP_TRANSFERRED":
        return <span>Transferred workspace ownership</span>;
      default:
        return <span>{log.action.replace(/_/g, " ").toLowerCase()}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Link
          href={`/workspaces/${params.id}`}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspace
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">Activity Log</span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Workspace Activity
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Audit history of uploads, deletions, membership changes, and tag updates.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs">
          {(["all", "images", "members", "tags"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                category === cat
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Stream */}
      {loading && logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
          <p className="text-xs text-zinc-400">Loading activity timeline...</p>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6 text-zinc-400" />}
          title="No activity recorded"
          description="Actions performed in this workspace will automatically appear here on the audit timeline."
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const badge = getActionBadge(log.action);
            return (
              <div
                key={log.id}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                {/* Event Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 ${badge.color}`}>
                  {badge.icon}
                </div>

                {/* Event Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      {renderDescription(log)}
                    </p>
                    <span className="text-[11px] text-zinc-400 shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Actor details (or masked badge) */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400">
                    {log.isActorMasked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
                        <Lock className="h-2.5 w-2.5" />
                        Workspace Member (Anonymized)
                      </span>
                    ) : log.actor ? (
                      <span>
                        by{" "}
                        <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {log.actor.name || log.actor.email}
                        </strong>
                      </span>
                    ) : (
                      <span>System Automation</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Pagination */}
          {nextCursor && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl px-6 text-xs"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  "Load More Activity"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
