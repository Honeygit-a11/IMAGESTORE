"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Edit3,
  ExternalLink,
  Eye,
  FolderKanban,
  HardDrive,
  ImageIcon,
  MailCheck,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Check,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";

// --- Types ---
export interface WorkspaceItem {
  id: string;
  name: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  isOwner: boolean;
  memberCount: number;
  imageCount: number;
  storageUsedBytes: number;
  storageUsedMb: string;
  createdAt: string;
}

export interface UserMeData {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  storage: {
    usedBytes: number;
    maxBytes: number;
    usedFormatted: string;
    maxFormatted: string;
    percentUsed: number;
  };
  workspaces: {
    currentCount: number;
    maxCount: number;
    canCreate: boolean;
  };
}

export interface PendingInvite {
  id: string;
  token: string;
  workspaceId: string;
  workspaceName: string;
  role: "EDITOR" | "VIEWER";
  invitedByName: string;
  expiresAt: string;
}

export interface Dashboard8Props {
  workspaces: WorkspaceItem[];
  userMe: UserMeData | null;
  pendingInvites: PendingInvite[];
  inviteActionLoading?: boolean;
  onRespondInvite: (token: string, action: "ACCEPT" | "DECLINE") => Promise<void>;
  onCreateWorkspace: (name: string) => Promise<void>;
  onDeleteWorkspace: (workspace: WorkspaceItem) => Promise<void>;
}

