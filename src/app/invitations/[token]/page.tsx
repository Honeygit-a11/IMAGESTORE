"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FolderKanban,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InvitationData {
  id: string;
  email: string;
  workspaceName: string;
  role: "EDITOR" | "VIEWER";
  invitedByName: string;
  status: string;
  expiresAt: string;
  isExpired: boolean;
}

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [invitation, setInvitation] = React.useState<InvitationData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resolvedMessage, setResolvedMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadInvitation() {
      if (!params.token) return;
      try {
        const res = await fetch(`/api/v1/invitations/${params.token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error?.message || "Invitation not found.");
          return;
        }

        setInvitation(data.data);
      } catch {
        setError("Network error loading invitation.");
      } finally {
        setLoading(false);
      }
    }
    loadInvitation();
  }, [params.token]);

  const handleAction = async (action: "ACCEPT" | "DECLINE") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/invitations/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please log in first to respond to this invitation.");
          router.push(`/login?redirect=/invitations/${params.token}`);
          return;
        }
        toast.error(data.error?.message || "Action failed.");
        return;
      }

      setResolvedMessage(data.data.message);
      toast.success(data.data.message);

      if (action === "ACCEPT") {
        setTimeout(() => {
          router.push(`/workspaces/${data.data.workspaceId}`);
        }, 1500);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-xs text-zinc-400">Verifying invitation token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-zinc-50/50 dark:bg-zinc-950">
      <header className="flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-lg">
          <span className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-black">
            IS
          </span>
          ImageSpace
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-md my-auto">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-8 shadow-xl backdrop-blur-sm text-center">
          {error ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Invalid Invitation
              </h1>
              <p className="text-xs text-zinc-500">{error}</p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="mt-2">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : resolvedMessage ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Response Recorded
              </h1>
              <p className="text-xs text-zinc-500">{resolvedMessage}</p>
              <Link href="/dashboard">
                <Button size="sm">
                  View Workspaces
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : invitation?.isExpired ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Invitation Expired
              </h1>
              <p className="text-xs text-zinc-500">
                This invitation expired after 7 days. Please ask the workspace owner to send a new invitation.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="mt-2">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <FolderKanban className="h-6 w-6" />
              </div>

              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Workspace Invitation
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1">
                  {invitation?.workspaceName}
                </h1>
                <p className="text-xs text-zinc-500 mt-2">
                  <strong>{invitation?.invitedByName}</strong> invited you to collaborate as a{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">{invitation?.role}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Offered Role</span>
                  <span className="font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    {invitation?.role === "EDITOR" ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {invitation?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Expires In</span>
                  <span className="text-zinc-600 dark:text-zinc-300 font-mono">
                    {new Date(invitation?.expiresAt || "").toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleAction("DECLINE")}
                  disabled={actionLoading}
                  className="w-1/2"
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Decline
                </Button>
                <Button
                  onClick={() => handleAction("ACCEPT")}
                  disabled={actionLoading}
                  loading={actionLoading}
                  className="w-1/2 shadow-sm"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Accept
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} ImageSpace. Collaborative Workspace Platform.
      </footer>
    </div>
  );
}
