-- Enhanced Community System Database Schema for Natarix
-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS community_memberships CASCADE;
DROP TABLE IF EXISTS sub_clubs CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sub-clubs table (nested under communities)
CREATE TABLE sub_clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    type VARCHAR(20) NOT NULL DEFAULT 'agnostic' CHECK (type IN ('location_bound', 'agnostic')),
    location VARCHAR(255), -- Can override parent community location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(community_id, name) -- Unique name within each community
);

-- Community memberships table (handles both communities and sub-clubs)
CREATE TABLE community_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    sub_club_id INTEGER REFERENCES sub_clubs(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'creator')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned')),
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
    -- Ensure either community_id or sub_club_id is set, but not both
    CHECK (
        (community_id IS NOT NULL AND sub_club_id IS NULL) OR 
        (community_id IS NULL AND sub_club_id IS NOT NULL)
    ),
    -- Prevent duplicate requests
    UNIQUE(user_id, community_id),
    UNIQUE(user_id, sub_club_id)
);

-- Create indexes for better performance
CREATE INDEX idx_communities_creator ON communities(creator_id);
CREATE INDEX idx_communities_type ON communities(type);
CREATE INDEX idx_communities_visibility ON communities(visibility);
CREATE INDEX idx_communities_location ON communities(location);
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);

CREATE INDEX idx_sub_clubs_community ON sub_clubs(community_id);
CREATE INDEX idx_sub_clubs_creator ON sub_clubs(creator_id);
CREATE INDEX idx_sub_clubs_type ON sub_clubs(type);

CREATE INDEX idx_memberships_user ON community_memberships(user_id);
CREATE INDEX idx_memberships_community ON community_memberships(community_id);
CREATE INDEX idx_memberships_sub_club ON community_memberships(sub_club_id);
CREATE INDEX idx_memberships_role ON community_memberships(role);

CREATE INDEX idx_join_requests_user ON join_requests(user_id);
CREATE INDEX idx_join_requests_community ON join_requests(community_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);

-- Function to update member count
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.community_id IS NOT NULL AND NEW.status = 'active' THEN
            UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
        END IF;
        IF NEW.sub_club_id IS NOT NULL AND NEW.status = 'active' THEN
            UPDATE sub_clubs SET member_count = member_count + 1 WHERE id = NEW.sub_club_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            IF NEW.community_id IS NOT NULL THEN
                IF OLD.status = 'active' AND NEW.status != 'active' THEN
                    UPDATE communities SET member_count = member_count - 1 WHERE id = NEW.community_id;
                ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
                    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
                END IF;
            END IF;
            IF NEW.sub_club_id IS NOT NULL THEN
                IF OLD.status = 'active' AND NEW.status != 'active' THEN
                    UPDATE sub_clubs SET member_count = member_count - 1 WHERE id = NEW.sub_club_id;
                ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
                    UPDATE sub_clubs SET member_count = member_count + 1 WHERE id = NEW.sub_club_id;
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.community_id IS NOT NULL AND OLD.status = 'active' THEN
            UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
        END IF;
        IF OLD.sub_club_id IS NOT NULL AND OLD.status = 'active' THEN
            UPDATE sub_clubs SET member_count = member_count - 1 WHERE id = OLD.sub_club_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for member count updates
CREATE TRIGGER trigger_update_member_count
    AFTER INSERT OR UPDATE OR DELETE ON community_memberships
    FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- Function to auto-approve creator membership
CREATE OR REPLACE FUNCTION auto_approve_creator()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-create creator membership for communities
    IF TG_TABLE_NAME = 'communities' THEN
        INSERT INTO community_memberships (user_id, community_id, role, status)
        VALUES (NEW.creator_id, NEW.id, 'creator', 'active');
    -- Auto-create creator membership for sub-clubs
    ELSIF TG_TABLE_NAME = 'sub_clubs' THEN
        INSERT INTO community_memberships (user_id, sub_club_id, role, status)
        VALUES (NEW.creator_id, NEW.id, 'creator', 'active');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-approving creators
CREATE TRIGGER trigger_auto_approve_community_creator
    AFTER INSERT ON communities
    FOR EACH ROW EXECUTE FUNCTION auto_approve_creator();

CREATE TRIGGER trigger_auto_approve_sub_club_creator
    AFTER INSERT ON sub_clubs
    FOR EACH ROW EXECUTE FUNCTION auto_approve_creator();

-- Insert sample data
INSERT INTO communities (name, description, visibility, type, location, latitude, longitude, radius_km, pin_code, creator_id, tags) VALUES
('Tech Enthusiasts', 'A community for technology lovers and innovators', 'public', 'agnostic', NULL, NULL, NULL, NULL, NULL, 1, ARRAY['technology', 'programming', 'innovation']),
('San Francisco Developers', 'Local developer community in San Francisco', 'public', 'location_bound', 'San Francisco, CA', 37.7749, -122.4194, 10, '94102', 1, ARRAY['developers', 'san-francisco', 'networking']),
('React Masters', 'Advanced React development discussions', 'private', 'agnostic', NULL, NULL, NULL, NULL, NULL, 1, ARRAY['react', 'javascript', 'frontend']),
('NYC Food Lovers', 'Discover the best food spots in New York City', 'public', 'location_bound', 'New York, NY', 40.7128, -74.0060, 15, '10001', 1, ARRAY['food', 'nyc', 'restaurants']),
('Bidholi Fitness Club', 'Local fitness community in Bidholi, Dehradun', 'public', 'location_bound', 'Bidholi, Dehradun', 30.2849, 78.0422, 5, '248007', 1, ARRAY['fitness', 'health', 'dehradun']),
('Mumbai Entrepreneurs', 'Startup and business community in Mumbai', 'public', 'location_bound', 'Mumbai, Maharashtra', 19.0760, 72.8777, 20, '400001', 1, ARRAY['business', 'startup', 'mumbai'])
ON CONFLICT (name) DO NOTHING;

-- Insert sample sub-clubs
INSERT INTO sub_clubs (name, description, community_id, visibility, type, creator_id) VALUES
('Frontend Focus', 'Discussions about frontend technologies', 1, 'public', 'agnostic', 1),
('Backend Builders', 'Backend development and architecture', 1, 'public', 'agnostic', 1),
('Mobile Dev', 'Mobile app development discussions', 1, 'public', 'agnostic', 1),
('South Bay Meetups', 'Meetups in the South Bay area', 2, 'public', 'location_bound', 1),
('Downtown SF', 'Downtown San Francisco events', 2, 'public', 'location_bound', 1)
ON CONFLICT (community_id, name) DO NOTHING; 