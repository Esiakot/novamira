"use client";
import React, { useState, useCallback, useEffect } from "react";
import styles from "@/styles/main/center/Feed.module.css";
import NewPost from "./NewPost";
import Posts from "./Posts";
import type { Post } from "@/types/auth";

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  return (
    <div className={styles.feed}>
      <NewPost onPostCreated={handleNewPost} />
      {loading ? (
        <p className={styles.loading}>Chargement du feed...</p>
      ) : (
        <Posts posts={posts} />
      )}
    </div>
  );
}
