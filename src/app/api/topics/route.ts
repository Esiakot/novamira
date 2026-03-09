import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { getSessionUser } from "@/libs/session";
import { z } from "zod";

// ── GET: List all active topics (with user follow status) ──

export const GET = apiHandler(
  async () => {
    const currentUser = await getSessionUser();
    const accountId = currentUser?.account.id ?? null;

    const result = await pool.query(
      `SELECT t.id, t.name, t.slug, t.description, t.icon_url,
              t.post_count, t.follower_count, t.created_by,
              (tf.account_id IS NOT NULL) AS user_following
       FROM topic t
       LEFT JOIN topic_follow tf ON tf.topic_id = t.id AND tf.account_id = $1
       WHERE t.is_active = true
       ORDER BY t.follower_count DESC, t.name ASC`,
      [accountId],
    );

    return NextResponse.json({ topics: result.rows });
  },
  { auth: false },
);

// ── POST: Create a new topic (user-created) ──

const createTopicSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  description: z
    .string()
    .max(255, "La description ne peut pas dépasser 255 caractères")
    .optional()
    .default(""),
});

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const parsed = createTopicSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    return NextResponse.json(
      { error: "Nom de topic invalide" },
      { status: 400 },
    );
  }

  // Check if slug already exists
  const existing = await pool.query(
    `SELECT id FROM topic WHERE slug = $1`,
    [slug],
  );
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "Un topic avec ce nom existe déjà" },
      { status: 409 },
    );
  }

  const result = await pool.query(
    `INSERT INTO topic (name, slug, description, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, slug, description, icon_url, post_count, follower_count, created_by`,
    [name, slug, description || null, user.account.id],
  );

  // Auto-follow the created topic
  await pool.query(
    `INSERT INTO topic_follow (account_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [user.account.id, result.rows[0].id],
  );

  return NextResponse.json({ topic: result.rows[0] }, { status: 201 });
});
