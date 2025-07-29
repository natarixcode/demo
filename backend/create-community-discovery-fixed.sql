-- Community Discovery Migration - Fixed Version
-- Add columns for discovery features
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();

-- Update member_count on join/leave using community_memberships table
CREATE OR REPLACE FUNCTION update_community_member_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET member_count = (
    SELECT COUNT(*) FROM community_memberships WHERE community_id = NEW.community_id AND status = 'active'
  )
  WHERE id = NEW.community_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_member_count ON community_memberships;
CREATE TRIGGER trg_update_member_count
AFTER INSERT OR DELETE ON community_memberships
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Update post_count and last_active on post create/delete
CREATE OR REPLACE FUNCTION update_community_post_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET post_count = (
    SELECT COUNT(*) FROM posts WHERE community_id = NEW.community_id
  ),
  last_active = NOW()
  WHERE id = NEW.community_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_post_count ON posts;
CREATE TRIGGER trg_update_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION update_community_post_count();

-- Update last_active on comment
CREATE OR REPLACE FUNCTION update_community_last_active_on_comment() RETURNS TRIGGER AS $$
DECLARE
  comm_id INT;
BEGIN
  SELECT community_id INTO comm_id FROM posts WHERE id = NEW.post_id;
  IF comm_id IS NOT NULL THEN
    UPDATE communities SET last_active = NOW() WHERE id = comm_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_last_active_comment ON comments;
CREATE TRIGGER trg_update_last_active_comment
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION update_community_last_active_on_comment();

-- Create compatibility view for memberships
DROP VIEW IF EXISTS memberships CASCADE;
CREATE VIEW memberships AS
SELECT 
  id,
  user_id,
  community_id,
  role,
  status,
  joined_at,
  updated_at
FROM community_memberships
WHERE community_id IS NOT NULL; 