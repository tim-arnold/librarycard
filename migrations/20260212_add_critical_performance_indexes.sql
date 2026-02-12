-- Add critical performance indexes for commonly joined/filtered columns
-- These columns are used in nearly every book query but lack indexes

CREATE INDEX IF NOT EXISTS idx_books_shelf_id ON books(shelf_id);
CREATE INDEX IF NOT EXISTS idx_books_added_by ON books(added_by);
CREATE INDEX IF NOT EXISTS idx_books_checked_out_by ON books(checked_out_by);
CREATE INDEX IF NOT EXISTS idx_shelves_location_id ON shelves(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_owner_id ON locations(owner_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_book_id ON book_genres(book_id);
