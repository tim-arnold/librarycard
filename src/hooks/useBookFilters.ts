'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { EnhancedBook } from '@/lib/types'
import { getStorageItem, setStorageItem } from '@/lib/storage'
import { nameToSlug } from '@/lib/urlUtils'
import { isAdmin } from '@/lib/permissions'

interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
}

interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
}

export type SortField = 'title' | 'author' | 'publishedDate' | 'dateAdded'
export type SortDirection = 'asc' | 'desc'

interface UseBookFiltersProps {
  books: EnhancedBook[]
  shelves: Shelf[]
  allLocations: Location[]
  userLocations?: Location[]
  currentLocation?: Location | null
  userRole: string | null
  isLoading: boolean
  initialFilters?: {
    location?: string
    shelf?: string
    status?: string
    searchTerm?: string
    category?: string
  }
}

export function useBookFilters({
  books,
  shelves,
  allLocations,
  userLocations,
  currentLocation,
  userRole,
  isLoading,
  initialFilters
}: UseBookFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [shelfFilter, setShelfFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState('')
  const [checkoutFilter, setCheckoutFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // View preferences
  const [viewMode, setViewMode] = useState<'card' | 'compact' | 'list'>('card')
  const [currentPage, setCurrentPage] = useState(1)
  const [booksPerPage, setBooksPerPage] = useState(25)
  
  // Filtered and sorted books
  const [filteredBooks, setFilteredBooks] = useState<EnhancedBook[]>([])

  // Initialize filters from URL on mount
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.location) setLocationFilter(initialFilters.location)
      if (initialFilters.shelf) setShelfFilter(initialFilters.shelf)
      if (initialFilters.status) setCheckoutFilter(initialFilters.status)
      if (initialFilters.searchTerm) setSearchTerm(initialFilters.searchTerm)
      // Note: categoryFilter is not restored from URL to avoid race conditions
    }
  }, [initialFilters])

  // Load saved view preferences from localStorage
  useEffect(() => {
    const savedViewMode = getStorageItem('library-view-mode', 'functional') as 'card' | 'compact' | 'list'
    if (savedViewMode && (savedViewMode === 'card' || savedViewMode === 'compact' || savedViewMode === 'list')) {
      setViewMode(savedViewMode)
    }
    
    const savedBooksPerPage = getStorageItem('library-books-per-page', 'functional')
    if (savedBooksPerPage) {
      const numericValue = parseInt(savedBooksPerPage, 10)
      if (!isNaN(numericValue) && [10, 25, 50, 100].includes(numericValue)) {
        setBooksPerPage(numericValue)
      }
    }
  }, [])

  // Reset shelf filter when location changes (only if shelf doesn't belong to new location)
  useEffect(() => {
    // Only reset shelf filter if the current shelf doesn't exist in the new location
    if (locationFilter && shelfFilter) {
      const filteredShelves = shelves.filter(shelf => {
        const location = allLocations.find(loc => loc.id === shelf.location_id)
        return location?.name === locationFilter
      })
      
      // If current shelf doesn't exist in the new location, reset to "All shelves"
      const shelfExistsInLocation = filteredShelves.some(shelf => shelf.name === shelfFilter)
      if (!shelfExistsInLocation) {
        setShelfFilter('')
      }
    }
  }, [locationFilter, shelves, allLocations, shelfFilter])

  // Helper function for dropdown generation - only check enhanced genres and categories
  const bookHasGenreForDropdown = (book: EnhancedBook, curatedGenre: string): boolean => {
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
  const bookMatchesGenreFilter = (book: EnhancedBook, curatedGenre: string): boolean => {
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

  // Use curated genres that actually have books mapped to them in the user's library (categories only for dropdown)
  const allCategories = useMemo(() => {
    // Get all assigned genres from books in the library
    const assignedGenres = new Set<string>()
    books.forEach(book => {
      if (book.assignedGenres) {
        book.assignedGenres.forEach(genre => assignedGenres.add(genre.name))
      }
    })
    
    // Get enhanced genres (curated genres from classification)
    const existingGenres = new Set<string>()
    books.forEach(book => {
      // Add enhanced genres (curated genres from classification)
      if (book.enhancedGenres) {
        book.enhancedGenres.forEach(genre => existingGenres.add(genre))
      }
    })
    
    // Combine all possible genres
    const allPossibleGenres = new Set([...Array.from(assignedGenres), ...Array.from(existingGenres)])
    
    const finalGenres = Array.from(allPossibleGenres).filter(curatedGenre => {
      return books.some(book => bookHasGenreForDropdown(book, curatedGenre))
    }).sort()
    
    return finalGenres
  }, [books])

  // Generate URL path based on current filters
  const generateFilterUrl = useCallback(() => {
    const segments = []
    
    // Add location if set (convert to slug)
    if (locationFilter) segments.push(nameToSlug(locationFilter))
    
    // Add shelf if set (only if location is also set, convert to slug)
    if (shelfFilter && locationFilter) segments.push(nameToSlug(shelfFilter))
    
    // Create base path
    const basePath = segments.length > 0 ? `/library/${segments.join('/')}` : '/library'
    
    // Add search params for other filters
    const searchParams = new URLSearchParams()
    if (searchTerm) searchParams.set('search', searchTerm)
    // Note: categoryFilter is not included in URL to avoid race conditions
    if (checkoutFilter) searchParams.set('status', checkoutFilter)
    
    return basePath + (searchParams.toString() ? `?${searchParams.toString()}` : '')
  }, [locationFilter, shelfFilter, checkoutFilter, searchTerm])

  // Debounce URL updates to prevent rapid navigation
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Update URL when filters change (only after component is fully loaded)
  useEffect(() => {
    // Don't update URL until component is loaded and has data
    if (isLoading) return
    
    // Clear existing timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }
    
    // Use longer debounce to prevent blinking during active filtering
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const newUrl = generateFilterUrl()
      if (pathname !== newUrl) {
        // Update browser history without triggering navigation
        window.history.replaceState({}, '', newUrl)
      }
    }, 1000) // 1 second debounce - only update URL when user stops interacting
    
    // Cleanup timeout on unmount
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current)
      }
    }
  }, [generateFilterUrl, pathname, router, isLoading])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = books

    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.authors.some(author => 
          author.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        book.isbn.includes(searchTerm)
      )
    }

    if (shelfFilter) {
      filtered = filtered.filter(book => book.shelf_name === shelfFilter)
    }

    if (categoryFilter.length > 0) {
      filtered = filtered.filter(book => 
        categoryFilter.some(genre => bookMatchesGenreFilter(book, genre))
      )
    }

    // Location filter - applies to both admin and regular users
    if (locationFilter) {
      filtered = filtered.filter(book => {
        const shelf = shelves.find(s => s.id === book.shelf_id)
        if (!shelf) return false
        
        // For admin users, use allLocations
        if (isAdmin(userRole)) {
          const location = allLocations.find(l => l.id === shelf.location_id)
          return location?.name === locationFilter
        } else {
          // For regular users, use userLocations
          const location = userLocations?.find(l => l.id === shelf.location_id)
          return location?.name === locationFilter
        }
      })
    } else if (!isAdmin(userRole) && currentLocation) {
      // For regular users with no explicit location filter, show only books from current location
      filtered = filtered.filter(book => {
        const shelf = shelves.find(s => s.id === book.shelf_id)
        if (!shelf) return false
        return shelf.location_id === currentLocation.id
      })
    }

    // Checkout status filter
    if (checkoutFilter) {
      filtered = filtered.filter(book => {
        const isCheckedOut = book.checked_out_by && book.checked_out_by !== ''
        if (checkoutFilter === 'checked_out') {
          return isCheckedOut
        } else if (checkoutFilter === 'available') {
          return !isCheckedOut
        }
        return true
      })
    }

    // Author filter
    if (authorFilter) {
      filtered = filtered.filter(book =>
        book.authors.some(author => 
          author.toLowerCase().includes(authorFilter.toLowerCase())
        )
      )
    }

    // Apply sorting (create new array to ensure React detects the change)
    filtered = [...filtered].sort((a, b) => {
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

    setFilteredBooks(filtered)
    // Reset to first page when filters or sorting change
    setCurrentPage(1)
  }, [books, searchTerm, shelfFilter, categoryFilter, locationFilter, checkoutFilter, authorFilter, userRole, shelves, allLocations, userLocations, currentLocation, sortField, sortDirection])

  // Pagination functions
  const getPaginatedBooks = (books: EnhancedBook[]) => {
    const startIndex = (currentPage - 1) * booksPerPage
    const endIndex = startIndex + booksPerPage
    return books.slice(startIndex, endIndex)
  }

  const getTotalPages = (books: EnhancedBook[]) => {
    return Math.ceil(books.length / booksPerPage)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Memoized paginated books to prevent stale renders
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * booksPerPage
    const endIndex = startIndex + booksPerPage
    return filteredBooks.slice(startIndex, endIndex)
  }, [filteredBooks, currentPage, booksPerPage])

  // View mode handlers
  const handleViewModeChange = (newViewMode: 'card' | 'compact' | 'list') => {
    setViewMode(newViewMode)
    setStorageItem('library-view-mode', newViewMode, 'functional')
  }

  const handleBooksPerPageChange = (newBooksPerPage: number) => {
    setBooksPerPage(newBooksPerPage)
    setStorageItem('library-books-per-page', newBooksPerPage.toString(), 'functional')
    // Reset to first page when changing books per page
    setCurrentPage(1)
  }

  // Filter handlers
  const handleGenreRemove = (genreToRemove: string) => {
    setCategoryFilter(categoryFilter.filter(g => g !== genreToRemove))
  }

  const handleAuthorClick = (authorName: string) => {
    // Clear other filters to focus on this author
    setSearchTerm('')
    setShelfFilter('')
    setCategoryFilter([])
    setCheckoutFilter('')
    
    // Set the author filter
    setAuthorFilter(authorName)
  }

  const handleSortFieldChange = (newSortField: SortField) => {
    setSortField(newSortField)
  }

  const handleSortDirectionChange = (newSortDirection: SortDirection) => {
    setSortDirection(newSortDirection)
  }

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    shelfFilter,
    setShelfFilter,
    categoryFilter,
    setCategoryFilter,
    locationFilter,
    setLocationFilter,
    checkoutFilter,
    setCheckoutFilter,
    authorFilter,
    setAuthorFilter,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    
    // View preferences
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    booksPerPage,
    setBooksPerPage,
    
    // Computed values
    filteredBooks,
    paginatedBooks,
    allCategories,
    
    // Handlers
    handleViewModeChange,
    handleBooksPerPageChange,
    handleGenreRemove,
    handleAuthorClick,
    handleSortFieldChange,
    handleSortDirectionChange,
    handlePageChange,
    
    // Pagination helpers
    getPaginatedBooks,
    getTotalPages,
  }
}