-- Enhanced Community System Database Schema for Natarix
-- Comprehensive sub-club and community management system

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS subclub_community_requests CASCADE;
DROP TABLE IF EXISTS community_moderators CASCADE;
DROP TABLE IF EXISTS community_memberships CASCADE;
DROP TABLE IF EXISTS sub_clubs CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS join_requests CASCADE;

-- Communities table with enhanced features
CREATE TABLE communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    type VARCHAR(20) NOT NULL DEFAULT 'agnostic' CHECK (type IN ('location_bound', 'agnostic')),
    location VARCHAR(255), -- City, state, or coordinates
    latitude DECIMAL(10, 8), -- GPS coordinates for location-bound communities
    longitude DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 5 CHECK (radius_km >= 1 AND radius_km <= 100), -- Radius in kilometers
    pin_code VARCHAR(10), -- PIN code for location reference
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags TEXT[], -- Array of tags
    member_count INTEGER DEFAULT 0,
    subclub_count INTEGER DEFAULT 0,
    rules TEXT[], -- Community rules
    banner_url TEXT, -- Community banner image
    icon_url TEXT, -- Community icon
    allow_subclub_requests BOOLEAN DEFAULT true, -- Allow external sub-clubs to request joining
    auto_approve_subclubs BOOLEAN DEFAULT false, -- Auto-approve sub-club requests
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Sub-clubs table (can be independent or community-linked)
CREATE TABLE sub_clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL, -- NULL for independent sub-clubs
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    type VARCHAR(20) NOT NULL DEFAULT 'agnostic' CHECK (type IN ('location_bound', 'agnostic')),
    location VARCHAR(255), -- Can override parent community location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 0,
    is_independent BOOLEAN DEFAULT false, -- True if created independently
    seeking_community BOOLEAN DEFAULT false, -- True if looking to join a community
    tags TEXT[], -- Sub-club tags
    rules TEXT[], -- Sub-club rules
    banner_url TEXT, -- Sub-club banner image
    icon_url TEXT, -- Sub-club icon
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Unique name within each community (NULL community_id allows independent sub-clubs)
    UNIQUE(community_id, name)
);

-- Community memberships table (handles both communities and sub-clubs)
CREATE TABLE community_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    sub_club_id INTEGER REFERENCES sub_clubs(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'creator', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned', 'suspended')),
    permissions TEXT[], -- Array of specific permissions
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure user can only have one membership per community/sub-club
    UNIQUE(user_id, community_id),
    UNIQUE(user_id, sub_club_id),
    -- Ensure either community_id or sub_club_id is set, but not both
    CHECK (
        (community_id IS NOT NULL AND sub_club_id IS NULL) OR 
        (community_id IS NULL AND sub_club_id IS NOT NULL)
    )
);

-- Join requests table for private communities/sub-clubs
CREATE TABLE join_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    sub_club_id INTEGER REFERENCES sub_clubs(id) ON DELETE CASCADE,
    message TEXT, -- Optional message from user
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    review_message TEXT, -- Message from reviewer
    -- Ensure either community_id or sub_club_id is set, but not both
    CHECK (
        (community_id IS NOT NULL AND sub_club_id IS NULL) OR 
        (community_id IS NULL AND sub_club_id IS NOT NULL)
    ),
    -- Prevent duplicate requests
    UNIQUE(user_id, community_id),
    UNIQUE(user_id, sub_club_id)
);

-- NEW: Sub-club to Community Addition Requests
CREATE TABLE subclub_community_requests (
    id SERIAL PRIMARY KEY,
    sub_club_id INTEGER NOT NULL REFERENCES sub_clubs(id) ON DELETE CASCADE,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Sub-club creator/admin
    message TEXT, -- Request message explaining why sub-club should be added
    proposed_name VARCHAR(255), -- Proposed name within the community (if different)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id), -- Community admin who reviewed
    review_message TEXT, -- Response from community admin
    -- Prevent duplicate requests
    UNIQUE(sub_club_id, community_id)
);

