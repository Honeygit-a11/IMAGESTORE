"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatGridSkeleton } from "@/components/ui/skeleton-loaders";
import {
  Dashboard8,
  WorkspaceItem,
  UserMeData,
  PendingInvite,
} from "@/components/dashboard/dashboard-8";

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = React.useState<WorkspaceItem[]>([]);
  const [userMe, setUserMe] = React.useState<UserMeData | null>(null);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteActionLoading, setInviteActionLoading] = React.useState(false);

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

      toast.success(data.data?.message || "Invitation updated");
      await fetchDashboardData();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setInviteActionLoading(false);
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to create workspace");
        throw new Error(data.error?.message || "Failed to create workspace");
      }

      toast.success(`Workspace "${data.data.name}" created successfully!`);
      await fetchDashboardData();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        // already toasted
      } else {
        toast.error("Network error. Please try again.");
      }
      throw err;
    }
  };

  const handleDeleteWorkspace = async (workspace: WorkspaceItem) => {
    try {
      const res = await fetch(`/api/v1/workspaces/${workspace.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to delete workspace");
        throw new Error(data.error?.message || "Failed to delete workspace");
      }

      toast.success(data.data?.message || "Workspace deleted permanently");
      await fetchDashboardData();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        // already toasted
      } else {
        toast.error("Network error. Please try again.");
      }
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div>
          <div className="h-8 w-48 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
        <StatGridSkeleton count={4} />
        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800 space-y-4">
          <div className="h-5 w-1/4 rounded bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
          <div className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <Dashboard8
      workspaces={workspaces}
      userMe={userMe}
      pendingInvites={pendingInvites}
      inviteActionLoading={inviteActionLoading}
      onRespondInvite={handleRespondInvite}
      onCreateWorkspace={handleCreateWorkspace}
      onDeleteWorkspace={handleDeleteWorkspace}
    />
  );
}