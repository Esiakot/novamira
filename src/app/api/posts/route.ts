import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { z } from "zod";
import {
  POST_MAX_LENGTH,
  LONGPOST_MAX_LENGTH,
  LONGPOST_PREVIEW_LENGTH,
  POST_MAX_IMAGES,
} from "@/libs/constants";
import { getSessionUser } from "@/libs/session";
import type { Post, LongPost, PostMedia } from "@/types/auth";

// ── Validation schemas ──

const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu est requis")
    .max(POST_MAX_LENGTH, `Le contenu ne peut pas dépasser ${POST_MAX_LENGTH} caractères`),
  visibility: z
    .enum(["public", "followers", "mentioned", "private"])
    .optional()
    .default("public"),
  topic_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .default(null),
  media_urls: z
    .array(z.string().url())
    .max(POST_MAX_IMAGES, `Maximum ${POST_MAX_IMAGES} images par post`)
    .optional()
    .default([]),
});

const createLongPostSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  body: z
    .string()
    .min(1, "Le contenu est requis")
    .max(LONGPOST_MAX_LENGTH, `Le contenu ne peut pas dépasser ${LONGPOST_MAX_LENGTH} caractères`),
  visibility: z
    .enum(["public", "followers", "mentioned", "private"])
    .optional()
    .default("public"),
});

// ── Serializers ──

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

// ── GET: Fetch feed posts ──

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const topicSlug = searchParams.get("topic");

  // Get current user for like/dislike state
  const currentUser = await getSessionUser();
  const accountId = currentUser?.account.id ?? null;

  let topicFilter = "";
  const params: (string | number | null)[] = [accountId, accountId, limit, offset];

  if (topicSlug) {
    topicFilter = `AND t.slug = $5`;
    params.push(topicSlug);
  }

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
            (pd.account_id IS NOT NULL) AS user_disliked
     FROM post p
     JOIN account a ON p.author_id = a.id
     LEFT JOIN topic t ON p.topic_id = t.id
     LEFT JOIN longpost lp ON lp.post_id = p.id AND lp.is_published = true
     LEFT JOIN post_like pl ON pl.post_id = p.id AND pl.account_id = $1
     LEFT JOIN post_dislike pd ON pd.post_id = p.id AND pd.account_id = $2
     WHERE p.is_deleted = false
       AND p.is_reply = false
       AND p.visibility = 'public'
       ${topicFilter}
     ORDER BY p.created_at DESC
     LIMIT $3 OFFSET $4`,
    params,
  );

  // Fetch media for all posts in one query
  const postIds = result.rows.map((r) => r.id);
  let mediaMap: Record<string, PostMedia[]> = {};

  if (postIds.length > 0) {
    const mediaResult = await pool.query(
      `SELECT id, post_id, media_url, media_type, alt_text, sort_order
       FROM post_media
       WHERE post_id = ANY($1)
       ORDER BY sort_order ASC`,
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

  const posts: Post[] = result.rows.map((row) =>
    serializePost(row, mediaMap[row.id] || []),
  );

  return NextResponse.json({ posts });
}, { auth: false });

// ── POST: Create a new post (normal or long) ──

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const isLongPost = body.is_longpost === true;

  if (isLongPost) {
    // ── Long post ──
    const parsed = createLongPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { title, body: longBody, visibility } = parsed.data;

    // Preview = first N characters of the body (strip markdown-like images)
    const plainText = longBody.replace(/!\[.*?\]\(.*?\)/g, "").trim();
    const preview =
      plainText.length > LONGPOST_PREVIEW_LENGTH
        ? plainText.slice(0, LONGPOST_PREVIEW_LENGTH) + "…"
        : plainText;

    // Estimate reading time (~200 words per minute)
    const wordCount = longBody.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const postResult = await client.query(
        `INSERT INTO post (author_id, content, visibility)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user.account.id, preview, visibility],
      );
      const post = postResult.rows[0];

      const longpostResult = await client.query(
        `INSERT INTO longpost (post_id, title, body, reading_time_min, is_published, published_at)
         VALUES ($1, $2, $3, $4, true, NOW())
         RETURNING *`,
        [post.id, title, longBody, readingTime],
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          post: serializePost(
            {
              ...post,
              author_username: user.account.username,
              author_display_name: user.account.display_name,
              author_avatar_url: user.account.avatar_url,
              topic_name: null,
              topic_slug: null,
              longpost_id: longpostResult.rows[0].id,
              longpost_title: title,
              longpost_body: longBody,
              longpost_cover: null,
              longpost_reading_time: readingTime,
              longpost_created_at: longpostResult.rows[0].created_at,
              user_liked: false,
              user_disliked: false,
            },
            [],
          ),
        },
        { status: 201 },
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } else {
    // ── Normal post ──
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { content, visibility, topic_id, media_urls } = parsed.data;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const postResult = await client.query(
        `INSERT INTO post (author_id, content, visibility, topic_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user.account.id, content, visibility, topic_id],
      );
      const post = postResult.rows[0];

      // Insert media
      const media: PostMedia[] = [];
      for (let i = 0; i < media_urls.length; i++) {
        const mediaResult = await client.query(
          `INSERT INTO post_media (post_id, media_url, media_type, sort_order)
           VALUES ($1, $2, 'image', $3)
           RETURNING *`,
          [post.id, media_urls[i], i],
        );
        const m = mediaResult.rows[0];
        media.push({
          id: m.id,
          media_url: m.media_url,
          media_type: m.media_type,
          alt_text: m.alt_text,
          sort_order: m.sort_order,
        });
      }

      await client.query("COMMIT");

      return NextResponse.json(
        {
          post: serializePost(
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
            media,
          ),
        },
        { status: 201 },
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
});
