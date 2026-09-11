"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Live password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to register account.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50/50 dark:bg-zinc-950">
      <Navbar />

      <main className="mx-auto w-full max-w-md my-auto px-4 py-8">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-8 shadow-sm backdrop-blur-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Create your account
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              500 MB cloud storage · 2 workspaces · 3 members per workspace
            </p>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/v1/auth/google"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 py-2.5 px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer mb-5"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign up with Google</span>
          </a>

          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider absolute">
              or with email
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Connor"
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                />
                <User className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>

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
                  placeholder="sarah@example.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                />
                <Mail className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Note: Email address cannot be changed after registration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                />
                <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      hasMinLength ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"
                    }`}
                  />
                  <span className={hasMinLength ? "text-zinc-900 dark:text-zinc-100 font-medium" : ""}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      hasUppercase ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"
                    }`}
                  />
                  <span className={hasUppercase ? "text-zinc-900 dark:text-zinc-100 font-medium" : ""}>
                    At least one uppercase letter (A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      hasNumber ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"
                    }`}
                  />
                  <span className={hasNumber ? "text-zinc-900 dark:text-zinc-100 font-medium" : ""}>
                    At least one number (0-9)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 px-4 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register & Verify Email
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Already have an account?{" "}
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
