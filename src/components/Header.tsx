"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/styles/Header.module.css";
import {
  ProfilIcon,
  PrivateMessageIcon,
  NotificationIcon,
  SettingsIcon,
} from "./FlatIcons";

export default function Header() {
  const router = useRouter();
  const handleLogout = () => {
    document.cookie =
      "auth_token=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };
  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>
        <Link href="/">novamira</Link>
      </h1>
      <input className={styles.search} type="text" placeholder="search..." />
      <nav className={styles.nav}>
        <Link href="/profil" aria-label="Profil">
          <ProfilIcon className={styles.icons} />
        </Link>
        <Link href="/privatemessage" aria-label="Message privé">
          <PrivateMessageIcon className={styles.icons} />
        </Link>
        <Link href="/notifications" aria-label="Notifications">
          <NotificationIcon className={styles.icons} />
        </Link>
        <Link href="/settings" aria-label="Paramètres">
          <SettingsIcon className={styles.icons} />
        </Link>
        <button
          onClick={handleLogout}
          style={{
            marginLeft: 12,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--icons)",
            fontWeight: 600,
          }}
        >
          Déconnexion
        </button>
      </nav>
    </header>
  );
}
