import { NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── GET: Total unread messages count across all conversations ──
export const GET = apiHandler(async (_request, { user }) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(sub.cnt), 0)::int AS count
     FROM (
       SELECT COUNT(*) AS cnt
       FROM conversation_member cm
       JOIN message m ON m.conversation_id = cm.conversation_id
         AND m.is_deleted = false
         AND m.created_at > COALESCE(cm.last_read_at, cm.joined_at)
         AND m.sender_id != $1
       WHERE cm.account_id = $1
     ) sub`,
    [user.account.id],
  );

  return NextResponse.json({ count: result.rows[0].count });
});
