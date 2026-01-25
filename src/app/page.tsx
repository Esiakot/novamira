import Image from "next/image";
import styles from "./page.module.css";
import Header from "@/components/Header";
import Feed from "@/components/main/center/Feed";
import Profil from "@/components/main/left/Profil";
import Trends from "@/components/main/right/Trends";

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.pageContent}>
        <Profil />
        <Feed />
        <Trends />
      </div>
    </div>
  );
}
