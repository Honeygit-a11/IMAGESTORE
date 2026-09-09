export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800" />
        <div className="absolute h-10 w-10 rounded-full border-2 border-transparent border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
      </div>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
        Loading ImageSpace...
      </p>
    </div>
  );
}
