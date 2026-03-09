import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { z } from "zod";

const readSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
  read_all: z.boolean().optional().default(false),
});

// ── POST: Mark notifications as read ──

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const parsed = readSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { notification_ids, read_all } = parsed.data;

  if (read_all) {
    await pool.query(
      `UPDATE notification SET is_read = true, read_at = NOW()
       WHERE recipient_id = $1 AND is_read = false`,
      [user.account.id],
    );
  } else if (notification_ids && notification_ids.length > 0) {
    await pool.query(
      `UPDATE notification SET is_read = true, read_at = NOW()
       WHERE recipient_id = $1 AND id = ANY($2) AND is_read = false`,
      [user.account.id, notification_ids],
    );
  }

  return NextResponse.json({ success: true });
});
