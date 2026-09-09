"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { KeyRound, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight, Loader2, Key } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = React.useState<"request" | "reset">("request");
  const [email, setEmail] = React.useState("");
  const [token, setToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to send reset code.");
        return;
      }

      setStep("reset");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to reset password.");
        return;
      }

      setSuccessMessage(data.data?.message || "Password successfully changed!");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-8 shadow-sm backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-4 mx-auto">
            <KeyRound className="h-6 w-6" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {step === "request" ? "Reset your password" : "Create new password"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {step === "request"
                ? "Enter your email to receive a password reset code"
                : "Enter the code sent to your email and your new password"}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                Password Reset Complete
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 px-4 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-sm"
              >
                Sign In with New Password
              </Link>
            </div>
          ) : step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={loading}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                  />
                  <Mail className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 px-4 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Reset Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.trim())}
                    placeholder="123456"
                    disabled={loading}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-center font-mono tracking-widest text-lg font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                  />
                  <Key className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                  />
                  <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                </div>

                <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${hasMinLength ? "text-emerald-500" : "text-zinc-400"}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${hasUppercase ? "text-emerald-500" : "text-zinc-400"}`} />
                    <span>1+ uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${hasNumber ? "text-emerald-500" : "text-zinc-400"}`} />
                    <span>1+ number</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token || !isPasswordValid}
                className="w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 px-4 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    Reset Password & Sign Out Devices
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-zinc-500">
            Remember your credentials?{" "}
            <Link
              href="/login"
              className="font-semibold text-zinc-900 dark:text-white underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} ImageSpace. End-to-end Session Security.
      </footer>
    </div>
  );
}