-- NEW: Community Moderators/Admins with specific permissions
CREATE TABLE community_moderators (
    id SERIAL PRIMARY KEY,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'admin')),
    permissions TEXT[] DEFAULT ARRAY[
        'manage_members', 
        'manage_posts', 
        'manage_rules', 
        'approve_subclubs'
    ], -- Specific permissions array
    appointed_by INTEGER REFERENCES users(id), -- Who appointed this moderator
    appointed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    -- Ensure user can only have one moderator role per community
    UNIQUE(community_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_communities_creator ON communities(creator_id);
CREATE INDEX idx_communities_type ON communities(type);
CREATE INDEX idx_communities_visibility ON communities(visibility);
CREATE INDEX idx_communities_location ON communities(location);
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX idx_communities_subclub_requests ON communities(allow_subclub_requests);

CREATE INDEX idx_sub_clubs_community ON sub_clubs(community_id);
CREATE INDEX idx_sub_clubs_creator ON sub_clubs(creator_id);
CREATE INDEX idx_sub_clubs_type ON sub_clubs(type);
CREATE INDEX idx_sub_clubs_independent ON sub_clubs(is_independent);
CREATE INDEX idx_sub_clubs_seeking ON sub_clubs(seeking_community);

CREATE INDEX idx_memberships_user ON community_memberships(user_id);
CREATE INDEX idx_memberships_community ON community_memberships(community_id);
CREATE INDEX idx_memberships_sub_club ON community_memberships(sub_club_id);
CREATE INDEX idx_memberships_role ON community_memberships(role);
CREATE INDEX idx_memberships_status ON community_memberships(status);

CREATE INDEX idx_join_requests_user ON join_requests(user_id);
CREATE INDEX idx_join_requests_community ON join_requests(community_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);

CREATE INDEX idx_subclub_requests_subclub ON subclub_community_requests(sub_club_id);
CREATE INDEX idx_subclub_requests_community ON subclub_community_requests(community_id);
CREATE INDEX idx_subclub_requests_status ON subclub_community_requests(status);

CREATE INDEX idx_moderators_community ON community_moderators(community_id);
CREATE INDEX idx_moderators_user ON community_moderators(user_id);
CREATE INDEX idx_moderators_active ON community_moderators(is_active);

-- Functions to update member counts
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE communities 
        SET member_count = (
            SELECT COUNT(*) 
            FROM community_memberships 
            WHERE community_id = NEW.community_id AND status = 'active'
        )
        WHERE id = NEW.community_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE communities 
        SET member_count = (
            SELECT COUNT(*) 
            FROM community_memberships 
            WHERE community_id = OLD.community_id AND status = 'active'
        )
        WHERE id = OLD.community_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update both old and new community if community_id changed
        IF OLD.community_id IS DISTINCT FROM NEW.community_id THEN
            UPDATE communities 
            SET member_count = (
                SELECT COUNT(*) 
                FROM community_memberships 
                WHERE community_id = OLD.community_id AND status = 'active'
            )
            WHERE id = OLD.community_id;
            
            UPDATE communities 
            SET member_count = (
                SELECT COUNT(*) 
                FROM community_memberships 
                WHERE community_id = NEW.community_id AND status = 'active'
            )
            WHERE id = NEW.community_id;
        ELSE
            UPDATE communities 
            SET member_count = (
                SELECT COUNT(*) 
                FROM community_memberships 
                WHERE community_id = NEW.community_id AND status = 'active'
            )
            WHERE id = NEW.community_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update sub-club member count
CREATE OR REPLACE FUNCTION update_subclub_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE sub_clubs 
        SET member_count = (
            SELECT COUNT(*) 
            FROM community_memberships 
            WHERE sub_club_id = NEW.sub_club_id AND status = 'active'
        )
        WHERE id = NEW.sub_club_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE sub_clubs 
        SET member_count = (
            SELECT COUNT(*) 
            FROM community_memberships 
            WHERE sub_club_id = OLD.sub_club_id AND status = 'active'
        )
        WHERE id = OLD.sub_club_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update both old and new sub-club if sub_club_id changed
        IF OLD.sub_club_id IS DISTINCT FROM NEW.sub_club_id THEN
            UPDATE sub_clubs 
            SET member_count = (
                SELECT COUNT(*) 
                FROM community_memberships 
                WHERE sub_club_id = OLD.sub_club_id AND status = 'active'
            )
            WHERE id = OLD.sub_club_id;
            
            UPDATE sub_clubs 
            SET member_count = (
                SELECT COUNT(*) 
                FROM community_memberships 
                WHERE sub_club_id = NEW.sub_club_id AND status = 'active'
            )
            WHERE id = NEW.sub_club_id;
        ELSE
            UPDATE sub_clubs 
            SET member_count = (
                SELECT COUNT(*) 
                FROM community_memberships 
                WHERE sub_club_id = NEW.sub_club_id AND status = 'active'
            )
            WHERE id = NEW.sub_club_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update community sub-club count
CREATE OR REPLACE FUNCTION update_community_subclub_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.community_id IS NOT NULL THEN
            UPDATE communities 
            SET subclub_count = (
                SELECT COUNT(*) 
                FROM sub_clubs 
                WHERE community_id = NEW.community_id
            )
            WHERE id = NEW.community_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.community_id IS NOT NULL THEN
            UPDATE communities 
            SET subclub_count = (
                SELECT COUNT(*) 
                FROM sub_clubs 
                WHERE community_id = OLD.community_id
            )
            WHERE id = OLD.community_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update both old and new community if community_id changed
        IF OLD.community_id IS DISTINCT FROM NEW.community_id THEN
            IF OLD.community_id IS NOT NULL THEN
                UPDATE communities 
                SET subclub_count = (
                    SELECT COUNT(*) 
                    FROM sub_clubs 
                    WHERE community_id = OLD.community_id
                )
                WHERE id = OLD.community_id;
            END IF;
            
            IF NEW.community_id IS NOT NULL THEN
                UPDATE communities 
                SET subclub_count = (
                    SELECT COUNT(*) 
                    FROM sub_clubs 
                    WHERE community_id = NEW.community_id
                )
                WHERE id = NEW.community_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_community_member_count
    AFTER INSERT OR UPDATE OR DELETE ON community_memberships
    FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

CREATE TRIGGER trigger_update_subclub_member_count
    AFTER INSERT OR UPDATE OR DELETE ON community_memberships
    FOR EACH ROW EXECUTE FUNCTION update_subclub_member_count();

CREATE TRIGGER trigger_update_community_subclub_count
    AFTER INSERT OR UPDATE OR DELETE ON sub_clubs
    FOR EACH ROW EXECUTE FUNCTION update_community_subclub_count();

-- Insert sample data
INSERT INTO communities (name, description, visibility, type, location, latitude, longitude, radius_km, pin_code, creator_id, tags, rules) VALUES
('Tech Innovators', 'A community for technology enthusiasts and innovators', 'public', 'agnostic', NULL, NULL, NULL, NULL, NULL, 1, 
 ARRAY['technology', 'innovation', 'programming'], 
 ARRAY['Be respectful', 'No spam', 'Stay on topic', 'Help others learn']),
('Bay Area Developers', 'Local developer community in San Francisco Bay Area', 'public', 'location_bound', 'San Francisco, CA', 37.7749, -122.4194, 50, '94102', 1, 
 ARRAY['development', 'local', 'networking'], 
 ARRAY['Be respectful', 'Local events only', 'No recruitment spam']),
('NYC Food Lovers', 'Discover the best food spots in New York City', 'public', 'location_bound', 'New York, NY', 40.7128, -74.0060, 15, '10001', 1, 
 ARRAY['food', 'nyc', 'restaurants'], 
 ARRAY['Food-related posts only', 'Include photos', 'No advertisements']),
('Private Entrepreneurs', 'Exclusive community for serious entrepreneurs', 'private', 'agnostic', NULL, NULL, NULL, NULL, NULL, 1, 
 ARRAY['business', 'startup', 'private'], 
 ARRAY['Invitation only', 'No sharing outside group', 'Serious discussions only'])
ON CONFLICT (name) DO NOTHING;

-- Insert sample independent sub-clubs
INSERT INTO sub_clubs (name, description, community_id, visibility, type, creator_id, is_independent, seeking_community, tags, rules) VALUES
('React Enthusiasts', 'Dedicated to React.js development and best practices', NULL, 'public', 'agnostic', 1, true, true, 
 ARRAY['react', 'javascript', 'frontend'], 
 ARRAY['React-related content only', 'Share code examples', 'Help beginners']),
('AI/ML Study Group', 'Machine learning and artificial intelligence discussions', NULL, 'public', 'agnostic', 1, true, true, 
 ARRAY['ai', 'ml', 'python', 'data-science'], 
 ARRAY['Educational content only', 'Cite sources', 'No self-promotion']),
('Crypto Traders NYC', 'Cryptocurrency trading group for NYC area', NULL, 'private', 'location_bound', 1, true, true, 
 ARRAY['crypto', 'trading', 'nyc'], 
 ARRAY['NYC residents only', 'No financial advice', 'Share strategies only']),
('DevOps Masters', 'Advanced DevOps practices and tools', 1, 'public', 'agnostic', 1, false, false, 
 ARRAY['devops', 'automation', 'cloud'], 
 ARRAY['Advanced topics only', 'Share real experiences', 'No basic questions'])
ON CONFLICT (community_id, name) DO NOTHING;

-- Insert sample memberships
INSERT INTO community_memberships (user_id, community_id, role, status) VALUES
(1, 1, 'creator', 'active'),
(1, 2, 'creator', 'active'),
(1, 3, 'creator', 'active'),
(1, 4, 'creator', 'active')
ON CONFLICT (user_id, community_id) DO NOTHING;

INSERT INTO community_memberships (user_id, sub_club_id, role, status) VALUES
(1, 1, 'creator', 'active'),
(1, 2, 'creator', 'active'),
(1, 3, 'creator', 'active'),
(1, 4, 'creator', 'active')
ON CONFLICT (user_id, sub_club_id) DO NOTHING;

-- Insert sample community moderators
INSERT INTO community_moderators (community_id, user_id, role, permissions, appointed_by) VALUES
(1, 1, 'admin', ARRAY['manage_members', 'manage_posts', 'manage_rules', 'approve_subclubs', 'manage_moderators'], 1),
(2, 1, 'admin', ARRAY['manage_members', 'manage_posts', 'manage_rules', 'approve_subclubs', 'manage_moderators'], 1)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Insert sample sub-club community requests
INSERT INTO subclub_community_requests (sub_club_id, community_id, requested_by, message, status) VALUES
(1, 1, 1, 'React Enthusiasts would be a great fit for Tech Innovators community. We focus on modern React development and have 50+ active members.', 'pending'),
(2, 1, 1, 'Our AI/ML Study Group aligns perfectly with the innovation focus of your community. We organize weekly study sessions and share cutting-edge research.', 'pending')
ON CONFLICT (sub_club_id, community_id) DO NOTHING; 