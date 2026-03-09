"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/pages/PostPage.module.css";
import {
  TopIcon,
  DownIcon,
  ShareMoreIcon,
  MoreIcon,
  ReplyIcon,
} from "@/assets/FlatIcons";
import type { Post } from "@/types/auth";

/* ── Helpers ── */

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

function ImageGallery({ media }: { media: { media_url: string }[] }) {
  if (!media.length) return null;
  const gridClass =
    media.length === 1
      ? styles.gallery1
      : media.length === 2
        ? styles.gallery2
        : media.length === 3
          ? styles.gallery3
          : styles.gallery4;

  return (
    <div className={`${styles.imageGallery} ${gridClass}`}>
      {media.map((m, i) => (
        <img key={m.media_url} src={m.media_url} alt={`Image ${i + 1}`} className={styles.galleryImage} />
      ))}
    </div>
  );
}

/* ── Reply form ── */

function ReplyForm({
  postId,
  onCreated,
  onCancel,
}: {
  postId: string;
  onCreated: (r: Post) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
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
      onCreated(data.reply);
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
        rows={3}
        maxLength={501}
        onInput={() => { const t = ref.current; if (t) { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; } }}
        autoFocus
      />
      {error && <p className={styles.replyError}>{error}</p>}
      <div className={styles.replyFormActions}>
        <button className={styles.cancelBtn} onClick={onCancel} type="button">Annuler</button>
        <button className={styles.submitBtn} onClick={submit} disabled={posting} type="button">
          {posting ? "…" : "Répondre"}
        </button>
      </div>
    </div>
  );
}

/* ── Recursive reply card ── */

