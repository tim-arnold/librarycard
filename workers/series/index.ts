import { Env } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface Series {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  book_count?: number;
}

export interface CreateSeriesRequest {
  name: string;
  description?: string;
  color?: string;
  sort_order?: number;
}

export interface UpdateSeriesRequest {
  name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
}

export interface AddBooksToSeriesRequest {
  book_ids: string[];
}

// Get all user series with book counts
export async function getUserSeries(userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const stmt = env.DB.prepare(`
      SELECT 
        s.id, s.user_id, s.name, s.description, s.color, 
        s.created_at, s.updated_at, s.sort_order,
        COUNT(bs.book_id) as book_count
      FROM series s
      LEFT JOIN book_series bs ON s.id = bs.series_id
      WHERE s.user_id = ?
      GROUP BY s.id, s.user_id, s.name, s.description, s.color, s.created_at, s.updated_at, s.sort_order
      ORDER BY s.sort_order ASC, s.created_at DESC
    `);
    
    const result = await stmt.bind(userId).all();
    const series = result.results || [];
    
    return new Response(JSON.stringify({ series }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user series:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch series' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Create a new series
export async function createSeries(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json() as CreateSeriesRequest;
    const { name, description, color, sort_order } = body;
    
    if (!name || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Series name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if series name already exists for this user
    const existingStmt = env.DB.prepare('SELECT id FROM series WHERE user_id = ? AND name = ?');
    const existing = await existingStmt.bind(userId, name.trim()).first();
    
    if (existing) {
      return new Response(JSON.stringify({ error: 'A series with this name already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const seriesId = uuidv4();
    const currentTimestamp = new Date().toISOString();
    
    const stmt = env.DB.prepare(`
      INSERT INTO series (id, user_id, name, description, color, created_at, updated_at, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      seriesId,
      userId,
      name.trim(),
      description?.trim() || null,
      color || null,
      currentTimestamp,
      currentTimestamp,
      sort_order || 0
    ).run();
    
    // Return the created series
    const newSeries = {
      id: seriesId,
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || null,
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
      sort_order: sort_order || 0,
      book_count: 0
    };
    
    return new Response(JSON.stringify(newSeries), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating series:', error);
    return new Response(JSON.stringify({ error: 'Failed to create series' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Update a series
export async function updateSeries(request: Request, seriesId: string, userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json() as UpdateSeriesRequest;
    const { name, description, color, sort_order } = body;
    
    // Check if series exists and belongs to user
    const existingStmt = env.DB.prepare('SELECT id FROM series WHERE id = ? AND user_id = ?');
    const existing = await existingStmt.bind(seriesId, userId).first();
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Series not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check for name conflicts if name is being updated
    if (name && name.trim().length > 0) {
      const duplicateStmt = env.DB.prepare('SELECT id FROM series WHERE user_id = ? AND name = ? AND id != ?');
      const duplicate = await duplicateStmt.bind(userId, name.trim(), seriesId).first();
      
      if (duplicate) {
        return new Response(JSON.stringify({ error: 'A series with this name already exists' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined && name.trim().length > 0) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description?.trim() || null);
    }
    
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color || null);
    }
    
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }
    
    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No updates provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(seriesId);
    
    const updateQuery = `UPDATE series SET ${updates.join(', ')} WHERE id = ?`;
    const updateStmt = env.DB.prepare(updateQuery);
    
    await updateStmt.bind(...values).run();
    
    // Return updated series with book count
    const updatedStmt = env.DB.prepare(`
      SELECT 
        s.id, s.user_id, s.name, s.description, s.color, 
        s.created_at, s.updated_at, s.sort_order,
        COUNT(bs.book_id) as book_count
      FROM series s
      LEFT JOIN book_series bs ON s.id = bs.series_id
      WHERE s.id = ?
      GROUP BY s.id, s.user_id, s.name, s.description, s.color, s.created_at, s.updated_at, s.sort_order
    `);
    
    const updatedSeries = await updatedStmt.bind(seriesId).first();
    
    return new Response(JSON.stringify(updatedSeries), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating series:', error);
    return new Response(JSON.stringify({ error: 'Failed to update series' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Delete a series
export async function deleteSeries(seriesId: string, userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Check if series exists and belongs to user
    const existingStmt = env.DB.prepare('SELECT id FROM series WHERE id = ? AND user_id = ?');
    const existing = await existingStmt.bind(seriesId, userId).first();
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Series not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Delete series (book_series entries will be cascade deleted)
    const deleteStmt = env.DB.prepare('DELETE FROM series WHERE id = ?');
    const result = await deleteStmt.bind(seriesId).run();
    
    if (result.meta?.changes === 0 && result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Failed to delete series' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ message: 'Series deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting series:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete series' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Add books to a series
export async function addBooksToSeries(request: Request, seriesId: string, userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json() as AddBooksToSeriesRequest;
    const { book_ids } = body;
    
    if (!Array.isArray(book_ids) || book_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'book_ids must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if series exists and belongs to user
    const seriesStmt = env.DB.prepare('SELECT id FROM series WHERE id = ? AND user_id = ?');
    const series = await seriesStmt.bind(seriesId, userId).first();
    
    if (!series) {
      return new Response(JSON.stringify({ error: 'Series not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Verify all books exist and user has access to them
    const bookAccessStmt = env.DB.prepare(`
      SELECT DISTINCT b.id 
      FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE b.id IN (${book_ids.map(() => '?').join(',')}) 
        AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
    `);
    
    const accessibleBooks = await bookAccessStmt.bind(...book_ids, userId, userId, userId).all();
    const accessibleBookIds = (accessibleBooks.results || []).map((book: any) => book.id);
    
    if (accessibleBookIds.length !== book_ids.length) {
      return new Response(JSON.stringify({ error: 'Some books not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Add books to series (ignore duplicates)
    const currentTimestamp = new Date().toISOString();
    const addedBooks: string[] = [];
    
    for (const bookId of book_ids) {
      try {
        const insertStmt = env.DB.prepare(`
          INSERT OR IGNORE INTO book_series (book_id, series_id, added_at)
          VALUES (?, ?, ?)
        `);
        
        const result = await insertStmt.bind(bookId, seriesId, currentTimestamp).run();
        
        // Check if insertion actually happened (not ignored due to existing entry)
        if (result.meta?.changes > 0 || result.changes > 0) {
          addedBooks.push(bookId);
        }
      } catch (error) {
        console.warn(`Error adding book ${bookId} to series:`, error);
      }
    }
    
    return new Response(JSON.stringify({ 
      message: `${addedBooks.length} books added to series`,
      added_books: addedBooks,
      skipped: book_ids.length - addedBooks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding books to series:', error);
    return new Response(JSON.stringify({ error: 'Failed to add books to series' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Remove book from series
export async function removeBookFromSeries(seriesId: string, bookId: string, userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Check if series exists and belongs to user
    const seriesStmt = env.DB.prepare('SELECT id FROM series WHERE id = ? AND user_id = ?');
    const series = await seriesStmt.bind(seriesId, userId).first();
    
    if (!series) {
      return new Response(JSON.stringify({ error: 'Series not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Remove book from series
    const removeStmt = env.DB.prepare('DELETE FROM book_series WHERE series_id = ? AND book_id = ?');
    const result = await removeStmt.bind(seriesId, bookId).run();
    
    if (result.meta?.changes === 0 && result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Book not found in series' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ message: 'Book removed from series successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error removing book from series:', error);
    return new Response(JSON.stringify({ error: 'Failed to remove book from series' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get books in a series
export async function getSeriesBooks(seriesId: string, userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const url = new URL(corsHeaders['request-url'] || 'https://example.com');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Check if series exists and belongs to user
    const seriesStmt = env.DB.prepare(`
      SELECT 
        s.id, s.user_id, s.name, s.description, s.color, 
        s.created_at, s.updated_at, s.sort_order
      FROM series s
      WHERE s.id = ? AND s.user_id = ?
    `);
    const series = await seriesStmt.bind(seriesId, userId).first();
    
    if (!series) {
      return new Response(JSON.stringify({ error: 'Series not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get books in the series with pagination
    const booksStmt = env.DB.prepare(`
      SELECT 
        b.id, b.isbn, b.title, b.authors, b.description, b.thumbnail,
        b.published_date, b.categories, b.tags, b.created_at,
        b.status, b.checked_out_by, b.checked_out_date, b.due_date,
        s.name as shelf_name,
        l.name as location_name,
        bs.added_at as added_to_series_at
      FROM book_series bs
      JOIN books b ON bs.book_id = b.id
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE bs.series_id = ?
      ORDER BY bs.added_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const result = await booksStmt.bind(seriesId, limit, offset).all();
    const books = result.results || [];
    
    // Get total count
    const countStmt = env.DB.prepare('SELECT COUNT(*) as total FROM book_series WHERE series_id = ?');
    const countResult = await countStmt.bind(seriesId).first() as any;
    const total = countResult?.total || 0;
    
    // Parse JSON fields
    const enhancedBooks = books.map((book: any) => ({
      ...book,
      authors: book.authors ? JSON.parse(book.authors) : [],
      categories: book.categories ? JSON.parse(book.categories) : [],
      tags: book.tags ? JSON.parse(book.tags) : []
    }));
    
    return new Response(JSON.stringify({
      series,
      books: enhancedBooks,
      total,
      page,
      limit
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching series books:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch series books' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}