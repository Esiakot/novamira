import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── GET: List notifications for current user ──

export const GET = apiHandler(async (request: NextRequest, { user }) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const result = await pool.query(
    `SELECT n.id, n.type, n.content, n.post_id, n.is_read, n.created_at,
            s.username AS sender_username,
            s.display_name AS sender_display_name,
            s.avatar_url AS sender_avatar_url,
            CASE WHEN lp.id IS NOT NULL THEN true ELSE false END AS is_longpost
     FROM notification n
     LEFT JOIN account s ON n.sender_id = s.id
     LEFT JOIN longpost lp ON lp.post_id = n.post_id
     WHERE n.recipient_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2 OFFSET $3`,
    [user.account.id, limit, offset],
  );

  return NextResponse.json({ notifications: result.rows });
});
