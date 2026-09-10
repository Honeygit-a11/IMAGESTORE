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
  KeyRound,
  Mail,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface SessionItem {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface WorkspaceStorageItem {
  id: string;
  name: string;
  role: string;
  storageUsedBytes: number;
  storageUsedFormatted: string;
  imageCount: number;
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
    workspaces?: WorkspaceStorageItem[];
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
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeCooldown, setCodeCooldown] = React.useState(0);
  const [requestingCode, setRequestingCode] = React.useState(false);
  const [updatingPassword, setUpdatingPassword] = React.useState(false);

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

  // Code cooldown timer
  React.useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setInterval(() => {
      setCodeCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [codeCooldown]);

  const handleRevokeSession = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/auth/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setMessage({ type: "success", text: "Session revoked successfully." });
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
        setMessage({ type: "success", text: "All other devices have been logged out." });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCode = async () => {
    if (codeCooldown > 0 || requestingCode) return;
    setRequestingCode(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/auth/password-change/request-code", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCodeCooldown(60);
        setMessage({
          type: "success",
          text: "Verification code sent! Please check your email inbox.",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error?.message || "Failed to send verification code.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while requesting code." });
    } finally {
      setRequestingCode(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !code) {
      setMessage({ type: "error", text: "Please fill in all password change fields." });
      return;
    }

    setUpdatingPassword(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/auth/password-change/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          code,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Password changed successfully! Other sessions were terminated for security.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setCode("");
        // Refresh sessions list
        fetchProfileAndSessions();
      } else {
        setMessage({
          type: "error",
          text: data.error?.message || "Failed to update password.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while updating password." });
    } finally {
      setUpdatingPassword(false);
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
        <p className="text-sm text-zinc-400">Loading your profile & settings...</p>
      </div>
    );
  }

  const isCredentialsUser = profile?.user.authProvider === "CREDENTIALS";

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Profile & Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your credentials, storage allocation across workspaces, and active device sessions.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </button>
      </div>

      {/* Global Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Personal Information */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Personal Details
              </h2>
              <p className="text-xs text-zinc-500">
                Primary account identity. Per platform rules, email cannot be altered.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {profile?.user.authProvider === "GOOGLE" ? "Google OAuth" : "Email & Password"}
          </span>
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

      {/* 2. Password & Security Management */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Password & Security
            </h2>
            <p className="text-xs text-zinc-500">
              {isCredentialsUser
                ? "Change your password with email one-time verification protection."
                : "Your sign-in credentials are authenticated through Google."}
            </p>
          </div>
        </div>

        {isCredentialsUser ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  New Password (min 8 chars, 1 uppercase, 1 number)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Email Verification Code Row */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Email Verification Code (6 digits)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-40 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-mono tracking-wider text-center text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={requestingCode || codeCooldown > 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {requestingCode ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  {codeCooldown > 0 ? `Resend code in ${codeCooldown}s` : "Get Code via Email"}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                A 6-digit confirmation code will be sent to <strong>{profile?.user.email}</strong>.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {updatingPassword ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                Update Password
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                Managed by Google Sign-In
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Your account is authenticated via Google. Password reset and verification codes are handled directly by Google.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Storage Usage & Workspace Breakdown */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Storage Usage & Workspace Allocation
            </h2>
            <p className="text-xs text-zinc-500">
              Platform quota: 500 MB total storage shared across a maximum of 2 workspaces.
            </p>
          </div>
        </div>

        {/* Global Storage Bar */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-700 dark:text-zinc-300">
              Total Storage Utilized ({profile?.storage.usedFormatted || "0 MB"} of 500 MB)
            </span>
            <span className="text-zinc-500">{profile?.storage.percentUsed || 0}%</span>
          </div>
          <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${profile?.storage.percentUsed || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Soft-deleted files in Trash still reserve quota until 30-day purge.</span>
            <span>{(500 - (profile?.storage.usedBytes || 0) / (1024 * 1024)).toFixed(1)} MB available</span>
          </div>
        </div>

        {/* Workspace Capacity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Members Capacity
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              3 Members / Workspace
            </p>
          </div>
        </div>

        {/* Per-Workspace Storage Breakdown */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
            Storage Usage Across Workspaces
          </h3>

          {profile?.storage.workspaces && profile.storage.workspaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.storage.workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {ws.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {ws.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {ws.imageCount} active images
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {ws.storageUsedFormatted}
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      {((ws.storageUsedBytes / (500 * 1024 * 1024)) * 100).toFixed(1)}% quota
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              No workspaces created yet. Create a workspace from the dashboard to start storing images.
            </p>
          )}
        </div>
      </section>

      {/* 4. Active Devices & Multi-Device Management */}
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

      {/* 5. Theme Settings */}
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
                Switch between Light, Dark, or match your Operating System default.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>
    </div>
  );
}
