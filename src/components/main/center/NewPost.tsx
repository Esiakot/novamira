"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/main/center/NewPost.module.css";
import {
  PlusIcon,
  LongTextIcon,
  MoreIcon,
  VideoIcon,
} from "@/assets/FlatIcons";
import {
  POST_MAX_LENGTH,
  POST_CHAR_WARNING,
  POST_CHAR_DANGER,
  POST_MAX_IMAGES,
} from "@/libs/constants";
import type { Post } from "@/types/auth";

interface NewPostProps {
  onPostCreated: (post: Post) => void;
}

export default function NewPost({ onPostCreated }: NewPostProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [charCount, setCharCount] = useState(0);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Image attachments for short posts
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Topic selector
  const [topics, setTopics] = useState<{ id: number; name: string; slug: string; user_following: boolean }[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  React.useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        if (data.topics) setTopics(data.topics.filter((t: { user_following: boolean }) => t.user_following));
      })
      .catch(() => {});
  }, []);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
      setCharCount(textarea.value.length);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (imageUrls.length >= POST_MAX_IMAGES) {
      setError(`Maximum ${POST_MAX_IMAGES} images par post`);
      return;
    }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "post");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }
      setImageUrls((prev) => [...prev, data.url]);
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      await handleImageUpload(files[i]);
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (posting) return;
    setError("");

    const content = textareaRef.current?.value.trim();
    if (!content) return;

    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          media_urls: imageUrls,
          topic_id: selectedTopicId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la publication");
        return;
      }
      onPostCreated(data.post);
      if (textareaRef.current) {
        textareaRef.current.value = "";
        textareaRef.current.style.height = "auto";
      }
      setCharCount(0);
      setImageUrls([]);
      setSelectedTopicId(null);
    } catch {
      setError("Erreur réseau");
    } finally {
      setPosting(false);
    }
  };

  let charClass = styles.charCount;
  if (charCount >= POST_CHAR_DANGER) charClass += " " + styles.red;
  else if (charCount >= POST_CHAR_WARNING) charClass += " " + styles.yellow;

  return (
    <div className={styles.miraNews}>
      <textarea
        ref={textareaRef}
        className={styles.miraNewsInput}
        placeholder="Quoi de neuf, Mira ?"
        maxLength={POST_MAX_LENGTH}
        rows={3}
        onInput={handleInput}
        style={{ overflow: "hidden", resize: "none" }}
      />

      {/* ── Topic selector ── */}
      {topics.length > 0 && (
        <select
          className={styles.topicSelect}
          value={selectedTopicId ?? ""}
          onChange={(e) =>
            setSelectedTopicId(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Aucun SubMira</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {/* ── Image previews ── */}
      {imageUrls.length > 0 && (
        <div className={styles.imagePreviewGrid}>
          {imageUrls.map((url, i) => (
            <div key={url} className={styles.imagePreviewItem}>
              <img src={url} alt={`Image ${i + 1}`} className={styles.imagePreviewImg} />
              <button
                className={styles.imageRemoveBtn}
                onClick={() => removeImage(i)}
                type="button"
                aria-label="Supprimer l'image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className={styles.miraNewsActions}>
        <div className={styles.buttonLeft}>
          <div className={charClass}>{charCount}/{POST_MAX_LENGTH}</div>
          <button
            className={styles.icons}
            aria-label="Ajouter une image"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || imageUrls.length >= POST_MAX_IMAGES}
            type="button"
            title={`Ajouter une image (${imageUrls.length}/${POST_MAX_IMAGES})`}
          >
            <PlusIcon />
            {imageUrls.length > 0 && (
              <span className={styles.imageCount}>{imageUrls.length}/{POST_MAX_IMAGES}</span>
            )}
          </button>
          <button className={styles.icons} aria-label="Ajouter une vidéo" type="button">
            <VideoIcon />
          </button>
          <button
            className={styles.icons}
            aria-label="Écrire un long post"
            onClick={() => router.push("/longpost/new")}
            type="button"
            title="Écrire un long post"
          >
            <LongTextIcon />
          </button>
          <button className={styles.icons} aria-label="Plus d'options" type="button">
            <MoreIcon />
          </button>
        </div>
        <button
          className={styles.sendButton}
          onClick={handlePost}
          disabled={posting || uploading}
          type="button"
        >
          {posting ? "..." : uploading ? "⏳" : "publier"}
        </button>
      </div>
    </div>
  );
}
