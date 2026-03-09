import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── POST: Signal that user is typing in a conversation ──
// ── GET: Check who is typing in a conversation ──

// In-memory typing state (per-server instance — sufficient for single-server)
const typingState = new Map<string, Map<string, number>>(); // conversationId -> accountId -> timestamp

function cleanOldTyping(convId: string) {
  const convTyping = typingState.get(convId);
  if (!convTyping) return;
  const now = Date.now();
  for (const [accountId, timestamp] of convTyping) {
    if (now - timestamp > 5000) { // 5 second timeout
      convTyping.delete(accountId);
    }
  }
  if (convTyping.size === 0) typingState.delete(convId);
}

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const conversationId = segments[segments.length - 2];

  // Verify membership
  const membership = await pool.query(
    `SELECT 1 FROM conversation_member WHERE conversation_id = $1 AND account_id = $2`,
    [conversationId, user.account.id],
  );
  if (membership.rows.length === 0) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!typingState.has(conversationId)) {
    typingState.set(conversationId, new Map());
  }
  typingState.get(conversationId)!.set(user.account.id, Date.now());

  return NextResponse.json({ success: true });
});

export const GET = apiHandler(async (request: NextRequest, { user }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const conversationId = segments[segments.length - 2];

  // Verify membership
  const membership = await pool.query(
    `SELECT 1 FROM conversation_member WHERE conversation_id = $1 AND account_id = $2`,
    [conversationId, user.account.id],
  );
  if (membership.rows.length === 0) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  cleanOldTyping(conversationId);
  const convTyping = typingState.get(conversationId);
  const typingUsers: string[] = [];

  if (convTyping) {
    for (const [accountId] of convTyping) {
      if (accountId !== user.account.id) {
        typingUsers.push(accountId);
      }
    }
  }

  // Get usernames for typing users
  let typingUsernames: string[] = [];
  if (typingUsers.length > 0) {
    const result = await pool.query(
      `SELECT username FROM account WHERE id = ANY($1)`,
      [typingUsers],
    );
    typingUsernames = result.rows.map((r: { username: string }) => r.username);
  }

  return NextResponse.json({ typing: typingUsernames });
});
