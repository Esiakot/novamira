import { NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── GET: Get unread notification count ──

export const GET = apiHandler(async (_request, { user }) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM notification
     WHERE recipient_id = $1 AND is_read = false`,
    [user.account.id],
  );

  return NextResponse.json({ count: result.rows[0].count });
});
