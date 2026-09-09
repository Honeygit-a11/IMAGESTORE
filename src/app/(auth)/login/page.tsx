"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Lock, Mail, AlertCircle, ArrowRight, Loader2, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = React.useState<number | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (lockoutSeconds && lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === "ACCOUNT_LOCKED") {
          setLockoutSeconds(data.error.details?.retryAfterSeconds || 900);
          setError(data.error.message);
        } else if (data.error?.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(data.error.details?.email || email);
          setError(data.error.message);
        } else {
          setError(data.error?.message || "Failed to sign in. Please try again.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Sign in to access your workspaces & storage
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <span>{error}</span>
                {unverifiedEmail && (
                  <div className="mt-2">
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                      className="font-semibold underline underline-offset-2 hover:text-red-900 dark:hover:text-red-100"
                    >
                      Click here to enter your verification code &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {lockoutSeconds && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Account temporarily locked. Retry in: <strong>{lockoutSeconds}s</strong>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={loading || !!lockoutSeconds}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                />
                <Mail className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading || !!lockoutSeconds}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
                />
                <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!lockoutSeconds}
              className="w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 px-4 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-zinc-900 dark:text-white underline underline-offset-4"
            >
              Create free account
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
