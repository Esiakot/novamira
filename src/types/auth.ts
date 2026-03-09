export interface User {
  id: string;
  email: string;
  phone_number: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  location: string | null;
  website: string | null;
  date_of_birth: string | null;
  is_private: boolean;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  longpost_count: number;
  profile_completed: boolean;
  topic_follow_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  user: User;
  account: Account;
}

export interface SessionInfo {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

// ── Posts ──

export interface PostMedia {
  id: string;
  media_url: string;
  media_type: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Post {
  id: string;
  author_id: string;
  content: string | null;
  parent_id: string | null;
  is_reply: boolean;
  topic_id: number | null;
  topic_name: string | null;
  topic_slug: string | null;
  like_count: number;
  dislike_count: number;
  reply_count: number;
  repost_count: number;
  share_count: number;
  view_count: number;
  visibility: string;
  created_at: string;
  updated_at: string;
  // Joined author info
  author_username: string;
  author_display_name: string;
  author_avatar_url: string | null;
  // Media attachments
  media: PostMedia[];
  // Long post (if any)
  longpost: LongPost | null;
  // Parent post info (for replies)
  parent_author_username: string | null;
  parent_author_display_name: string | null;
  // User interaction state
  user_liked: boolean;
  user_disliked: boolean;
}

export interface LongPost {
  id: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  reading_time_min: number | null;
  created_at: string;
}


