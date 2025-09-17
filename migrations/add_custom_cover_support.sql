-- Add custom cover support for books
-- Migration: add_custom_cover_support.sql
-- Date: 2025-09-16

-- Add custom cover URL field to books table
ALTER TABLE books ADD COLUMN custom_cover_url TEXT;

-- Add custom cover metadata field to track image info
ALTER TABLE books ADD COLUMN custom_cover_metadata TEXT; -- JSON: {size, format, upload_date, original_filename}

-- Create book_images table for potential future expansion
CREATE TABLE IF NOT EXISTS book_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL, -- 'cover', 'back_cover', 'spine', 'custom'
  storage_provider TEXT DEFAULT 'r2', -- 'r2', 'local', etc.
  storage_key TEXT, -- R2 object key for cleanup
  file_size INTEGER, -- Size in bytes
  image_format TEXT, -- 'webp', 'jpeg', 'png'
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE, -- Primary cover for display
  uploaded_by TEXT NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON for additional metadata
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_images_book ON book_images(book_id);
CREATE INDEX IF NOT EXISTS idx_book_images_type ON book_images(image_type);
CREATE INDEX IF NOT EXISTS idx_book_images_primary ON book_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_book_images_uploaded_by ON book_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_books_custom_cover ON books(custom_cover_url);