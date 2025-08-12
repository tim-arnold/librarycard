-- Add Review Moderation System to book_ratings table
-- GitHub Issue #256: Admin review moderation for written reviews

-- Step 1: Add moderation fields to existing book_ratings table
ALTER TABLE book_ratings ADD COLUMN review_status TEXT DEFAULT 'approved';
ALTER TABLE book_ratings ADD COLUMN reviewed_by TEXT;
ALTER TABLE book_ratings ADD COLUMN reviewed_at DATETIME;
ALTER TABLE book_ratings ADD COLUMN review_rejection_reason TEXT;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_ratings_status ON book_ratings(review_status);
CREATE INDEX IF NOT EXISTS idx_book_ratings_reviewed_by ON book_ratings(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_book_ratings_reviewed_at ON book_ratings(reviewed_at);

-- Step 3: Set existing reviews to approved status (backward compatibility)
UPDATE book_ratings 
SET review_status = 'approved', reviewed_at = created_at 
WHERE review_text IS NOT NULL AND review_text != '';

-- Step 4: Add foreign key constraint for reviewed_by field
-- Note: Using separate statement for SQLite compatibility
-- ALTER TABLE book_ratings ADD CONSTRAINT fk_book_ratings_reviewed_by 
-- FOREIGN KEY (reviewed_by) REFERENCES users(id);

-- Migration Notes:
-- - review_status: 'pending', 'approved', 'rejected'
-- - Star ratings (1-5) are unaffected by moderation - they remain immediate
-- - Only written reviews (review_text) go through moderation process
-- - Existing reviews are grandfathered in as 'approved'
-- - Admins can approve/reject/delete pending reviews