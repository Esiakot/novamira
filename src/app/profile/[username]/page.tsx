"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "@/styles/pages/Profile.module.css";
import Posts from "@/components/main/center/Posts";
import FollowListModal from "@/components/FollowListModal";
import { useAuth } from "@/hooks/useAuth";
import {
  Following,
  Followers,
  LongTextIcon,
  MiraIcon,
  PrivateLockIcon,
  PrivateMessageIcon,
} from "@/assets/FlatIcons";
import type { Post } from "@/types/auth";

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  location: string | null;
  website: string | null;
  is_private: boolean;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  longpost_count: number;
  created_at: string;
  is_following: boolean;
  is_own: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setProfile(data.profile);
      setPosts(data.posts);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (followLoading || !profile) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: profile.username }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_following: data.following,
                follower_count: prev.follower_count + (data.following ? 1 : -1),
              }
            : prev,
        );
      }
    } catch {
      // silent
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || "Profil introuvable"}</p>
          <button className={styles.backBtn} onClick={() => router.push("/")} type="button">
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.container}>
      {/* ── Banner ── */}
      <div
        className={styles.banner}
        style={
          profile.banner_url
            ? { backgroundImage: `url(${profile.banner_url})` }
            : undefined
        }
      >
        <button className={styles.backBtn} onClick={() => router.back()} type="button">
          ←
        </button>
      </div>

      {/* ── Profile header ── */}
      <div className={styles.header}>
        <img
          src={profile.avatar_url || "/test-1.jpg"}
          alt={`Avatar de ${profile.display_name}`}
          className={styles.avatar}
        />
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.displayName}>
              {profile.display_name}
              {profile.is_private && (
                <span className={styles.privateIcon}>
                  <PrivateLockIcon />
                </span>
              )}
            </h1>
            {!profile.is_own && user && (
              <>
                <button
                  className={`${styles.followBtn} ${profile.is_following ? styles.followBtnActive : ""}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                  type="button"
                >
                  {followLoading ? "…" : profile.is_following ? "Suivi" : "Suivre"}
                </button>
                <button
                  className={styles.messageBtn}
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/messages/conversations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ recipient_username: profile.username }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        router.push(`/privatemessage?conv=${data.conversation_id}`);
                      }
                    } catch { /* silent */ }
                  }}
                  type="button"
                  aria-label="Envoyer un message"
                >
                  <PrivateMessageIcon />
                </button>
              </>
            )}
            {profile.is_own && (
              <button
                className={styles.editBtn}
                onClick={() => router.push("/settings")}
                type="button"
              >
                Modifier le profil
              </button>
            )}
          </div>
          <span className={styles.username}>@{profile.username}</span>
        </div>
      </div>

      {/* ── Bio & info ── */}
      <div className={styles.bioSection}>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        <div className={styles.metaRow}>
          {profile.location && <span className={styles.metaItem}>📍 {profile.location}</span>}
          {profile.website && (
            <a
              href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.metaLink}
            >
              🔗 {profile.website}
            </a>
          )}
          <span className={styles.metaItem}>📅 Membre depuis {memberSince}</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.stats}>
        <button className={styles.statItem} onClick={() => setFollowModal("following")} type="button">
          <Following />
          <span className={styles.statCount}>{formatCount(profile.following_count)}</span>
          <span className={styles.statLabel}>abonnements</span>
        </button>
        <button className={styles.statItem} onClick={() => setFollowModal("followers")} type="button">
          <Followers />
          <span className={styles.statCount}>{formatCount(profile.follower_count)}</span>
          <span className={styles.statLabel}>abonnés</span>
        </button>
        <div className={styles.statItem}>
          <MiraIcon />
          <span className={styles.statCount}>{formatCount(profile.post_count)}</span>
          <span className={styles.statLabel}>posts</span>
        </div>
        <div className={styles.statItem}>
          <LongTextIcon />
          <span className={styles.statCount}>{formatCount(profile.longpost_count)}</span>
          <span className={styles.statLabel}>articles</span>
        </div>
      </div>

      {/* ── Posts ── */}
      <div className={styles.postsSection}>
        <h2 className={styles.sectionTitle}>Publications</h2>
        <Posts posts={posts} />
      </div>

      {followModal && (
        <FollowListModal
          username={profile.username}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}
