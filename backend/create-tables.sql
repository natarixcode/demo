-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to posts table if they don't exist
DO $$ 
BEGIN 
    -- Check and add is_draft column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='is_draft') THEN
        ALTER TABLE posts ADD COLUMN is_draft BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Check and add upvotes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='upvotes') THEN
        ALTER TABLE posts ADD COLUMN upvotes INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add downvotes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='downvotes') THEN
        ALTER TABLE posts ADD COLUMN downvotes INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add share_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='share_count') THEN
        ALTER TABLE posts ADD COLUMN share_count INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add comment_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='comment_count') THEN
        ALTER TABLE posts ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add community_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='community_id') THEN
        ALTER TABLE posts ADD COLUMN community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add sub_club_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='sub_club_id') THEN
        ALTER TABLE posts ADD COLUMN sub_club_id INTEGER REFERENCES sub_clubs(id) ON DELETE CASCADE;
    END IF;
END $$;


-- Create communities table if it doesn't exist
CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_communities join table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_communities (
  user_id INTEGER NOT NULL,
  community_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, community_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    sub_club_id INTEGER REFERENCES sub_clubs(id) ON DELETE CASCADE,
    is_draft BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure a post belongs to either a community, sub-club, or neither (general post)
    CHECK (
        (community_id IS NOT NULL AND sub_club_id IS NULL) OR 
        (community_id IS NULL AND sub_club_id IS NOT NULL) OR
        (community_id IS NULL AND sub_club_id IS NULL)
    )
);

-- Create votes table for tracking user votes on posts
CREATE TABLE IF NOT EXISTS post_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Create comments table for post comments
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comment votes table for voting on comments
CREATE TABLE IF NOT EXISTS comment_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, comment_id)
);

-- Create shares table for tracking post shares
CREATE TABLE IF NOT EXISTS post_shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    share_type VARCHAR(20) DEFAULT 'link', -- 'link', 'social', 'email', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_draft ON posts(is_draft);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_sub_club_id ON posts(sub_club_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);

-- Insert sample data (use ON CONFLICT to avoid duplicates)
INSERT INTO users (username, email, password) VALUES 
('admin', 'admin@notorix.com', 'admin123'),
('johnsmith', 'john@example.com', 'password123'),
('sarah_dev', 'sarah@notorix.com', 'dev456'),
('react_enthusiast', 'react@example.com', 'react123'),
('ui_designer', 'ui@example.com', 'design123')
ON CONFLICT (username) DO NOTHING;

-- Update existing posts to have proper vote/share/comment counts, insert new ones
DO $$
BEGIN
    -- Update existing posts if they exist
    UPDATE posts SET 
        upvotes = COALESCE(upvotes, 0),
        downvotes = COALESCE(downvotes, 0),
        share_count = COALESCE(share_count, 0),
        comment_count = COALESCE(comment_count, 0),
        is_draft = COALESCE(is_draft, FALSE)
    WHERE upvotes IS NULL OR downvotes IS NULL OR share_count IS NULL OR comment_count IS NULL OR is_draft IS NULL;
    
    -- Insert sample posts if they don't exist
    INSERT INTO posts (title, content, author, is_draft, upvotes, downvotes, share_count, comment_count) 
    SELECT * FROM (VALUES 
        ('Welcome to Notorix', 'This is the first post on our new platform! Welcome everyone to Notorix community.', 1, FALSE, 45, 2, 12, 8),
        ('Getting Started Guide', 'Here are some tips to get started with Notorix and make the most of your experience.', 1, FALSE, 67, 1, 23, 15),
        ('My First Post', 'Hello everyone! Excited to be part of this community.', 2, FALSE, 23, 0, 5, 3),
        ('Development Updates', 'Working on some exciting new features for the platform.', 3, FALSE, 89, 3, 34, 22),
        ('Community Guidelines', 'Please be respectful and follow our community guidelines for a better experience.', 1, FALSE, 156, 4, 67, 45),
        ('Draft: Future Features', 'Here are some ideas for future features we might implement...', 1, TRUE, 0, 0, 0, 0),
        ('Building React Apps with Advanced Glassmorphism Effects', 'In this comprehensive guide, we will explore how to create stunning glassmorphism effects in React applications...', 2, FALSE, 342, 23, 45, 67)
    ) AS new_posts(title, content, author, is_draft, upvotes, downvotes, share_count, comment_count)
    WHERE NOT EXISTS (
        SELECT 1 FROM posts WHERE posts.title = new_posts.title
    );
END $$;

-- Insert sample comments (avoid duplicates)
INSERT INTO comments (post_id, author, content, parent_comment_id, upvotes, downvotes) 
SELECT * FROM (VALUES 
    (1, 2, 'Great welcome message! Excited to be here.', NULL, 12, 0),
    (1, 3, 'Looking forward to contributing to this community.', NULL, 8, 1),
    (1, 4, 'Thanks for the warm welcome!', 1, 5, 0),
    (2, 3, 'Very helpful guide for newcomers.', NULL, 15, 0),
    (2, 4, 'Could you add more examples?', NULL, 7, 2),
    (7, 4, 'This is an amazing tutorial! I have been looking for a comprehensive guide on glassmorphism.', NULL, 24, 1),
    (7, 5, 'Great breakdown of the principles! This helps a lot.', NULL, 18, 0),
    (7, 2, 'Question: Does this work well on mobile devices?', NULL, 15, 2)
) AS new_comments(post_id, author, content, parent_comment_id, upvotes, downvotes)
WHERE NOT EXISTS (
    SELECT 1 FROM comments WHERE comments.content = new_comments.content
);

-- Insert sample votes (avoid duplicates)
INSERT INTO post_votes (user_id, post_id, vote_type) 
SELECT * FROM (VALUES 
    (2, 1, 'upvote'),
    (3, 1, 'upvote'),
    (4, 1, 'upvote'),
    (2, 2, 'upvote'),
    (3, 2, 'upvote'),
    (4, 7, 'upvote'),
    (5, 7, 'upvote')
) AS new_votes(user_id, post_id, vote_type)
WHERE NOT EXISTS (
    SELECT 1 FROM post_votes WHERE post_votes.user_id = new_votes.user_id AND post_votes.post_id = new_votes.post_id
);

-- Insert sample comment votes (avoid duplicates)
INSERT INTO comment_votes (user_id, comment_id, vote_type) 
SELECT * FROM (VALUES 
    (1, 1, 'upvote'),
    (3, 1, 'upvote'),
    (4, 1, 'upvote'),
    (1, 6, 'upvote'),
    (2, 6, 'upvote')
) AS new_comment_votes(user_id, comment_id, vote_type)
WHERE NOT EXISTS (
    SELECT 1 FROM comment_votes WHERE comment_votes.user_id = new_comment_votes.user_id AND comment_votes.comment_id = new_comment_votes.comment_id
);

-- Insert sample shares (avoid duplicates)
INSERT INTO post_shares (user_id, post_id, share_type) 
SELECT * FROM (VALUES 
    (2, 1, 'link'),
    (3, 1, 'social'),
    (4, 2, 'link'),
    (5, 7, 'social'),
    (2, 7, 'link')
) AS new_shares(user_id, post_id, share_type)
WHERE NOT EXISTS (
    SELECT 1 FROM post_shares WHERE post_shares.user_id = new_shares.user_id AND post_shares.post_id = new_shares.post_id AND post_shares.share_type = new_shares.share_type
); 