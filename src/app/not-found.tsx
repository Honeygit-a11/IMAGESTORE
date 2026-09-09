import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-900 p-4 text-zinc-600 dark:text-zinc-400 mb-4 ring-8 ring-zinc-50 dark:ring-zinc-900/50">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Page not found
      </h2>
      <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        The page or resource you are looking for does not exist, or has been moved.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
