import type { EnhancedBook } from '@/lib/types'

// Helper function for dropdown generation - only check enhanced genres and categories
export function bookHasGenreForDropdown(book: EnhancedBook, curatedGenre: string): boolean {
  // Check assigned genres first (these are user-selected and highest priority)
  if (book.assignedGenres) {
    const curatedLower = curatedGenre.toLowerCase()
    const hasMatch = book.assignedGenres.some(genre => genre.name.toLowerCase() === curatedLower)
    if (hasMatch) {
      return true
    }
  }
  
  // Check enhanced genres (these are already curated) - use case-insensitive matching
  if (book.enhancedGenres) {
    const curatedLower = curatedGenre.toLowerCase()
    const hasMatch = book.enhancedGenres.some(genre => genre.toLowerCase() === curatedLower)
    if (hasMatch) {
      return true
    }
  }
  
  // For raw categories only, use flexible matching for compound genres
  const rawGenres = book.categories || []
  return rawGenres.some(rawGenre => {
    const rawLower = rawGenre.toLowerCase()
    const curatedLower = curatedGenre.toLowerCase()
    
    // Handle special compound genres FIRST to prevent incorrect matches
    if (curatedGenre === 'Historical Fiction') {
      // Only match explicit historical fiction references, never horror/fantasy/sci-fi
      if (rawLower.includes('horror') || rawLower.includes('fantasy') || rawLower.includes('science fiction')) {
        return false
      }
      return rawLower.includes('historical fiction') || 
             (rawLower.includes('fiction') && rawLower.includes('historical'))
    }
    
    if (curatedGenre === 'Literary Fiction') {
      // Only match explicit literary fiction references, never horror/fantasy/sci-fi
      if (rawLower.includes('horror') || rawLower.includes('fantasy') || rawLower.includes('science fiction')) {
        return false
      }
      return rawLower.includes('literary fiction') ||
             (rawLower.includes('fiction') && rawLower.includes('literary'))
    }
    
    if (curatedGenre === 'Young Adult') {
      return rawLower.includes('young adult') || rawLower.includes('juvenile') || 
             (rawLower.includes('young') && rawLower.includes('adult'))
    }
    
    // For multi-word genres, require ALL words to be present (not just any single word)
    // This prevents "Science Fiction" from matching books that only have "Fiction"
    if (curatedGenre.includes(' ')) {
      const curatedWords = curatedLower.split(/\s+/).filter(word => word.length > 2)
      const rawWords = rawLower.split(/\s+|[,&-]+/).filter(word => word.length > 2)
      
      // Require ALL words from the curated genre to be present in the raw text
      return curatedWords.every(curatedWord => rawWords.includes(curatedWord))
    }
    
    // Single-word genre matching - check both exact substring and word boundaries
    if (rawLower.includes(curatedLower) || curatedLower.includes(rawLower)) {
      return true
    }
    
    // Fallback: exact word match in word boundaries for single words
    const rawWords = rawLower.split(/\s+|[,&-]+/).filter(word => word.length > 2)
    return rawWords.includes(curatedLower)
  })
}

// Helper function to check if a book matches a curated genre filter - includes subjects for comprehensive filtering
export function bookMatchesGenreFilter(book: EnhancedBook, curatedGenre: string): boolean {
  // Check assigned genres first (these are user-selected and highest priority)
  if (book.assignedGenres) {
    const curatedLower = curatedGenre.toLowerCase()
    const hasMatch = book.assignedGenres.some(genre => genre.name.toLowerCase() === curatedLower)
    if (hasMatch) {
      return true
    }
  }
  
  // Check enhanced genres (these are already curated) - use case-insensitive matching
  if (book.enhancedGenres) {
    const curatedLower = curatedGenre.toLowerCase()
    const hasMatch = book.enhancedGenres.some(genre => genre.toLowerCase() === curatedLower)
    if (hasMatch) {
      return true
    }
  }
  
  // For raw categories and subjects, use flexible matching for compound genres
  const rawGenres = [...(book.categories || []), ...(book.subjects || [])]
  return rawGenres.some(rawGenre => {
    const rawLower = rawGenre.toLowerCase()
    const curatedLower = curatedGenre.toLowerCase()
    
    // Handle special compound genres FIRST to prevent incorrect matches
    if (curatedGenre === 'Historical Fiction') {
      // Only match explicit historical fiction references, never horror/fantasy/sci-fi
      if (rawLower.includes('horror') || rawLower.includes('fantasy') || rawLower.includes('science fiction')) {
        return false
      }
      return rawLower.includes('historical fiction') || 
             (rawLower.includes('fiction') && rawLower.includes('historical'))
    }
    
    if (curatedGenre === 'Literary Fiction') {
      // Only match explicit literary fiction references, never horror/fantasy/sci-fi
      if (rawLower.includes('horror') || rawLower.includes('fantasy') || rawLower.includes('science fiction')) {
        return false
      }
      return rawLower.includes('literary fiction') ||
             (rawLower.includes('fiction') && rawLower.includes('literary'))
    }
    
    if (curatedGenre === 'Young Adult') {
      return rawLower.includes('young adult') || rawLower.includes('juvenile') || 
             (rawLower.includes('young') && rawLower.includes('adult'))
    }
    
    // For multi-word genres, require ALL words to be present (not just any single word)
    // This prevents "Science Fiction" from matching books that only have "Fiction"
    if (curatedGenre.includes(' ')) {
      const curatedWords = curatedLower.split(/\s+/).filter(word => word.length > 2)
      const rawWords = rawLower.split(/\s+|[,&-]+/).filter(word => word.length > 2)
      
      // Require ALL words from the curated genre to be present in the raw text
      return curatedWords.every(curatedWord => rawWords.includes(curatedWord))
    }
    
    // Single-word genre matching - check both exact substring and word boundaries
    if (rawLower.includes(curatedLower) || curatedLower.includes(rawLower)) {
      return true
    }
    
    // Fallback: exact word match in word boundaries for single words
    const rawWords = rawLower.split(/\s+|[,&-]+/).filter(word => word.length > 2)
    return rawWords.includes(curatedLower)
  })
}