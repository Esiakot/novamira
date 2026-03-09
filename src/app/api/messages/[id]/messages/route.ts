import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── GET: List messages in a conversation ──
export const GET = apiHandler(async (request: NextRequest, { user }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const conversationId = segments[segments.length - 2]; // /api/messages/[id]/messages
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const before = url.searchParams.get("before"); // cursor for pagination

  // Verify membership
  const membership = await pool.query(
    `SELECT 1 FROM conversation_member WHERE conversation_id = $1 AND account_id = $2`,
    [conversationId, user.account.id],
  );
  if (membership.rows.length === 0) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let query = `
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.reply_to_id,
           m.is_edited, m.is_deleted, m.created_at, m.updated_at,
           a.username AS sender_username,
           a.display_name AS sender_display_name,
           a.avatar_url AS sender_avatar_url
    FROM message m
    LEFT JOIN account a ON a.id = m.sender_id
    WHERE m.conversation_id = $1 AND m.is_deleted = false
  `;
  const params: (string | number)[] = [conversationId];

  if (before) {
    params.push(before);
    query += ` AND m.created_at < $${params.length}`;
  }

  params.push(limit);
  query += ` ORDER BY m.created_at DESC LIMIT $${params.length}`;

  const result = await pool.query(query, params);

  return NextResponse.json({ messages: result.rows.reverse() });
});

// ── POST: Send a message ──
export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const conversationId = segments[segments.length - 2];
  const body = await request.json();
  const { content, reply_to_id } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: "Message trop long (5000 max)" }, { status: 400 });
  }

  // Verify membership
  const membership = await pool.query(
    `SELECT 1 FROM conversation_member WHERE conversation_id = $1 AND account_id = $2`,
    [conversationId, user.account.id],
  );
  if (membership.rows.length === 0) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Insert message
  const result = await pool.query(
    `INSERT INTO message (conversation_id, sender_id, content, reply_to_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, conversation_id, sender_id, content, reply_to_id, is_edited, is_deleted, created_at, updated_at`,
    [conversationId, user.account.id, content.trim(), reply_to_id || null],
  );

  const msg = result.rows[0];

  // Create notification for other members
  const members = await pool.query(
    `SELECT account_id FROM conversation_member WHERE conversation_id = $1 AND account_id != $2`,
    [conversationId, user.account.id],
  );

  for (const member of members.rows) {
    await pool.query(
      `INSERT INTO notification (recipient_id, sender_id, type, message_id, content)
       VALUES ($1, $2, 'message', $3, $4)
       ON CONFLICT DO NOTHING`,
      [member.account_id, user.account.id, msg.id, content.trim().slice(0, 100)],
    );
  }

  return NextResponse.json({
    message: {
      ...msg,
      sender_username: user.account.username,
      sender_display_name: user.account.display_name,
      sender_avatar_url: user.account.avatar_url,
    },
  }, { status: 201 });
});
