"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/styles/layout/Header.module.css";
import {
  ProfilIcon,
  PrivateMessageIcon,
  NotificationIcon,
  SettingsIcon,
  LogoutIcon,
} from "@/assets/FlatIcons";
import { useAuth } from "@/hooks/useAuth";

interface NotifPreview {
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

interface ConvPreview {
  id: string;
  type: string;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_created_at: string | null;
  other_username: string | null;
  other_display_name: string | null;
  other_avatar_url: string | null;
  unread_count: number;
}

function notifMessage(n: NotifPreview): string {
  const who = n.sender_display_name || n.sender_username || "Quelqu'un";
  switch (n.type) {
    case "like":    return `${who} a aimé votre post`;
    case "dislike": return `${who} n'a pas aimé votre post`;
    case "follow":  return `${who} vous suit`;
    case "reply":   return `${who} a répondu à votre post`;
    case "mention": return `${who} vous a mentionné`;
    case "repost":  return `${who} a repartagé votre post`;
    case "message": return `${who} vous a envoyé un message`;
    case "system":  return n.content || "Notification système";
    default:        return n.content || "Nouvelle notification";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifPreview[]>([]);
  const [convs, setConvs] = useState<ConvPreview[]>([]);
  const [newConvUsername, setNewConvUsername] = useState("");
  const [newConvError, setNewConvError] = useState("");
  const [showNewConvInput, setShowNewConvInput] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgUnreadCount, setMsgUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    if (document.hidden) return;
    try {
      const [notifRes, msgRes] = await Promise.all([
        fetch("/api/notifications/unread-count"),
        fetch("/api/messages/unread-count"),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        setUnreadCount(data.count);
      }
      if (msgRes.ok) {
        const data = await msgRes.json();
        setMsgUnreadCount(data.count);
      }
    } catch { /* silent */ }
  }, [user]);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchConvs = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConvs((data.conversations || []).slice(0, 5));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);

