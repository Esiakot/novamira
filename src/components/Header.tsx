import React from "react";
import Link from "next/link";
import styles from "@/styles/Header.module.css";
import {
  ProfilIcon,
  PrivateMessageIcon,
  NotificationIcon,
  SettingsIcon,
} from "./FlatIcons";

export default function Header() {
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
      </nav>
    </header>
  );
}
