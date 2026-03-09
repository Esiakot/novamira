"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "@/styles/pages/Auth.module.css";

type RegisterStep = 1 | 2 | 3;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Register fields (step 1: email + password)
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  // Register fields (step 2: identity)
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Register fields (step 3: birth date + confirm)
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (registerStep === 1) {
      if (!regEmail || !regPassword || !regConfirmPassword) {
        setError("Tous les champs sont requis");
        return;
      }
      if (regPassword.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      if (!username || !displayName || !phoneNumber) {
        setError("Tous les champs sont requis");
        return;
      }
      if (username.length < 3) {
        setError("Le nom d'utilisateur doit contenir au moins 3 caractères");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError("Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores");
        return;
      }
      if (!/^\+?[0-9]{7,15}$/.test(phoneNumber)) {
        setError("Numéro de téléphone invalide");
        return;
      }
      setRegisterStep(3);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!dateOfBirth) {
      setError("La date de naissance est requise");
      return;
    }

    // Age check: must be at least 13
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 13) {
      setError("Vous devez avoir au moins 13 ans pour vous inscrire");
      return;
    }

    setLoading(true);
    try {
      const result = await register(
        regEmail,
        regPassword,
        username,
        displayName,
        phoneNumber,
        dateOfBirth,
      );
      if (result.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setRegisterStep(1);
    setError("");
  };

  const goBackStep = () => {
    setError("");
    setRegisterStep((prev) => (prev > 1 ? (prev - 1) as RegisterStep : prev));
  };

  const stepLabels = ["Compte", "Identité", "Naissance"];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>novamira</h1>
        <p className={styles.subtitle}>
          {isLogin
            ? "Connexion à votre compte"
            : `Créer un compte — Étape ${registerStep}/3`}
        </p>

        {/* ── Step indicator ── */}
        {!isLogin && (
          <div className={styles.stepIndicator}>
            {stepLabels.map((label, i) => (
              <div
                key={i}
                className={`${styles.step} ${i + 1 <= registerStep ? styles.stepActive : ""} ${i + 1 < registerStep ? styles.stepDone : ""}`}
              >
                <div className={styles.stepDot}>
                  {i + 1 < registerStep ? "✓" : i + 1}
                </div>
                <span className={styles.stepLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Login form ── */}
        {isLogin && (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Chargement..." : "Se connecter"}
            </button>
          </form>
        )}

        {/* ── Register Step 1: Email + Password ── */}
        {!isLogin && registerStep === 1 && (
          <form onSubmit={handleNextStep} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="regEmail" className={styles.label}>
                Email
              </label>
              <input
                id="regEmail"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={styles.input}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="regPassword" className={styles.label}>
                Mot de passe
              </label>
              <input
                id="regPassword"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={styles.input}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="regConfirmPassword" className={styles.label}>
                Confirmer le mot de passe
              </label>
              <input
                id="regConfirmPassword"
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button}>
              Continuer
            </button>
          </form>
        )}

        {/* ── Register Step 2: Username + Display Name + Phone ── */}
        {!isLogin && registerStep === 2 && (
          <form onSubmit={handleNextStep} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="username" className={styles.label}>
                Nom d&apos;utilisateur
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
              <span className={styles.hint}>Lettres, chiffres et underscores uniquement</span>
            </div>
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
              <label htmlFor="phoneNumber" className={styles.label}>
                Numéro de téléphone
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={styles.input}
                placeholder="+33612345678"
                required
              />
              <span className={styles.hint}>Format international recommandé</span>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.stepButtons}>
              <button type="button" onClick={goBackStep} className={styles.backBtn}>
                Retour
              </button>
              <button type="submit" className={styles.button}>
                Continuer
              </button>
            </div>
          </form>
        )}

        {/* ── Register Step 3: Date of Birth + Submit ── */}
        {!isLogin && registerStep === 3 && (
          <form onSubmit={handleRegister} className={styles.form}>
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
                required
              />
              <span className={styles.hint}>Vous devez avoir au moins 13 ans</span>
            </div>

            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Récapitulatif</h3>
              <div className={styles.summaryRow}>
                <span>Email</span>
                <span>{regEmail}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Utilisateur</span>
                <span>@{username}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Nom</span>
                <span>{displayName}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Téléphone</span>
                <span>{phoneNumber}</span>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.stepButtons}>
              <button type="button" onClick={goBackStep} className={styles.backBtn}>
                Retour
              </button>
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </div>
          </form>
        )}

        <p className={styles.switch}>
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button onClick={switchMode} className={styles.switchButton}>
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
