// Dynamic Genre Management System
// Database operations for curated genres, book-genre relationships, and genre suggestions

import { D1Database } from '@cloudflare/workers-types'
import type { 
  CuratedGenre, 
  BookGenre, 
  GenreSuggestion,
  CreateGenreRequest,
  AssignGenreRequest,
  SuggestGenreRequest,
  ReviewGenreSuggestionRequest
} from '../types'

export class GenreService {
  constructor(private db: D1Database) {}

  // Curated Genres Operations
  
  async getAllActiveGenres(): Promise<CuratedGenre[]> {
    const stmt = this.db.prepare(`
      SELECT id, name, description, created_by as createdBy, 
             created_at as createdAt, updated_at as updatedAt, is_active as isActive
      FROM curated_genres 
      WHERE is_active = 1 
      ORDER BY name
    `)
    
    const result = await stmt.all()
    return result.results as unknown as CuratedGenre[]
  }

  async getAllGenres(): Promise<CuratedGenre[]> {
    const stmt = this.db.prepare(`
      SELECT id, name, description, created_by as createdBy, 
             created_at as createdAt, updated_at as updatedAt, is_active as isActive
      FROM curated_genres 
      ORDER BY name
    `)
    
    const result = await stmt.all()
    return result.results as unknown as CuratedGenre[]
  }

  async getGenreById(id: number): Promise<CuratedGenre | null> {
    const stmt = this.db.prepare(`
      SELECT id, name, description, created_by as createdBy, 
             created_at as createdAt, updated_at as updatedAt, is_active as isActive
      FROM curated_genres
      WHERE id = ? AND is_active = 1
    `)
    
    const result = await stmt.bind(id).first()
    return result ? (result as unknown as CuratedGenre) : null
  }

  async createGenre(request: CreateGenreRequest, createdBy: string): Promise<CuratedGenre> {
    const stmt = this.db.prepare(`
      INSERT INTO curated_genres (name, description, created_by)
      VALUES (?, ?, ?)
      RETURNING id, name, description, created_by as createdBy, 
                created_at as createdAt, updated_at as updatedAt, is_active as isActive
    `)
    
    const result = await stmt.bind(request.name, request.description || null, createdBy).first()
    if (!result) {
      throw new Error('Failed to create genre')
    }
    return result as unknown as CuratedGenre
  }

  async updateGenre(id: number, request: CreateGenreRequest): Promise<CuratedGenre | null> {
    const stmt = this.db.prepare(`
      UPDATE curated_genres 
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
      RETURNING id, name, description, created_by as createdBy, 
                created_at as createdAt, updated_at as updatedAt, is_active as isActive
    `)
    
    const result = await stmt.bind(request.name, request.description || null, id).first()
    return result ? (result as unknown as CuratedGenre) : null
  }

  async deactivateGenre(id: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE curated_genres 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    const result = await stmt.bind(id).run()
    return (result as any).changes > 0
  }

  // Book-Genre Relationship Operations

  async getBookGenres(bookId: number): Promise<BookGenre[]> {
    const stmt = this.db.prepare(`
      SELECT bg.id, bg.book_id as bookId, bg.genre_id as genreId,
             bg.assigned_by as assignedBy, bg.assigned_at as assignedAt,
             bg.is_auto_assigned as isAutoAssigned,
             g.id as genre_id, g.name as genre_name, g.description as genre_description,
             g.created_by as genre_createdBy, g.created_at as genre_createdAt,
             g.updated_at as genre_updatedAt, g.is_active as genre_isActive
      FROM book_genres bg
      JOIN curated_genres g ON bg.genre_id = g.id
      WHERE bg.book_id = ? AND g.is_active = TRUE
      ORDER BY g.name
    `)
    
    const result = await stmt.bind(bookId).all()
    return result.results.map((row: any) => ({
      id: row.id,
      bookId: row.bookId,
      genreId: row.genreId,
      assignedBy: row.assignedBy,
      assignedAt: row.assignedAt,
      isAutoAssigned: Boolean(row.isAutoAssigned),
      genre: {
        id: row.genre_id,
        name: row.genre_name,
        description: row.genre_description,
        createdBy: row.genre_createdBy,
        createdAt: row.genre_createdAt,
        updatedAt: row.genre_updatedAt,
        isActive: Boolean(row.genre_isActive)
      }
    })) as BookGenre[]
  }

  async assignGenreToBook(bookId: number, request: AssignGenreRequest, assignedBy: string): Promise<BookGenre | null> {
    // Check if already assigned
    const existingStmt = this.db.prepare(`
      SELECT id FROM book_genres WHERE book_id = ? AND genre_id = ?
    `)
    const existing = await existingStmt.bind(bookId, request.genreId).first()
    
    if (existing) {
      throw new Error('Genre already assigned to this book')
    }

    // Insert new assignment
    const insertStmt = this.db.prepare(`
      INSERT INTO book_genres (book_id, genre_id, assigned_by, is_auto_assigned)
      VALUES (?, ?, ?, ?)
      RETURNING id
    `)
    
    const insertResult = await insertStmt.bind(
      bookId, 
      request.genreId, 
      assignedBy, 
      request.isAutoAssigned || false
    ).first()
    
    if (!insertResult) {
      throw new Error('Failed to assign genre to book')
    }

    // Return the full BookGenre with genre details
    return this.getBookGenreById((insertResult as any).id)
  }

