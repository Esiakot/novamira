import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { verifyPassword, hashPassword } from "@/utils/auth";
import { serializeAccount } from "@/utils/serialize";
import {
  usernameSchema,
  displayNameSchema,
  passwordSchema,
  emailSchema,
  bioSchema,
  locationSchema,
  websiteSchema,
  dateOfBirthSchema,
} from "@/utils/validation";
import { apiHandler } from "@/libs/apiHandler";

export const PATCH = apiHandler(async (request: NextRequest, { user: sessionUser }) => {
  const body = await request.json();
  const {
    username,
    display_name,
    bio,
    avatar_url,
    banner_url,
    location,
    website,
    date_of_birth,
    is_private,
    current_password,
    new_password,
    new_email,
    email_password,
  } = body;

  const hasAccountFields =
    username !== undefined ||
    display_name !== undefined ||
    bio !== undefined ||
    avatar_url !== undefined ||
    banner_url !== undefined ||
    location !== undefined ||
    website !== undefined ||
    date_of_birth !== undefined ||
    is_private !== undefined;

  const hasPasswordChange = current_password !== undefined && new_password !== undefined;
  const hasEmailChange = new_email !== undefined && email_password !== undefined;

  if (!hasAccountFields && !hasPasswordChange && !hasEmailChange) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  // ── Password change ──
  if (hasPasswordChange) {
    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: "Mot de passe actuel et nouveau mot de passe requis" },
        { status: 400 },
      );
    }

    const passwordResult = passwordSchema.safeParse(new_password);
    if (!passwordResult.success) {
      return NextResponse.json(
        { error: passwordResult.error.issues[0].message },
        { status: 400 },
      );
    }

    const userResult = await pool.query(
      `SELECT password_hash FROM "user" WHERE id = $1`,
      [sessionUser.user.id],
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const valid = await verifyPassword(current_password, userResult.rows[0].password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
    }

    const newHash = await hashPassword(new_password);
    await pool.query(
      `UPDATE "user" SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, sessionUser.user.id],
    );

    return NextResponse.json({ success: true, message: "Mot de passe modifié avec succès" });
  }

  // ── Email change ──
  if (hasEmailChange) {
    if (!new_email || !email_password) {
      return NextResponse.json(
        { error: "Nouvel email et mot de passe requis" },
        { status: 400 },
      );
    }

    const emailResult = emailSchema.safeParse(new_email);
    if (!emailResult.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const userResult = await pool.query(
      `SELECT password_hash FROM "user" WHERE id = $1`,
      [sessionUser.user.id],
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const valid = await verifyPassword(email_password, userResult.rows[0].password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const emailCheck = await pool.query(
      `SELECT id FROM "user" WHERE email = $1 AND id != $2`,
      [new_email, sessionUser.user.id],
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    await pool.query(
      `UPDATE "user" SET email = $1, updated_at = NOW() WHERE id = $2`,
      [new_email, sessionUser.user.id],
    );

    return NextResponse.json({ success: true, message: "Email modifié avec succès" });
  }

  // ── Account profile fields ──
  if (username !== undefined) {
    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      return NextResponse.json(
        { error: usernameResult.error.issues[0].message },
        { status: 400 },
      );
    }
    const existing = await pool.query(
      `SELECT id FROM account WHERE username = $1 AND id != $2`,
      [username, sessionUser.account.id],
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris" }, { status: 409 });
    }
  }

  if (display_name !== undefined) {
    const dnResult = displayNameSchema.safeParse(display_name);
    if (!dnResult.success) {
      return NextResponse.json(
        { error: dnResult.error.issues[0].message },
        { status: 400 },
      );
    }
  }

  if (bio !== undefined) {
    const bioResult = bioSchema.safeParse(bio);
    if (!bioResult.success) {
      return NextResponse.json(
        { error: bioResult.error.issues[0].message },
        { status: 400 },
      );
    }
  }

  if (location !== undefined) {
    const locationResult = locationSchema.safeParse(location || null);
    if (!locationResult.success) {
      return NextResponse.json(
        { error: locationResult.error.issues[0].message },
        { status: 400 },
      );
    }
  }

  if (website !== undefined) {
    const websiteResult = websiteSchema.safeParse(website || null);
    if (!websiteResult.success) {
      return NextResponse.json(
        { error: websiteResult.error.issues[0].message },
        { status: 400 },
      );
    }
  }

  if (date_of_birth !== undefined) {
    const dobResult = dateOfBirthSchema.safeParse(date_of_birth || null);
    if (!dobResult.success) {
      return NextResponse.json(
        { error: dobResult.error.issues[0].message },
        { status: 400 },
      );
    }
  }

  // Build dynamic update query
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
  if (display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(display_name); }
  if (bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(bio || null); }
  if (avatar_url !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(avatar_url || null); }
  if (banner_url !== undefined) { fields.push(`banner_url = $${idx++}`); values.push(banner_url || null); }
  if (location !== undefined) { fields.push(`location = $${idx++}`); values.push(location || null); }
  if (website !== undefined) { fields.push(`website = $${idx++}`); values.push(website || null); }
  if (date_of_birth !== undefined) { fields.push(`date_of_birth = $${idx++}`); values.push(date_of_birth || null); }
  if (is_private !== undefined) { fields.push(`is_private = $${idx++}`); values.push(is_private === true || is_private === "true"); }

  fields.push(`updated_at = NOW()`);
  values.push(sessionUser.account.id);

  const result = await pool.query(
    `UPDATE account SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );

  return NextResponse.json({
    account: serializeAccount(result.rows[0]),
  });
});
