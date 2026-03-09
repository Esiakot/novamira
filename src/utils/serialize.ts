import type { Account, User, AuthUser } from "@/types/auth";

/**
 * Serialize a raw DB user row into the User type.
 */
export function serializeUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    phone_number: (row.phone_number as string | null) ?? null,
    email_verified: row.email_verified as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * Serialize a raw DB account row into the Account type.
 * Supports both flat rows (from JOIN) and direct account rows.
 */
export function serializeAccount(row: Record<string, unknown>): Account {
  return {
    id: (row.account_id ?? row.id) as string,
    user_id: (row.user_id ?? row.id) as string,
    username: row.username as string,
    display_name: row.display_name as string,
    bio: (row.bio as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    banner_url: (row.banner_url as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    date_of_birth: (row.date_of_birth as string | null) ?? null,
    is_private: row.is_private as boolean,
    is_verified: row.is_verified as boolean,
    follower_count: row.follower_count as number,
    following_count: row.following_count as number,
    post_count: row.post_count as number,
    longpost_count: (row.longpost_count as number) ?? 0,
    profile_completed: (row.profile_completed as boolean) ?? false,
    topic_follow_count: (row.topic_follow_count as number) ?? 0,
    created_at: (row.account_created_at ?? row.created_at) as string,
    updated_at: (row.account_updated_at ?? row.updated_at) as string,
  };
}

/**
 * Serialize user + account rows into the AuthUser shape.
 * Works with separate rows (login/register) or a single joined row (session).
 */
export function serializeAuthUser(
  userRow: Record<string, unknown>,
  accountRow?: Record<string, unknown>,
): AuthUser {
  return {
    user: serializeUser(userRow),
    account: serializeAccount(accountRow ?? userRow),
  };
}
