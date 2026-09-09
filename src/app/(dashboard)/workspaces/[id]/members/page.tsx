"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Crown,
  Edit3,
  Eye,
  UserX,
  LogOut,
  ArrowRightLeft,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";

interface MemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  isOwner: boolean;
  isCurrentUser: boolean;
  joinedAt: string;
}

interface InvitationItem {
  id: string;
  email: string;
  role: "EDITOR" | "VIEWER";
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function WorkspaceMembersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [invitations, setInvitations] = React.useState<InvitationItem[]>([]);
  const [workspaceName, setWorkspaceName] = React.useState("Workspace");
  const [isCallerOwner, setIsCallerOwner] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Invite Member Modal State
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviteLoading, setInviteLoading] = React.useState(false);

  // Leave / Remove confirmation state
  const [removeTarget, setRemoveTarget] = React.useState<MemberItem | null>(null);

  // Transfer Ownership state
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [transferTargetId, setTransferTargetId] = React.useState("");

  const fetchMembersAndInvites = React.useCallback(async () => {
    if (!params.id) return;
    try {
      const [membersRes, wsRes] = await Promise.all([
        fetch(`/api/v1/workspaces/${params.id}/members`),
        fetch(`/api/v1/workspaces/${params.id}`),
      ]);

      if (!membersRes.ok || !wsRes.ok) {
        toast.error("Failed to load workspace members");
        router.push("/dashboard");
        return;
      }

      const mData = await membersRes.json();
      const wsData = await wsRes.json();

      setMembers(mData.data || []);
      setWorkspaceName(wsData.data.name);
      setIsCallerOwner(wsData.data.isOwner);

      // If owner, also fetch pending invitations
      if (wsData.data.isOwner) {
        const invRes = await fetch(`/api/v1/workspaces/${params.id}/invitations`);
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvitations(invData.data || []);
        }
      }
    } catch {
      toast.error("Network error while loading members");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  React.useEffect(() => {
    fetchMembersAndInvites();
  }, [fetchMembersAndInvites]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${params.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to send invitation");
        return;
      }

      toast.success(`Invitation sent to ${inviteEmail} (expires in 7 days)`);
      setInviteEmail("");
      setInviteOpen(false);
      fetchMembersAndInvites();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/workspaces/${params.id}/invitations/${invitationId}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to cancel invitation");
        return;
      }

      toast.success("Invitation cancelled");
      fetchMembersAndInvites();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: "EDITOR" | "VIEWER") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${params.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to update role");
        return;
      }

      toast.success("Member role updated successfully");
      fetchMembersAndInvites();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveOrLeave = async () => {
    if (!removeTarget) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${params.id}/members/${removeTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Action failed");
        return;
      }

      toast.success(data.data?.message || "Member removed");
      setRemoveTarget(null);

      if (removeTarget.isCurrentUser) {
        router.push("/dashboard");
      } else {
        fetchMembersAndInvites();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTargetId) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${params.id}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerUserId: transferTargetId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Transfer failed");
        return;
      }

      toast.success(data.data?.message || "Ownership transferred");
      setTransferOpen(false);
      setTransferTargetId("");
      fetchMembersAndInvites();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-400">Loading workspace members and invitations...</p>
      </div>
    );
  }

  const memberCount = members.length;
  const pendingCount = invitations.length;
  const totalOccupied = memberCount + pendingCount;
  const canInvite = isCallerOwner && totalOccupied < 3;
  const otherMembers = members.filter((m) => !m.isOwner);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Link
          href={`/workspaces/${params.id}`}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {workspaceName}
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">Members & Invitations</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Workspace Members
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
              {memberCount} / 3 Members ({totalOccupied}/3 with Invites)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Max 3 total members per workspace. Active invitations reserve a slot until accepted or expired.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCallerOwner && otherMembers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
              className="text-xs"
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
              Transfer Ownership
            </Button>
          )}

          {isCallerOwner && (
            <Button
              size="sm"
              onClick={() => setInviteOpen(true)}
              disabled={!canInvite}
              className="text-xs shadow-sm"
              title={!canInvite ? "All 3 member slots filled" : undefined}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Active Members Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Active Members ({memberCount})
        </h2>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 divide-y divide-zinc-100 dark:divide-zinc-800/80 shadow-sm overflow-hidden">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* User Details */}
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {member.name}
                    </span>
                    {member.isCurrentUser && (
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.2 rounded font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {member.email} · Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Role & Actions */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {isCallerOwner && !member.isOwner ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleChangeRole(member.id, e.target.value as "EDITOR" | "VIEWER")
                    }
                    disabled={actionLoading}
                    className="text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      member.role === "OWNER"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : member.role === "EDITOR"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {member.role === "OWNER" && <Crown className="h-3 w-3" />}
                    {member.role === "EDITOR" && <Edit3 className="h-3 w-3" />}
                    {member.role === "VIEWER" && <Eye className="h-3 w-3" />}
                    {member.role}
                  </span>
                )}

                {isCallerOwner && !member.isOwner && (
                  <button
                    onClick={() => setRemoveTarget(member)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                )}

                {!isCallerOwner && member.isCurrentUser && (
                  <button
                    onClick={() => setRemoveTarget(member)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Leave Workspace
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Invitations Section (Owner Only) */}
      {isCallerOwner && invitations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending Invitations ({invitations.length})
          </h2>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 divide-y divide-zinc-100 dark:divide-zinc-800/80 shadow-sm overflow-hidden">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {inv.email}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {inv.role}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Expires on {new Date(inv.expiresAt).toLocaleDateString()} (7-day link)
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelInvite(inv.id)}
                  disabled={actionLoading}
                  className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Cancel Invite
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite Member Modal Dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite Member to Workspace"
        description={`Send an invitation via email to join "${workspaceName}". The invitation will expire in 7 days.`}
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email Address
            </label>
            <Input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@example.com"
              disabled={inviteLoading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Assigned Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                  inviteRole === "EDITOR"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="EDITOR"
                  checked={inviteRole === "EDITOR"}
                  onChange={() => setInviteRole("EDITOR")}
                  className="sr-only"
                />
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" />
                  EDITOR
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Upload images, manage tags, delete own files.
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                  inviteRole === "VIEWER"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="VIEWER"
                  checked={inviteRole === "VIEWER"}
                  onChange={() => setInviteRole("VIEWER")}
                  className="sr-only"
                />
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  VIEWER
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Read-only view, search, and download images.
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInviteOpen(false)}
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!inviteEmail.trim() || inviteLoading}
              loading={inviteLoading}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Remove / Leave Confirmation Dialog */}
      {removeTarget && (
        <ConfirmationDialog
          open={!!removeTarget}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          title={
            removeTarget.isCurrentUser
              ? `Leave "${workspaceName}"?`
              : `Remove ${removeTarget.name}?`
          }
          description={
            removeTarget.isCurrentUser
              ? "You will immediately lose access to this workspace. Any images you uploaded will remain inside the workspace."
              : `This user will immediately lose access across all devices. Their uploaded images will remain intact inside this workspace.`
          }
          confirmText={removeTarget.isCurrentUser ? "Leave Workspace" : "Remove Member"}
          loading={actionLoading}
          onConfirm={handleRemoveOrLeave}
        />
      )}

      {/* Transfer Ownership Modal */}
      <Dialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        title="Transfer Workspace Ownership"
        description={`Select an existing workspace member to transfer full ownership of "${workspaceName}". You will transition to an Editor role.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Select New Owner
            </label>
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="">-- Choose a member --</option>
              {otherMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
            Ownership transfer is irreversible unless the new owner transfers it back. Workspace storage usage will be attributed to the new owner.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!transferTargetId || actionLoading}
              loading={actionLoading}
              onClick={handleTransferOwnership}
            >
              Confirm Ownership Transfer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
