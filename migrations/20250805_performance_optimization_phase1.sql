-- Performance Optimization Phase 1: Database Indexes and Query Optimization
-- Created: August 5, 2025
-- GitHub Issue: #35 - Performance Review

-- =============================================
-- MISSING CRITICAL INDEXES
-- =============================================

-- Composite index for common book filtering patterns (shelf + status)
CREATE INDEX IF NOT EXISTS idx_books_shelf_status ON books(shelf_id, status);

-- Composite index for date-ordered queries by shelf
CREATE INDEX IF NOT EXISTS idx_books_created_shelf ON books(created_at DESC, shelf_id);

-- Index for book genre relationships (for assigned_genres subquery)
CREATE INDEX IF NOT EXISTS idx_book_genres_book ON book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres(genre_id);

-- Composite index for curated genres (active genres first)
CREATE INDEX IF NOT EXISTS idx_curated_genres_active ON curated_genres(is_active, id);

-- Optimize rating calculations with covering indexes
CREATE INDEX IF NOT EXISTS idx_book_ratings_book_user ON book_ratings(book_id, user_id, rating);

-- Optimize location member lookups for rating calculations
CREATE INDEX IF NOT EXISTS idx_location_members_user_location ON location_members(user_id, location_id);

-- Index for location ownership patterns
CREATE INDEX IF NOT EXISTS idx_locations_owner_id ON locations(owner_id, id);

-- Optimize checkout history queries
CREATE INDEX IF NOT EXISTS idx_checkout_history_book_date ON book_checkout_history(book_id, action_date DESC);

-- Index for checked out user name lookups
CREATE INDEX IF NOT EXISTS idx_books_checked_out_user ON books(checked_out_by) WHERE checked_out_by IS NOT NULL;

-- =============================================
-- QUERY OPTIMIZATION VIEWS
-- =============================================

-- Create a view for efficient book genre aggregation
DROP VIEW IF EXISTS book_genres_agg;
CREATE VIEW book_genres_agg AS
SELECT 
  bg.book_id,
  json_group_array(
    json_object(
      'id', cg.id, 
      'name', cg.name, 
      'description', cg.description
    )
  ) as assigned_genres
FROM book_genres bg 
JOIN curated_genres cg ON bg.genre_id = cg.id 
WHERE cg.is_active = 1
GROUP BY bg.book_id;

-- Create a view for efficient library rating calculations
DROP VIEW IF EXISTS library_ratings_agg;
CREATE VIEW library_ratings_agg AS
WITH location_users AS (
  SELECT DISTINCT 
    l.id as location_id,
    u.id as user_id
  FROM locations l
  LEFT JOIN location_members lm ON l.id = lm.location_id
  LEFT JOIN users u ON lm.user_id = u.id OR l.owner_id = u.id
  WHERE u.id IS NOT NULL
)
SELECT 
  b.id as book_id,
  l.id as location_id,
  AVG(CAST(br.rating AS REAL)) as library_average_rating,
  COUNT(br.rating) as library_rating_count
FROM books b
JOIN shelves s ON b.shelf_id = s.id
JOIN locations l ON s.location_id = l.id
LEFT JOIN book_ratings br ON b.id = br.book_id
LEFT JOIN location_users lu ON l.id = lu.location_id AND br.user_id = lu.user_id
GROUP BY b.id, l.id;

-- =============================================
-- PERFORMANCE MONITORING
-- =============================================

-- Enable query analysis (SQLite specific)
PRAGMA analysis_limit = 1000;
PRAGMA optimize;

-- Update table statistics for better query planning
ANALYZE books;
ANALYZE book_ratings;
ANALYZE book_genres;
ANALYZE shelves;
ANALYZE locations;
ANALYZE location_members;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Query to verify index usage (for testing)
-- EXPLAIN QUERY PLAN SELECT * FROM books WHERE shelf_id = 1 AND status = 'available';
-- EXPLAIN QUERY PLAN SELECT * FROM books ORDER BY created_at DESC, shelf_id;

-- Test the new views
-- SELECT COUNT(*) FROM book_genres_agg;
-- SELECT COUNT(*) FROM library_ratings_agg;