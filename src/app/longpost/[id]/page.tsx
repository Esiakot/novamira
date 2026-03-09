"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/pages/LongPostRead.module.css";
import { TopIcon, DownIcon, ReplyIcon } from "@/assets/FlatIcons";
import type { Post } from "@/types/auth";

/** Parse markdown images ![alt](url) and render as <img>, keep rest as text */
function RenderBody({ body }: { body: string }) {
  const parts: React.ReactNode[] = [];
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`} style={{ whiteSpace: "pre-wrap" }}>
          {body.slice(lastIndex, match.index)}
        </span>,
      );
    }
    parts.push(
      <img
        key={`img-${match.index}`}
        src={match[2]}
        alt={match[1]}
        className={styles.bodyImage}
      />,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push(
      <span key={`t-${lastIndex}`} style={{ whiteSpace: "pre-wrap" }}>
        {body.slice(lastIndex)}
      </span>,
    );
  }

  return <div className={styles.body}>{parts}</div>;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* ── Inline reply form ── */
function LPReplyForm({
  postId,
  onReplyCreated,
  onCancel,
}: {
  postId: string;
  onReplyCreated: (r: Post) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (posting) return;
    const content = ref.current?.value.trim();
    if (!content) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      onReplyCreated(data.reply);
      if (ref.current) { ref.current.value = ""; ref.current.style.height = "auto"; }
    } catch { setError("Erreur réseau"); }
    finally { setPosting(false); }
  };

  return (
    <div className={styles.replyForm}>
      <textarea
        ref={ref}
        className={styles.replyInput}
        placeholder="Écrire une réponse…"
        rows={2}
        maxLength={501}
        onInput={() => { const ta = ref.current; if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; } }}
        autoFocus
      />
      {error && <p className={styles.replyError}>{error}</p>}
      <div className={styles.replyFormActions}>
        <button className={styles.replyCancelBtn} onClick={onCancel} type="button">Annuler</button>
        <button className={styles.replySubmitBtn} onClick={handleSubmit} disabled={posting} type="button">
          {posting ? "…" : "Répondre"}
        </button>
      </div>
    </div>
  );
}

/* ── Reply card (recursive) ── */
function LPReplyCard({ reply, depth }: { reply: Post; depth: number }) {
  const [liked, setLiked] = useState(reply.user_liked);
  const [disliked, setDisliked] = useState(reply.user_disliked);
  const [likeCount, setLikeCount] = useState(reply.like_count);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [children, setChildren] = useState<Post[]>([]);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [replyCount, setReplyCount] = useState(reply.reply_count);

  const toggleChildren = useCallback(async () => {
    if (childrenLoaded) { setShowChildren(v => !v); return; }
    try {
      const res = await fetch(`/api/posts/${reply.id}/replies`);
      if (res.ok) { const d = await res.json(); setChildren(d.replies || []); }
    } catch { /* silent */ }
    setChildrenLoaded(true);
    setShowChildren(true);
  }, [reply.id, childrenLoaded]);

  const handleLike = async () => {
    if (loading) return; setLoading(true);
    try { const res = await fetch(`/api/posts/${reply.id}/like`, { method: "POST" }); if (res.ok) { const d = await res.json(); setLiked(d.liked); setDisliked(d.disliked); setLikeCount(d.like_count); } } catch {} finally { setLoading(false); }
  };
  const handleDislike = async () => {
    if (loading) return; setLoading(true);
    try { const res = await fetch(`/api/posts/${reply.id}/dislike`, { method: "POST" }); if (res.ok) { const d = await res.json(); setLiked(d.liked); setDisliked(d.disliked); setLikeCount(d.like_count); } } catch {} finally { setLoading(false); }
  };

  const onReplyCreated = (r: Post) => {
    setChildren(prev => [...prev, r]);
    setChildrenLoaded(true);
    setShowChildren(true);
    setShowForm(false);
    setReplyCount(c => c + 1);
  };

  return (
    <div className={styles.replyCard} style={{ marginLeft: Math.min(depth, 4) > 0 ? "1.5rem" : 0 }}>
      <div className={styles.replyHead}>
        <Link href={`/profile/${reply.author_username}`}>
          <img src={reply.author_avatar_url || "/test-1.jpg"} alt="" className={styles.replyAvatar} />
        </Link>
        <Link href={`/profile/${reply.author_username}`} className={styles.replyAuthor}>{reply.author_display_name}</Link>
        <span className={styles.replyUsername}>@{reply.author_username}</span>
        <span className={styles.replyTime}>{timeAgo(reply.created_at)}</span>
      </div>
      <p className={styles.replyContent}>{reply.content}</p>
      <div className={styles.replyActions}>
        <button className={`${styles.replyActionBtn} ${liked ? styles.liked : ""}`} onClick={handleLike} disabled={loading} type="button">
          <TopIcon /><span>{likeCount}</span>
        </button>
        <button className={`${styles.replyActionBtn} ${disliked ? styles.disliked : ""}`} onClick={handleDislike} disabled={loading} type="button">
          <DownIcon />
        </button>
        <button className={styles.replyActionBtn} onClick={() => setShowForm(v => !v)} type="button">
          <ReplyIcon /><span>Répondre</span>
        </button>
        {replyCount > 0 && !showChildren && (
          <button className={styles.showRepliesBtn} onClick={toggleChildren} type="button">{replyCount} réponse{replyCount > 1 ? "s" : ""}</button>
        )}
        {showChildren && replyCount > 0 && (
          <button className={styles.showRepliesBtn} onClick={() => setShowChildren(false)} type="button">Masquer</button>
        )}
      </div>
      {showForm && <LPReplyForm postId={reply.id} onReplyCreated={onReplyCreated} onCancel={() => setShowForm(false)} />}
      {showChildren && children.length > 0 && (
        <div>{children.map(c => <LPReplyCard key={c.id} reply={c} depth={depth + 1} />)}</div>
      )}
    </div>
  );
}

export default function LongPostReadPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<Post[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(0);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      if (!data.post.longpost) {
        setError("Ce post n'est pas un article long");
        return;
      }
      setPost(data.post);
      setReplyCount(data.post.reply_count);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement…</div>
      </div>
    );
  }

  if (error || !post || !post.longpost) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error || "Article introuvable"}</p>
          <button className={styles.backLink} onClick={() => router.push("/")} type="button">
            ← Retour au fil
          </button>
        </div>
      </div>
    );
  }

  const lp = post.longpost;
  const publishedDate = new Date(lp.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.container}>
      <article className={styles.article}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <button className={styles.backLink} onClick={() => router.back()} type="button">
            ← Retour
          </button>
          <h1 className={styles.title}>{lp.title}</h1>

          <div className={styles.authorRow}>
            <Link href={`/profile/${post.author_username}`} className={styles.authorLink}>
              <img
                src={post.author_avatar_url || "/test-1.jpg"}
                alt="Avatar"
                className={styles.authorAvatar}
              />
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{post.author_display_name}</span>
                <span className={styles.authorUsername}>@{post.author_username}</span>
              </div>
            </Link>
            <div className={styles.postMeta}>
              <span>{publishedDate}</span>
              {lp.reading_time_min && <span>· {lp.reading_time_min} min de lecture</span>}
            </div>
          </div>
        </header>

        {/* ── Cover image ── */}
        {lp.cover_image_url && (
          <img src={lp.cover_image_url} alt="Couverture" className={styles.coverImage} />
        )}

        {/* ── Body ── */}
        <RenderBody body={lp.body} />

        {/* ── Footer stats ── */}
        <footer className={styles.footer}>
          <span>{post.like_count} likes</span>
          <span>·</span>
          <span>{replyCount} réponses</span>
          <span>·</span>
          <span>{post.share_count} partages</span>
        </footer>

        {/* ── Replies section ── */}
        <div className={styles.repliesSection}>
          <div className={styles.repliesHeader}>
            <h3>Réponses ({replyCount})</h3>
            <button className={styles.replySubmitBtn} onClick={() => setShowReplyForm(v => !v)} type="button">
              {showReplyForm ? "Annuler" : "Répondre"}
            </button>
          </div>

          {showReplyForm && (
            <LPReplyForm
              postId={post.id}
              onReplyCreated={(r) => {
                setReplies(prev => [r, ...prev]);
                setRepliesLoaded(true);
                setShowReplies(true);
                setShowReplyForm(false);
                setReplyCount(c => c + 1);
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          )}

          {replyCount > 0 && !showReplies && (
            <button
              className={styles.showRepliesBtn}
              onClick={async () => {
                if (!repliesLoaded) {
                  try {
                    const res = await fetch(`/api/posts/${post.id}/replies`);
                    if (res.ok) { const d = await res.json(); setReplies(d.replies || []); }
                  } catch { /* silent */ }
                  setRepliesLoaded(true);
                }
                setShowReplies(true);
              }}
              type="button"
            >
              Voir les réponses
            </button>
          )}
          {showReplies && replyCount > 0 && (
            <button className={styles.showRepliesBtn} onClick={() => setShowReplies(false)} type="button">
              Masquer les réponses
            </button>
          )}

          {showReplies && replies.length > 0 && (
            <div className={styles.repliesList}>
              {replies.map(r => <LPReplyCard key={r.id} reply={r} depth={0} />)}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