// --- Helper: Circular Progress Ring ---
function CircularProgressRing({
  value,
  size = 36,
  strokeWidth = 3.5,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  let colorClass = "stroke-emerald-500 text-emerald-500";
  if (normalizedValue > 80) {
    colorClass = "stroke-rose-500 text-rose-500";
  } else if (normalizedValue > 50) {
    colorClass = "stroke-amber-500 text-amber-500";
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-zinc-200 dark:stroke-zinc-800"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn("transition-all duration-500 ease-out", colorClass)}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
        {Math.round(normalizedValue)}%
      </span>
    </div>
  );
}

// --- Helper: SVG Sparkline ---
function Sparkline({
  data,
  color = "#3b82f6",
  gradientId,
  height = 40,
}: {
  data: number[];
  color?: string;
  gradientId: string;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const padding = 2;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type SortField = "name" | "imageCount" | "storageUsedBytes" | "memberCount" | "createdAt";

export function Dashboard8({
  workspaces,
  userMe,
  pendingInvites,
  inviteActionLoading = false,
  onRespondInvite,
  onCreateWorkspace,
  onDeleteWorkspace,
}: Dashboard8Props) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | "OWNER" | "EDITOR" | "VIEWER">("ALL");
  const [sortField, setSortField] = React.useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Create Workspace Modal
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);

  // Delete Workspace Dialog
  const [deleteTarget, setDeleteTarget] = React.useState<WorkspaceItem | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const workspaceCount = userMe?.workspaces.currentCount ?? workspaces.length;
  const maxWorkspaces = userMe?.workspaces.maxCount ?? 2;
  const canCreate = userMe?.workspaces.canCreate ?? workspaceCount < maxWorkspaces;

  // Aggregate stats
  const totalImages = React.useMemo(() => {
    return workspaces.reduce((acc, ws) => acc + ws.imageCount, 0);
  }, [workspaces]);

  const totalMembers = React.useMemo(() => {
    return workspaces.reduce((acc, ws) => acc + ws.memberCount, 0);
  }, [workspaces]);

  const percentUsed = userMe?.storage.percentUsed ?? 0;
  const usedStorageStr = userMe?.storage.usedFormatted ?? "0 MB";

  // Filter & Sort workspaces
  const filteredWorkspaces = React.useMemo(() => {
    return workspaces
      .filter((ws) => {
        const matchesSearch = ws.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "ALL" || ws.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [workspaces, searchTerm, roleFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreateLoading(true);
    try {
      await onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName("");
      setCreateOpen(false);
    } finally {
      setCreateLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await onDeleteWorkspace(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ────────── Header & Top Bar ────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Workspace Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              {workspaceCount} / {maxWorkspaces} Active
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Monitor isolated workspaces, storage quotas, member access, and delivery pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!canCreate}
            className="shadow-sm hover:shadow transition-shadow"
            title={!canCreate ? "Workspace limit reached (max 2)" : undefined}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Workspace
          </Button>
        </div>
      </div>

      {/* ────────── Pending Invitations Banner ────────── */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          {pendingInvites.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 border-l-4 border-l-blue-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MailCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Invitation to join &ldquo;{inv.workspaceName}&rdquo;
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    <strong>{inv.invitedByName}</strong> invited you as{" "}
                    <strong className="text-blue-600 dark:text-blue-400">{inv.role}</strong> (Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRespondInvite(inv.token, "DECLINE")}
                  disabled={inviteActionLoading}
                  className="text-xs"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => onRespondInvite(inv.token, "ACCEPT")}
                  disabled={inviteActionLoading || !canCreate}
                  loading={inviteActionLoading}
                  className="text-xs shadow-xs"
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ────────── ReactBits Pro Dashboard-8 Sparkline Metric Cards ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Storage Utilization */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Storage</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {usedStorageStr}
                </span>
                <span className="text-xs text-zinc-400 font-normal">/ 500 MB</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{percentUsed}% Quota</span>
            </div>
            <div className="w-20 h-7">
              <Sparkline
                data={[12, 18, 22, 19, 27, 34, percentUsed || 25]}
                color="#3b82f6"
                gradientId="spark-storage"
                height={28}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Active Workspaces */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Workspaces</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {workspaceCount}
                </span>
                <span className="text-xs text-zinc-400 font-normal">/ {maxWorkspaces} max</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-md",
                canCreate
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              )}
            >
              {canCreate ? "Slot Available" : "Cap Reached"}
            </span>
            <div className="w-20 h-7">
              <Sparkline
                data={[1, 1, 1, 2, 2, workspaceCount, workspaceCount]}
                color="#10b981"
                gradientId="spark-workspaces"
                height={28}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Total Image Files */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Image Files</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {totalImages}
                </span>
                <span className="text-xs text-zinc-400 font-normal">assets</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <ImageIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Preserved in S3</span>
            <div className="w-20 h-7">
              <Sparkline
                data={[4, 8, 15, 23, 29, 35, totalImages || 10]}
                color="#6366f1"
                gradientId="spark-images"
                height={28}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Team Collaborators */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Team Collaborators</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {totalMembers}
                </span>
                <span className="text-xs text-zinc-400 font-normal">/ 3 per ws</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">RBAC Protected</span>
            <div className="w-20 h-7">
              <Sparkline
                data={[1, 1, 2, 2, 3, totalMembers, totalMembers]}
                color="#8b5cf6"
                gradientId="spark-members"
                height={28}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ────────── Storage Infrastructure Health & Distribution Bar ────────── */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-900/40 dark:via-zinc-900/70 dark:to-zinc-900/40 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Account Storage Quota & Capacity
            </span>
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {usedStorageStr} of 500 MB used ({100 - percentUsed}% available)
          </span>
        </div>

        {/* Multi-segment capacity progress bar */}
        <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              percentUsed > 80
                ? "bg-rose-500"
                : percentUsed > 50
                ? "bg-amber-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-600"
            )}
            style={{ width: `${Math.max(percentUsed, 1)}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>Direct-to-Cloud Presigned Uploads: Active</span>
          <span>Zero-server buffer architecture (AWS S3 &amp; Cloudinary)</span>
        </div>
      </div>

      {/* ────────── ReactBits Pro Dashboard-8 Sortable Delivery & Workspace Table ────────── */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs overflow-hidden">
        {/* Table Control Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Delivery &amp; Workspace Modules
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Sortable pipelines with progress rings, storage load, and member allocations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs h-9 w-full sm:w-56"
              />
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 text-xs">
              {(["ALL", "OWNER", "EDITOR", "VIEWER"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] cursor-pointer",
                    roleFilter === r
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {r === "ALL" ? "All Roles" : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Container */}
        {filteredWorkspaces.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {workspaces.length === 0 ? "No workspaces found" : "No matching workspaces"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {workspaces.length === 0
                ? "Get started by creating your first workspace to upload image assets and invite your team."
                : "Try adjusting your search query or role filter."}
            </p>
            {workspaces.length === 0 && (
              <Button
                onClick={() => setCreateOpen(true)}
                disabled={!canCreate}
                size="sm"
                className="mt-4"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Workspace
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Workspace</span>
                      {sortField === "name" ? (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Your Role</th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                    onClick={() => handleSort("imageCount")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Assets</span>
                      {sortField === "imageCount" ? (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                    onClick={() => handleSort("storageUsedBytes")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Storage Load</span>
                      {sortField === "storageUsedBytes" ? (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <span title="Circular Progress Ring relative to 500 MB account cap">Progress Ring</span>
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                    onClick={() => handleSort("memberCount")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Seats</span>
                      {sortField === "memberCount" ? (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors hidden md:table-cell"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      {sortField === "createdAt" ? (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-normal">
                {filteredWorkspaces.map((ws) => {
                  // Calculate percentage of 500MB total space used by this workspace
                  const maxAccountBytes = userMe?.storage.maxBytes || 524288000;
                  const wsPercent = Math.min(
                    100,
                    Math.round((ws.storageUsedBytes / maxAccountBytes) * 100)
                  );

                  return (
                    <tr
                      key={ws.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Name & Link */}
                      <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <Link
                          href={`/workspaces/${ws.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-semibold text-sm">{ws.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                        </Link>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border",
                            ws.role === "OWNER"
                              ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60"
                              : ws.role === "EDITOR"
                              ? "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          {ws.role === "OWNER" && <Crown className="h-3 w-3" />}
                          {ws.role === "EDITOR" && <Edit3 className="h-3 w-3" />}
                          {ws.role === "VIEWER" && <Eye className="h-3 w-3" />}
                          {ws.role}
                        </span>
                      </td>

                      {/* Assets / Image count */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {ws.imageCount}
                          </span>
                        </div>
                      </td>

                      {/* Storage load */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {ws.storageUsedMb} MB
                        </span>
                      </td>

                      {/* Dashboard-8 Signature Progress Ring */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <CircularProgressRing value={wsPercent} size={32} strokeWidth={3} />
                          <span className="text-[11px] text-zinc-400">of quota</span>
                        </div>
                      </td>

                      {/* Members */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                          <Users className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{ws.memberCount} / 3</span>
                        </div>
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 text-zinc-400 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(ws.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/workspaces/${ws.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>

                          {ws.isOwner && (
                            <Dropdown
                              trigger={
                                <button
                                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              }
                            >
                              <DropdownItem
                                destructive
                                onClick={() => setDeleteTarget(ws)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Workspace
                              </DropdownItem>
                            </Dropdown>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-3.5 bg-zinc-50/60 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            Showing <strong>{filteredWorkspaces.length}</strong> of <strong>{workspaces.length}</strong> workspace modules
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Zap className="h-3 w-3 text-amber-500" />
            ReactBits Pro Dashboard-8 Module Board Active
          </span>
        </div>
      </div>

      {/* ────────── Create Workspace Modal ────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create New Workspace"
        description="Choose a name for your workspace. Names can be duplicated across ImageSpace and cannot be changed after creation."
      >
        <form onSubmit={submitCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Workspace Name
            </label>
            <Input
              required
              maxLength={50}
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. Studio Editorial, Marketing Assets"
              disabled={createLoading}
              autoFocus
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Max 50 characters · Automatically assigned as OWNER
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!newWorkspaceName.trim() || createLoading}
              loading={createLoading}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ────────── Delete Confirmation Dialog ────────── */}
      {deleteTarget && (
        <ConfirmationDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={`Delete "${deleteTarget.name}"?`}
          description="This action is permanent and destructive. All images, tags, members, and activity logs in this workspace will be permanently removed. Storage used by these images will be released."
          matchTarget={deleteTarget.name}
          confirmText="Delete Workspace Permanently"
          loading={deleteLoading}
          onConfirm={submitDelete}
        />
      )}
    </div>
  );
}

export default Dashboard8;
