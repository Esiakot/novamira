import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { verifyPassword, generateSessionToken } from "@/utils/auth";
import { serializeAuthUser } from "@/utils/serialize";
import { loginSchema } from "@/utils/validation";
import { createSession } from "@/libs/session";
import { apiHandler } from "@/libs/apiHandler";

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const userResult = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.email_verified, u.is_banned, u.ban_reason,
            u.created_at, u.updated_at
     FROM "user" u
     WHERE u.email = $1`,
    [email],
  );

  if (userResult.rows.length === 0) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 },
    );
  }

  const user = userResult.rows[0];

  if (user.is_banned) {
    return NextResponse.json(
      { error: `Compte banni: ${user.ban_reason || "Aucune raison spécifiée"}` },
      { status: 403 },
    );
  }

  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 },
    );
  }

  const accountResult = await pool.query(
    `SELECT * FROM account WHERE user_id = $1`,
    [user.id],
  );

  if (accountResult.rows.length === 0) {
    return NextResponse.json(
      { error: "Compte utilisateur introuvable" },
      { status: 404 },
    );
  }

  await pool.query(
    `UPDATE "user" SET last_login_at = NOW() WHERE id = $1`,
    [user.id],
  );

  const token = generateSessionToken();
  await createSession(user.id, token);

  return NextResponse.json({
    user: serializeAuthUser(user, accountResult.rows[0]),
  });
}, { auth: false });
