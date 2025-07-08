import type { EnhancedBook } from './types'

/**
 * Gets the display genres for a book using fallback logic:
 * 1. assignedGenres (new curated selections)
 * 2. enhancedGenres (existing auto-classified)  
 * 3. categories (raw Google Books data)
 */
export function getDisplayGenres(book: EnhancedBook): { genres: string[], source: 'assigned' | 'enhanced' | 'categories' } {
  // Priority 1: Assigned curated genres
  if (book.assignedGenres && book.assignedGenres.length > 0) {
    return {
      genres: book.assignedGenres.map(genre => genre.name),
      source: 'assigned'
    }
  }
  
  // Priority 2: Enhanced auto-classified genres
  if (book.enhancedGenres && book.enhancedGenres.length > 0) {
    return {
      genres: book.enhancedGenres,
      source: 'enhanced'
    }
  }
  
  // Priority 3: Raw categories from Google Books
  if (book.categories && book.categories.length > 0) {
    return {
      genres: book.categories,
      source: 'categories'
    }
  }
  
  // Fallback: No genres available
  return {
    genres: [],
    source: 'categories'
  }
}

/**
 * Checks if a book has any assigned curated genres
 */
export function hasAssignedGenres(book: EnhancedBook): boolean {
  return Boolean(book.assignedGenres && book.assignedGenres.length > 0)
}

/**
 * Gets the genre source for display purposes
 */
export function getGenreSourceLabel(source: 'assigned' | 'enhanced' | 'categories'): string {
  switch (source) {
    case 'assigned':
      return 'Curated'
    case 'enhanced':
      return 'Auto-classified'
    case 'categories':
      return 'Original'
    default:
      return ''
  }
}