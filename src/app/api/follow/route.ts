import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { z } from "zod";

const followSchema = z.object({
  username: z.string().min(1, "Username requis"),
});

// ── POST: Follow or unfollow a user (toggle) ──

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const parsed = followSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { username } = parsed.data;

  // Find target account
  const targetResult = await pool.query(
    `SELECT id FROM account WHERE username = $1`,
    [username],
  );

  if (targetResult.rows.length === 0) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const targetId = targetResult.rows[0].id;

  if (targetId === user.account.id) {
    return NextResponse.json({ error: "Impossible de se suivre soi-même" }, { status: 400 });
  }

  // Check if already following
  const existingResult = await pool.query(
    `SELECT 1 FROM following WHERE follower_id = $1 AND following_id = $2`,
    [user.account.id, targetId],
  );

  if (existingResult.rows.length > 0) {
    // Unfollow
    await pool.query(
      `DELETE FROM following WHERE follower_id = $1 AND following_id = $2`,
      [user.account.id, targetId],
    );
    return NextResponse.json({ following: false });
  } else {
    // Follow
    await pool.query(
      `INSERT INTO following (follower_id, following_id, status) VALUES ($1, $2, 'active')`,
      [user.account.id, targetId],
    );

    // Create follow notification
    await pool.query(
      `INSERT INTO notification (recipient_id, sender_id, type)
       VALUES ($1, $2, 'follow')
       ON CONFLICT DO NOTHING`,
      [targetId, user.account.id],
    );

    return NextResponse.json({ following: true });
  }
});