  async removeGenreFromBook(bookId: number, genreId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      DELETE FROM book_genres WHERE book_id = ? AND genre_id = ?
    `)
    
    const result = await stmt.bind(bookId, genreId).run()
    return (result as any).changes > 0
  }

  private async getBookGenreById(id: number): Promise<BookGenre | null> {
    const stmt = this.db.prepare(`
      SELECT bg.id, bg.book_id as bookId, bg.genre_id as genreId,
             bg.assigned_by as assignedBy, bg.assigned_at as assignedAt,
             bg.is_auto_assigned as isAutoAssigned,
             g.id as genre_id, g.name as genre_name, g.description as genre_description,
             g.created_by as genre_createdBy, g.created_at as genre_createdAt,
             g.updated_at as genre_updatedAt, g.is_active as genre_isActive
      FROM book_genres bg
      JOIN curated_genres g ON bg.genre_id = g.id
      WHERE bg.id = ?
    `)
    
    const result = await stmt.bind(id).first()
    if (!result) return null
    
    const row = result as any
    return {
      id: row.id,
      bookId: row.bookId,
      genreId: row.genreId,
      assignedBy: row.assignedBy,
      assignedAt: row.assignedAt,
      isAutoAssigned: Boolean(row.isAutoAssigned),
      genre: {
        id: row.genre_id,
        name: row.genre_name,
        description: row.genre_description,
        createdBy: row.genre_createdBy,
        createdAt: row.genre_createdAt,
        updatedAt: row.genre_updatedAt,
        isActive: Boolean(row.genre_isActive)
      }
    } as BookGenre
  }

  // Genre Suggestions Operations

  async createGenreSuggestion(request: SuggestGenreRequest, suggestedBy: string): Promise<GenreSuggestion> {
    const stmt = this.db.prepare(`
      INSERT INTO genre_suggestions (suggested_name, description, suggested_by, book_id)
      VALUES (?, ?, ?, ?)
      RETURNING id, suggested_name as suggestedName, description, suggested_by as suggestedBy,
                book_id as bookId, status, reviewed_by as reviewedBy, reviewed_at as reviewedAt,
                review_comment as reviewComment, created_at as createdAt
    `)
    
    const result = await stmt.bind(
      request.suggestedName,
      request.description || null,
      suggestedBy,
      request.bookId || null
    ).first()
    
    if (!result) {
      throw new Error('Failed to create genre suggestion')
    }
    return result as unknown as GenreSuggestion
  }

  async getPendingGenreSuggestions(): Promise<GenreSuggestion[]> {
    const stmt = this.db.prepare(`
      SELECT id, suggested_name as suggestedName, description, suggested_by as suggestedBy,
             book_id as bookId, status, reviewed_by as reviewedBy, reviewed_at as reviewedAt,
             review_comment as reviewComment, created_at as createdAt
      FROM genre_suggestions 
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `)
    
    const result = await stmt.all()
    return result.results as unknown as GenreSuggestion[]
  }

  async getUserGenreSuggestions(userId: string): Promise<GenreSuggestion[]> {
    const stmt = this.db.prepare(`
      SELECT id, suggested_name as suggestedName, description, suggested_by as suggestedBy,
             book_id as bookId, status, reviewed_by as reviewedBy, reviewed_at as reviewedAt,
             review_comment as reviewComment, created_at as createdAt
      FROM genre_suggestions 
      WHERE suggested_by = ?
      ORDER BY created_at DESC
    `)
    
    const result = await stmt.bind(userId).all()
    return result.results as unknown as GenreSuggestion[]
  }

  async reviewGenreSuggestion(
    id: number, 
    request: ReviewGenreSuggestionRequest, 
    reviewedBy: string
  ): Promise<GenreSuggestion | null> {
    const stmt = this.db.prepare(`
      UPDATE genre_suggestions 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_comment = ?
      WHERE id = ? AND status = 'pending'
      RETURNING id, suggested_name as suggestedName, description, suggested_by as suggestedBy,
                book_id as bookId, status, reviewed_by as reviewedBy, reviewed_at as reviewedAt,
                review_comment as reviewComment, created_at as createdAt
    `)
    
    const result = await stmt.bind(
      request.status,
      reviewedBy,
      request.reviewComment || null,
      id
    ).first()
    
    return result ? (result as unknown as GenreSuggestion) : null
  }

  // Utility Operations

  async getGenreUsageStats(): Promise<Array<{genreName: string, bookCount: number}>> {
    const stmt = this.db.prepare(`
      SELECT g.name as genreName, COUNT(bg.book_id) as bookCount
      FROM curated_genres g
      LEFT JOIN book_genres bg ON g.id = bg.genre_id
      WHERE g.is_active = TRUE
      GROUP BY g.id, g.name
      ORDER BY bookCount DESC, g.name
    `)
    
    const result = await stmt.all()
    return result.results as Array<{genreName: string, bookCount: number}>
  }

  async searchGenres(query: string): Promise<CuratedGenre[]> {
    const stmt = this.db.prepare(`
      SELECT id, name, description, created_by as createdBy, 
             created_at as createdAt, updated_at as updatedAt, is_active as isActive
      FROM curated_genres 
      WHERE is_active = 1 AND (name LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
        name
      LIMIT 20
    `)
    
    const searchTerm = `%${query}%`
    const exactMatch = `${query}%`
    
    const result = await stmt.bind(searchTerm, searchTerm, exactMatch).all()
    return result.results as unknown as CuratedGenre[]
  }
}