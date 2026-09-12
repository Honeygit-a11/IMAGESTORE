"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  Globe,
  ArrowUpRight,
} from "lucide-react";

export interface Footer8Props {
  className?: string;
}

export function Footer8({ className = "" }: Footer8Props) {
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer
      className={`border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand & Newsletter Column (replaces Hostier with ImageSpace) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/20">
                IS
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                ImageSpace
              </span>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              Collaborative image storage and organization for modern teams. Secure direct-to-cloud transfers, customizable taxonomy, and isolated workspace controls.
            </p>

            {/* Live Infrastructure Status */}
            {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational · 99.9% Uptime</span>
            </div> */}

            {/* Newsletter Subscription */}
            <div className="pt-2 max-w-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-2">
                Stay updated
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Thanks for subscribing to ImageSpace updates!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 shadow-xs"
                  >
                    <span>Subscribe</span>
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Product Column */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">
                Product
              </h3>
              <ul className="space-y-3 text-xs">
                <li>
                  <a
                    href="#features"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Feature Showcase
                  </a>
                </li>
                <li>
                  <a
                    href="#storage"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Storage Insights</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                      500MB
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#roles"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Roles & Permissions
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Presigned S3 Ingestion
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    30-Day Trash Retention
                  </a>
                </li>
              </ul>
            </div>

            {/* Platform & Workspaces */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">
                Workspaces
              </h3>
              <ul className="space-y-3 text-xs">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Workspace Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Create Workspace</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Team Login
                  </Link>
                </li>
                <li>
                  <span className="text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
                    Custom Domains (Coming Soon)
                  </span>
                </li>
                <li>
                  <span className="text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
                    API Tokens (Coming Soon)
                  </span>
                </li>
              </ul>
            </div>

            {/* Security & Governance */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">
                Security & Trust
              </h3>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-1.5 text-zinc-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>S3-Compatible Encryption</span>
                </li>
                <li className="flex items-center gap-1.5 text-zinc-500">
                  <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Per-Workspace Isolation</span>
                </li>
                <li className="flex items-center gap-1.5 text-zinc-500">
                  <Globe className="h-3.5 w-3.5 text-purple-500" />
                  <span>Sub-40ms Presigned Tokens</span>
                </li>
                <li>
                  <a
                    href="#roles"
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Access Audit Activity Logs
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Socials & Legal */}
        <div className="mt-14 pt-8 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-4 text-zinc-500">
            <span>&copy; {new Date().getFullYear()} ImageSpace. All rights reserved.</span>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">·</span>
            <span className="hidden sm:inline">Built for modern collaborative image workflows.</span>
          </div>

          {/* Social Links using SVG */}
          <div className="flex items-center gap-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter / X"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer8;
