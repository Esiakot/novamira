// lib/services/auth.service.ts
import pool from "@/libs/db"; // Ton fichier db.ts existant
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type { z } from "zod";
import { registerSchema } from "@/libs/validations/users/auth.schema";

// On déduit le type TS à partir du schéma Zod
type RegisterData = z.infer<typeof registerSchema>;

type RegisterResult =
  | { success: false; error: string; status: 409 | 500 }
  | { success: true; userId: string };

// On définit le type de retour pour être propre
type AuthResult =
  | { success: false; error: string; type: "AUTH_ERROR" | "SERVER_ERROR" }
  | { success: true; user: { id: number; email: string } };

export async function authenticateUser(
  email: string,
  passwordCandidate: string,
): Promise<AuthResult> {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Requête SQL
    const rows = await conn.query(
      "SELECT id, email, password FROM account WHERE email = ?",
      [email],
    );

    if (!rows[0]) {
      return {
        success: false,
        error: "Identifiants incorrects",
        type: "AUTH_ERROR",
      }; // On reste vague pour la sécurité
    }

    // 2. Vérification Password
    const isValid = await bcrypt.compare(passwordCandidate, rows[0].password);

    if (!isValid) {
      return {
        success: false,
        error: "Identifiants incorrects",
        type: "AUTH_ERROR",
      };
    }

    // 3. Succès (On ne renvoie JAMAIS le mot de passe)
    return { success: true, user: { id: rows[0].id, email: rows[0].email } };
  } catch (error) {
    console.error("Erreur login service:", error);
    return { success: false, error: "Erreur interne", type: "SERVER_ERROR" };
  } finally {
    if (conn) conn.release();
  }
}

export async function registerUser(
  data: RegisterData,
): Promise<RegisterResult> {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Vérifier si l'email existe déjà
    const checkEmail = await conn.query(
      "SELECT id FROM account WHERE email = ?",
      [data.email],
    );
    if (checkEmail[0]) {
      return {
        success: false,
        error: "Cet email est déjà utilisé",
        status: 409,
      };
    }

    // 2. Préparation des données
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Transaction : On commence les modifications
    await conn.beginTransaction();

    try {
      // Insertion Compte
      await conn.query(
        "INSERT INTO account (id, email, password) VALUES (?, ?, ?)",
        [userId, data.email, hashedPassword],
      );

      // Insertion Profil
      await conn.query(
        "INSERT INTO user_profile (id, account_id, username_handle, username_display, firstname, lastname, bio) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          randomUUID(), // ID du profil
          userId, // Lien vers le compte
          data.username_handle,
          data.username_display,
          data.firstname || null,
          data.lastname || null,
          data.bio || null,
        ],
      );

      // Si tout va bien, on valide la transaction
      await conn.commit();

      return { success: true, userId };
    } catch (err) {
      // S'il y a une erreur pendant les inserts, on annule tout (Rollback)
      await conn.rollback();
      throw err; // On renvoie l'erreur au catch global
    }
  } catch (error) {
    console.error("Erreur register service:", error);
    return {
      success: false,
      error: "Erreur serveur lors de l'inscription",
      status: 500,
    };
  } finally {
    if (conn) conn.release();
  }
}
