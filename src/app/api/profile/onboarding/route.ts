import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { z } from "zod";

const onboardingSchema = z.object({
  bio: z.string().max(150).optional().default(""),
  avatar_url: z.string().max(500).optional().default(""),
  location: z.string().max(100).optional().default(""),
  website: z
    .string()
    .url()
    .max(255)
    .optional()
    .or(z.literal("").transform(() => "")),
  topic_ids: z.array(z.number().int().positive()).optional().default([]),
});

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { bio, avatar_url, location, website, topic_ids } = parsed.data;

  // Update account profile fields
  await pool.query(
    `UPDATE account SET bio = $1, avatar_url = $2, location = $3, website = $4, profile_completed = true WHERE id = $5`,
    [bio || null, avatar_url || null, location || null, website || null, user.account.id],
  );

  // Follow selected topics
  if (topic_ids.length > 0) {
    const values = topic_ids
      .map((_, i) => `($1, $${i + 2})`)
      .join(", ");
    await pool.query(
      `INSERT INTO topic_follow (account_id, topic_id) VALUES ${values} ON CONFLICT DO NOTHING`,
      [user.account.id, ...topic_ids],
    );
  }

  return NextResponse.json({ success: true });
});
