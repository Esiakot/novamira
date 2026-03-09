"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import styles from "@/styles/components/NotificationToast.module.css";
import { useAuth } from "@/hooks/useAuth";

interface ToastNotification {
  id: string;
  type: string;
  content: string | null;
  post_id: string | null;
  is_read: boolean;
  sender_username: string | null;
  sender_display_name: string | null;
  sender_avatar_url: string | null;
  created_at: string;
  is_longpost: boolean;
}

const POLL_INTERVAL = 30_000; // 30 seconds base
const POLL_INTERVAL_IDLE = 120_000; // 2 min when no new notifs

function getNotificationMessage(notif: ToastNotification): string {
  const sender = notif.sender_display_name || notif.sender_username || "Quelqu'un";
  switch (notif.type) {
    case "like": return `${sender} a aimé votre post`;
    case "dislike": return `${sender} n'a pas aimé votre post`;
    case "follow": return `${sender} vous suit`;
    case "reply": return `${sender} a répondu à votre post`;
    case "mention": return `${sender} vous a mentionné`;
    case "repost": return `${sender} a repartagé votre post`;
    case "message": return `${sender} vous a envoyé un message`;
    case "system": return notif.content || "Notification système";
    default: return notif.content || "Nouvelle notification";
  }
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "like": return "👍";
    case "dislike": return "👎";
    case "follow": return "👤";
    case "reply": return "💬";
    case "mention": return "@";
    case "repost": return "🔄";
    case "message": return "✉️";
    case "system": return "🔔";
    default: return "🔔";
  }
}

export default function NotificationToast() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const lastCheck = useRef<string | null>(null);
  const initialized = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNewRecently = useRef(false);

  const pollNotifications = useCallback(async () => {
    if (!user) return;
    // Don't poll when tab is hidden
    if (document.hidden) return;

    try {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) return;

      const data = await res.json();
      const notifications: ToastNotification[] = data.notifications || [];

      // On first poll, just record existing IDs without showing toasts
      if (!initialized.current) {
        for (const n of notifications) {
          seenIds.current.add(n.id);
        }
        if (notifications.length > 0) {
          lastCheck.current = notifications[0].created_at;
        }
        initialized.current = true;
        return;
      }

      // Show new notifications as toasts
      const newNotifs = notifications.filter(
        (n) => !seenIds.current.has(n.id) && !n.is_read,
      );

      hasNewRecently.current = newNotifs.length > 0;

      if (newNotifs.length > 0) {
        for (const n of newNotifs) {
          seenIds.current.add(n.id);
        }
        setToasts((prev) => [...newNotifs, ...prev].slice(0, 5));

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          setToasts((prev) =>
            prev.filter((t) => !newNotifs.some((n) => n.id === t.id)),
          );
        }, 6000);
      }
    } catch {
      /* silent */
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial poll
    pollNotifications();

    // Adaptive polling: shorter interval if recent activity, longer if idle
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const interval = hasNewRecently.current ? POLL_INTERVAL : POLL_INTERVAL_IDLE;
      intervalRef.current = setInterval(pollNotifications, interval);
    };

    startPolling();

    // Re-poll when tab becomes visible again
    const handleVisibility = () => {
      if (!document.hidden) {
        pollNotifications();
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, pollNotifications]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => {
        const linkHref =
          toast.type === "follow" && toast.sender_username
            ? `/profile/${toast.sender_username}`
            : toast.post_id
              ? (toast.is_longpost ? `/longpost/${toast.post_id}` : `/post/${toast.post_id}`)
              : "/notifications";

        return (
          <div key={toast.id} className={styles.toast}>
            <Link href={linkHref} className={styles.toastLink} onClick={() => dismissToast(toast.id)}>
              <div className={styles.toastIcon}>
                {toast.sender_avatar_url ? (
                  <img src={toast.sender_avatar_url} alt="" className={styles.toastAvatar} />
                ) : (
                  <span className={styles.toastEmoji}>{getNotificationIcon(toast.type)}</span>
                )}
              </div>
              <p className={styles.toastMessage}>{getNotificationMessage(toast)}</p>
            </Link>
            <button
              className={styles.toastClose}
              onClick={() => dismissToast(toast.id)}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
