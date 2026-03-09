-- ============================================================
-- NOVAMIRA — Schema PostgreSQL complet
-- Généré le 2026-03-06
-- ============================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- emails case-insensitive

-- ============================================================
-- NETTOYAGE — Suppression des tables existantes (ordre inverse des dépendances)
-- ============================================================

DROP TABLE IF EXISTS push_subscription        CASCADE;
DROP TABLE IF EXISTS trending                 CASCADE;
DROP TABLE IF EXISTS search_history            CASCADE;
DROP TABLE IF EXISTS mention                   CASCADE;
DROP TABLE IF EXISTS moderation_log            CASCADE;
DROP TABLE IF EXISTS report                    CASCADE;
DROP TABLE IF EXISTS notification_setting      CASCADE;
DROP TABLE IF EXISTS notification              CASCADE;
DROP TABLE IF EXISTS payment_history           CASCADE;
DROP TABLE IF EXISTS subscription              CASCADE;
DROP TABLE IF EXISTS message_reaction          CASCADE;
DROP TABLE IF EXISTS message_media             CASCADE;
DROP TABLE IF EXISTS message                   CASCADE;
DROP TABLE IF EXISTS conversation_member       CASCADE;
DROP TABLE IF EXISTS conversation              CASCADE;
DROP TABLE IF EXISTS mute                      CASCADE;
DROP TABLE IF EXISTS block                     CASCADE;
DROP TABLE IF EXISTS following                 CASCADE;
DROP TABLE IF EXISTS poll_vote                 CASCADE;
DROP TABLE IF EXISTS poll_option               CASCADE;
DROP TABLE IF EXISTS poll                      CASCADE;
DROP TABLE IF EXISTS saved_post                CASCADE;
DROP TABLE IF EXISTS saved_collection          CASCADE;
DROP TABLE IF EXISTS post_shared               CASCADE;
DROP TABLE IF EXISTS post_like                 CASCADE;
DROP TABLE IF EXISTS post_hashtag              CASCADE;
DROP TABLE IF EXISTS post_media                CASCADE;
DROP TABLE IF EXISTS longpost                  CASCADE;
DROP TABLE IF EXISTS post                      CASCADE;
DROP TABLE IF EXISTS hashtag                   CASCADE;
DROP TABLE IF EXISTS topic_moderator           CASCADE;
DROP TABLE IF EXISTS topic_follow              CASCADE;
DROP TABLE IF EXISTS topic                     CASCADE;
DROP TABLE IF EXISTS session                   CASCADE;
DROP TABLE IF EXISTS account_role              CASCADE;
DROP TABLE IF EXISTS user_role                 CASCADE;
DROP TABLE IF EXISTS account                   CASCADE;
DROP TABLE IF EXISTS "user"                    CASCADE;

-- Suppression des fonctions trigger
DROP FUNCTION IF EXISTS trigger_set_updated_at()            CASCADE;
DROP FUNCTION IF EXISTS trigger_following_count()            CASCADE;
DROP FUNCTION IF EXISTS trigger_post_count()                 CASCADE;\nDROP FUNCTION IF EXISTS trigger_longpost_count()             CASCADE;
DROP FUNCTION IF EXISTS trigger_like_count()                 CASCADE;
DROP FUNCTION IF EXISTS trigger_reply_count()                CASCADE;
DROP FUNCTION IF EXISTS trigger_repost_count()               CASCADE;
DROP FUNCTION IF EXISTS trigger_topic_post_count()           CASCADE;
DROP FUNCTION IF EXISTS trigger_topic_follower_count()       CASCADE;
DROP FUNCTION IF EXISTS trigger_hashtag_post_count()         CASCADE;
DROP FUNCTION IF EXISTS trigger_poll_vote_count()            CASCADE;
DROP FUNCTION IF EXISTS trigger_conversation_last_message()  CASCADE;

-- ============================================================
-- 1. AUTHENTIFICATION & PROFIL
-- ============================================================

