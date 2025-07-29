-- Privacy Settings & Join Requests System
-- Add privacy features to communities and create join requests table

-- 1. Add visibility column to communities table
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) DEFAULT 'public';

-- Add constraint to ensure only valid visibility values
ALTER TABLE communities 
ADD CONSTRAINT communities_visibility_check 
CHECK (visibility IN ('public', 'private'));

-- 2. Create join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure only valid status values
  CONSTRAINT join_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Prevent duplicate requests from same user to same community
  UNIQUE(user_id, community_id)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_join_requests_community_id ON join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);
CREATE INDEX IF NOT EXISTS idx_communities_visibility ON communities(visibility);

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create trigger for join_requests updated_at
DROP TRIGGER IF EXISTS update_join_requests_updated_at ON join_requests;
CREATE TRIGGER update_join_requests_updated_at
    BEFORE UPDATE ON join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Create view for pending join requests with user details
CREATE OR REPLACE VIEW pending_join_requests AS
SELECT 
    jr.id,
    jr.user_id,
    jr.community_id,
    jr.message,
    jr.created_at,
    u.username,
    u.email,
    c.name as community_name,
    c.created_by as community_admin_id
FROM join_requests jr
JOIN users u ON jr.user_id = u.id
JOIN communities c ON jr.community_id = c.id
WHERE jr.status = 'pending';

-- 7. Sample data: Update existing communities to have visibility
UPDATE communities SET visibility = 'public' WHERE visibility IS NULL;

-- 8. Insert some sample private communities for testing
INSERT INTO communities (name, description, visibility, created_by) VALUES
('Private Tech Club', 'Exclusive tech discussions for verified professionals', 'private', 1),
('Secret Book Club', 'Private book discussions and reviews', 'private', 2),
('VIP Gaming Community', 'Elite gaming community for experienced players', 'private', 1)
ON CONFLICT DO NOTHING;

-- 9. Insert some sample join requests for testing
INSERT INTO join_requests (user_id, community_id, message, status) VALUES
(2, (SELECT id FROM communities WHERE name = 'Private Tech Club' LIMIT 1), 'I am a senior developer with 5+ years experience', 'pending'),
(3, (SELECT id FROM communities WHERE name = 'Private Tech Club' LIMIT 1), 'Looking to connect with other tech professionals', 'pending'),
(4, (SELECT id FROM communities WHERE name = 'Secret Book Club' LIMIT 1), 'I love reading and would like to join discussions', 'approved')
ON CONFLICT DO NOTHING;

-- 10. Create function to automatically handle community membership when join request is approved
CREATE OR REPLACE FUNCTION handle_approved_join_request()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to approved, add user to community_memberships
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO community_memberships (user_id, community_id, role, status, joined_at)
        VALUES (NEW.user_id, NEW.community_id, 'member', 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, community_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for automatic membership creation
DROP TRIGGER IF EXISTS trigger_approved_join_request ON join_requests;
CREATE TRIGGER trigger_approved_join_request
    AFTER UPDATE ON join_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_approved_join_request();

-- 12. Create function to get community privacy info
CREATE OR REPLACE FUNCTION get_community_privacy_info(community_id_param INTEGER, user_id_param INTEGER)
RETURNS TABLE (
    is_private BOOLEAN,
    is_member BOOLEAN,
    has_pending_request BOOLEAN,
    can_view_content BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.visibility = 'private' as is_private,
        COALESCE(cm.id IS NOT NULL, FALSE) as is_member,
        COALESCE(jr.id IS NOT NULL AND jr.status = 'pending', FALSE) as has_pending_request,
        CASE 
            WHEN c.visibility = 'public' THEN TRUE
            WHEN cm.id IS NOT NULL AND cm.status = 'active' THEN TRUE
            ELSE FALSE
        END as can_view_content
    FROM communities c
    LEFT JOIN community_memberships cm ON c.id = cm.community_id AND cm.user_id = user_id_param AND cm.status = 'active'
    LEFT JOIN join_requests jr ON c.id = jr.community_id AND jr.user_id = user_id_param AND jr.status = 'pending'
    WHERE c.id = community_id_param;
END;
$$ LANGUAGE plpgsql;

COMMIT; 