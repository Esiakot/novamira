"use client";
import React, { useRef } from "react";
import styles from "@/styles/main/center/Feed.module.css";
import NewPost from "./NewPost";
import Posts from "./Posts";

export default function Feed() {
  return (
    <>
      <div className={styles.feed}>
        <NewPost />
        <Posts />
      </div>
    </>
  );
}
