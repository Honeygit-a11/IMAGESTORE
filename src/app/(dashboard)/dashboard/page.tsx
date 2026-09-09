"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderKanban,
  HardDrive,
  Users,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
  ExternalLink,
  Crown,
  Edit3,
  Eye,
  Loader2,
  Clock,
  MailCheck,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

interface WorkspaceItem {
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

interface UserMeData {
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

interface PendingInvite {
  id: string;
  token: string;
  workspaceId: string;
  workspaceName: string;
  role: "EDITOR" | "VIEWER";
  invitedByName: string;
  expiresAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = React.useState<WorkspaceItem[]>([]);
  const [userMe, setUserMe] = React.useState<UserMeData | null>(null);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteActionLoading, setInviteActionLoading] = React.useState(false);

  // Create Workspace Modal State
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);

  // Deletion Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = React.useState<WorkspaceItem | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [wsRes, meRes, invRes] = await Promise.all([
        fetch("/api/v1/workspaces"),
        fetch("/api/v1/auth/me"),
        fetch("/api/v1/invitations/pending"),
      ]);

      if (meRes.status === 401) {
        router.push("/login");
        return;
      }

      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspaces(wsData.data || []);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setUserMe(meData.data);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setPendingInvites(invData.data || []);
      }
    } catch (err) {
      console.error("[Dashboard Fetch Error]", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRespondInvite = async (token: string, action: "ACCEPT" | "DECLINE") => {
    setInviteActionLoading(true);
    try {
      const res = await fetch(`/api/v1/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to process invitation");
        return;
      }

      toast.success(data.data.message);
      fetchDashboardData();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setInviteActionLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreateLoading(true);
    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to create workspace");
        return;
      }

      toast.success(`Workspace "${data.data.name}" created successfully!`);
      setNewWorkspaceName("");
      setCreateOpen(false);
      fetchDashboardData();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to delete workspace");
        return;
      }

      toast.success(data.data?.message || "Workspace deleted permanently");
      setDeleteTarget(null);
      fetchDashboardData();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-400">Loading your workspaces and storage metrics...</p>
      </div>
    );
  }

  const workspaceCount = userMe?.workspaces.currentCount ?? workspaces.length;
  const canCreateWorkspace = userMe?.workspaces.canCreate ?? workspaceCount < 2;

  return (
    <div className="space-y-8">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Workspaces
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
              {workspaceCount} / 2
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Collaborate on image assets with role-based permissions (up to 2 workspaces, 500 MB total).
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          disabled={!canCreateWorkspace}
          className="self-start sm:self-auto shadow-sm"
          title={!canCreateWorkspace ? "Maximum limit of 2 workspaces reached" : undefined}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create Workspace
        </Button>
      </div>

      {/* Pending Invitations Banner (In-App notification) */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          {pendingInvites.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <MailCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Invitation to join &quot;{inv.workspaceName}&quot;
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                    <strong>{inv.invitedByName}</strong> invited you to collaborate as an{" "}
                    <strong className="text-blue-600 dark:text-blue-400">{inv.role}</strong>. (Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRespondInvite(inv.token, "DECLINE")}
                  disabled={inviteActionLoading}
                  className="text-xs"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRespondInvite(inv.token, "ACCEPT")}
                  disabled={inviteActionLoading || workspaceCount >= 2}
                  loading={inviteActionLoading}
                  className="text-xs shadow-xs"
                  title={workspaceCount >= 2 ? "You already have 2 workspaces" : undefined}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Accept Invitation
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage & Capacity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Workspace Limit Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              Workspace Limit
            </span>
            <span className={canCreateWorkspace ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
              {canCreateWorkspace ? "Available" : "Limit Reached"}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {workspaceCount} <span className="text-sm font-normal text-zinc-400">/ 2 max</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Each user can participate in up to 2 workspaces total.
          </p>
        </div>

        {/* 500 MB Storage Quota Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-emerald-500" />
              Total Storage
            </span>
            <span className="font-mono text-zinc-500">
              {userMe?.storage.percentUsed || 0}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {userMe?.storage.usedFormatted || "0 MB"}{" "}
            <span className="text-sm font-normal text-zinc-400">/ 500 MB</span>
          </div>
          <ProgressBar
            value={userMe?.storage.usedBytes || 0}
            max={userMe?.storage.maxBytes || 524288000}
            showPercent={false}
            className="mt-3"
          />
        </div>

        {/* Team Capacity Rules */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Users className="h-4 w-4 text-purple-500" />
            Member Cap
          </div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            3 Members / Workspace
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Owner + 2 collaborators (Editor or Viewer roles) per workspace.
          </p>
        </div>
      </div>

      {/* Workspaces Grid / Empty State */}
      {workspaces.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No workspaces yet"
          description="Create your first workspace to upload images, invite team members, and manage permissions."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Your First Workspace
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="group relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Name, Role Badge, Menu */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/workspaces/${ws.id}`}
                        className="text-lg font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                      >
                        {ws.name}
                        <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          ws.role === "OWNER"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                            : ws.role === "EDITOR"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {ws.role === "OWNER" && <Crown className="h-3 w-3" />}
                        {ws.role === "EDITOR" && <Edit3 className="h-3 w-3" />}
                        {ws.role === "VIEWER" && <Eye className="h-3 w-3" />}
                        {ws.role}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Immutable Name
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown for Owner */}
                  {ws.isOwner && (
                    <Dropdown
                      trigger={
                        <button
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Workspace actions"
                        >
                          <MoreVertical className="h-4 w-4" />
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

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2.5 py-4 border-y border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1 text-zinc-400 mb-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>Members</span>
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {ws.memberCount} / 3 max
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1 text-zinc-400 mb-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Images</span>
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {ws.imageCount} files
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1 text-zinc-400 mb-1">
                      <HardDrive className="h-3.5 w-3.5" />
                      <span>Storage</span>
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {ws.storageUsedMb} MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created {new Date(ws.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/workspaces/${ws.id}`}
                  className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-2 flex items-center gap-1"
                >
                  Enter Workspace &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create New Workspace"
        description="Choose a name for your workspace. Names can be duplicated across ImageSpace and cannot be changed after creation."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
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

      {/* GitHub-Style Destructive Deletion Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmationDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={`Delete "${deleteTarget.name}"?`}
          description="This action is permanent and destructive. All images, tags, members, and activity logs in this workspace will be permanently removed. Storage used by these images will be released."
          matchTarget={deleteTarget.name}
          confirmText="Delete Workspace Permanently"
          loading={deleteLoading}
          onConfirm={handleDeleteWorkspace}
        />
      )}
    </div>
  );
}
