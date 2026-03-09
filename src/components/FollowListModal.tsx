"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/styles/components/FollowListModal.module.css";

interface FollowUser {
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface FollowListModalProps {
  username: string;
  type: "followers" | "following";
  onClose: () => void;
}

export default function FollowListModal({ username, type, onClose }: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${encodeURIComponent(username)}/${type}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, type]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {type === "followers" ? "Abonnés" : "Abonnements"}
          </h3>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className={styles.list}>
          {loading ? (
            <p className={styles.loading}>Chargement…</p>
          ) : users.length === 0 ? (
            <p className={styles.empty}>
              {type === "followers" ? "Aucun abonné" : "Aucun abonnement"}
            </p>
          ) : (
            users.map((u) => (
              <Link
                key={u.username}
                href={`/profile/${u.username}`}
                className={styles.userItem}
                onClick={onClose}
              >
                <img
                  src={u.avatar_url || "/test-1.jpg"}
                  alt={u.display_name}
                  className={styles.avatar}
                />
                <div className={styles.userInfo}>
                  <span className={styles.displayName}>{u.display_name}</span>
                  <span className={styles.username}>@{u.username}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
