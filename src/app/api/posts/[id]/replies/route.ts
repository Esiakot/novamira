import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { getSessionUser } from "@/libs/session";
import { z } from "zod";
import { POST_MAX_LENGTH } from "@/libs/constants";
import type { Post, PostMedia, LongPost } from "@/types/auth";

function serializePost(row: Record<string, unknown>, media: PostMedia[] = []): Post {
  const longpost: LongPost | null = row.longpost_id
    ? {
        id: row.longpost_id as string,
        title: row.longpost_title as string,
        body: row.longpost_body as string,
        cover_image_url: (row.longpost_cover as string | null) ?? null,
        reading_time_min: (row.longpost_reading_time as number | null) ?? null,
        created_at: row.longpost_created_at as string,
      }
    : null;

  return {
    id: row.id as string,
    author_id: row.author_id as string,
    content: (row.content as string | null) ?? null,
    parent_id: (row.parent_id as string | null) ?? null,
    is_reply: row.is_reply as boolean,
    topic_id: (row.topic_id as number | null) ?? null,
    topic_name: (row.topic_name as string | null) ?? null,
    topic_slug: (row.topic_slug as string | null) ?? null,
    like_count: row.like_count as number,
    dislike_count: (row.dislike_count as number) ?? 0,
    reply_count: row.reply_count as number,
    repost_count: row.repost_count as number,
    share_count: row.share_count as number,
    view_count: row.view_count as number,
    visibility: row.visibility as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author_username: row.author_username as string,
    author_display_name: row.author_display_name as string,
    author_avatar_url: (row.author_avatar_url as string | null) ?? null,
    parent_author_username: (row.parent_author_username as string | null) ?? null,
    parent_author_display_name: (row.parent_author_display_name as string | null) ?? null,
    media,
    longpost,
    user_liked: (row.user_liked as boolean) ?? false,
    user_disliked: (row.user_disliked as boolean) ?? false,
  };
}

const replySchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu est requis")
    .max(POST_MAX_LENGTH, `La réponse ne peut pas dépasser ${POST_MAX_LENGTH} caractères`),
});

// ── GET: List replies for a post ──

export const GET = apiHandler(
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    // /api/posts/[id]/replies → id is at index -2
    const postId = segments[segments.length - 2];

    if (!postId) {
      return NextResponse.json({ error: "Post ID requis" }, { status: 400 });
    }

    const currentUser = await getSessionUser();
    const accountId = currentUser?.account.id ?? null;

    const result = await pool.query(
      `SELECT p.id, p.author_id, p.content, p.parent_id, p.is_reply,
              p.like_count, p.dislike_count, p.reply_count, p.repost_count, p.share_count,
              p.view_count, p.visibility, p.topic_id, p.created_at, p.updated_at,
              a.username AS author_username,
              a.display_name AS author_display_name,
              a.avatar_url AS author_avatar_url,
              t.name AS topic_name,
              t.slug AS topic_slug,
              NULL AS longpost_id, NULL AS longpost_title, NULL AS longpost_body,
              NULL AS longpost_cover, NULL AS longpost_reading_time, NULL AS longpost_created_at,
              (pl.account_id IS NOT NULL) AS user_liked,
              (pd.account_id IS NOT NULL) AS user_disliked
       FROM post p
       JOIN account a ON p.author_id = a.id
       LEFT JOIN topic t ON p.topic_id = t.id
       LEFT JOIN post_like pl ON pl.post_id = p.id AND pl.account_id = $2
       LEFT JOIN post_dislike pd ON pd.post_id = p.id AND pd.account_id = $2
       WHERE p.parent_id = $1
         AND p.is_deleted = false
       ORDER BY p.created_at ASC`,
      [postId, accountId],
    );

    // Fetch media for all replies
    const postIds = result.rows.map((r) => r.id);
    let mediaMap: Record<string, PostMedia[]> = {};
    if (postIds.length > 0) {
      const mediaResult = await pool.query(
        `SELECT id, post_id, media_url, media_type, alt_text, sort_order
         FROM post_media WHERE post_id = ANY($1) ORDER BY sort_order ASC`,
        [postIds],
      );
      for (const m of mediaResult.rows) {
        if (!mediaMap[m.post_id]) mediaMap[m.post_id] = [];
        mediaMap[m.post_id].push({
          id: m.id,
          media_url: m.media_url,
          media_type: m.media_type,
          alt_text: m.alt_text,
          sort_order: m.sort_order,
        });
      }
    }

    const replies: Post[] = result.rows.map((row) =>
      serializePost(row, mediaMap[row.id] || []),
    );

    return NextResponse.json({ replies });
  },
  { auth: false },
);

// ── POST: Create a reply to a post ──

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const parentId = segments[segments.length - 2];

  if (!parentId) {
    return NextResponse.json({ error: "Post ID requis" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  // Verify parent exists
  const parentCheck = await pool.query(
    `SELECT id, root_id, topic_id FROM post WHERE id = $1 AND is_deleted = false`,
    [parentId],
  );
  if (parentCheck.rows.length === 0) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  const parent = parentCheck.rows[0];
  // root_id: if parent is itself a reply, use its root_id; otherwise parent is root
  const rootId = parent.root_id || parent.id;

  const { content } = parsed.data;

  const result = await pool.query(
    `INSERT INTO post (author_id, content, parent_id, root_id, is_reply, topic_id)
     VALUES ($1, $2, $3, $4, true, $5)
     RETURNING *`,
    [user.account.id, content, parentId, rootId, parent.topic_id],
  );

  const post = result.rows[0];

  const reply = serializePost(
    {
      ...post,
      author_username: user.account.username,
      author_display_name: user.account.display_name,
      author_avatar_url: user.account.avatar_url,
      topic_name: null,
      topic_slug: null,
      longpost_id: null,
      longpost_title: null,
      longpost_body: null,
      longpost_cover: null,
      longpost_reading_time: null,
      longpost_created_at: null,
      user_liked: false,
      user_disliked: false,
    },
    [],
  );

  // Create notification for post author (if not replying to self)
  if (parent.id) {
    const parentAuthor = await pool.query(
      `SELECT author_id FROM post WHERE id = $1`,
      [parentId],
    );
    if (
      parentAuthor.rows.length > 0 &&
      parentAuthor.rows[0].author_id !== user.account.id
    ) {
      await pool.query(
        `INSERT INTO notification (recipient_id, sender_id, type, post_id, content)
         VALUES ($1, $2, 'reply', $3, $4)`,
        [
          parentAuthor.rows[0].author_id,
          user.account.id,
          post.id,
          content.length > 100 ? content.slice(0, 100) + "…" : content,
        ],
      );
    }
  }

  return NextResponse.json({ reply }, { status: 201 });
});
