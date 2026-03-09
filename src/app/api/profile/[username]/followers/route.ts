import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/db";
import { apiHandler } from "@/libs/apiHandler";

// ── GET: List followers of a user ──

export const GET = apiHandler(
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    // /api/profile/[username]/followers → username at segments.length - 2
    const username = decodeURIComponent(segments[segments.length - 2]);

    if (!username) {
      return NextResponse.json({ error: "Username requis" }, { status: 400 });
    }

    // Find target account
    const accountResult = await pool.query(
      `SELECT id FROM account WHERE username = $1`,
      [username],
    );

    if (accountResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const accountId = accountResult.rows[0].id;

    const result = await pool.query(
      `SELECT a.username, a.display_name, a.avatar_url, a.bio
       FROM following f
       JOIN account a ON f.follower_id = a.id
       WHERE f.following_id = $1 AND f.status = 'active'
       ORDER BY f.created_at DESC
       LIMIT 100`,
      [accountId],
    );

    return NextResponse.json({ users: result.rows });
  },
  { auth: false },
);
