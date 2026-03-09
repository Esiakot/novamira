import { NextResponse } from "next/server";
import pool from "@/libs/db";
import { hashToken } from "@/utils/auth";
import { apiHandler } from "@/libs/apiHandler";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/libs/constants";
import { sessionIdSchema } from "@/utils/validation";

// GET: list active sessions
export const GET = apiHandler(async (_request, { user }) => {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value;
  const currentHash = currentToken ? hashToken(currentToken) : "";

  const result = await pool.query(
    `SELECT id, device_info, ip_address, created_at, expires_at, token_hash
     FROM session
     WHERE user_id = $1 AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [user.user.id],
  );

  const sessions = result.rows.map((s) => ({
    id: s.id,
    device_info: s.device_info,
    ip_address: s.ip_address,
    created_at: s.created_at,
    expires_at: s.expires_at,
    is_current: s.token_hash === currentHash,
  }));

  return NextResponse.json({ sessions });
});

// DELETE: revoke a specific session
export const DELETE = apiHandler(async (request: Request, { user }) => {
  const body = await request.json();
  const parsed = sessionIdSchema.safeParse(body.session_id);

  if (!parsed.success) {
    return NextResponse.json({ error: "ID de session invalide" }, { status: 400 });
  }

  await pool.query(
    `DELETE FROM session WHERE id = $1 AND user_id = $2`,
    [parsed.data, user.user.id],
  );

  return NextResponse.json({ success: true });
});
