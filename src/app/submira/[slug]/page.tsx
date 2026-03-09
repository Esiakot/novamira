"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Posts from "@/components/main/center/Posts";
import NewPost from "@/components/main/center/NewPost";
import AuthPage from "@/components/auth/AuthPage";
import styles from "@/styles/pages/SubMiraFeed.module.css";
import type { Post } from "@/types/auth";

interface TopicInfo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  post_count: number;
  follower_count: number;
  user_following: boolean;
}

export default function SubMiraFeedPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();

  const [topic, setTopic] = useState<TopicInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [topicsRes, postsRes] = await Promise.all([
        fetch("/api/topics"),
        fetch(`/api/posts?topic=${encodeURIComponent(slug)}`),
      ]);

      if (topicsRes.ok) {
        const topicsData = await topicsRes.json();
        const found = topicsData.topics?.find(
          (t: TopicInfo) => t.slug === slug,
        );
        if (found) setTopic(found);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleToggleFollow = async () => {
    if (!topic || toggling) return;
    setToggling(true);
    try {
      const res = await fetch("/api/topics/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topic.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setTopic((prev) =>
          prev
            ? {
                ...prev,
                user_following: data.following,
                follower_count: data.following
                  ? prev.follower_count + 1
                  : Math.max(prev.follower_count - 1, 0),
              }
            : prev,
        );
      }
    } catch {
      /* silent */
    } finally {
      setToggling(false);
    }
  };

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {topic && (
          <div className={styles.topicHeader}>
            <div className={styles.topicInfo}>
              <h1 className={styles.topicName}>
                {topic.icon_url && (
                  <img
                    src={topic.icon_url}
                    alt=""
                    className={styles.topicIcon}
                  />
                )}
                {topic.name}
              </h1>
              {topic.description && (
                <p className={styles.topicDesc}>{topic.description}</p>
              )}
              <div className={styles.topicStats}>
                <span>{topic.follower_count} membres</span>
                <span>·</span>
                <span>{topic.post_count} posts</span>
              </div>
            </div>
            <button
              className={`${styles.followBtn} ${topic.user_following ? styles.following : ""}`}
              onClick={handleToggleFollow}
              disabled={toggling}
            >
              {topic.user_following ? "Rejoint" : "Rejoindre"}
            </button>
          </div>
        )}

        <NewPost onPostCreated={handleNewPost} />

        {loading ? (
          <p className={styles.loading}>Chargement des posts...</p>
        ) : (
          <Posts posts={posts} />
        )}

        <Link href="/submiras" className={styles.backLink}>
          ← Tous les SubMiras
        </Link>
      </div>
    </div>
  );
}
