"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Feed from "@/components/main/center/Feed";
import Profil from "@/components/main/left/Profil";
import Trends from "@/components/main/right/Trends";
import AuthPage from "@/components/auth/AuthPage";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.account.profile_completed) {
      router.push("/onboarding");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!user.account.profile_completed) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <Profil />
        <Feed />
        <Trends />
      </div>
    </div>
  );
}