CREATE TABLE "user" (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    email_verified      BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret   VARCHAR(255),
    two_factor_enabled  BOOLEAN NOT NULL DEFAULT false,
    phone_number        VARCHAR(20),
    last_login_at       TIMESTAMPTZ,
    last_login_ip       INET,
    is_banned           BOOLEAN NOT NULL DEFAULT false,
    ban_reason          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE account (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    username            VARCHAR(30) NOT NULL UNIQUE,
    display_name        VARCHAR(50) NOT NULL,
    bio                 VARCHAR(150),
    avatar_url          VARCHAR(500),
    banner_url          VARCHAR(500),
    location            VARCHAR(100),
    website             VARCHAR(255),
    date_of_birth       DATE,
    is_private          BOOLEAN NOT NULL DEFAULT false,
    is_verified         BOOLEAN NOT NULL DEFAULT false,
    follower_count      INTEGER NOT NULL DEFAULT 0,
    following_count     INTEGER NOT NULL DEFAULT 0,
    post_count          INTEGER NOT NULL DEFAULT 0,
    longpost_count      INTEGER NOT NULL DEFAULT 0,
    profile_completed   BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_username ON account (username);

CREATE TABLE user_role (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(50) NOT NULL UNIQUE,
    description         VARCHAR(255),
    permissions         JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE account_role (
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    role_id             INTEGER NOT NULL REFERENCES user_role(id) ON DELETE CASCADE,
    granted_by          UUID REFERENCES account(id) ON DELETE SET NULL,
    granted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, role_id)
);

CREATE TABLE session (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash          VARCHAR(255) NOT NULL UNIQUE,
    device_info         VARCHAR(255),
    ip_address          INET,
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_user_id ON session (user_id);
CREATE INDEX idx_session_expires_at ON session (expires_at);

-- ============================================================
-- 2. TOPICS & HASHTAGS
-- ============================================================

CREATE TABLE topic (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(50) NOT NULL UNIQUE,
    slug                VARCHAR(50) NOT NULL UNIQUE,
    description         VARCHAR(255),
    icon_url            VARCHAR(500),
    post_count          INTEGER NOT NULL DEFAULT 0,
    follower_count      INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_by          UUID REFERENCES account(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE topic_follow (
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    topic_id            INTEGER NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, topic_id)
);

CREATE TABLE topic_moderator (
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    topic_id            INTEGER NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    granted_by          UUID REFERENCES account(id) ON DELETE SET NULL,
    granted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, topic_id)
);

CREATE TABLE hashtag (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL UNIQUE,
    post_count          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. POSTS
-- ============================================================

CREATE TABLE post (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id           UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    content             VARCHAR(500),
    parent_id           UUID REFERENCES post(id) ON DELETE SET NULL,
    root_id             UUID REFERENCES post(id) ON DELETE SET NULL,
    is_reply            BOOLEAN NOT NULL DEFAULT false,
    topic_id            INTEGER REFERENCES topic(id) ON DELETE SET NULL,
    like_count          INTEGER NOT NULL DEFAULT 0,
    reply_count         INTEGER NOT NULL DEFAULT 0,
    repost_count        INTEGER NOT NULL DEFAULT 0,
    share_count         INTEGER NOT NULL DEFAULT 0,
    view_count          INTEGER NOT NULL DEFAULT 0,
    is_pinned           BOOLEAN NOT NULL DEFAULT false,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    visibility          VARCHAR(20) NOT NULL DEFAULT 'public'
                        CHECK (visibility IN ('public', 'followers', 'mentioned', 'private')),
    language            VARCHAR(10),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_author_created ON post (author_id, created_at DESC);
CREATE INDEX idx_post_parent_id ON post (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_post_root_id ON post (root_id) WHERE root_id IS NOT NULL;
CREATE INDEX idx_post_topic_created ON post (topic_id, created_at DESC) WHERE topic_id IS NOT NULL;
CREATE INDEX idx_post_created_at ON post (created_at DESC) WHERE is_deleted = false;

CREATE TABLE longpost (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL UNIQUE REFERENCES post(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    body                TEXT NOT NULL,
    cover_image_url     VARCHAR(500),
    reading_time_min    SMALLINT,
    is_published        BOOLEAN NOT NULL DEFAULT false,
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE post_media (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    media_url           VARCHAR(500) NOT NULL,
    media_type          VARCHAR(20) NOT NULL
                        CHECK (media_type IN ('image', 'video', 'gif', 'audio')),
    thumbnail_url       VARCHAR(500),
    alt_text            VARCHAR(300),
    width               INTEGER,
    height              INTEGER,
    duration_sec        SMALLINT,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_media_post_id ON post_media (post_id);

CREATE TABLE post_hashtag (
    post_id             UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    hashtag_id          INTEGER NOT NULL REFERENCES hashtag(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

CREATE TABLE post_like (
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    post_id             UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, post_id)
);

CREATE INDEX idx_post_like_post_id ON post_like (post_id);

CREATE TABLE post_dislike (
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    post_id             UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, post_id)
);

CREATE INDEX idx_post_dislike_post_id ON post_dislike (post_id);

CREATE TABLE post_shared (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    post_id             UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    quote_content       VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (account_id, post_id)
);

CREATE INDEX idx_post_shared_post_id ON post_shared (post_id);

-- ============================================================
-- 4. SAUVEGARDES / BOOKMARKS
-- ============================================================

CREATE TABLE saved_collection (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    is_private          BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_collection_account ON saved_collection (account_id);

CREATE TABLE saved_post (
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    post_id             UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    collection_id       UUID REFERENCES saved_collection(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, post_id)
);

-- ============================================================
-- 5. SONDAGES
-- ============================================================

CREATE TABLE poll (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL UNIQUE REFERENCES post(id) ON DELETE CASCADE,
    expires_at          TIMESTAMPTZ NOT NULL,
    total_votes         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE poll_option (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id             UUID NOT NULL REFERENCES poll(id) ON DELETE CASCADE,
    label               VARCHAR(100) NOT NULL,
    vote_count          INTEGER NOT NULL DEFAULT 0,
    sort_order          SMALLINT NOT NULL
);

CREATE INDEX idx_poll_option_poll_id ON poll_option (poll_id);

CREATE TABLE poll_vote (
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    poll_id             UUID NOT NULL REFERENCES poll(id) ON DELETE CASCADE,
    option_id           UUID NOT NULL REFERENCES poll_option(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, poll_id)
);

-- ============================================================
-- 6. RELATIONS SOCIALES
-- ============================================================

CREATE TABLE following (
    follower_id         UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    following_id        UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'pending')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_following_following_id ON following (following_id);

CREATE TABLE block (
    blocker_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    blocked_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

CREATE TABLE mute (
    muter_id            UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    muted_id            UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    mute_posts          BOOLEAN NOT NULL DEFAULT true,
    mute_notifications  BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (muter_id, muted_id),
    CHECK (muter_id != muted_id)
);

-- ============================================================
-- 7. MESSAGERIE
-- ============================================================

CREATE TABLE conversation (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                VARCHAR(10) NOT NULL CHECK (type IN ('direct', 'group')),
    name                VARCHAR(100),
    avatar_url          VARCHAR(500),
    created_by          UUID REFERENCES account(id) ON DELETE SET NULL,
    last_message_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_member (
    conversation_id     UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    role                VARCHAR(20) NOT NULL DEFAULT 'member'
                        CHECK (role IN ('owner', 'admin', 'member')),
    last_read_at        TIMESTAMPTZ,
    is_muted            BOOLEAN NOT NULL DEFAULT false,
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (conversation_id, account_id)
);

CREATE INDEX idx_conversation_member_account ON conversation_member (account_id);

CREATE TABLE message (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_id           UUID REFERENCES account(id) ON DELETE SET NULL,
    content             TEXT,
    reply_to_id         UUID REFERENCES message(id) ON DELETE SET NULL,
    is_edited           BOOLEAN NOT NULL DEFAULT false,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_conversation_created ON message (conversation_id, created_at DESC);

CREATE TABLE message_media (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id          UUID NOT NULL REFERENCES message(id) ON DELETE CASCADE,
    media_url           VARCHAR(500) NOT NULL,
    media_type          VARCHAR(20) NOT NULL,
    file_name           VARCHAR(255),
    file_size_bytes     INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_media_message_id ON message_media (message_id);

CREATE TABLE message_reaction (
    message_id          UUID NOT NULL REFERENCES message(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    emoji               VARCHAR(20) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, account_id, emoji)
);

-- ============================================================
-- 8. ABONNEMENTS & MONÉTISATION
-- ============================================================

CREATE TABLE subscription (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id           UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    target_id               UUID REFERENCES account(id) ON DELETE SET NULL,
    plan                    VARCHAR(50) NOT NULL,
    price_cents             INTEGER NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status                  VARCHAR(20) NOT NULL
                            CHECK (status IN ('active', 'cancelled', 'past_due', 'expired')),
    payment_provider        VARCHAR(20),
    provider_subscription_id VARCHAR(255),
    starts_at               TIMESTAMPTZ NOT NULL,
    ends_at                 TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_subscriber ON subscription (subscriber_id);
CREATE INDEX idx_subscription_target ON subscription (target_id) WHERE target_id IS NOT NULL;

CREATE TABLE payment_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id         UUID NOT NULL REFERENCES subscription(id) ON DELETE CASCADE,
    amount_cents            INTEGER NOT NULL,
    currency                VARCHAR(3) NOT NULL,
    status                  VARCHAR(20) NOT NULL
                            CHECK (status IN ('succeeded', 'failed', 'refunded')),
    provider_payment_id     VARCHAR(255),
    paid_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_history_subscription ON payment_history (subscription_id);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================

CREATE TABLE notification (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id        UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    sender_id           UUID REFERENCES account(id) ON DELETE SET NULL,
    type                VARCHAR(30) NOT NULL
                        CHECK (type IN ('like', 'dislike', 'follow', 'reply', 'mention', 'repost', 'message', 'system', 'poll_ended')),
    post_id             UUID REFERENCES post(id) ON DELETE CASCADE,
    message_id          UUID REFERENCES message(id) ON DELETE CASCADE,
    content             VARCHAR(255),
    is_read             BOOLEAN NOT NULL DEFAULT false,
    read_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_recipient ON notification (recipient_id, is_read, created_at DESC);

CREATE TABLE notification_setting (
    account_id          UUID PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE,
    likes_enabled       BOOLEAN NOT NULL DEFAULT true,
    replies_enabled     BOOLEAN NOT NULL DEFAULT true,
    follows_enabled     BOOLEAN NOT NULL DEFAULT true,
    mentions_enabled    BOOLEAN NOT NULL DEFAULT true,
    reposts_enabled     BOOLEAN NOT NULL DEFAULT true,
    messages_enabled    BOOLEAN NOT NULL DEFAULT true,
    email_digest        VARCHAR(20) NOT NULL DEFAULT 'daily'
                        CHECK (email_digest IN ('none', 'instant', 'daily', 'weekly')),
    push_enabled        BOOLEAN NOT NULL DEFAULT true,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. MODÉRATION & SIGNALEMENTS
-- ============================================================

CREATE TABLE report (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id             UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    reported_account_id     UUID REFERENCES account(id) ON DELETE SET NULL,
    reported_post_id        UUID REFERENCES post(id) ON DELETE SET NULL,
    reported_message_id     UUID REFERENCES message(id) ON DELETE SET NULL,
    reason                  VARCHAR(50) NOT NULL
                            CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'nudity', 'misinformation', 'violence', 'impersonation', 'other')),
    description             TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by             UUID REFERENCES account(id) ON DELETE SET NULL,
    resolution_note         TEXT,
    resolved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_status ON report (status, created_at DESC);

CREATE TABLE moderation_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id            UUID REFERENCES account(id) ON DELETE SET NULL,
    action                  VARCHAR(50) NOT NULL,
    target_account_id       UUID REFERENCES account(id) ON DELETE SET NULL,
    target_post_id          UUID REFERENCES post(id) ON DELETE SET NULL,
    reason                  TEXT,
    metadata                JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_log_moderator ON moderation_log (moderator_id, created_at DESC);

-- ============================================================
-- 11. MENTIONS & RECHERCHE
-- ============================================================

CREATE TABLE mention (
    post_id                 UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    mentioned_account_id    UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, mentioned_account_id)
);

CREATE INDEX idx_mention_account ON mention (mentioned_account_id);

CREATE TABLE search_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    query               VARCHAR(255) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_history_account ON search_history (account_id, created_at DESC);

-- ============================================================
-- 12. TENDANCES
-- ============================================================

CREATE TABLE trending (
    id                  SERIAL PRIMARY KEY,
    hashtag_id          INTEGER REFERENCES hashtag(id) ON DELETE CASCADE,
    topic_id            INTEGER REFERENCES topic(id) ON DELETE CASCADE,
    score               DOUBLE PRECISION NOT NULL,
    post_count_1h       INTEGER NOT NULL DEFAULT 0,
    post_count_24h      INTEGER NOT NULL DEFAULT 0,
    region              VARCHAR(10) NOT NULL DEFAULT 'global',
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trending_score ON trending (region, score DESC);

-- ============================================================
-- 13. PUSH & DEVICES
-- ============================================================

CREATE TABLE push_subscription (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    endpoint            TEXT NOT NULL,
    p256dh_key          VARCHAR(255) NOT NULL,
    auth_key            VARCHAR(255) NOT NULL,
    device_type         VARCHAR(20),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscription_account ON push_subscription (account_id);

-- ============================================================
-- 14. TRIGGERS — updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
            tbl
        );
    END LOOP;
END;
$$;

-- ============================================================
-- 15. TRIGGERS — Compteurs dénormalisés
-- ============================================================

-- follower_count / following_count
CREATE OR REPLACE FUNCTION trigger_following_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE account SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE account SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE account SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        UPDATE account SET follower_count  = GREATEST(follower_count  - 1, 0) WHERE id = OLD.following_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE account SET following_count = following_count + 1 WHERE id = NEW.follower_id;
            UPDATE account SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE account SET following_count = GREATEST(following_count - 1, 0) WHERE id = NEW.follower_id;
            UPDATE account SET follower_count  = GREATEST(follower_count  - 1, 0) WHERE id = NEW.following_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_following_count
AFTER INSERT OR UPDATE OR DELETE ON following
FOR EACH ROW EXECUTE FUNCTION trigger_following_count();

-- post_count (short posts only — longpost trigger corrects the count)
CREATE OR REPLACE FUNCTION trigger_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE account SET post_count = post_count + 1 WHERE id = NEW.author_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            -- Check if this post has a longpost attached
            IF EXISTS (SELECT 1 FROM longpost WHERE post_id = NEW.id) THEN
                UPDATE account SET longpost_count = GREATEST(longpost_count - 1, 0) WHERE id = NEW.author_id;
            ELSE
                UPDATE account SET post_count = GREATEST(post_count - 1, 0) WHERE id = NEW.author_id;
            END IF;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_count
AFTER INSERT OR UPDATE ON post
FOR EACH ROW EXECUTE FUNCTION trigger_post_count();

-- longpost_count (transfers count from post_count to longpost_count)
CREATE OR REPLACE FUNCTION trigger_longpost_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE account SET
            longpost_count = longpost_count + 1,
            post_count = GREATEST(post_count - 1, 0)
        WHERE id = (SELECT author_id FROM post WHERE id = NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_longpost_count
AFTER INSERT ON longpost
FOR EACH ROW EXECUTE FUNCTION trigger_longpost_count();

-- like_count
CREATE OR REPLACE FUNCTION trigger_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_like_count
AFTER INSERT OR DELETE ON post_like
FOR EACH ROW EXECUTE FUNCTION trigger_like_count();

-- reply_count
CREATE OR REPLACE FUNCTION trigger_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE post SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_deleted = true AND OLD.is_deleted = false AND NEW.parent_id IS NOT NULL THEN
            UPDATE post SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = NEW.parent_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reply_count
AFTER INSERT OR UPDATE ON post
FOR EACH ROW EXECUTE FUNCTION trigger_reply_count();

-- repost_count
CREATE OR REPLACE FUNCTION trigger_repost_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post SET repost_count = repost_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post SET repost_count = GREATEST(repost_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_repost_count
AFTER INSERT OR DELETE ON post_shared
FOR EACH ROW EXECUTE FUNCTION trigger_repost_count();

-- topic post_count
CREATE OR REPLACE FUNCTION trigger_topic_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.topic_id IS NOT NULL THEN
        UPDATE topic SET post_count = post_count + 1 WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' AND OLD.topic_id IS NOT NULL THEN
        UPDATE topic SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.topic_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
            IF OLD.topic_id IS NOT NULL THEN
                UPDATE topic SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.topic_id;
            END IF;
            IF NEW.topic_id IS NOT NULL THEN
                UPDATE topic SET post_count = post_count + 1 WHERE id = NEW.topic_id;
            END IF;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_topic_post_count
AFTER INSERT OR UPDATE OR DELETE ON post
FOR EACH ROW EXECUTE FUNCTION trigger_topic_post_count();

-- topic follower_count
CREATE OR REPLACE FUNCTION trigger_topic_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE topic SET follower_count = follower_count + 1 WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE topic SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.topic_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_topic_follower_count
AFTER INSERT OR DELETE ON topic_follow
FOR EACH ROW EXECUTE FUNCTION trigger_topic_follower_count();

-- hashtag post_count
CREATE OR REPLACE FUNCTION trigger_hashtag_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE hashtag SET post_count = post_count + 1 WHERE id = NEW.hashtag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE hashtag SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.hashtag_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hashtag_post_count
AFTER INSERT OR DELETE ON post_hashtag
FOR EACH ROW EXECUTE FUNCTION trigger_hashtag_post_count();

-- poll total_votes
CREATE OR REPLACE FUNCTION trigger_poll_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE poll SET total_votes = total_votes + 1 WHERE id = NEW.poll_id;
        UPDATE poll_option SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE poll SET total_votes = GREATEST(total_votes - 1, 0) WHERE id = OLD.poll_id;
        UPDATE poll_option SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.option_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_poll_vote_count
AFTER INSERT OR DELETE ON poll_vote
FOR EACH ROW EXECUTE FUNCTION trigger_poll_vote_count();

-- conversation last_message_at
CREATE OR REPLACE FUNCTION trigger_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversation SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conversation_last_message
AFTER INSERT ON message
FOR EACH ROW EXECUTE FUNCTION trigger_conversation_last_message();

-- ============================================================
-- 16. SEED — Rôles par défaut
-- ============================================================

INSERT INTO user_role (name, description, permissions) VALUES
    ('admin',     'Administrateur global',      '{"all": true}'),
    ('moderator', 'Modérateur global',           '{"can_ban": true, "can_delete_post": true, "can_review_reports": true}'),
    ('premium',   'Utilisateur premium',         '{"can_longpost": true, "can_upload_hd": true, "extended_char_limit": true}'),
    ('user',      'Utilisateur standard',        '{}')
ON CONFLICT (name) DO NOTHING;
