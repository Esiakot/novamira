import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── POST: Toggle like on a post ──

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  // URL: /api/posts/[id]/like → id is at segments.length - 2
  const postId = segments[segments.length - 2];

  if (!postId) {
    return NextResponse.json({ error: "Post ID requis" }, { status: 400 });
  }

  // Verify post exists
  const postCheck = await pool.query(
    `SELECT id FROM post WHERE id = $1 AND is_deleted = false`,
    [postId],
  );
  if (postCheck.rows.length === 0) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  // Check if already liked
  const existing = await pool.query(
    `SELECT 1 FROM post_like WHERE account_id = $1 AND post_id = $2`,
    [user.account.id, postId],
  );

  if (existing.rows.length > 0) {
    // Unlike
    await pool.query(
      `DELETE FROM post_like WHERE account_id = $1 AND post_id = $2`,
      [user.account.id, postId],
    );

    const counts = await pool.query(
      `SELECT like_count, dislike_count FROM post WHERE id = $1`,
      [postId],
    );

    return NextResponse.json({
      liked: false,
      disliked: false,
      like_count: counts.rows[0].like_count,
      dislike_count: counts.rows[0].dislike_count,
    });
  } else {
    // Like (trigger will auto-remove dislike via mutual exclusion)
    await pool.query(
      `INSERT INTO post_like (account_id, post_id) VALUES ($1, $2)`,
      [user.account.id, postId],
    );

    const counts = await pool.query(
      `SELECT like_count, dislike_count FROM post WHERE id = $1`,
      [postId],
    );

    // Create notification for post author (if not self)
    const postAuthor = await pool.query(
      `SELECT author_id FROM post WHERE id = $1`,
      [postId],
    );
    if (postAuthor.rows[0].author_id !== user.account.id) {
      await pool.query(
        `INSERT INTO notification (recipient_id, sender_id, type, post_id)
         VALUES ($1, $2, 'like', $3)
         ON CONFLICT DO NOTHING`,
        [postAuthor.rows[0].author_id, user.account.id, postId],
      );
    }

    return NextResponse.json({
      liked: true,
      disliked: false,
      like_count: counts.rows[0].like_count,
      dislike_count: counts.rows[0].dislike_count,
    });
  }
});