function ReplyCard({ reply, depth }: { reply: Post; depth: number }) {
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
    if (childrenLoaded) { setShowChildren((v) => !v); return; }
    try {
      const res = await fetch(`/api/posts/${reply.id}/replies`);
      if (res.ok) { const d = await res.json(); setChildren(d.replies || []); }
    } catch { /* silent */ }
    setChildrenLoaded(true);
    setShowChildren(true);
  }, [reply.id, childrenLoaded]);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${reply.id}/like`, { method: "POST" });
      if (res.ok) { const d = await res.json(); setLiked(d.liked); setDisliked(d.disliked); setLikeCount(d.like_count); }
    } catch {} finally { setLoading(false); }
  };

  const handleDislike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${reply.id}/dislike`, { method: "POST" });
      if (res.ok) { const d = await res.json(); setLiked(d.liked); setDisliked(d.disliked); setLikeCount(d.like_count); }
    } catch {} finally { setLoading(false); }
  };

  const onReplyCreated = (r: Post) => {
    setChildren((prev) => [...prev, r]);
    setChildrenLoaded(true);
    setShowChildren(true);
    setShowForm(false);
    setReplyCount((c) => c + 1);
  };

  return (
    <div className={styles.replyCard} style={{ marginLeft: Math.min(depth, 4) > 0 ? "1.5rem" : 0 }}>
      <div className={styles.replyHead}>
        <Link href={`/profile/${reply.author_username}`}>
          <img src={reply.author_avatar_url || "/test-1.jpg"} alt="" className={styles.replyAvatar} />
        </Link>
        <Link href={`/profile/${reply.author_username}`} className={styles.replyAuthor}>
          {reply.author_display_name}
        </Link>
        <span className={styles.replyUsername}>@{reply.author_username}</span>
        <span className={styles.replyTime}>{timeAgo(reply.created_at)}</span>
      </div>
      <Link href={`/post/${reply.id}`} className={styles.replyBodyLink}>
        <p className={styles.replyContent}>{reply.content}</p>
        {reply.media && reply.media.length > 0 && <ImageGallery media={reply.media} />}
      </Link>
      <div className={styles.replyActions}>
        <button className={`${styles.replyActionBtn} ${liked ? styles.liked : ""}`} onClick={handleLike} disabled={loading} type="button">
          <TopIcon /><span>{likeCount}</span>
        </button>
        <button className={`${styles.replyActionBtn} ${disliked ? styles.disliked : ""}`} onClick={handleDislike} disabled={loading} type="button">
          <DownIcon />
        </button>
        <button className={styles.replyActionBtn} onClick={() => setShowForm((v) => !v)} type="button">
          <ReplyIcon /><span>Répondre</span>
        </button>
        {replyCount > 0 && !showChildren && (
          <button className={styles.showRepliesBtn} onClick={toggleChildren} type="button">
            {replyCount} réponse{replyCount > 1 ? "s" : ""}
          </button>
        )}
        {showChildren && replyCount > 0 && (
          <button className={styles.showRepliesBtn} onClick={() => setShowChildren(false)} type="button">
            Masquer
          </button>
        )}
      </div>
      {showForm && <ReplyForm postId={reply.id} onCreated={onReplyCreated} onCancel={() => setShowForm(false)} />}
      {showChildren && children.length > 0 && (
        <div className={styles.childReplies}>
          {children.map((c) => <ReplyCard key={c.id} reply={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [parentPost, setParentPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replies, setReplies] = useState<Post[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyCount, setReplyCount] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  /* Fetch post */
  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      const p: Post = data.post;
      /* If this is a long post, redirect to the dedicated longpost page */
      if (p.longpost) { router.replace(`/longpost/${p.id}`); return; }
      setPost(p);
      setReplyCount(p.reply_count);
      setLiked(p.user_liked);
      setDisliked(p.user_disliked);
      setLikeCount(p.like_count);
      // Fetch parent post if this is a reply
      if (p.is_reply && p.parent_id) {
        try {
          const pRes = await fetch(`/api/posts/${encodeURIComponent(p.parent_id)}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            setParentPost(pData.post);
          }
        } catch { /* silent */ }
      }
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }, [postId, router]);

  /* Fetch replies */
  const fetchReplies = useCallback(async () => {
    if (repliesLoaded) return;
    try {
      const res = await fetch(`/api/posts/${postId}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies || []);
      }
    } catch { /* silent */ }
    setRepliesLoaded(true);
  }, [postId, repliesLoaded]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useEffect(() => { if (post) fetchReplies(); }, [post, fetchReplies]);

  /* Like / dislike */
  const handleLike = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) { const d = await res.json(); setLiked(d.liked); setDisliked(d.disliked); setLikeCount(d.like_count); }
    } catch {} finally { setActionLoading(false); }
  };
  const handleDislike = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/dislike`, { method: "POST" });
      if (res.ok) { const d = await res.json(); setLiked(d.liked); setDisliked(d.disliked); setLikeCount(d.like_count); }
    } catch {} finally { setActionLoading(false); }
  };

  /* New reply */
  const onReplyCreated = (r: Post) => {
    setReplies((prev) => [r, ...prev]);
    setReplyCount((c) => c + 1);
    setShowForm(false);
  };

  /* ── Render ── */

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Chargement…</div></div>;
  }
  if (error || !post) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error || "Post introuvable"}</p>
          <button className={styles.backBtn} onClick={() => router.push("/")} type="button">← Retour au fil</button>
        </div>
      </div>
    );
  }

  const publishedDate = new Date(post.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Back */}
        <button className={styles.backBtn} onClick={() => router.back()} type="button">← Retour</button>

        {/* Parent post context (if this is a reply) */}
        {post.is_reply && parentPost && (
          <Link href={`/post/${parentPost.id}`} className={styles.parentContext}>
            <div className={styles.parentHead}>
              <img src={parentPost.author_avatar_url || "/test-1.jpg"} alt="" className={styles.parentAvatar} />
              <span className={styles.parentAuthor}>{parentPost.author_display_name}</span>
              <span className={styles.parentUsername}>@{parentPost.author_username}</span>
            </div>
            <p className={styles.parentContent}>
              {parentPost.content && parentPost.content.length > 150
                ? parentPost.content.slice(0, 150) + "…"
                : parentPost.content}
            </p>
          </Link>
        )}
        {post.is_reply && (
          <div className={styles.replyIndicator}>En réponse au post ci-dessus</div>
        )}

        {/* Post header */}
        <div className={styles.postHead}>
          <Link href={`/profile/${post.author_username}`} className={styles.authorLink}>
            <img src={post.author_avatar_url || "/test-1.jpg"} alt="Avatar" className={styles.avatar} />
          </Link>
          <div className={styles.usernameDiv}>
            <Link href={`/profile/${post.author_username}`} className={styles.displayNameLink}>
              {post.author_display_name}
            </Link>
            <Link href={`/profile/${post.author_username}`} className={styles.usernameLink}>
              @{post.author_username}
            </Link>
          </div>
          {post.topic_name && post.topic_slug && (
            <Link href={`/submira/${post.topic_slug}`} className={styles.topicBadge}>
              {post.topic_name}
            </Link>
          )}
          <span className={styles.timestamp}>{publishedDate}</span>
        </div>

        {/* Content */}
        <div className={styles.postContent}>{post.content}</div>
        {post.media && post.media.length > 0 && <ImageGallery media={post.media} />}

        {/* Actions bar */}
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${liked ? styles.liked : ""}`}
            onClick={handleLike}
            disabled={actionLoading}
            type="button"
          >
            <TopIcon /><span>{likeCount}</span>
          </button>
          <button
            className={`${styles.actionBtn} ${disliked ? styles.disliked : ""}`}
            onClick={handleDislike}
            disabled={actionLoading}
            type="button"
          >
            <DownIcon />
          </button>
          <button className={styles.actionBtn} type="button">
            <ShareMoreIcon /><span>{post.share_count}</span>
          </button>
          <button className={styles.actionBtn} type="button">
            <MoreIcon />
          </button>
        </div>

        {/* Footer stats */}
        <div className={styles.footer}>
          <span>{likeCount} likes</span>
          <span>·</span>
          <span>{replyCount} réponses</span>
          <span>·</span>
          <span>{post.share_count} partages</span>
        </div>

        {/* Replies section */}
        <div className={styles.repliesSection}>
          <div className={styles.repliesHeader}>
            <h3>Réponses ({replyCount})</h3>
            <button className={styles.submitBtn} onClick={() => setShowForm((v) => !v)} type="button">
              {showForm ? "Annuler" : "Répondre"}
            </button>
          </div>

          {showForm && (
            <ReplyForm
              postId={post.id}
              onCreated={onReplyCreated}
              onCancel={() => setShowForm(false)}
            />
          )}

          <div className={styles.repliesList}>
            {replies.map((r) => (
              <ReplyCard key={r.id} reply={r} depth={0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
