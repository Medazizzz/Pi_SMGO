-- =====================================================
-- Kids Content Database Schema
-- WHY: Create tables for kids content management
-- =====================================================

-- Create kids_content table
CREATE TABLE IF NOT EXISTS kids_content (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    age_group VARCHAR(20),
    content_type VARCHAR(50),
    rating DECIMAL(3,1),
    duration VARCHAR(50),
    image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    genre VARCHAR(100),
    is_educational BOOLEAN DEFAULT FALSE,
    released_year INT,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_age_group (age_group),
    INDEX idx_content_type (content_type),
    INDEX idx_featured (featured),
    INDEX idx_educational (is_educational),
    FULLTEXT INDEX idx_search (title, description, genre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create kids_favorites table
CREATE TABLE IF NOT EXISTS kids_favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_content (user_id, content_id),
    FOREIGN KEY (content_id) REFERENCES kids_content(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_content_id (content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create kids_watch_history table
CREATE TABLE IF NOT EXISTS kids_watch_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content_id VARCHAR(36) NOT NULL,
    progress_minutes INT DEFAULT 0,
    total_minutes INT,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES kids_content(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_content_id (content_id),
    INDEX idx_user_content (user_id, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create kids_parental_controls table
CREATE TABLE IF NOT EXISTS kids_parental_controls (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    child_user_id VARCHAR(36) NOT NULL,
    max_age_group VARCHAR(20),
    daily_limit_minutes INT,
    screen_time_enabled BOOLEAN DEFAULT TRUE,
    restricted_genres VARCHAR(500),
    pin_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_parent_child (parent_id, child_user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_child_id (child_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample kids content
INSERT INTO kids_content (id, title, description, age_group, content_type, rating, duration, image_url, genre, is_educational, released_year, featured)
VALUES 
('kids_001', 'Adventure Island', 'Join our heroes on an exciting journey through magical lands!', '6-9', 'ANIMATION', 4.9, '22 min', 'https://images.unsplash.com/photo-1587614382346-4ec2e0311ff0?w=500', 'Adventure', TRUE, 2024, TRUE),
('kids_002', 'Learning ABC', 'Fun way to learn letters and numbers!', '2-5', 'EDUCATIONAL', 4.8, '15 min', 'https://images.unsplash.com/photo-1574263867373-30651cc06da5?w=500', 'Educational', TRUE, 2023, TRUE),
('kids_003', 'Space Rangers', 'Explore the universe with our brave space explorers!', '10-13', 'SERIES', 4.7, '42 min/ep', 'https://images.unsplash.com/photo-1536440407147-f9c07d019dde?w=500', 'Sci-Fi', TRUE, 2024, FALSE),
('kids_004', 'Magic Academy', 'Discover the secrets of a magical school!', '6-9', 'SERIES', 4.6, '30 min/ep', 'https://images.unsplash.com/photo-1506232408501-d90b3f8f6b4f?w=500', 'Fantasy', FALSE, 2024, FALSE),
('kids_005', 'Jungle Friends', 'Follow adorable animal friends in their jungle adventures!', '2-5', 'ANIMATION', 4.9, '12 min', 'https://images.unsplash.com/photo-1523388645328-f2e9e4b79af1?w=500', 'Adventure', TRUE, 2023, TRUE),
('kids_006', 'Detective Squad', 'Solve mysteries with a team of clever kids!', '10-13', 'MOVIE', 4.8, '85 min', 'https://images.unsplash.com/photo-1578713183184-71dae1a5c5c3?w=500', 'Mystery', FALSE, 2024, FALSE);

-- Create index for full-text search
ALTER TABLE kids_content 
ADD FULLTEXT INDEX ft_search (title, description, genre);

-- Verify tables
SHOW TABLES LIKE 'kids_%';
SELECT COUNT(*) as sample_content FROM kids_content;
