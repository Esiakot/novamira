// lib/services/profile.service.ts
import pool from "@/libs/db"; // Adapte le chemin selon ton dossier (lib ou libs)

// On définit le type de retour pour être rigoureux (comme dans ton frontend)
export type UserProfile = {
  id: string;
  account_id: string;
  username_handle: string;
  username_display: string;
  lastname?: string;
  firstname?: string;
  bio?: string;
  country?: string;
  city?: string;
  avatar_url?: string;
  header_url?: string;
  link_1?: string;
  link_2?: string;
};

export async function getUserProfile(
  accountId: string,
): Promise<UserProfile | null> {
  let conn;
  try {
    conn = await pool.getConnection();

    // La requête SQL pure
    const rows = await conn.query(
      "SELECT * FROM user_profile WHERE account_id = ?",
      [accountId],
    );

    // Si aucun résultat
    if (!rows || rows.length === 0) {
      return null;
    }

    // On retourne le premier résultat (typé)
    return rows[0] as UserProfile;
  } catch (error) {
    console.error("Erreur profile service:", error);
    throw error; // On relance l'erreur pour que le contrôleur sache qu'il y a eu un crash
  } finally {
    if (conn) conn.release();
  }
}
