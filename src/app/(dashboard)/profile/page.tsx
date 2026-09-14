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
  KeyRound,
  Mail,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
import { SectionSkeleton } from "@/components/ui/skeleton-loaders";
import { MountReveal, Stagger } from "@/components/ui/stagger";

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
      <div className="max-w-4xl space-y-6 animate-fade-in-up">
        <div>
          <div className="h-8 w-52 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
        <SectionSkeleton count={4} />
      </div>
    );
  }

  const isCredentialsUser = profile?.user.authProvider === "CREDENTIALS";

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Top Header */}
      <MountReveal className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            Profile & Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your credentials, storage allocation across workspaces, and active device sessions.
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200/60 dark:border-red-900/40"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </Button>
      </MountReveal>

      {/* Global Message Banner */}
      {message && (
        <div
          className={`animate-fade-in-down p-4 rounded-xl border flex items-center gap-3 text-xs border-l-4 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 border-l-emerald-500 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 border-l-rose-500 text-rose-800 dark:text-rose-200"
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

      {/* 1. Personal Details */}
      <Stagger stagger={0.08}>
        <SectionCard
          icon={<User className="h-5 w-5" />}
          iconBg="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          title="Personal Details"
          description="Primary account identity. Per platform rules, email cannot be altered."
          headerAction={
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-800 text-zinc-600 dark:text-zinc-300">
              {profile?.user.authProvider === "GOOGLE" ? "Google OAuth" : "Email & Password"}
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
                Full Name
              </label>
              <Input
                readOnly
                value={profile?.user.name || "ImageSpace Member"}
                className="bg-zinc-50/50 dark:bg-zinc-900"
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
              <Input
                type="email"
                readOnly
                value={profile?.user.email || ""}
                className="bg-zinc-50/50 dark:bg-zinc-900"
              />
            </div>
          </div>
        </SectionCard>

        {/* 2. Password & Security */}
        <SectionCard
          icon={<KeyRound className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
          title="Password & Security"
          description={
            isCredentialsUser
              ? "Change your password with email one-time verification protection."
              : "Your sign-in credentials are authenticated through Google."
          }
        >
          {isCredentialsUser ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    New Password (min 8 chars, 1 uppercase, 1 number)
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Email Verification Code (6 digits)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    className="w-40 font-mono tracking-[0.3em] text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequestCode}
                    disabled={requestingCode || codeCooldown > 0}
                    loading={requestingCode}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {codeCooldown > 0 ? `Resend in ${codeCooldown}s` : "Get Code"}
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  A 6-digit confirmation code will be sent to <strong>{profile?.user.email}</strong>.
                </p>
              </div>

              <div className="pt-1">
                <Button type="submit" disabled={updatingPassword} loading={updatingPassword}>
                  {!updatingPassword && <KeyRound className="h-4 w-4" />}
                  Update Password
                </Button>
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
        </SectionCard>

        {/* 3. Storage Usage */}
        <SectionCard
          icon={<HardDrive className="h-5 w-5" />}
          iconBg="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
          title="Storage Usage & Workspace Allocation"
          description="Platform quota: 500 MB total storage shared across a maximum of 2 workspaces."
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">
                Total Storage Utilized ({profile?.storage.usedFormatted || "0 MB"} of 500 MB)
              </span>
              <span className="text-zinc-500">{profile?.storage.percentUsed || 0}%</span>
            </div>
            <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-500 dark:to-indigo-400 rounded-full transition-all duration-700"
                style={{ width: `${profile?.storage.percentUsed || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Soft-deleted files in Trash still reserve quota until 30-day purge.</span>
              <span>{(500 - (profile?.storage.usedBytes || 0) / (1024 * 1024)).toFixed(1)} MB available</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
                <FolderKanban className="h-4 w-4 text-blue-500" />
                Workspaces Limit
              </div>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {profile?.workspaces.currentCount || 0} / 2 Workspaces
              </p>
            </div>
            <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
                <ShieldCheck className="h-4 w-4 text-purple-500" />
                Members Capacity
              </div>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                3 Members / Workspace
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
              Storage Usage Across Workspaces
            </h3>

            {profile?.storage.workspaces && profile.storage.workspaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.storage.workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5 duration-200"
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
        </SectionCard>

        {/* 4. Active Devices & Sessions */}
        <SectionCard
          icon={<Smartphone className="h-5 w-5" />}
          iconBg="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
          title="Active Devices & Sessions"
          description="Review and revoke active sign-ins across all your devices."
          headerAction={
            sessions.length > 1 ? (
              <Button
                onClick={handleRevokeOthers}
                disabled={actionLoading}
                size="sm"
                variant="secondary"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out Other Devices
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-[200px] sm:max-w-md truncate">
                        {sess.userAgent}
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.3)]">
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
        </SectionCard>

        {/* 5. Theme Settings */}
        <SectionCard
          icon={<Palette className="h-5 w-5" />}
          iconBg="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          title="Visual Theme"
          description="Switch between Light, Dark, or match your Operating System default."
          headerAction={<ThemeToggle />}
        >
          <div className="rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800/60 border border-zinc-100 dark:border-zinc-800 p-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            Changes apply instantly across the entire application — including the landing page, dashboards, and image galleries.
          </div>
        </SectionCard>
      </Stagger>
    </div>
  );
}