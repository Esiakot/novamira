"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/main/left/Profil.module.css";
import {
  SettingsIcon,
  Following,
  Followers,
  LongTextIcon,
  MiraIcon,
  SubMira,
  PrivateLockIcon,
} from "@/assets/FlatIcons";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import FollowListModal from "@/components/FollowListModal";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

export default function Profil() {
  const { user } = useAuth();
  const account = user?.account;
  const router = useRouter();
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div className={styles.base}>
        <div className={styles.profilWrapper}>
          <div className={styles.profil}>
            <div className={styles.profilContainer}>
              <img
                src={account?.avatar_url || "/test-1.jpg"}
                alt="User Avatar"
                className={styles.avatar}
              />
              <div className={styles.userDetails}>
                <div className={styles.usernameContainer}>
                  <Link href={`/profile/${account?.username}`} className={styles.usernameButton}>
                    {account?.display_name || "Utilisateur"}
                    {account?.is_private && (
                      <span className={styles.privateIcon} title="Compte privé">
                        <PrivateLockIcon />
                      </span>
                    )}
                  </Link>
                  <Link href={`/profile/${account?.username}`} className={styles.userButton}>
                    @{account?.username || "user"}
                  </Link>
                </div>
                {account?.bio && (
                  <p className={styles.userBio}>
                    {account.bio.length > 150
                      ? account.bio.slice(0, 150) + "\u2026"
                      : account.bio}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.optionContainer}>
              <div className={styles.userInfo}>
                <button className={styles.optionButton} onClick={() => router.push("/settings")}>
                  <SettingsIcon />
                </button>
                <button className={styles.optionButton} onClick={() => router.push("/submiras")}>
                  <SubMira /> <span className={styles.count}>{formatCount(account?.topic_follow_count ?? 0)}</span>
                </button>
                <button className={styles.optionButton} onClick={() => setFollowModal("following")}>
                  <Following /> <span className={styles.count}>{formatCount(account?.following_count ?? 0)}</span>
                </button>
                <button className={styles.optionButton} onClick={() => setFollowModal("followers")}>
                  <Followers /> <span className={styles.count}>{formatCount(account?.follower_count ?? 0)}</span>
                </button>
              </div>
              <div className={styles.textCount}>
                <button className={styles.optionButton}>
                  <LongTextIcon /> <span className={styles.count}>{formatCount(account?.longpost_count ?? 0)}</span>
                </button>
                <button className={styles.optionButton}>
                  <MiraIcon /> <span className={styles.count}>{formatCount(account?.post_count ?? 0)}</span>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.navigationPages}>
            <button className={styles.navButton}>Posts</button>
            <button className={styles.navButton}>Media</button>
            <button className={styles.navButton}>Likes</button>
            <button className={styles.navButton}>Replies</button>
            <button className={styles.navButton}>Mirrors</button>
            <Link href="/submiras" className={styles.navButton}>SubMiras</Link>
            <button className={styles.navButton}>Highlights</button>
          </div>
          <div className={styles.rgpdPages}>
            <div className={styles.rgpdTop}>
              {" "}
              <Link href="/contact" className={styles.rgpdLink}>
                Contact
              </Link>{" "}
              <Link href="/legal" className={styles.rgpdLink}>
                Mentions légales
              </Link>{" "}
              <Link href="/accessibility" className={styles.rgpdLink}>
                Accessibilité
              </Link>
            </div>
            <div className={styles.rgpdBottom}>
              <Link href="/privacy" className={styles.rgpdLink}>
                Politique de confidentialité
              </Link>
              <Link href="/terms" className={styles.rgpdLink}>
                Conditions d'utilisation
              </Link>
              <Link href="/cookies" className={styles.rgpdLink}>
                Politique
                <br /> de cookies
              </Link>{" "}
            </div>
            <div className={styles.copyright}>
              © 2026 novamira - Tous droits réservés - v0.9.3
            </div>
          </div>
        </div>
      </div>

      {followModal && account && (
        <FollowListModal
          username={account.username}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </>
  );
}
