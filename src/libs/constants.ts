// ── Application Constants ──

export const APP_NAME = "novamira";

// ── Validation ──
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 50;

export const PASSWORD_MIN_LENGTH = 6;
export const BIO_MAX_LENGTH = 150;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Session ──
export const SESSION_COOKIE = "novamira_session";
export const SESSION_DURATION_DAYS = 30;

// ── Upload ──
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

// ── Posts ──
export const POST_MAX_LENGTH = 501;
export const POST_CHAR_WARNING = 430;
export const POST_CHAR_DANGER = 495;
export const LONGPOST_MAX_LENGTH = 50000;
export const LONGPOST_PREVIEW_LENGTH = 280;
export const POST_MAX_IMAGES = 4;

// ── Crypto ──
export const BCRYPT_SALT_ROUNDS = 10;

// ── Upload ──
export const ALLOWED_UPLOAD_TYPES_SET = new Set(ALLOWED_UPLOAD_TYPES);
export const ALLOWED_UPLOAD_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
export const VALID_UPLOAD_TYPE = new Set(["avatar", "banner", "post"]);
