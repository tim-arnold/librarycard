import type { EnhancedBook } from '@/lib/types'

// Pagination helper functions
export function getPaginatedBooks(books: EnhancedBook[], currentPage: number, booksPerPage: number): EnhancedBook[] {
  const startIndex = (currentPage - 1) * booksPerPage
  const endIndex = startIndex + booksPerPage
  return books.slice(startIndex, endIndex)
}

export function getTotalPages(books: EnhancedBook[], booksPerPage: number): number {
  return Math.ceil(books.length / booksPerPage)
}

// Book sorting utilities
export type SortField = 'title' | 'author' | 'publishedDate' | 'dateAdded'
export type SortDirection = 'asc' | 'desc'

export function sortBooks(books: EnhancedBook[], sortField: SortField, sortDirection: SortDirection): EnhancedBook[] {
  return [...books].sort((a, b) => {
    let comparison = 0
    
    switch (sortField) {
      case 'title':
        // Remove articles (a, an, the) for better alphabetical sorting
        const titleA = a.title.replace(/^(the|a|an)\s+/i, '').trim()
        const titleB = b.title.replace(/^(the|a|an)\s+/i, '').trim()
        comparison = titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' })
        break
      case 'author':
        // Sort by last name when possible (look for comma, otherwise use last word)
        const getAuthorSortKey = (authors: string[]) => {
          if (authors.length === 0) return 'zzz' // Put books without authors at the end
          const firstAuthor = authors[0]
          // If author is in "Last, First" format, use that directly
          if (firstAuthor.includes(',')) {
            return firstAuthor.toLowerCase()
          }
          // Otherwise, try to extract last name
          const words = firstAuthor.trim().split(/\s+/)
          const lastName = words[words.length - 1]
          return lastName.toLowerCase()
        }
        const authorA = getAuthorSortKey(a.authors)
        const authorB = getAuthorSortKey(b.authors)
        comparison = authorA.localeCompare(authorB, undefined, { numeric: true, sensitivity: 'base' })
        break
      case 'publishedDate':
        // Handle missing publication dates by treating them as very old dates for ascending, very new for descending
        const getDateValue = (dateStr?: string) => {
          if (!dateStr) return sortDirection === 'asc' ? -Infinity : Infinity
          const date = new Date(dateStr)
          return isNaN(date.getTime()) ? (sortDirection === 'asc' ? -Infinity : Infinity) : date.getTime()
        }
        const dateA = getDateValue(a.publishedDate)
        const dateB = getDateValue(b.publishedDate)
        comparison = dateA - dateB
        break
      case 'dateAdded':
        // For now, use the book ID as a proxy for date added (since newer books typically have higher IDs)
        // In a future enhancement, we could add an actual dateAdded field to the database
        const idA = parseInt(a.id) || 0
        const idB = parseInt(b.id) || 0
        comparison = idA - idB
        break
      default:
        comparison = 0
    }
    
    return sortDirection === 'desc' ? -comparison : comparison
  })
}