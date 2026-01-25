"use client";
import React, { useRef, useState } from "react";
import styles from "@/styles/main/center/NewPost.module.css";
import {
  PlusIcon,
  LongTextIcon,
  MoreIcon,
  VideoIcon,
} from "@/components/FlatIcons";

export default function NewPost() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(0);
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
      setCharCount(textarea.value.length);
    }
  };
  let charClass = styles.charCount;
  if (charCount >= 495) charClass += " " + styles.red;
  else if (charCount >= 430) charClass += " " + styles.yellow;
  return (
    <div className={styles.miraNews}>
      <textarea
        ref={textareaRef}
        className={styles.miraNewsInput}
        placeholder="Quoi de neuf, Mira ?"
        maxLength={501}
        rows={3}
        onInput={handleInput}
        style={{ overflow: "hidden", resize: "none" }}
      />
      <div className={styles.miraNewsActions}>
        <div className={styles.buttonLeft}>
          <div className={charClass}>{charCount}/501</div>
          <button className={styles.icons} aria-label="Ajouter une image">
            <PlusIcon />
          </button>
          <button className={styles.icons} aria-label="Ajouter une vidéo">
            <VideoIcon />
          </button>
          <button className={styles.icons} aria-label="Ajouter un texte long">
            <span
              className={charCount >= 495 ? styles.longTextGreen : undefined}
            >
              <LongTextIcon />
            </span>
          </button>
          <button className={styles.icons} aria-label="Plus d'options">
            <MoreIcon />
          </button>
        </div>
        <button className={styles.sendButton}>publier</button>
      </div>
    </div>
  );
}
