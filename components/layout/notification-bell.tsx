"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { notificationsService } from "@/services/notifications.service";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/database";

const POLL_MS = 30_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function poll() {
      try {
        setUnreadCount(await notificationsService.countUnread());
      } catch {
        // silencioso
      }
    }
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        setNotifications(await notificationsService.listRecent());
      } catch {
        // silencioso
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silencioso
    }
  }

  async function handleMarkOne(notification: Notification) {
    if (!notification.read) {
      try {
        await notificationsService.markRead(notification.id);
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silencioso
      }
    }

    setOpen(false);
    if (notification.related_task_id) {
      router.push(`/tarefa/${notification.related_task_id}`);
    } else if (notification.team_id) {
      router.push(`/equipas/${notification.team_id}`);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Notificações</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[var(--color-secondary)] hover:underline"
              >
                <Check className="h-3 w-3" /> Marcar tudo como lido
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">Sem notificações.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleMarkOne(notification)}
                  className={cn(
                    "flex w-full items-start gap-2 border-b border-[var(--color-border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-surface-alt)]",
                    !notification.read && "bg-[var(--color-accent)]/5"
                  )}
                >
                  {!notification.read && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  )}
                  <div className={cn("min-w-0 flex-1", notification.read && "pl-3.5")}>
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">{notification.title}</p>
                    {notification.body && (
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">{notification.body}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-[var(--color-ink-muted)]">
                      {new Date(notification.created_at).toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
