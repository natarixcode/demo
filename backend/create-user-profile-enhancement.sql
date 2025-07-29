-- Enhanced User Profile System for Natarix (Anonymous Avatar System)
-- This migration adds profile fields while keeping users anonymous with generated avatars

-- Add new columns to users table for enhanced profile features
DO $$ 
BEGIN 
    -- Add bio column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';
    END IF;
    
    -- Add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='location') THEN
        ALTER TABLE users ADD COLUMN location VARCHAR(255) DEFAULT '';
    END IF;
    
    -- Add avatar_color for anonymous avatars (will store hex color)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_color') THEN
        ALTER TABLE users ADD COLUMN avatar_color VARCHAR(7) DEFAULT '#3B82F6';
    END IF;
    
    -- Add karma score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='karma') THEN
        ALTER TABLE users ADD COLUMN karma INTEGER DEFAULT 0;
    END IF;
    
    -- Add post count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='post_count') THEN
        ALTER TABLE users ADD COLUMN post_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add comment count for stats
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='comment_count') THEN
        ALTER TABLE users ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add display_name for optional custom display name (still anonymous)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='display_name') THEN
        ALTER TABLE users ADD COLUMN display_name VARCHAR(100) DEFAULT '';
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

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE 'User profile enhancement migration completed successfully!';
    RAISE NOTICE 'Added fields: bio, location, avatar_color, karma, post_count, comment_count, display_name';
    RAISE NOTICE 'All existing users now have avatar colors and updated stats.';
END $$; 