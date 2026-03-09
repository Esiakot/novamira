import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { z } from "zod";

const topicFollowSchema = z.object({
  topic_id: z.number().int().positive("ID de topic requis"),
});

// ── POST: Toggle follow/unfollow a topic ──

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const parsed = topicFollowSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { topic_id } = parsed.data;

  // Verify topic exists
  const topicCheck = await pool.query(
    `SELECT id FROM topic WHERE id = $1 AND is_active = true`,
    [topic_id],
  );

  if (topicCheck.rows.length === 0) {
    return NextResponse.json({ error: "Topic introuvable" }, { status: 404 });
  }

  // Check if already following
  const existing = await pool.query(
    `SELECT 1 FROM topic_follow WHERE account_id = $1 AND topic_id = $2`,
    [user.account.id, topic_id],
  );

  if (existing.rows.length > 0) {
    // Unfollow
    await pool.query(
      `DELETE FROM topic_follow WHERE account_id = $1 AND topic_id = $2`,
      [user.account.id, topic_id],
    );
    return NextResponse.json({ following: false });
  } else {
    // Follow
    await pool.query(
      `INSERT INTO topic_follow (account_id, topic_id) VALUES ($1, $2)`,
      [user.account.id, topic_id],
    );
    return NextResponse.json({ following: true });
  }
});
