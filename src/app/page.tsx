import Image from "next/image";
import styles from "./page.module.css";
import Header from "@/components/Header";
import Feed from "@/components/main/center/Feed";
import Profile from "@/components/main/left/Profile";
import Trends from "@/components/main/right/Trends";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("auth_token");
  if (!authCookie?.value) redirect("/login");
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.pageContent}>
        <Profile />
        <Feed />
        <Trends />
      </div>
    </div>
  );
}
