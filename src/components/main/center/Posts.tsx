"use client";
import React, { useState } from "react";
import Link from "next/link";
import styles from "@/styles/main/center/Posts.module.css";
import {
  MoreIcon,
  DownIcon,
  TopIcon,
  ShareMoreIcon,
  LongTextIcon,
  ReplyIcon,
} from "@/assets/FlatIcons";
import type { Post } from "@/types/auth";

interface PostsProps {
  posts: Post[];
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

/** Image gallery grid for short posts */
function ImageGallery({ media }: { media: { media_url: string }[] }) {
  if (media.length === 0) return null;

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
        <img
          key={m.media_url}
          src={m.media_url}
          alt={`Image ${i + 1}`}
          className={styles.galleryImage}
        />
      ))}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const isLongPost = post.longpost !== null;
  const [liked, setLiked] = useState(post.user_liked);
  const [disliked, setDisliked] = useState(post.user_disliked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [dislikeCount, setDislikeCount] = useState(post.dislike_count);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setDisliked(data.disliked);
        setLikeCount(data.like_count);
        setDislikeCount(data.dislike_count);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/dislike`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setDisliked(data.disliked);
        setLikeCount(data.like_count);
        setDislikeCount(data.dislike_count);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  /* For long posts, the post page is /longpost/[id]; for short posts, /post/[id] */
  const postUrl = isLongPost ? `/longpost/${post.id}` : `/post/${post.id}`;

  return (
    <div className={styles.miraPost}>
      <div className={styles.miraHead}>
        <Link href={`/profile/${post.author_username}`} className={styles.authorLink}>
          <img
            src={post.author_avatar_url || "/test-1.jpg"}
            alt="Avatar"
            className={styles.avatar}
          />
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
        <span className={styles.timestamp}>{timeAgo(post.created_at)}</span>
      </div>

      {post.is_reply && post.parent_id && (
        <Link href={`/post/${post.parent_id}`} className={styles.replyContext}>
          En réponse à {post.parent_author_display_name || post.parent_author_username || "un post"}
        </Link>
      )}

      <Link href={postUrl} className={styles.postBody}>
        {isLongPost && (
          <div className={styles.longPostBadge}>
            <LongTextIcon />
            <span className={styles.longPostTitle}>{post.longpost!.title}</span>
            {post.longpost!.reading_time_min && (
              <span className={styles.readingTime}>
                {post.longpost!.reading_time_min} min de lecture
              </span>
            )}
          </div>
        )}

        <p className={styles.miraPostContent}>{post.content}</p>
        {!isLongPost && post.media && post.media.length > 0 && (
          <ImageGallery media={post.media} />
        )}

        {isLongPost && (
          <span className={styles.readMoreBtn}>
            Lire la suite →
          </span>
        )}
      </Link>

      <div className={styles.miraPostActions}>
        <div className={styles.buttonLeft}>
          <button
            className={`${styles.icons} ${liked ? styles.liked : ""}`}
            aria-label="Monter"
            type="button"
            onClick={handleLike}
            disabled={loading}
          >
            <TopIcon />
            <span className={styles.count}>{likeCount}</span>
          </button>
          <button
            className={`${styles.icons} ${disliked ? styles.disliked : ""}`}
            aria-label="Descendre"
            type="button"
            onClick={handleDislike}
            disabled={loading}
          >
            <DownIcon />
          </button>
          <Link href={postUrl} className={styles.icons} aria-label="Répondre">
            <ReplyIcon />
            <span className={styles.count}>{post.reply_count}</span>
          </Link>
          <button className={styles.icons} aria-label="Partager" type="button">
            <ShareMoreIcon />
            <span className={styles.count}>{post.share_count}</span>
          </button>
          <button className={styles.icons} aria-label="Plus d'options" type="button">
            <MoreIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Posts({ posts }: PostsProps) {
  if (posts.length === 0) {
    return (
      <div className={styles.emptyFeed}>
        <p>Aucun post pour le moment.</p>
        <p>Soyez le premier à publier !</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}
