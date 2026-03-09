import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── POST: Mark conversation as read ──
export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const conversationId = segments[segments.length - 2]; // /api/messages/[id]/read

  // Verify membership and update last_read_at
  const result = await pool.query(
    `UPDATE conversation_member SET last_read_at = NOW()
     WHERE conversation_id = $1 AND account_id = $2
     RETURNING conversation_id`,
    [conversationId, user.account.id],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
});