    const handleVisibility = () => {
      if (!document.hidden) fetchUnread();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, fetchUnread]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) {
        setMsgOpen(false);
        setShowNewConvInput(false);
        setNewConvUsername("");
        setNewConvError("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render header when not logged in
  if (!user) return null;

  const toggleNotifMenu = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) {
      fetchNotifs();
      setSettingsOpen(false);
      setMsgOpen(false);
    }
  };

  const toggleMsgMenu = () => {
    const next = !msgOpen;
    setMsgOpen(next);
    if (next) {
      fetchConvs();
      setSettingsOpen(false);
      setNotifOpen(false);
      setShowNewConvInput(false);
      setNewConvUsername("");
      setNewConvError("");
    }
  };

  const handleLogout = async () => {
    setSettingsOpen(false);
    await logout();
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [id] }),
      });
    } catch { /* silent */ }
  };

  const handleNewConv = async () => {
    if (!newConvUsername.trim()) return;
    setNewConvError("");
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_username: newConvUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewConvError(data.error || "Erreur");
        return;
      }
      setMsgOpen(false);
      setShowNewConvInput(false);
      setNewConvUsername("");
      router.push(`/privatemessage?conv=${data.conversation_id}`);
    } catch {
      setNewConvError("Erreur réseau");
    }
  };

  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>
        <Link href="/">novamira</Link>
      </h1>
      <input className={styles.search} type="text" placeholder="search..." />
      <nav className={styles.nav}>
        <Link href={`/profile/${user.account.username}`} aria-label="Profil">
          <ProfilIcon className={styles.icons} />
        </Link>

        {/* ── Messages dropdown ── */}
        <div className={styles.notifWrapper} ref={msgRef}>
          <button
            onClick={toggleMsgMenu}
            aria-label="Messages"
            className={styles.notifButton}
          >
            <PrivateMessageIcon className={styles.icons} />
            {msgUnreadCount > 0 && (
              <span className={styles.notifBadge}>
                {msgUnreadCount > 99 ? "99+" : msgUnreadCount}
              </span>
            )}
          </button>
          {msgOpen && (
            <div className={styles.notifMenu}>
              <div className={styles.notifHeader} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={styles.notifTitle}>Messages</span>
                <button
                  className={styles.msgNewBtn}
                  onClick={() => setShowNewConvInput((v) => !v)}
                  title="Nouvelle conversation"
                >
                  +
                </button>
              </div>
              {showNewConvInput && (
                <div className={styles.msgNewConv}>
                  <input
                    className={styles.msgNewConvInput}
                    placeholder="Nom d'utilisateur..."
                    value={newConvUsername}
                    onChange={(e) => { setNewConvUsername(e.target.value); setNewConvError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleNewConv()}
                    autoFocus
                  />
                  {newConvError && <p className={styles.msgNewConvError}>{newConvError}</p>}
                </div>
              )}
              {convs.length === 0 ? (
                <p className={styles.notifEmpty}>Aucune conversation</p>
              ) : (
                <div className={styles.notifList}>
                  {convs.map((c) => (
                    <button
                      key={c.id}
                      className={`${styles.notifItem} ${c.unread_count > 0 ? styles.notifUnread : ""}`}
                      onClick={() => {
                        setMsgOpen(false);
                        router.push(`/privatemessage?conv=${c.id}`);
                      }}
                    >
                      <div className={styles.notifItemIcon}>
                        {c.other_avatar_url ? (
                          <img src={c.other_avatar_url} alt="" className={styles.notifAvatar} />
                        ) : (
                          <span className={styles.notifEmoji}>
                            {(c.other_display_name || c.other_username || "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className={styles.notifItemBody}>
                        <p className={styles.notifItemMsg} style={{ fontWeight: 600 }}>
                          {c.other_display_name || c.other_username || "Conversation"}
                        </p>
                        <p className={styles.notifItemMsg} style={{ fontWeight: 400, opacity: 0.7 }}>
                          {c.last_message_content
                            ? (c.last_message_sender_id === user.account.id ? "Vous: " : "") +
                              (c.last_message_content.length > 40
                                ? c.last_message_content.slice(0, 40) + "…"
                                : c.last_message_content)
                            : "Pas de message"}
                        </p>
                        {c.last_message_created_at && (
                          <span className={styles.notifItemTime}>{timeAgo(c.last_message_created_at)}</span>
                        )}
                      </div>
                      {c.unread_count > 0 && <span className={styles.notifDot} />}
                    </button>
                  ))}
                </div>
              )}
              <Link
                href="/privatemessage"
                className={styles.notifSeeAll}
                onClick={() => setMsgOpen(false)}
              >
                + Voir tous les messages
              </Link>
            </div>
          )}
        </div>

        {/* ── Notification dropdown ── */}
        <div className={styles.notifWrapper} ref={notifRef}>
          <button
            onClick={toggleNotifMenu}
            aria-label="Notifications"
            className={styles.notifButton}
          >
            <NotificationIcon className={styles.icons} />
            {unreadCount > 0 && (
              <span className={styles.notifBadge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className={styles.notifMenu}>
              <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>Notifications</span>
              </div>
              {notifs.length === 0 ? (
                <p className={styles.notifEmpty}>Aucune notification</p>
              ) : (
                <div className={styles.notifList}>
                  {notifs.map((n) => {
                    const href =
                      n.type === "follow" && n.sender_username
                        ? `/profile/${n.sender_username}`
                        : n.post_id
                          ? (n.is_longpost ? `/longpost/${n.post_id}` : `/post/${n.post_id}`)
                          : "/notifications";
                    return (
                      <button
                        key={n.id}
                        className={`${styles.notifItem} ${!n.is_read ? styles.notifUnread : ""}`}
                        onClick={() => {
                          if (!n.is_read) {
                            markOneRead(n.id);
                            setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
                            setUnreadCount((c) => Math.max(c - 1, 0));
                          }
                          setNotifOpen(false);
                          router.push(href);
                        }}
                      >
                        <div className={styles.notifItemIcon}>
                          {n.sender_avatar_url ? (
                            <img src={n.sender_avatar_url} alt="" className={styles.notifAvatar} />
                          ) : (
                            <span className={styles.notifEmoji}>
                              {n.type === "like" ? "👍" : n.type === "dislike" ? "👎" : n.type === "follow" ? "👤" : n.type === "reply" ? "💬" : "🔔"}
                            </span>
                          )}
                        </div>
                        <div className={styles.notifItemBody}>
                          <p className={styles.notifItemMsg}>{notifMessage(n)}</p>
                          <span className={styles.notifItemTime}>{timeAgo(n.created_at)}</span>
                        </div>
                        {!n.is_read && <span className={styles.notifDot} />}
                      </button>
                    );
                  })}
                </div>
              )}
              <Link
                href="/notifications"
                className={styles.notifSeeAll}
                onClick={() => setNotifOpen(false)}
              >
                + Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>

        <div className={styles.settingsWrapper} ref={menuRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-label="Paramètres"
            className={styles.settingsButton}
          >
            <SettingsIcon className={styles.icons} />
          </button>
          {settingsOpen && (
            <div className={styles.settingsMenu}>
              <div className={styles.menuUser}>
                <span className={styles.menuDisplayName}>
                  {user.account.display_name}
                </span>
                <span className={styles.menuUsername}>
                  @{user.account.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={styles.menuItem}
              >
                <LogoutIcon className={styles.menuIcon} />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
