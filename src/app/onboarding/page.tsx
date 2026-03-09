"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "@/styles/pages/Onboarding.module.css";

interface Topic {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  follower_count: number;
}

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Step 2: Topics
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
    if (!loading && user?.account.profile_completed) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (step === 2) {
      setLoadingTopics(true);
      fetch("/api/topics")
        .then((res) => res.json())
        .then((data) => {
          if (data.topics) setTopics(data.topics);
        })
        .catch(() => {})
        .finally(() => setLoadingTopics(false));
    }
  }, [step]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
      } else {
        setError(data.error || "Erreur lors de l'upload");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleTopic = (id: number) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          avatar_url: avatarUrl,
          location,
          website,
          topic_ids: selectedTopics,
        }),
      });
      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  const stepLabels = ["Profil", "Centres d'intérêt", "C'est parti !"];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>novamira</h1>
        <p className={styles.subtitle}>
          Bienvenue <strong>@{user.account.username}</strong> ! Complétez votre profil.
        </p>

        {/* Step indicator */}
        <div className={styles.stepIndicator}>
          {stepLabels.map((label, i) => (
            <div
              key={i}
              className={`${styles.step} ${i + 1 <= step ? styles.stepActive : ""} ${i + 1 < step ? styles.stepDone : ""}`}
            >
              <div className={styles.stepDot}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Profile info ── */}
        {step === 1 && (
          <div className={styles.form}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                <img
                  src={avatarUrl || "/test-1.jpg"}
                  alt="Avatar"
                  className={styles.avatarPreview}
                />
                <button
                  type="button"
                  className={styles.avatarUploadBtn}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? "..." : "✎"}
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={styles.hiddenInput}
                onChange={handleAvatarUpload}
              />
              <p className={styles.avatarHint}>Ajoutez une photo de profil</p>
            </div>

            <div className={styles.field}>
              <label htmlFor="bio" className={styles.label}>
                Bio <span className={styles.charHint}>{bio.length}/150</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={styles.textarea}
                placeholder="Parlez de vous en quelques mots..."
                maxLength={150}
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="location" className={styles.label}>
                Localisation
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={styles.input}
                placeholder="Paris, France"
                maxLength={100}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="website" className={styles.label}>
                Site web
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={styles.input}
                placeholder="https://monsite.com"
                maxLength={255}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.stepButtons}>
              <button
                className={styles.skipBtn}
                onClick={() => setStep(2)}
              >
                Passer
              </button>
              <button className={styles.nextBtn} onClick={() => setStep(2)}>
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Topics/Interests ── */}
        {step === 2 && (
          <div className={styles.form}>
            <p className={styles.stepDesc}>
              Choisissez vos centres d&apos;intérêt pour personnaliser votre fil d&apos;actualité.
            </p>
            {loadingTopics ? (
              <p className={styles.loading}>Chargement...</p>
            ) : topics.length === 0 ? (
              <p className={styles.emptyTopics}>
                Aucun topic disponible pour le moment.
              </p>
            ) : (
              <div className={styles.topicGrid}>
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    className={`${styles.topicChip} ${selectedTopics.includes(topic.id) ? styles.topicSelected : ""}`}
                    onClick={() => toggleTopic(topic.id)}
                  >
                    {topic.icon_url && (
                      <img
                        src={topic.icon_url}
                        alt=""
                        className={styles.topicIcon}
                      />
                    )}
                    <span>{topic.name}</span>
                    {selectedTopics.includes(topic.id) && (
                      <span className={styles.checkMark}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedTopics.length > 0 && (
              <p className={styles.selectedCount}>
                {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} sélectionné{selectedTopics.length > 1 ? "s" : ""}
              </p>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.stepButtons}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>
                Retour
              </button>
              <button className={styles.skipBtn} onClick={() => setStep(3)}>
                Passer
              </button>
              <button className={styles.nextBtn} onClick={() => setStep(3)}>
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <div className={styles.form}>
            <div className={styles.finalSection}>
              <div className={styles.profilePreview}>
                <img
                  src={avatarUrl || "/test-1.jpg"}
                  alt="Avatar"
                  className={styles.finalAvatar}
                />
                <div>
                  <h3 className={styles.finalName}>{user.account.display_name}</h3>
                  <p className={styles.finalUsername}>@{user.account.username}</p>
                </div>
              </div>
              {bio && <p className={styles.finalBio}>{bio}</p>}
              {location && (
                <p className={styles.finalMeta}>📍 {location}</p>
              )}
              {selectedTopics.length > 0 && (
                <div className={styles.finalTopics}>
                  <span className={styles.finalTopicsLabel}>Vos centres d&apos;intérêt :</span>
                  <div className={styles.finalTopicList}>
                    {topics
                      .filter((t) => selectedTopics.includes(t.id))
                      .map((t) => (
                        <span key={t.id} className={styles.finalTopicTag}>
                          {t.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <p className={styles.readyText}>
              Votre profil est prêt ! Vous pourrez toujours le modifier plus tard dans les paramètres.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.stepButtons}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>
                Retour
              </button>
              <button
                className={styles.finishBtn}
                onClick={handleFinish}
                disabled={saving}
              >
                {saving ? "Finalisation..." : "Commencer l'aventure 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
