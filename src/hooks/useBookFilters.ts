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
    console.log('🔧 useBookFilters - received initialFilters:', initialFilters)
    if (initialFilters) {
      if (initialFilters.location) setLocationFilter(initialFilters.location)
      if (initialFilters.shelf) setShelfFilter(initialFilters.shelf)
      if (initialFilters.status) setCheckoutFilter(initialFilters.status)
      if (initialFilters.searchTerm) {
        console.log('🔧 Setting searchTerm from URL:', JSON.stringify(initialFilters.searchTerm))
        setSearchTerm(initialFilters.searchTerm)
      }
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

  // Use only genres that are actually displayed as chips in the book listings (for dropdown)
  // Note: Only the FIRST genre from getDisplayGenres is shown as a chip
  // Filter by current location and shelf to show only relevant genres
  const allCategories = useMemo(() => {
    const allDisplayedGenres = new Set<string>()
    
    // Filter books by current location and shelf context
    const contextFilteredBooks = books.filter(book => {
      // Apply location filter if set
      if (locationFilter) {
        const shelf = shelves.find(s => s.id === book.shelf_id)
        if (!shelf) return false
        
        // For admin users, use allLocations
        if (isAdmin(userRole)) {
          const location = allLocations.find(l => l.id === shelf.location_id)
          if (location?.name !== locationFilter) return false
        } else {
          // For regular users, use userLocations
          const location = userLocations?.find(l => l.id === shelf.location_id)
          if (location?.name !== locationFilter) return false
        }
      } else if (!isAdmin(userRole) && currentLocation) {
        // For regular users with no explicit location filter, show only books from current location
        const shelf = shelves.find(s => s.id === book.shelf_id)
        if (!shelf || shelf.location_id !== currentLocation.id) return false
      }
      
      // Apply shelf filter if set
      if (shelfFilter && book.shelf_name !== shelfFilter) {
        return false
      }
      
      return true
    })
    
    contextFilteredBooks.forEach(book => {
      // Get the first genre that would be displayed as a chip using the same logic as the UI
      // Priority 1: First assigned curated genre
      if (book.assignedGenres && book.assignedGenres.length > 0) {
        allDisplayedGenres.add(book.assignedGenres[0].name)
      }
      // Priority 2: First enhanced auto-classified genre (only if no assigned genres)
      else if (book.enhancedGenres && book.enhancedGenres.length > 0) {
        allDisplayedGenres.add(book.enhancedGenres[0])
      }
      // Priority 3: First raw category from Google Books (only if no assigned or enhanced genres)
      else if (book.categories && book.categories.length > 0) {
        allDisplayedGenres.add(book.categories[0])
      }
    })
    
    return Array.from(allDisplayedGenres).sort()
  }, [books, locationFilter, shelfFilter, shelves, allLocations, userLocations, currentLocation, userRole])

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

  // Memoized filter predicates for performance optimization
  const filterPredicates = useMemo(() => {
    // Create optimized search predicate with pre-computed lowercase terms
    const createSearchPredicate = (searchTerm: string) => {
      if (!searchTerm) return () => true
      const searchLower = searchTerm.toLowerCase()
      
      // Handle special "missing:" queries for data quality filtering
      if (searchLower.startsWith('missing:')) {
        const missingType = searchLower.replace('missing:', '').trim()
        console.log('🔍 Missing type detected:', JSON.stringify(missingType))
        
        return (book: EnhancedBook) => {
          switch (missingType) {
            case 'genre':
              // Check if book has no genres at all
              const hasAssignedGenres = book.assignedGenres && book.assignedGenres.length > 0
              const hasEnhancedGenres = book.enhancedGenres && book.enhancedGenres.length > 0
              const hasCategories = book.categories && book.categories.length > 0
              const isMissingGenre = !hasAssignedGenres && !hasEnhancedGenres && !hasCategories
              
              if (isMissingGenre) {
                console.log('📚 Found missing genre book:', book.title, {
                  assignedGenres: book.assignedGenres,
                  enhancedGenres: book.enhancedGenres, 
                  categories: book.categories
                })
              }
              
              return isMissingGenre
            
            case 'cover':
              return !book.thumbnail || book.thumbnail.trim() === ''
            
            case 'location':
              return !book.shelf_name || book.shelf_name.trim() === ''
            
            case 'isbn':
              return !book.isbn || book.isbn.trim() === ''
            
            case 'author':
              return !book.authors || book.authors.length === 0 || 
                     book.authors.every(author => !author || author.trim() === '')
            
            case 'title':
              return !book.title || book.title.trim() === ''
            
            default:
              return false
          }
        }
      }
      
      // Regular search functionality
      return (book: EnhancedBook) => {
        // Early return optimizations
        if (book.isbn && book.isbn.includes(searchTerm)) return true
        
        const titleLower = book.title.toLowerCase()
        if (titleLower.includes(searchLower)) return true
        
        return book.authors.some(author => 
          author.toLowerCase().includes(searchLower)
        )
      }
    }

    // Create optimized genre filter predicate
    const createGenrePredicate = (categoryFilters: string[]) => {
      if (categoryFilters.length === 0) return () => true
      
      // Pre-compute lowercase filters for performance
      const filterLookup = new Set(categoryFilters.map(f => f.toLowerCase()))
      
      return (book: EnhancedBook) => {
        // Quick check: assigned genres (highest priority)
        if (book.assignedGenres) {
          for (const genre of book.assignedGenres) {
            if (filterLookup.has(genre.name.toLowerCase())) return true
          }
        }
        
        // Enhanced genres check
        if (book.enhancedGenres) {
          for (const genre of book.enhancedGenres) {
            if (filterLookup.has(genre.toLowerCase())) return true
          }
        }
        
        // Raw categories and subjects with optimized compound genre logic
        const rawGenres = [...(book.categories || []), ...(book.subjects || [])]
        return categoryFilters.some(curatedGenre => {
          const curatedLower = curatedGenre.toLowerCase()
          
          return rawGenres.some(rawGenre => {
            const rawLower = rawGenre.toLowerCase()
            
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
            
            // For multi-word genres, require ALL words to be present
            if (curatedGenre.includes(' ')) {
              const curatedWords = curatedLower.split(/\s+/).filter(word => word.length > 2)
              const rawWords = rawLower.split(/\s+|[,&-]+/).filter(word => word.length > 2)
              return curatedWords.every(curatedWord => rawWords.includes(curatedWord))
            }
            
            // Single-word genre matching
            if (rawLower.includes(curatedLower) || curatedLower.includes(rawLower)) {
              return true
            }
            
            // Fallback: exact word match
            const rawWords = rawLower.split(/\s+|[,&-]+/).filter(word => word.length > 2)
            return rawWords.includes(curatedLower)
          })
        })
      }
    }

    // Create optimized location filter predicate
    const createLocationPredicate = (locationFilter: string) => {
      if (!locationFilter) {
        // Handle default location filtering for non-admin users
        if (!isAdmin(userRole) && currentLocation) {
          return (book: EnhancedBook) => {
            const shelf = shelves.find(s => s.id === book.shelf_id)
            return shelf ? shelf.location_id === currentLocation.id : false
          }
        }
        return () => true
      }
      
      return (book: EnhancedBook) => {
        const shelf = shelves.find(s => s.id === book.shelf_id)
        if (!shelf) return false
        
        if (isAdmin(userRole)) {
          const location = allLocations.find(l => l.id === shelf.location_id)
          return location?.name === locationFilter
        } else {
          const location = userLocations?.find(l => l.id === shelf.location_id)
          return location?.name === locationFilter
        }
      }
    }

    // Create optimized checkout status predicate
    const createCheckoutPredicate = (checkoutFilter: string) => {
      if (!checkoutFilter) return () => true
      
      return (book: EnhancedBook) => {
        const isCheckedOut = book.checked_out_by && book.checked_out_by !== ''
        if (checkoutFilter === 'checked_out') return isCheckedOut
        if (checkoutFilter === 'available') return !isCheckedOut
        return true
      }
    }

    // Create optimized author filter predicate
    const createAuthorPredicate = (authorFilter: string) => {
      if (!authorFilter) return () => true
      const authorLower = authorFilter.toLowerCase()
      
      return (book: EnhancedBook) => {
        return book.authors.some(author => 
          author.toLowerCase().includes(authorLower)
        )
      }
    }

    return {
      searchPredicate: createSearchPredicate(searchTerm),
      genrePredicate: createGenrePredicate(categoryFilter),
      shelfPredicate: shelfFilter ? (book: EnhancedBook) => book.shelf_name === shelfFilter : () => true,
      locationPredicate: createLocationPredicate(locationFilter),
      checkoutPredicate: createCheckoutPredicate(checkoutFilter),
      authorPredicate: createAuthorPredicate(authorFilter)
    }
  }, [searchTerm, categoryFilter, shelfFilter, locationFilter, checkoutFilter, authorFilter, 
      shelves, allLocations, userLocations, currentLocation, userRole])

  // Optimized filtering and sorting with single pass and memoized predicates
  const filteredAndSortedBooks = useMemo(() => {
    // Single pass filtering with early returns for performance
    const filtered = books.filter(book => {
      // Apply all filter predicates with short-circuiting
      return filterPredicates.searchPredicate(book) &&
             filterPredicates.genrePredicate(book) &&
             filterPredicates.shelfPredicate(book) &&
             filterPredicates.locationPredicate(book) &&
             filterPredicates.checkoutPredicate(book) &&
             filterPredicates.authorPredicate(book)
    })

    // Apply sorting with optimized comparison functions
    return [...filtered].sort((a, b) => {
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
  }, [books, filterPredicates, sortField, sortDirection])

  // Update state-based filteredBooks for backward compatibility
  useEffect(() => {
    setFilteredBooks(filteredAndSortedBooks)
  }, [filteredAndSortedBooks])

  // Separate effect to reset pagination only when filter criteria change (not when book data changes)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, shelfFilter, categoryFilter, locationFilter, checkoutFilter, authorFilter, sortField, sortDirection])

  // Ensure current page is valid when filtered books change (but don't reset unnecessarily)
  useEffect(() => {
    if (filteredBooks.length > 0) {
      const maxPage = Math.ceil(filteredBooks.length / booksPerPage)
      if (currentPage > maxPage) {
        setCurrentPage(maxPage)
      }
    }
  }, [filteredBooks.length, booksPerPage, currentPage])

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