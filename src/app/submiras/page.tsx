"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/components/auth/AuthPage";
import styles from "@/styles/pages/SubMiras.module.css";

interface Topic {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  post_count: number;
  follower_count: number;
  user_following: boolean;
  created_by: string | null;
}

export default function SubMirasPage() {
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  // Create topic form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        if (data.topics) setTopics(data.topics);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleToggleFollow = async (topicId: number) => {
    if (toggling) return;
    setToggling(topicId);
    try {
      const res = await fetch("/api/topics/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId }),
      });
      if (res.ok) {
        const data = await res.json();
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topicId
              ? {
                  ...t,
                  user_following: data.following,
                  follower_count: data.following
                    ? t.follower_count + 1
                    : Math.max(t.follower_count - 1, 0),
                }
              : t,
          ),
        );
      }
    } catch {
      /* silent */
    } finally {
      setToggling(null);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTopicName.trim(),
          description: newTopicDesc.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.topic) {
        setTopics((prev) => [
          { ...data.topic, user_following: true },
          ...prev,
        ]);
        setNewTopicName("");
        setNewTopicDesc("");
        setShowCreateForm(false);
      } else {
        setCreateError(data.error || "Erreur lors de la création");
      }
    } catch {
      setCreateError("Erreur réseau");
    } finally {
      setCreating(false);
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>SubMiras</h1>
            <p className={styles.subtitle}>
              Explorez et rejoignez des communautés thématiques
            </p>
          </div>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Annuler" : "+ Créer un topic"}
          </button>
        </div>

        {/* ── Create topic form ── */}
        {showCreateForm && (
          <form onSubmit={handleCreateTopic} className={styles.createForm}>
            <div className={styles.createField}>
              <label className={styles.createLabel}>Nom du topic</label>
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className={styles.createInput}
                placeholder="Ex: Peinture abstraite"
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            <div className={styles.createField}>
              <label className={styles.createLabel}>
                Description <span className={styles.optional}>(optionnel)</span>
              </label>
              <textarea
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                className={styles.createTextarea}
                placeholder="Décrivez le sujet de ce topic..."
                maxLength={255}
                rows={2}
              />
            </div>
            {createError && <p className={styles.createError}>{createError}</p>}
            <button
              type="submit"
              className={styles.createSubmitBtn}
              disabled={creating}
            >
              {creating ? "Création..." : "Créer le topic"}
            </button>
          </form>
        )}

        {loading ? (
          <p className={styles.loading}>Chargement des SubMiras...</p>
        ) : topics.length === 0 ? (
          <p className={styles.empty}>Aucune SubMira disponible.</p>
        ) : (
          <div className={styles.grid}>
            {topics.map((topic) => (
              <div key={topic.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <Link
                    href={`/submira/${topic.slug}`}
                    className={styles.cardName}
                  >
                    {topic.icon_url && (
                      <img
                        src={topic.icon_url}
                        alt=""
                        className={styles.topicIcon}
                      />
                    )}
                    {topic.name}
                  </Link>
                  <button
                    className={`${styles.followBtn} ${topic.user_following ? styles.following : ""}`}
                    onClick={() => handleToggleFollow(topic.id)}
                    disabled={toggling === topic.id}
                  >
                    {topic.user_following ? "Rejoint" : "Rejoindre"}
                  </button>
                </div>
                {topic.description && (
                  <p className={styles.cardDesc}>{topic.description}</p>
                )}
                <div className={styles.cardStats}>
                  <span>{topic.follower_count} membres</span>
                  <span>·</span>
                  <span>{topic.post_count} posts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
