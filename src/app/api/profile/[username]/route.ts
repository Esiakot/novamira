import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";
import { getSessionUser } from "@/libs/session";
import type { PostMedia } from "@/types/auth";

// ── GET: Fetch a user's public profile + their posts ──

export const GET = apiHandler(
  async (request: NextRequest) => {
    const currentUser = await getSessionUser();
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const username = segments[segments.length - 1];

    if (!username) {
      return NextResponse.json({ error: "Username requis" }, { status: 400 });
    }

    // Fetch profile
    const profileResult = await pool.query(
      `SELECT a.id, a.username, a.display_name, a.bio, a.avatar_url, a.banner_url,
              a.location, a.website, a.is_private, a.is_verified,
              a.follower_count, a.following_count, a.post_count, a.longpost_count,
              a.created_at
       FROM account a
       WHERE a.username = $1`,
      [username],
    );

    if (profileResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const profile = profileResult.rows[0];

    // Check if current user follows this profile
    let is_following = false;
    if (currentUser && currentUser.account.id !== profile.id) {
      const followCheck = await pool.query(
        `SELECT 1 FROM following WHERE follower_id = $1 AND following_id = $2 AND status = 'active'`,
        [currentUser.account.id, profile.id],
      );
      is_following = followCheck.rows.length > 0;
    }

    // Fetch their posts
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const postsResult = await pool.query(
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
       LEFT JOIN post_like pl ON pl.post_id = p.id AND pl.account_id = $4
       LEFT JOIN post_dislike pd ON pd.post_id = p.id AND pd.account_id = $4
       WHERE p.author_id = $1
         AND p.is_deleted = false
         AND p.visibility = 'public'
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [profile.id, limit, offset, currentUser?.account.id ?? null],
    );

    // Fetch media
    const postIds = postsResult.rows.map((r) => r.id);
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

    const posts = postsResult.rows.map((row) => {
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

      return {
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
        media: mediaMap[row.id] || [],
        longpost,
        user_liked: row.user_liked ?? false,
        user_disliked: row.user_disliked ?? false,
      };
    });

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        banner_url: profile.banner_url,
        location: profile.location,
        website: profile.website,
        is_private: profile.is_private,
        is_verified: profile.is_verified,
        follower_count: profile.follower_count,
        following_count: profile.following_count,
        post_count: profile.post_count,
        longpost_count: profile.longpost_count,
        created_at: profile.created_at,
        is_following,
        is_own: currentUser ? currentUser.account.id === profile.id : false,
      },
      posts,
    });
  },
  { auth: false },
);
