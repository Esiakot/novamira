"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LONGPOST_MAX_LENGTH } from "@/libs/constants";
import { LongTextIcon } from "@/assets/FlatIcons";
import styles from "@/styles/pages/LongPost.module.css";

export default function NewLongPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const handleBodyInput = () => {
    const textarea = bodyRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  // Upload an image and insert markdown-style reference into body
  const handleImageInsert = useCallback(async (file: File) => {
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

      // Insert image markdown at cursor position
      const textarea = bodyRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imageMarkdown = `\n![image](${data.url})\n`;
        const newBody =
          body.slice(0, start) + imageMarkdown + body.slice(end);
        setBody(newBody);

        // Move cursor after the inserted image
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + imageMarkdown.length;
          textarea.focus();
        });
      }
    } catch {
      setError("Erreur réseau lors de l'upload");
    } finally {
      setUploading(false);
    }
  }, [body]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageInsert(file);
      e.target.value = "";
    }
  };

  // Handle drag & drop on textarea
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        await handleImageInsert(file);
      }
    },
    [handleImageInsert],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePublish = async () => {
    if (posting) return;
    setError("");

    if (!title.trim()) {
      setError("Le titre est requis");
      return;
    }
    if (!body.trim()) {
      setError("Le contenu est requis");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_longpost: true,
          title: title.trim(),
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la publication");
        return;
      }
      router.push("/");
    } catch {
      setError("Erreur réseau");
    } finally {
      setPosting(false);
    }
  };

  // Word count & reading time estimate
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (loading) return null;
  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Header bar ── */}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => router.push("/")}
            type="button"
          >
            ← Retour
          </button>
          <div className={styles.headerTitle}>
            <LongTextIcon />
            <span>Long Post</span>
          </div>
          <button
            className={styles.publishButton}
            onClick={handlePublish}
            disabled={posting || !title.trim() || !body.trim()}
            type="button"
          >
            {posting ? "Publication..." : "Publier"}
          </button>
        </div>

        {/* ── Editor ── */}
        <div className={styles.editor}>
          <input
            type="text"
            className={styles.titleInput}
            placeholder="Titre de votre long post..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />

          <div className={styles.toolbar}>
            <button
              className={styles.toolbarButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              type="button"
              title="Insérer une image"
            >
              {uploading ? "⏳" : "🖼️ Image"}
            </button>
            <span className={styles.toolbarInfo}>
              {wordCount} mots · ~{readingTime} min de lecture · {body.length}/{LONGPOST_MAX_LENGTH}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <textarea
            ref={bodyRef}
            className={styles.bodyInput}
            placeholder="Écrivez votre long post ici...&#10;&#10;Glissez-déposez des images ou utilisez le bouton 🖼️ pour les insérer dans le texte."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onInput={handleBodyInput}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            maxLength={LONGPOST_MAX_LENGTH}
          />

          {/* Preview of inserted images */}
          {body.includes("![") && (
            <div className={styles.imagePreviewNote}>
              Les images insérées seront affichées dans le texte lors de la lecture.
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
