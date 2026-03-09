import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { hashPassword, generateSessionToken } from "@/utils/auth";
import { serializeAuthUser } from "@/utils/serialize";
import { registerSchema } from "@/utils/validation";
import { createSession } from "@/libs/session";
import { apiHandler } from "@/libs/apiHandler";

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  const { email, password, username, display_name, phone_number, date_of_birth } = parsed.data;

  // Check if email already exists
  const emailCheck = await pool.query(
    `SELECT id FROM "user" WHERE email = $1`,
    [email],
  );
  if (emailCheck.rows.length > 0) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé" },
      { status: 409 },
    );
  }

  // Check if username already exists
  const usernameCheck = await pool.query(
    `SELECT id FROM account WHERE username = $1`,
    [username],
  );
  if (usernameCheck.rows.length > 0) {
    return NextResponse.json(
      { error: "Ce nom d'utilisateur est déjà pris" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const userResult = await pool.query(
    `INSERT INTO "user" (email, password_hash, phone_number) VALUES ($1, $2, $3) RETURNING id, email, phone_number, email_verified, created_at, updated_at`,
    [email, passwordHash, phone_number],
  );
  const user = userResult.rows[0];

  const accountResult = await pool.query(
    `INSERT INTO account (user_id, username, display_name, date_of_birth) VALUES ($1, $2, $3, $4) RETURNING *`,
    [user.id, username, display_name, date_of_birth],
  );

  const token = generateSessionToken();
  await createSession(user.id, token);

  return NextResponse.json(
    { user: serializeAuthUser(user, accountResult.rows[0]) },
    { status: 201 },
  );
}, { auth: false });
