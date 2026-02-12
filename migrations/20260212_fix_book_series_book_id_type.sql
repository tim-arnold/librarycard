-- Fix book_series.book_id type mismatch: TEXT -> INTEGER
-- books.id is INTEGER but book_series.book_id was TEXT, preventing proper FK enforcement
-- and requiring CAST workarounds in queries.

CREATE TABLE book_series_new (
    book_id INTEGER NOT NULL,
    series_id TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, series_id),
    FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE CASCADE
);

INSERT INTO book_series_new (book_id, series_id, added_at)
SELECT CAST(book_id AS INTEGER), series_id, added_at
FROM book_series;

DROP TABLE book_series;

ALTER TABLE book_series_new RENAME TO book_series;

CREATE INDEX idx_book_series_book_id ON book_series(book_id);
CREATE INDEX idx_book_series_series_id ON book_series(series_id);
CREATE INDEX idx_book_series_added_at ON book_series(added_at);
