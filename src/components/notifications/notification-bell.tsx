"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Mail,
  UserCheck,
  UserX,
  Shield,
  Crown,
  AlertTriangle,
  Inbox,
  Loader2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [markingAll, setMarkingAll] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications?limit=20");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // ignore network errors
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s interval
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleMarkAsRead = async (id: string, link: string | null) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setOpen(false);
        router.push(link);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/v1/notifications/mark-all-read", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "INVITATION_RECEIVED":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "INVITATION_ACCEPTED":
        return <UserCheck className="h-4 w-4 text-emerald-500" />;
      case "INVITATION_DECLINED":
        return <UserX className="h-4 w-4 text-rose-500" />;
      case "MEMBER_REMOVED":
        return <UserX className="h-4 w-4 text-amber-500" />;
      case "MEMBER_ROLE_CHANGED":
        return <Shield className="h-4 w-4 text-purple-500" />;
      case "OWNERSHIP_TRANSFER_COMPLETED":
        return <Crown className="h-4 w-4 text-amber-500" />;
      case "SECURITY_ALERT":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-zinc-500" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        aria-label="View notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 dark:bg-red-950/60 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {markingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  All caught up!
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  No notifications to display right now.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                  className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                    n.read
                      ? "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 opacity-75 hover:opacity-100"
                      : "bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                  }`}
                >
                  <div className="mt-0.5 shrink-0 rounded-xl p-2 bg-zinc-100 dark:bg-zinc-800">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600 ring-2 ring-blue-100 dark:ring-blue-900" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
