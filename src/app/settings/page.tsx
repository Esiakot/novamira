"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { SessionInfo } from "@/types/auth";
import styles from "@/styles/pages/Settings.module.css";

type Tab = "profil" | "securite";

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profil");

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Upload refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email change fields
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Sessions
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.account) {
      setDisplayName(user.account.display_name || "");
      setUsername(user.account.username || "");
      setBio(user.account.bio || "");
      setAvatarUrl(user.account.avatar_url || "");
      setBannerUrl(user.account.banner_url || "");
      setLocation(user.account.location || "");
      setWebsite(user.account.website || "");
      setDateOfBirth(user.account.date_of_birth?.split("T")[0] || "");
      setIsPrivate(user.account.is_private || false);
    }
  }, [user]);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "securite") {
      fetchSessions();
    }
  }, [tab, fetchSessions]);

  // ── File upload helper ──
  const handleFileUpload = async (
    file: File,
    type: "avatar" | "banner",
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return null;
      }
      return data.url;
    } catch {
      setError("Erreur réseau lors de l'upload");
      return null;
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    const url = await handleFileUpload(file, "avatar");
    if (url) setAvatarUrl(url);
    setUploadingAvatar(false);
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError("");
    const url = await handleFileUpload(file, "banner");
    if (url) setBannerUrl(url);
    setUploadingBanner(false);
  };

  // ── Save profile ──
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          username,
          bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          location,
          website,
          date_of_birth: dateOfBirth || null,
          is_private: isPrivate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la sauvegarde");
      } else {
        setMessage("Profil mis à jour avec succès");
        await refreshUser();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // ── Save password ──
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors du changement");
      } else {
        setMessage("Mot de passe modifié avec succès");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // ── Change email ──
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_email: newEmail,
          email_password: emailPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors du changement d'email");
      } else {
        setMessage("Email modifié avec succès");
        setNewEmail("");
        setEmailPassword("");
        await refreshUser();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // ── Revoke session ──
  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      /* ignore */
    }
  };

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    setError("");
    setMessage("");
  };

  if (loading || !user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <button onClick={() => router.push("/")} className={styles.backButton}>
            ← Retour
          </button>
          <h2 className={styles.sidebarTitle}>Paramètres</h2>
          <button
            onClick={() => switchTab("profil")}
            className={`${styles.tabButton} ${tab === "profil" ? styles.tabActive : ""}`}
          >
            Profil
          </button>
          <button
            onClick={() => switchTab("securite")}
            className={`${styles.tabButton} ${tab === "securite" ? styles.tabActive : ""}`}
          >
            Sécurité
          </button>
        </div>

        <div className={styles.content}>
          {/* ═══════════ PROFIL TAB ═══════════ */}
          {tab === "profil" && (
            <>
              <h1 className={styles.title}>Modifier le profil</h1>
              <form onSubmit={handleProfileSave} className={styles.form}>

                {/* ── Banner ── */}
                <div className={styles.bannerSection}>
                  <div
                    className={styles.bannerPreview}
                    style={{
                      backgroundImage: bannerUrl
                        ? `url(${bannerUrl})`
                        : "linear-gradient(135deg, #001229 0%, #3b71b8 100%)",
                    }}
                  >
                    <button
                      type="button"
                      className={styles.bannerUploadBtn}
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingBanner}
                    >
                      {uploadingBanner ? "..." : "Modifier la bannière"}
                    </button>
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className={styles.hiddenInput}
                    onChange={handleBannerChange}
                  />
                </div>

                {/* ── Avatar ── */}
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
                    onChange={handleAvatarChange}
                  />
                  <div className={styles.avatarInfo}>
                    <p className={styles.avatarHint}>JPG, PNG, WebP ou GIF — 5 Mo max</p>
                  </div>
                </div>

                {/* ── Display name & username ── */}
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="displayName" className={styles.label}>
                      Nom d&apos;affichage
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={styles.input}
                      placeholder="John Doe"
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="username" className={styles.label}>
                      @nom d&apos;utilisateur
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={styles.input}
                      placeholder="johndoe"
                      required
                      minLength={3}
                      maxLength={30}
                    />
                  </div>
                </div>

                {/* ── Bio ── */}
                <div className={styles.field}>
                  <label htmlFor="bio" className={styles.label}>
                    Bio <span className={styles.charHint}>{bio.length}/150</span>
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={styles.textarea}
                    placeholder="Parlez de vous..."
                    maxLength={150}
                    rows={3}
                  />
                </div>

                {/* ── Location & Website ── */}
                <div className={styles.row}>
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
                </div>

                {/* ── Date of birth ── */}
                <div className={styles.field}>
                  <label htmlFor="dateOfBirth" className={styles.label}>
                    Date de naissance
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={styles.input}
                  />
                </div>

                {/* ── Privacy toggle ── */}
                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>Compte privé</span>
                    <span className={styles.toggleDesc}>
                      Seuls les abonnés approuvés verront vos publications
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`${styles.toggle} ${isPrivate ? styles.toggleOn : ""}`}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>

                {error && <p className={styles.error}>{error}</p>}
                {message && <p className={styles.success}>{message}</p>}

                <button type="submit" className={styles.saveButton} disabled={saving}>
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </form>
            </>
          )}

          {/* ═══════════ SECURITE TAB ═══════════ */}
          {tab === "securite" && (
            <>
              {/* ── Password change ── */}
              <h1 className={styles.title}>Modifier le mot de passe</h1>
              <form onSubmit={handlePasswordSave} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="currentPassword" className={styles.label}>
                    Mot de passe actuel
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.input}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="newPassword" className={styles.label}>
                      Nouveau mot de passe
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.input}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Confirmer
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={styles.input}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && !message && <p className={styles.error}>{error}</p>}
                {message && !error && <p className={styles.success}>{message}</p>}

                <button type="submit" className={styles.saveButton} disabled={saving}>
                  {saving ? "Modification..." : "Modifier le mot de passe"}
                </button>
              </form>

              {/* ── Email change ── */}
              <div className={styles.sectionDivider} />
              <h2 className={styles.subtitle}>Modifier l&apos;email</h2>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email actuel</span>
                <span className={styles.infoValue}>{user.user.email}</span>
              </div>
              <form onSubmit={handleEmailChange} className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="newEmail" className={styles.label}>
                      Nouvel email
                    </label>
                    <input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className={styles.input}
                      placeholder="nouveau@email.com"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="emailPassword" className={styles.label}>
                      Mot de passe
                    </label>
                    <input
                      id="emailPassword"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className={styles.input}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className={styles.saveButton} disabled={saving}>
                  {saving ? "Modification..." : "Modifier l'email"}
                </button>
              </form>

              {/* ── Active sessions ── */}
              <div className={styles.sectionDivider} />
              <h2 className={styles.subtitle}>Sessions actives</h2>
              {loadingSessions ? (
                <p className={styles.infoValue}>Chargement...</p>
              ) : sessions.length === 0 ? (
                <p className={styles.infoValue}>Aucune session active</p>
              ) : (
                <div className={styles.sessionList}>
                  {sessions.map((s) => (
                    <div key={s.id} className={styles.sessionItem}>
                      <div className={styles.sessionInfo}>
                        <span className={styles.sessionDevice}>
                          {s.is_current ? "● Session actuelle" : "Session"}
                        </span>
                        <span className={styles.sessionMeta}>
                          Créée le{" "}
                          {new Date(s.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {!s.is_current && (
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          className={styles.revokeButton}
                        >
                          Révoquer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Account info ── */}
              <div className={styles.sectionDivider} />
              <h2 className={styles.subtitle}>Informations du compte</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID du compte</span>
                  <span className={styles.infoValue}>{user.account.id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Membre depuis</span>
                  <span className={styles.infoValue}>
                    {new Date(user.account.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Vérifié</span>
                  <span className={styles.infoValue}>
                    {user.account.is_verified ? "Oui ✓" : "Non"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
