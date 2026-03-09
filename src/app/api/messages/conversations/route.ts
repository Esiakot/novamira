import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── GET: List conversations for current user ──
export const GET = apiHandler(async (_request: NextRequest, { user }) => {
  const result = await pool.query(
    `SELECT c.id, c.type, c.name, c.avatar_url, c.last_message_at, c.created_at,
            cm.last_read_at, cm.is_muted,
            -- Last message preview
            m.content AS last_message_content,
            m.sender_id AS last_message_sender_id,
            m.created_at AS last_message_created_at,
            sender_acc.username AS last_message_sender_username,
            -- Other participant (for direct conversations)
            other_acc.id AS other_id,
            other_acc.username AS other_username,
            other_acc.display_name AS other_display_name,
            other_acc.avatar_url AS other_avatar_url,
            -- Unread count
            (SELECT COUNT(*)::int FROM message msg
             WHERE msg.conversation_id = c.id
               AND msg.is_deleted = false
               AND msg.created_at > COALESCE(cm.last_read_at, cm.joined_at)
               AND msg.sender_id != $1
            ) AS unread_count
     FROM conversation c
     JOIN conversation_member cm ON cm.conversation_id = c.id AND cm.account_id = $1
     LEFT JOIN LATERAL (
       SELECT content, sender_id, created_at
       FROM message
       WHERE conversation_id = c.id AND is_deleted = false
       ORDER BY created_at DESC LIMIT 1
     ) m ON true
     LEFT JOIN account sender_acc ON sender_acc.id = m.sender_id
     LEFT JOIN LATERAL (
       SELECT a.id, a.username, a.display_name, a.avatar_url
       FROM conversation_member cm2
       JOIN account a ON a.id = cm2.account_id
       WHERE cm2.conversation_id = c.id AND cm2.account_id != $1
       LIMIT 1
     ) other_acc ON c.type = 'direct'
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
    [user.account.id],
  );

  return NextResponse.json({ conversations: result.rows });
});

// ── POST: Create a new direct conversation ──
export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const { recipient_username } = body;

  if (!recipient_username) {
    return NextResponse.json({ error: "Nom d'utilisateur requis" }, { status: 400 });
  }

  // Find recipient
  const recipientResult = await pool.query(
    `SELECT id FROM account WHERE username = $1`,
    [recipient_username],
  );
  if (recipientResult.rows.length === 0) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const recipientId = recipientResult.rows[0].id;

  if (recipientId === user.account.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous envoyer un message" }, { status: 400 });
  }

  // Check if a direct conversation already exists between these users
  const existing = await pool.query(
    `SELECT c.id FROM conversation c
     JOIN conversation_member cm1 ON cm1.conversation_id = c.id AND cm1.account_id = $1
     JOIN conversation_member cm2 ON cm2.conversation_id = c.id AND cm2.account_id = $2
     WHERE c.type = 'direct'
     LIMIT 1`,
    [user.account.id, recipientId],
  );

  if (existing.rows.length > 0) {
    return NextResponse.json({ conversation_id: existing.rows[0].id });
  }

  // Create new conversation
  const conv = await pool.query(
    `INSERT INTO conversation (type, created_by) VALUES ('direct', $1) RETURNING id`,
    [user.account.id],
  );
  const convId = conv.rows[0].id;

  // Add both members
  await pool.query(
    `INSERT INTO conversation_member (conversation_id, account_id, role) VALUES ($1, $2, 'owner'), ($1, $3, 'member')`,
    [convId, user.account.id, recipientId],
  );

  return NextResponse.json({ conversation_id: convId }, { status: 201 });
});
