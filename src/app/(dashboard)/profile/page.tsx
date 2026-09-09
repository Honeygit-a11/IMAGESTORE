"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  HardDrive,
  Smartphone,
  Monitor,
  Palette,
  LogOut,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  FolderKanban,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface SessionItem {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface UserProfileData {
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: string | null;
    authProvider: string;
    createdAt: string;
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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<UserProfileData | null>(null);
  const [sessions, setSessions] = React.useState<SessionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const fetchProfileAndSessions = React.useCallback(async () => {
    try {
      const [meRes, sessionsRes] = await Promise.all([
        fetch("/api/v1/auth/me"),
        fetch("/api/v1/auth/sessions"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setProfile(meData.data);
      } else {
        // Not authenticated
        router.push("/login");
        return;
      }

      if (sessionsRes.ok) {
        const sessData = await sessionsRes.json();
        setSessions(sessData.data.sessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchProfileAndSessions();
  }, [fetchProfileAndSessions]);

  const handleRevokeSession = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/auth/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setMessage("Session revoked successfully.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeOthers = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/auth/sessions/revoke-others", {
        method: "POST",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        setMessage("All other devices have been logged out.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-400">Loading your profile & security settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Account & Security Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your credentials, storage quota, active devices, and session security.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Info */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Personal Information
            </h2>
            <p className="text-xs text-zinc-500">
              Immutable primary identifier: email address cannot be changed.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={profile?.user.name || "ImageSpace Member"}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-500">
                Email Address (Immutable)
              </label>
              {profile?.user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="text-[11px] text-amber-500">Unverified</span>
              )}
            </div>
            <input
              type="email"
              readOnly
              value={profile?.user.email || ""}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Storage & Workspaces Capacity (Core Rules: 500 MB max, 2 workspaces max) */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Storage Usage & Workspace Capacity
            </h2>
            <p className="text-xs text-zinc-500">
              Platform limits: 500 MB total storage shared across maximum 2 workspaces.
            </p>
          </div>
        </div>

        {/* 500 MB Storage Bar */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-700 dark:text-zinc-300">
              Storage Utilized ({profile?.storage.usedFormatted || "0 MB"} of 500 MB)
            </span>
            <span className="text-zinc-500">{profile?.storage.percentUsed || 0}%</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${profile?.storage.percentUsed || 0}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            Images in Trash still count toward storage until permanent deletion after 30 days.
          </p>
        </div>

        {/* Workspace Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              Workspaces Limit
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {profile?.workspaces.currentCount || 0} / 2 Workspaces
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              Members Limit
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              3 Members / Workspace
            </p>
          </div>
        </div>
      </section>

      {/* Active Sessions & Multi-Device Management */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Active Devices & Sessions
              </h2>
              <p className="text-xs text-zinc-500">
                Review and revoke active sign-ins across all your devices.
              </p>
            </div>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOthers}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out Other Devices
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30"
            >
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-zinc-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-[200px] sm:max-w-md truncate">
                      {sess.userAgent}
                    </span>
                    {sess.isCurrent && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        Current Device
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    IP: {sess.ipAddress} · Last active:{" "}
                    {new Date(sess.lastActiveAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  disabled={actionLoading}
                  className="p-2 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Revoke session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Theme Settings */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Visual Theme
              </h2>
              <p className="text-xs text-zinc-500">
                Switch between Light, Dark, or automatically match your Operating System.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>
    </div>
  );
}
