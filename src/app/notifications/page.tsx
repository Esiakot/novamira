"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/components/auth/AuthPage";
import styles from "@/styles/pages/Notifications.module.css";

interface Notification {
  id: string;
  type: string;
  content: string | null;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  sender_username: string | null;
  sender_display_name: string | null;
  sender_avatar_url: string | null;
  is_longpost: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function getNotificationMessage(notif: Notification): string {
  const sender = notif.sender_display_name || notif.sender_username || "Quelqu'un";
  switch (notif.type) {
    case "like":
      return `${sender} a aimé votre post`;
    case "dislike":
      return `${sender} n'a pas aimé votre post`;
    case "follow":
      return `${sender} vous suit`;
    case "reply":
      return `${sender} a répondu à votre post`;
    case "mention":
      return `${sender} vous a mentionné`;
    case "repost":
      return `${sender} a repartagé votre post`;
    case "message":
      return `${sender} vous a envoyé un message`;
    case "system":
      return notif.content || "Notification système";
    case "poll_ended":
      return "Un sondage auquel vous avez participé est terminé";
    default:
      return notif.content || "Nouvelle notification";
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
    case "poll_ended": return "📊";
    default: return "🔔";
  }
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read_all: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true })),
        );
      }
    } catch {
      /* silent */
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      /* silent */
    }
  };

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Notifications</h1>
          {unreadCount > 0 && (
            <button className={styles.markAllBtn} onClick={markAllRead}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <p className={styles.loading}>Chargement...</p>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔔</span>
            <p>Aucune notification pour le moment.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((notif) => {
              const linkHref = notif.type === "follow" && notif.sender_username
                ? `/profile/${notif.sender_username}`
                : notif.post_id
                  ? (notif.is_longpost ? `/longpost/${notif.post_id}` : `/post/${notif.post_id}`)
                  : "#";

              return (
                <Link
                  key={notif.id}
                  href={linkHref}
                  className={`${styles.item} ${!notif.is_read ? styles.unread : ""}`}
                  onClick={() => !notif.is_read && markOneRead(notif.id)}
                >
                  <div className={styles.itemIcon}>
                    {notif.sender_avatar_url ? (
                      <img
                        src={notif.sender_avatar_url}
                        alt=""
                        className={styles.senderAvatar}
                      />
                    ) : (
                      <span className={styles.typeIcon}>
                        {getNotificationIcon(notif.type)}
                      </span>
                    )}
                  </div>
                  <div className={styles.itemContent}>
                    <p className={styles.itemMessage}>
                      {getNotificationMessage(notif)}
                    </p>
                    {notif.content && notif.type !== "system" && (
                      <p className={styles.itemPreview}>{notif.content}</p>
                    )}
                    <span className={styles.itemTime}>
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                  {!notif.is_read && <div className={styles.unreadDot} />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
