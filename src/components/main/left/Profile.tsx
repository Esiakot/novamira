"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/main/left/Profile.module.css";
// On importe le type depuis le service pour être sûr que le Front et le Back parlent la même langue
import type { UserProfile } from "@/libs/services/users/profile.service";
import Link from "next/link";
import {
  SettingsIcon,
  Following,
  Followers,
  LongTextIcon,
  MiraIcon,
  SubMira,
} from "../../FlatIcons";

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/profile");

        if (res.status === 401) {
          setError("Non connecté");
          return;
        }

        if (!res.ok) {
          setError("Erreur chargement profil");
          return;
        }

        const data: UserProfile = await res.json();
        setProfile(data);
      } catch (e) {
        console.error(e);
        setError("Erreur réseau");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className={styles.base}>Chargement...</div>;
  if (error) return <div className={styles.base}>{error}</div>;

  return (
    <>
      <div className={styles.base}>
        <div className={styles.profilWrapper}>
          <div className={styles.profil}>
            <div className={styles.profilContainer}>
              <img
                src={profile?.avatar_url || "/default-avatar.png"}
                alt="User Avatar"
                className={styles.avatar}
              />
              <div className={styles.userDetails}>
                <div className={styles.usernameContainer}>
                  <button className={styles.usernameButton}>
                    {profile?.username_display || "Utilisateur"}
                  </button>
                  <button className={styles.userButton}>
                    @{profile?.username_handle || "handle"}
                  </button>
                </div>
                <p className={styles.userBio}>{profile?.bio || ""}</p>
              </div>
            </div>
            <div className={styles.optionContainer}>
              <div className={styles.userInfo}>
                <button className={styles.optionButton}>
                  <SettingsIcon />
                </button>
                <button className={styles.optionButton}>
                  <SubMira /> <span className={styles.count}>125</span>
                </button>
                <button className={styles.optionButton}>
                  <Following /> <span className={styles.count}>36.2k</span>
                </button>
                <button className={styles.optionButton}>
                  <Followers /> <span className={styles.count}>925</span>
                </button>
              </div>
              <div className={styles.textCount}>
                <button className={styles.optionButton}>
                  <LongTextIcon /> <span className={styles.count}>126</span>
                </button>
                <button className={styles.optionButton}>
                  <MiraIcon /> <span className={styles.count}>5.2k</span>
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
            <button className={styles.navButton}>SubMiras</button>
            <button className={styles.navButton}>Highlights</button>
          </div>
          <div className={styles.rgpdPages}>
            <div className={styles.rgpdTop}>
              <Link href="/contact" className={styles.rgpdLink}>
                Contact
              </Link>
              <Link href="/legal" className={styles.rgpdLink}>
                Mentions légales
              </Link>
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
              </Link>
            </div>
            <div className={styles.copyright}>
              © 2026 novamira - Tous droits réservés - v0.9.3
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
