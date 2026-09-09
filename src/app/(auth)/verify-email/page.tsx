"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { MailCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, Key } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialToken = searchParams.get("token") || "";

  const [email, setEmail] = React.useState(initialEmail);
  const [token, setToken] = React.useState(initialToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Auto-verify if both email and token are provided via link click
  React.useEffect(() => {
    if (initialEmail && initialToken) {
      handleVerification(initialEmail, initialToken);
    }
  }, [initialEmail, initialToken]);

  const handleVerification = async (targetEmail: string, targetToken: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, token: targetToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Invalid or expired verification code.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) return;
    handleVerification(email, token);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-8 shadow-sm backdrop-blur-sm">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        <MailCheck className="h-6 w-6" />
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Verify your email
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enter the 6-digit verification code sent to your inbox
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
            Email Verified Successfully!
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Redirecting you to the sign-in page...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 underline mt-2"
          >
            Click here if not redirected automatically
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Verification Code (6-Digit)
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

          <button
            type="submit"
            disabled={loading || !token || !email}
            className="w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 px-4 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Confirm & Activate Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-zinc-500">
        Already activated?{" "}
        <Link
          href="/login"
          className="font-semibold text-zinc-900 dark:text-white underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
        <React.Suspense fallback={<div className="p-8 text-center text-sm text-zinc-400">Loading verification form...</div>}>
          <VerifyEmailForm />
        </React.Suspense>
      </main>

      <footer className="text-center text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} ImageSpace. End-to-end Session Security.
      </footer>
    </div>
  );
}
