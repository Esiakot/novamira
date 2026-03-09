"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/components/auth/AuthPage";
import styles from "@/styles/pages/Messages.module.css";

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  last_message_at: string | null;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_sender_username: string | null;
  last_message_created_at: string | null;
  other_id: string | null;
  other_username: string | null;
  other_display_name: string | null;
  other_avatar_url: string | null;
  unread_count: number;
  last_read_at: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender_username: string;
  sender_display_name: string;
  sender_avatar_url: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvUsername, setNewConvUsername] = useState("");
  const [newConvError, setNewConvError] = useState("");
  const [newConvLoading, setNewConvLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTypingSent = useRef(0);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ }
  }, []);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* silent */ }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // Auto-select conversation from URL query param
  useEffect(() => {
    const convParam = searchParams.get("conv");
    if (convParam && convParam !== activeConvId) {
      setActiveConvId(convParam);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Mark as read
      fetch(`/api/messages/${activeConvId}/read`, { method: "POST" }).catch(() => {});
    }
  }, [activeConvId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Poll for new messages and typing status
  useEffect(() => {
    if (!activeConvId || !user) return;

    const pollMessages = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/messages/${activeConvId}/messages`);
        if (res.ok) {
          const data = await res.json();
          const newMsgs: Message[] = data.messages || [];
          setMessages((prev) => {
            if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].id !== prev[prev.length - 1]?.id)) {
              return newMsgs;
            }
            return prev;
          });
        }
      } catch { /* silent */ }
    };

    const pollTyping = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/messages/${activeConvId}/typing`);
        if (res.ok) {
          const data = await res.json();
          setTypingUsers(data.typing || []);
        }
      } catch { /* silent */ }
    };

    const msgInterval = setInterval(pollMessages, 3000);
    const typInterval = setInterval(pollTyping, 2000);

    const handleVisibility = () => {
      if (!document.hidden) {
        pollMessages();
        fetch(`/api/messages/${activeConvId}/read`, { method: "POST" }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(msgInterval);
      clearInterval(typInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeConvId, user]);

  // Convs polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (!document.hidden) fetchConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, fetchConversations]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!activeConvId) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    fetch(`/api/messages/${activeConvId}/typing`, { method: "POST" }).catch(() => {});
  }, [activeConvId]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "36px";
        }
        fetchConversations();
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  // Create new conversation
  const handleNewConv = async () => {
    if (!newConvUsername.trim()) return;
    setNewConvError("");
    setNewConvLoading(true);
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
      setShowNewConv(false);
      setNewConvUsername("");
      await fetchConversations();
      setActiveConvId(data.conversation_id);
    } catch {
      setNewConvError("Erreur réseau");
    } finally {
      setNewConvLoading(false);
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = "36px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    sendTypingIndicator();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading) {
    return <div className={styles.page}><p style={{ marginTop: "20vh", opacity: 0.5 }}>Chargement...</p></div>;
  }
  if (!user) return <AuthPage />;

  // Check if the last message in active conv was read by the other user
  const getReadStatus = (msg: Message): "sent" | "seen" => {
    if (msg.sender_id !== user.account.id) return "sent";
    if (!activeConv?.last_read_at) return "sent";
    return new Date(activeConv.last_read_at) >= new Date(msg.created_at) ? "seen" : "sent";
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const lastSelfMessageId = [...messages].reverse().find((m) => m.sender_id === user.account.id)?.id;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Messages</h2>
            <button className={styles.newConvBtn} onClick={() => setShowNewConv(true)} title="Nouvelle conversation">
              +
            </button>
          </div>
          <div className={styles.convList}>
            {conversations.length === 0 ? (
              <div className={styles.emptyConvList}>
                <span style={{ fontSize: "2rem" }}>✉️</span>
                <p>Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`${styles.convItem} ${conv.id === activeConvId ? styles.convItemActive : ""}`}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  {conv.other_avatar_url ? (
                    <img src={conv.other_avatar_url} alt="" className={styles.convAvatar} />
                  ) : (
                    <div className={styles.convAvatarPlaceholder}>
                      {(conv.other_display_name || conv.other_username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className={styles.convInfo}>
                    <div className={styles.convName}>
                      {conv.other_display_name || conv.other_username || "Conversation"}
                    </div>
                    <div className={styles.convPreview}>
                      {conv.last_message_content
                        ? (conv.last_message_sender_id === user.account.id ? "Vous: " : "") + conv.last_message_content
                        : "Pas de message"}
                    </div>
                  </div>
                  <div className={styles.convMeta}>
                    {conv.last_message_created_at && (
                      <span className={styles.convTime}>{timeAgo(conv.last_message_created_at)}</span>
                    )}
                    {conv.unread_count > 0 && (
                      <span className={styles.convUnread}>{conv.unread_count}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={styles.chatArea}>
          {!activeConv ? (
            <div className={styles.chatEmpty}>Sélectionnez une conversation</div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                {activeConv.other_avatar_url ? (
                  <img src={activeConv.other_avatar_url} alt="" className={styles.chatHeaderAvatar} />
                ) : (
                  <div className={styles.convAvatarPlaceholder} style={{ width: 36, height: 36 }}>
                    {(activeConv.other_display_name || activeConv.other_username || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className={styles.chatHeaderInfo}>
                  <div className={styles.chatHeaderName}>
                    {activeConv.other_display_name || activeConv.other_username}
                  </div>
                  {typingUsers.length > 0 && (
                    <div className={styles.chatHeaderTyping}>
                      <span>{typingUsers.join(", ")} écrit</span>
                      <span className={styles.typingDots}>
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.chatMessages}>
                {groupedMessages.map((group) => (
                  <React.Fragment key={group.date}>
                    <div className={styles.dateSeparator}>
                      {formatDateSeparator(group.date)}
                    </div>
                    {group.messages.map((msg) => {
                      const isSelf = msg.sender_id === user.account.id;
                      const isLastSelf = msg.id === lastSelfMessageId;
                      return (
                        <div
                          key={msg.id}
                          className={`${styles.messageRow} ${isSelf ? styles.messageRowSelf : styles.messageRowOther}`}
                        >
                          {!isSelf && (
                            <img
                              src={msg.sender_avatar_url || "/test-1.jpg"}
                              alt=""
                              className={styles.messageAvatar}
                            />
                          )}
                          <div>
                            <div className={`${styles.messageBubble} ${isSelf ? styles.messageBubbleSelf : styles.messageBubbleOther}`}>
                              {msg.content}
                            </div>
                            <div className={`${styles.messageTime} ${isSelf ? styles.messageTimeSelf : styles.messageTimeOther}`}>
                              {formatMessageTime(msg.created_at)}
                            </div>
                            {isSelf && isLastSelf && (
                              <div className={styles.messageRead}>
                                <span className={`${styles.readIcon} ${getReadStatus(msg) === "seen" ? styles.readIconSeen : ""}`}>
                                  {getReadStatus(msg) === "seen" ? "✓✓" : "✓"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.chatInput}>
                <textarea
                  ref={textareaRef}
                  className={styles.chatTextarea}
                  placeholder="Écrire un message..."
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className={styles.chatSendBtn}
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  title="Envoyer"
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      {showNewConv && (
        <div className={styles.modalOverlay} onClick={() => setShowNewConv(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Nouvelle conversation</h3>
            <input
              className={styles.modalInput}
              placeholder="Nom d'utilisateur..."
              value={newConvUsername}
              onChange={(e) => { setNewConvUsername(e.target.value); setNewConvError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleNewConv()}
              autoFocus
            />
            {newConvError && <p className={styles.modalError}>{newConvError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setShowNewConv(false)}>
                Annuler
              </button>
              <button
                className={styles.modalSubmitBtn}
                onClick={handleNewConv}
                disabled={!newConvUsername.trim() || newConvLoading}
              >
                {newConvLoading ? "..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
