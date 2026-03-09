import { cookies } from "next/headers";
import pool from "@/libs/db";
import { hashToken } from "@/utils/auth";
import { serializeAuthUser } from "@/utils/serialize";
import { SESSION_COOKIE, SESSION_DURATION_DAYS } from "@/libs/constants";

export async function createSession(userId: string, token: string) {
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await pool.query(
    `INSERT INTO session (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT u.id, u.email, u.phone_number, u.email_verified, u.created_at, u.updated_at,
            a.id as account_id, a.user_id, a.username, a.display_name, a.bio,
            a.avatar_url, a.banner_url, a.location, a.website,
            a.date_of_birth, a.is_private, a.is_verified,
            a.follower_count, a.following_count, a.post_count, a.longpost_count,
            a.profile_completed, a.topic_follow_count,
            a.created_at as account_created_at, a.updated_at as account_updated_at
     FROM session s
     JOIN "user" u ON s.user_id = u.id
     JOIN account a ON a.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash],
  );

  if (result.rows.length === 0) return null;

  return serializeAuthUser(result.rows[0]);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await pool.query(`DELETE FROM session WHERE token_hash = $1`, [tokenHash]);
    cookieStore.delete(SESSION_COOKIE);
  }
}
