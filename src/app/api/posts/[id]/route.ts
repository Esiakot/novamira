import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { getSessionUser } from "@/libs/session";
import type { PostMedia } from "@/types/auth";

// ── GET: Fetch a single post by ID ──

export const GET = apiHandler(
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const postId = segments[segments.length - 1];

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
              lp.id AS longpost_id,
              lp.title AS longpost_title,
              lp.body AS longpost_body,
              lp.cover_image_url AS longpost_cover,
              lp.reading_time_min AS longpost_reading_time,
              lp.created_at AS longpost_created_at,
              (pl.account_id IS NOT NULL) AS user_liked,
              (pd.account_id IS NOT NULL) AS user_disliked,
              pa.username AS parent_author_username,
              pa.display_name AS parent_author_display_name
       FROM post p
       JOIN account a ON p.author_id = a.id
       LEFT JOIN post pp ON pp.id = p.parent_id
       LEFT JOIN account pa ON pa.id = pp.author_id
       LEFT JOIN topic t ON p.topic_id = t.id
       LEFT JOIN longpost lp ON lp.post_id = p.id AND lp.is_published = true
       LEFT JOIN post_like pl ON pl.post_id = p.id AND pl.account_id = $2
       LEFT JOIN post_dislike pd ON pd.post_id = p.id AND pd.account_id = $2
       WHERE p.id = $1 AND p.is_deleted = false`,
      [postId, accountId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }

    const row = result.rows[0];

    // Fetch media
    const mediaResult = await pool.query(
      `SELECT id, post_id, media_url, media_type, alt_text, sort_order
       FROM post_media WHERE post_id = $1 ORDER BY sort_order ASC`,
      [postId],
    );

    const media: PostMedia[] = mediaResult.rows.map((m) => ({
      id: m.id,
      media_url: m.media_url,
      media_type: m.media_type,
      alt_text: m.alt_text,
      sort_order: m.sort_order,
    }));

    const longpost = row.longpost_id
      ? {
          id: row.longpost_id,
          title: row.longpost_title,
          body: row.longpost_body,
          cover_image_url: row.longpost_cover ?? null,
          reading_time_min: row.longpost_reading_time ?? null,
          created_at: row.longpost_created_at,
        }
      : null;

    const post = {
      id: row.id,
      author_id: row.author_id,
      content: row.content ?? null,
      parent_id: row.parent_id ?? null,
      is_reply: row.is_reply,
      topic_id: row.topic_id ?? null,
      topic_name: row.topic_name ?? null,
      topic_slug: row.topic_slug ?? null,
      like_count: row.like_count,
      dislike_count: row.dislike_count ?? 0,
      reply_count: row.reply_count,
      repost_count: row.repost_count,
      share_count: row.share_count,
      view_count: row.view_count,
      visibility: row.visibility,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author_username: row.author_username,
      author_display_name: row.author_display_name,
      author_avatar_url: row.author_avatar_url ?? null,
      parent_author_username: row.parent_author_username ?? null,
      parent_author_display_name: row.parent_author_display_name ?? null,
      media,
      longpost,
      user_liked: row.user_liked ?? false,
      user_disliked: row.user_disliked ?? false,
    };

    return NextResponse.json({ post });
  },
  { auth: false },
);
