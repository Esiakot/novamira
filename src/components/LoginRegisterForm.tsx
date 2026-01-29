"use client";
import { useState } from "react";

export default function LoginRegisterForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameHandle, setUsernameHandle] = useState("");
  const [usernameDisplay, setUsernameDisplay] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "/api/users/login" : "/api/users/register";
    const body = isLogin
      ? { email, password }
      : {
          email,
          password,
          username_handle: usernameHandle,
          username_display: usernameDisplay,
          firstname,
          lastname,
          bio,
        };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) setError(data.message || "Erreur");
    else window.location.href = "/";
  };

  const handleLogout = () => {
    document.cookie =
      "auth_token=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  // Si déjà connecté, proposer la déconnexion
  if (
    typeof document !== "undefined" &&
    document.cookie.includes("auth_token=")
  ) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "60px auto",
          padding: 24,
          border: "1px solid #eee",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <h2>Vous êtes déjà connecté</h2>
        <button
          onClick={handleLogout}
          style={{ width: "100%", padding: 10, marginTop: 16 }}
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "60px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h2 style={{ textAlign: "center" }}>
        {isLogin ? "Connexion" : "Inscription"}
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Pseudo (handle)"
              value={usernameHandle}
              onChange={(e) => setUsernameHandle(e.target.value)}
              required
              style={{ width: "100%", marginBottom: 12, padding: 8 }}
            />
            <input
              type="text"
              placeholder="Nom affiché"
              value={usernameDisplay}
              onChange={(e) => setUsernameDisplay(e.target.value)}
              required
              style={{ width: "100%", marginBottom: 12, padding: 8 }}
            />
            <input
              type="text"
              placeholder="Prénom"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              style={{ width: "100%", marginBottom: 12, padding: 8 }}
            />
            <input
              type="text"
              placeholder="Nom"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              style={{ width: "100%", marginBottom: 12, padding: 8 }}
            />
            <textarea
              placeholder="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: 8,
                minHeight: 60,
              }}
            />
          </>
        )}
        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          {isLogin ? "Se connecter" : "S'inscrire"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        {isLogin ? (
          <span>
            Pas de compte ?{" "}
            <a href="#" onClick={() => setIsLogin(false)}>
              Inscription
            </a>
          </span>
        ) : (
          <span>
            Déjà inscrit ?{" "}
            <a href="#" onClick={() => setIsLogin(true)}>
              Connexion
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
