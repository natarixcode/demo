-- Enhanced Notification Center System for Natarix
-- Comprehensive notification system with user preferences and real-time updates

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('comment', 'reply', 'join', 'like', 'mention', 'follow', 'community_invite')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER, -- ID of related post, comment, community, etc.
    related_type VARCHAR(20), -- 'post', 'comment', 'community', 'user'
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Who triggered this notification
    action_url TEXT, -- URL to navigate to when clicked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    allow_comment BOOLEAN DEFAULT TRUE,
    allow_reply BOOLEAN DEFAULT TRUE,
    allow_join BOOLEAN DEFAULT TRUE,
    allow_like BOOLEAN DEFAULT TRUE,
    allow_mention BOOLEAN DEFAULT TRUE,
    allow_follow BOOLEAN DEFAULT TRUE,
    allow_community_invite BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_user_notification_preferences() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;
CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_notification_preferences();

-- Function to create notifications with preference checking
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id INTEGER,
    p_type VARCHAR(20),
    p_title VARCHAR(255),
    p_content TEXT,
    p_sender_id INTEGER DEFAULT NULL,
    p_related_id INTEGER DEFAULT NULL,
    p_related_type VARCHAR(20) DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
    user_prefs RECORD;
    should_create BOOLEAN := FALSE;
BEGIN
    -- Get user preferences
    SELECT * INTO user_prefs 
    FROM notification_preferences 
    WHERE user_id = p_user_id;
    
    -- If no preferences exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO notification_preferences (user_id) VALUES (p_user_id);
        should_create := TRUE;
    ELSE
        -- Check if user wants this type of notification
        CASE p_type
            WHEN 'comment' THEN should_create := user_prefs.allow_comment;
            WHEN 'reply' THEN should_create := user_prefs.allow_reply;
            WHEN 'join' THEN should_create := user_prefs.allow_join;
            WHEN 'like' THEN should_create := user_prefs.allow_like;
            WHEN 'mention' THEN should_create := user_prefs.allow_mention;
            WHEN 'follow' THEN should_create := user_prefs.allow_follow;
            WHEN 'community_invite' THEN should_create := user_prefs.allow_community_invite;
            ELSE should_create := TRUE;
        END CASE;
    END IF;
    
    -- Don't create notification for actions user did themselves
    IF p_sender_id = p_user_id THEN
        should_create := FALSE;
    END IF;
    
    -- Create notification if allowed
    IF should_create THEN
        INSERT INTO notifications (
            user_id, type, title, content, sender_id, 
            related_id, related_type, action_url
        )
        VALUES (
            p_user_id, p_type, p_title, p_content, p_sender_id,
            p_related_id, p_related_type, p_action_url
        )
        RETURNING id INTO notification_id;
        
        RETURN notification_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    p_user_id INTEGER,
    p_notification_ids INTEGER[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF p_notification_ids IS NULL THEN
        -- Mark all unread notifications as read
        UPDATE notifications 
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id AND is_read = FALSE;
    ELSE
        -- Mark specific notifications as read
        UPDATE notifications 
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id 
        AND id = ANY(p_notification_ids) 
        AND is_read = FALSE;
    END IF;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id INTEGER) RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to clean old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample notifications for testing (optional - remove in production)
DO $$
DECLARE
    user_record RECORD;
    admin_id INTEGER;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM users WHERE username = 'admin' LIMIT 1;
    
    -- Create sample notifications for users (except admin)
    FOR user_record IN SELECT id FROM users WHERE username != 'admin' LIMIT 3 LOOP
        -- Welcome notification
        PERFORM create_notification(
            user_record.id,
            'join',
            'Welcome to Natarix! 🎉',
            'Thanks for joining our community. Start exploring and share your thoughts!',
            admin_id,
            NULL,
            'system',
            '/'
        );
        
        -- Sample comment notification
        PERFORM create_notification(
            user_record.id,
            'comment',
            'New comment on your post',
            'Someone commented on your recent post. Check it out!',
            admin_id,
            1,
            'post',
            '/posts/1'
        );
    END LOOP;
END $$;

-- Create notification activity view for analytics
CREATE OR REPLACE VIEW notification_analytics AS
SELECT 
    type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_read THEN 1 END) as read_count,
    COUNT(CASE WHEN NOT is_read THEN 1 END) as unread_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_read_time_seconds,
    DATE_TRUNC('day', created_at) as notification_date
FROM notifications
GROUP BY type, DATE_TRUNC('day', created_at)
ORDER BY notification_date DESC, total_count DESC;

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE 'Notification system migration completed successfully!';
    RAISE NOTICE 'Tables created: notifications, notification_preferences';
    RAISE NOTICE 'Functions created: create_notification, mark_notifications_read, get_unread_count, cleanup_old_notifications';
    RAISE NOTICE 'Sample notifications created for existing users (if any)';
END $$; 