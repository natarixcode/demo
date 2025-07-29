// setup-notifications.js - Automatically setup notification system in database
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const notificationSystemSQL = `
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
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
    ELSE
        -- Mark specific notifications as read
        UPDATE notifications 
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id 
        AND id = ANY(p_notification_ids)
        AND is_read = FALSE;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
    END IF;
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for notification analytics
CREATE OR REPLACE VIEW notification_analytics AS
SELECT 
    DATE(created_at) as notification_date,
    type,
    COUNT(*) as total_count,
    SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count,
    SUM(CASE WHEN is_read THEN 0 ELSE 1 END) as unread_count,
    ROUND(
        (SUM(CASE WHEN is_read THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as read_percentage
FROM notifications
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), type
ORDER BY notification_date DESC, total_count DESC;

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
`;

const userProfileEnhancementSQL = `
-- User Profile Enhancement Migration

-- Add new columns to users table if they don't exist
DO $$ 
BEGIN 
    -- Check and add bio column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;
    
    -- Check and add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='location') THEN
        ALTER TABLE users ADD COLUMN location VARCHAR(100);
    END IF;
    
    -- Check and add avatar_color column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_color') THEN
        ALTER TABLE users ADD COLUMN avatar_color VARCHAR(7) DEFAULT '#3B82F6';
    END IF;
    
    -- Check and add karma column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='karma') THEN
        ALTER TABLE users ADD COLUMN karma INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add post_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='post_count') THEN
        ALTER TABLE users ADD COLUMN post_count INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add comment_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='comment_count') THEN
        ALTER TABLE users ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add display_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='display_name') THEN
        ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
    END IF;
END $$;

-- Create function to generate random avatar colors for new users
CREATE OR REPLACE FUNCTION generate_avatar_color() RETURNS VARCHAR(7) AS $$
DECLARE
    colors VARCHAR(7)[] := ARRAY['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];
BEGIN
    RETURN colors[floor(random() * array_length(colors, 1) + 1)];
END;
$$ LANGUAGE plpgsql;

-- Update existing users with random avatar colors if they don't have one
UPDATE users 
SET avatar_color = generate_avatar_color() 
WHERE avatar_color = '#3B82F6' OR avatar_color IS NULL;

-- Create function to update user stats (karma and post count)
CREATE OR REPLACE FUNCTION update_user_stats(user_id INTEGER) RETURNS VOID AS $$
BEGIN
    -- Update post count
    UPDATE users 
    SET post_count = (
        SELECT COUNT(*) 
        FROM posts 
        WHERE author = user_id AND is_draft = FALSE
    )
    WHERE id = user_id;
    
    -- Update comment count
    UPDATE users 
    SET comment_count = (
        SELECT COUNT(*) 
        FROM comments 
        WHERE author = user_id
    )
    WHERE id = user_id;
    
    -- Calculate and update karma (upvotes - downvotes from posts and comments)
    UPDATE users 
    SET karma = (
        COALESCE((
            SELECT SUM(upvotes - downvotes) 
            FROM posts 
            WHERE author = user_id AND is_draft = FALSE
        ), 0) + 
        COALESCE((
            SELECT SUM(upvotes - downvotes) 
            FROM comments 
            WHERE author = user_id
        ), 0)
    )
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user stats when posts/comments change
CREATE OR REPLACE FUNCTION trigger_update_user_stats() RETURNS TRIGGER AS $$
BEGIN
    -- Handle both INSERT, UPDATE, DELETE operations
    IF TG_OP = 'DELETE' THEN
        PERFORM update_user_stats(OLD.author);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update stats for both old and new author (if changed)
        PERFORM update_user_stats(NEW.author);
        IF OLD.author != NEW.author THEN
            PERFORM update_user_stats(OLD.author);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM update_user_stats(NEW.author);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for posts table
DROP TRIGGER IF EXISTS trigger_posts_update_user_stats ON posts;
CREATE TRIGGER trigger_posts_update_user_stats
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_stats();

-- Create triggers for comments table
DROP TRIGGER IF EXISTS trigger_comments_update_user_stats ON comments;
CREATE TRIGGER trigger_comments_update_user_stats
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_stats();

-- Update all existing user stats
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        PERFORM update_user_stats(user_record.id);
    END LOOP;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_karma ON users(karma DESC);
CREATE INDEX IF NOT EXISTS idx_users_post_count ON users(post_count DESC);
`;

async function setupNotificationSystem() {
  try {
    console.log('🔧 Setting up notification system...');
    
    // Run user profile enhancement first
    console.log('📊 Setting up user profile enhancements...');
    await pool.query(userProfileEnhancementSQL);
    console.log('✅ User profile enhancements completed!');
    
    // Run notification system setup
    console.log('🔔 Setting up notification system...');
    await pool.query(notificationSystemSQL);
    console.log('✅ Notification system setup completed!');
    
    // Test the functions
    console.log('🧪 Testing notification functions...');
    
    // Test get_unread_count function
    const testResult = await pool.query('SELECT get_unread_count(1) as count');
    console.log('✅ get_unread_count function working:', testResult.rows[0].count);
    
    // Test create_notification function  
    await pool.query(`
      SELECT create_notification(
        1, 
        'comment', 
        'Test Notification', 
        'This is a test notification to verify the system works',
        2,
        1,
        'post',
        '/posts/1'
      ) as notification_id
    `);
    console.log('✅ create_notification function working!');
    
    console.log('');
    console.log('🎉 NOTIFICATION SYSTEM SETUP COMPLETE!');
    console.log('');
    console.log('✅ Created tables: notifications, notification_preferences');
    console.log('✅ Created functions: get_unread_count, create_notification, mark_notifications_read');
    console.log('✅ Created indexes for performance');
    console.log('✅ Created triggers for auto-updates');
    console.log('✅ Enhanced user profiles with new fields');
    console.log('');
    console.log('🚀 Your notification center is now ready to use!');
    console.log('📱 Visit http://localhost:5173 to see the notification bell in action!');
    
  } catch (error) {
    console.error('❌ Error setting up notification system:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupNotificationSystem(); 