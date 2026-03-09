-- ============================================================
-- MIGRATION: post_dislike + dislike notifications
-- ============================================================

-- 1. Add dislike_count column to post (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post' AND column_name = 'dislike_count'
  ) THEN
    ALTER TABLE post ADD COLUMN dislike_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Create post_dislike table
CREATE TABLE IF NOT EXISTS post_dislike (
    account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    post_id    UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_dislike_post_id ON post_dislike (post_id);

-- 3. Trigger: dislike_count
CREATE OR REPLACE FUNCTION trigger_dislike_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post SET dislike_count = dislike_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dislike_count ON post_dislike;
CREATE TRIGGER trg_dislike_count
AFTER INSERT OR DELETE ON post_dislike
FOR EACH ROW EXECUTE FUNCTION trigger_dislike_count();

-- 4. Mutual exclusion triggers (like removes dislike, dislike removes like)
CREATE OR REPLACE FUNCTION trigger_like_removes_dislike()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM post_dislike WHERE account_id = NEW.account_id AND post_id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_like_removes_dislike ON post_like;
CREATE TRIGGER trg_like_removes_dislike
BEFORE INSERT ON post_like
FOR EACH ROW EXECUTE FUNCTION trigger_like_removes_dislike();

CREATE OR REPLACE FUNCTION trigger_dislike_removes_like()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM post_like WHERE account_id = NEW.account_id AND post_id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dislike_removes_like ON post_dislike;
CREATE TRIGGER trg_dislike_removes_like
BEFORE INSERT ON post_dislike
FOR EACH ROW EXECUTE FUNCTION trigger_dislike_removes_like();

-- 5. Update notification type constraint to include 'dislike'
ALTER TABLE notification DROP CONSTRAINT IF EXISTS notification_type_check;
ALTER TABLE notification ADD CONSTRAINT notification_type_check
    CHECK (type IN ('like', 'dislike', 'follow', 'reply', 'mention', 'repost', 'message', 'system', 'poll_ended'));
