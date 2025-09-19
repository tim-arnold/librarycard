'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  CircularProgress,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material'
import {
  Search,
  Add,
  CheckCircle,
  Clear,
  Warning,
  CheckBox,
  CheckBoxOutlineBlank,
  Book,
  Public,
  PhoneAndroid,
} from '@mui/icons-material'
import type { EnhancedBook, GoogleBookItem } from '@/lib/types'
import { useBookSelection } from '@/contexts/BookSelectionContext'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { useSession } from 'next-auth/react'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

// Utility function to ensure Google Books thumbnail URLs use HTTPS
function ensureHttps(url: string | undefined): string | undefined {
  if (!url) return url
  if (url.startsWith('http://books.google.com/')) {
    return url.replace('http://books.google.com/', 'https://books.google.com/')
  }
  return url
}

interface BookSearchProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onBookSelected: (item: GoogleBookItem) => void
  onError: (title: string, message: string) => void
  existingBooks: EnhancedBook[]
  justAddedBooks: Set<string>
  disabled?: boolean
  actionsDisabled?: boolean // New prop to disable only action buttons, not search
  shouldAutoSearch?: boolean
  onSearchComplete?: () => void
  displayedResults?: number
  onDisplayedResultsChange?: (count: number) => void
  lastAddedBookKey?: string | null
  cancelledBookKey?: string | null
  onCancelledBookScrollComplete?: () => void
  searchResults?: GoogleBookItem[]
  onSearchResultsChange?: (results: GoogleBookItem[]) => void
  totalResults?: number
  onTotalResultsChange?: (total: number) => void
}

export default function BookSearch({
  searchQuery,
  onSearchQueryChange,
  onBookSelected,
  onError,
  existingBooks,
  justAddedBooks,
  disabled = false,
  actionsDisabled = false,
  shouldAutoSearch = false,
  onSearchComplete,
  displayedResults: parentDisplayedResults,
  onDisplayedResultsChange,
  lastAddedBookKey,
  cancelledBookKey,
  onCancelledBookScrollComplete,
  searchResults: parentSearchResults,
  onSearchResultsChange,
  totalResults: parentTotalResults,
  onTotalResultsChange,
}: BookSearchProps) {
  // Selection context for cart functionality
  const { state: selectionState, actions: selectionActions } = useBookSelection()
  const { data: session } = useSession()
  const { isMobile } = useMobileBreakpoints()
  
  const [isSearching, setIsSearching] = useState(false)
  const [displayedResults, setDisplayedResults] = useState(parentDisplayedResults || 10)
  const [showOpenLibraryOption, setShowOpenLibraryOption] = useState(false)
  const [hasOpenLibraryResults, setHasOpenLibraryResults] = useState(false)
  const [isEnhancingWithOpenLibrary, setIsEnhancingWithOpenLibrary] = useState(false)
  const [hideBooksWithoutCovers, setHideBooksWithoutCovers] = useState(false)
  
  // Use parent state if provided, otherwise use local state
  const searchResults = parentSearchResults || []
  const totalResults = parentTotalResults || 0
  const [addAnywayDialog, setAddAnywayDialog] = useState<{
    isOpen: boolean
    book: GoogleBookItem | null
  }>({ isOpen: false, book: null })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchFormRef = useRef<HTMLDivElement>(null)
  const searchResultsRef = useRef<HTMLHeadingElement>(null)

  // Auto-focus the search input field when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Sync displayedResults with parent prop when it changes
  useEffect(() => {
    if (parentDisplayedResults !== undefined && parentDisplayedResults !== displayedResults) {
      setDisplayedResults(parentDisplayedResults)
    }
  }, [parentDisplayedResults])

  // Scroll to newly added book when it appears in search results
  useEffect(() => {
    if (lastAddedBookKey && searchResults.length > 0) {
      setTimeout(() => {
        const bookCards = document.querySelectorAll('[data-book-key]')
        Array.from(bookCards).forEach(card => {
          if (card.getAttribute('data-book-key') === lastAddedBookKey) {
            const elementTop = (card as HTMLElement).offsetTop - 20
            window.scrollTo({
              top: elementTop,
              behavior: 'smooth'
            })
          }
        })
      }, 300)
    }
  }, [lastAddedBookKey, searchResults])

  // Scroll to cancelled book when returning from book selection
  useEffect(() => {
    if (cancelledBookKey && searchResults.length > 0) {
      setTimeout(() => {
        const bookCards = document.querySelectorAll('[data-book-key]')
        Array.from(bookCards).forEach(card => {
          if (card.getAttribute('data-book-key') === cancelledBookKey) {
            const elementTop = (card as HTMLElement).offsetTop - 20
            window.scrollTo({
              top: elementTop,
              behavior: 'smooth'
            })
          }
        })
        // Clear the cancelled book key after scrolling
        onCancelledBookScrollComplete?.()
      }, 300)
    }
  }, [cancelledBookKey, searchResults, onCancelledBookScrollComplete])

  // Auto-search when searchQuery is provided from OCR results or after adding a book
  useEffect(() => {
    if (shouldAutoSearch && searchQuery.trim() && searchResults.length === 0 && !isSearching) {
      searchBooks(searchQuery)
    }
  }, [searchQuery, shouldAutoSearch])

  const searchBooks = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    setShowOpenLibraryOption(false)
    setHasOpenLibraryResults(false)
    
    try {
      // Always start with Google Books search
      await searchGoogleBooks(query)
      
      // Show OpenLibrary option after Google search completes
      setShowOpenLibraryOption(true)
      
      onSearchComplete?.()
    } catch (_error) {
      onError(
        'Search Error',
        'Failed to search books. Please check your internet connection and try again.'
      )
    } finally {
      setIsSearching(false)
    }
  }


  const searchGoogleBooks = async (query: string) => {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=40`
    )
    
    if (response.ok) {
      const data = await response.json()
      // Convert Google Books format to our enhanced format
      const convertedItems = (data.items || []).map((item: any) => ({
        id: item.id,
        isbn: item.volumeInfo.industryIdentifiers?.find(
          (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors,
        description: item.volumeInfo.description,
        covers: item.volumeInfo.imageLinks ? {
          thumbnail: ensureHttps(item.volumeInfo.imageLinks.thumbnail),
          small: ensureHttps(item.volumeInfo.imageLinks.small),
          medium: ensureHttps(item.volumeInfo.imageLinks.medium),
          large: ensureHttps(item.volumeInfo.imageLinks.large),
          extraLarge: ensureHttps(item.volumeInfo.imageLinks.extraLarge),
        } : undefined,
        publishedDate: item.volumeInfo.publishedDate,
        categories: item.volumeInfo.categories,
        publisher: item.volumeInfo.publisher,
        pageCount: item.volumeInfo.pageCount,
        averageRating: item.volumeInfo.averageRating,
        ratingsCount: item.volumeInfo.ratingsCount,
        source: 'google' as const,
        sourceDisplayName: 'Google Books',
        // Keep legacy format for backward compatibility
        volumeInfo: item.volumeInfo
      }))
      
      onSearchResultsChange?.(convertedItems)
      onTotalResultsChange?.(data.totalItems || 0)
      
      // Only reset to 10 if parent doesn't have a specific displayedResults value
      if (parentDisplayedResults === undefined) {
        setDisplayedResults(10)
        onDisplayedResultsChange?.(10)
      }
      
      // Scroll to "Search Results" heading after results are loaded
      // Use longer timeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (searchResultsRef.current) {
          console.log('Scrolling to Search Results (Google):', { element: searchResultsRef.current, offsetTop: searchResultsRef.current.offsetTop, currentScrollTop: window.scrollY })
          searchResultsRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        } else {
          console.log('searchResultsRef.current is null (Google)')
        }
      }, 300)
    } else {
      onError('Search Failed', 'Failed to search for books. Please try again.')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!disabled) {
      searchBooks(searchQuery)
    }
  }

  const handleBookSelect = (item: GoogleBookItem) => {
    if (!disabled) {
      onBookSelected(item)
    }
  }

  const enhanceWithOpenLibrary = async () => {
    if (!searchQuery.trim() || !session?.user?.email) return
    
    setIsEnhancingWithOpenLibrary(true)
    
    try {
      const params = new URLSearchParams({
        enhanced: 'true',
        q: searchQuery.trim()
      })
      
      const response = await fetch(`${getApiBaseUrl()}/api/books/editions?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const enhancedEditions = data.editions || []
        
        // Merge with existing Google Books results, removing duplicates
        const currentResults = searchResults
        const mergedResults = [...currentResults]
        
        // Add OpenLibrary results that aren't already in Google results
        enhancedEditions.forEach((olBook: any) => {
          const isDuplicate = currentResults.some((gbBook: any) => {
            // Check for ISBN match first
            if (olBook.isbn && gbBook.isbn && olBook.isbn === gbBook.isbn) {
              return true
            }
            
            // Check for title + author match
            const titleMatch = olBook.title?.toLowerCase().trim() === gbBook.title?.toLowerCase().trim()
            const authorMatch = olBook.authors && gbBook.authors && 
              olBook.authors.some((olAuthor: string) => 
                gbBook.authors.some((gbAuthor: string) => 
                  gbAuthor.toLowerCase().trim() === olAuthor.toLowerCase().trim()
                )
              )
            
            return titleMatch && authorMatch
          })
          
          if (!isDuplicate) {
            mergedResults.push(olBook)
          }
        })
        
        onSearchResultsChange?.(mergedResults)
        setHasOpenLibraryResults(true)
        
        // Update displayed results to show new books if needed
        if (parentDisplayedResults === undefined && mergedResults.length > displayedResults) {
          const newDisplayed = Math.max(displayedResults, Math.min(mergedResults.length, displayedResults + 10))
          setDisplayedResults(newDisplayed)
          onDisplayedResultsChange?.(newDisplayed)
        }
      } else {
        onError('Enhancement Failed', 'Failed to search OpenLibrary. Please try again.')
      }
    } catch (_error) {
      onError('Enhancement Failed', 'Failed to search OpenLibrary. Please try again.')
    } finally {
      setIsEnhancingWithOpenLibrary(false)
    }
  }

  const handleClearSearch = () => {
    onSearchQueryChange('')
    onSearchResultsChange?.([])
    onTotalResultsChange?.(0)
    setDisplayedResults(10)
    onDisplayedResultsChange?.(10)
    setShowOpenLibraryOption(false)
    setHasOpenLibraryResults(false)
    searchInputRef.current?.focus()
  }

  const handleLoadMore = () => {
    const remainingResults = searchResults.length - displayedResults
    const nextBatch = Math.min(remainingResults, 10)
    const newDisplayedResults = displayedResults + nextBatch
    setDisplayedResults(newDisplayedResults)
    onDisplayedResultsChange?.(newDisplayedResults)
  }

  const handleAddAnyway = (book: GoogleBookItem) => {
    setAddAnywayDialog({ isOpen: true, book })
  }

  const confirmAddAnyway = async () => {
    if (addAnywayDialog.book) {
      try {
        // Close dialog first to prevent UI stuck state
        setAddAnywayDialog({ isOpen: false, book: null })
        // Then trigger book selection
        onBookSelected(addAnywayDialog.book)
      } catch (error) {
        // If book selection fails, ensure dialog is closed and show error
        setAddAnywayDialog({ isOpen: false, book: null })
        onError('Selection Error', 'Failed to add book. Please try again.')
      }
    }
  }

  const cancelAddAnyway = () => {
    setAddAnywayDialog({ isOpen: false, book: null })
  }

  // Helper function to extract data from either new or legacy format
  const getItemData = (item: GoogleBookItem) => {
    if (item.volumeInfo) {
      // Legacy Google Books format
      return {
        isbn: item.volumeInfo.industryIdentifiers?.find(
          id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || [],
        publishedDate: item.volumeInfo.publishedDate,
        thumbnail: ensureHttps(item.volumeInfo.imageLinks?.thumbnail)
      }
    } else {
      // Enhanced format
      return {
        isbn: item.isbn,
        title: item.title,
        authors: item.authors || [],
        publishedDate: item.publishedDate,
        thumbnail: item.covers?.thumbnail || item.covers?.small || item.covers?.medium
      }
    }
  }

  // Enhanced duplicate detection helper functions
  const getBookDuplicateInfo = (googleBookItem: GoogleBookItem): { isExactDuplicate: boolean; isPotentialDuplicate: boolean } => {
    const { isbn, title, authors, publishedDate } = getItemData(googleBookItem)

    let isExactDuplicate = false
    let isPotentialDuplicate = false


    existingBooks.forEach(existingBook => {
      // Primary check: exact ISBN match (definite duplicate)
      if (isbn && existingBook.isbn === isbn) {
        isExactDuplicate = true
        return
      }
      
      // Secondary check: exact title match (case-insensitive)
      const titleMatch = existingBook.title.toLowerCase().trim() === title.toLowerCase().trim()
      
      if (titleMatch) {
        // If titles match exactly, check authors
        const authorMatch = authors.length === 0 || existingBook.authors.length === 0 || 
          authors.some(author => 
            existingBook.authors.some(existingAuthor => 
              existingAuthor.toLowerCase().trim() === author.toLowerCase().trim()
            )
          )
        
        if (authorMatch) {
          // If we have ISBNs for both books but they're different, this is NOT a duplicate
          if (isbn && existingBook.isbn && isbn !== existingBook.isbn) {
            // Different ISBNs = different books, even with same title/author
            return
          }
          
          // If both title and author match, check publication date for additional validation
          if (publishedDate && existingBook.publishedDate) {
            const newBookYear = publishedDate.split('-')[0]
            const existingBookYear = existingBook.publishedDate.split('-')[0]
            
            if (newBookYear === existingBookYear) {
              isExactDuplicate = true
            } else {
              // Different years, but same title/author - potential duplicate (different edition)
              isPotentialDuplicate = true
            }
          } else {
            // No publication date info available for comparison
            // For identical title + author, assume exact duplicate unless we have conflicting evidence
            isExactDuplicate = true
          }
        }
      }
    })

    return { isExactDuplicate, isPotentialDuplicate }
  }


  const wasBookJustAdded = (googleBookItem: GoogleBookItem): boolean => {
    const { isbn, title } = getItemData(googleBookItem)
    const bookKey = isbn || title
    return justAddedBooks.has(bookKey)
  }

  // Convert GoogleBookItem to EnhancedBook for cart functionality
  const createEnhancedBookFromGoogleItem = (item: GoogleBookItem): EnhancedBook => {
    const { isbn, title, authors, publishedDate, thumbnail } = getItemData(item)

    return {
      id: item.id,
      isbn: isbn || item.id,
      title: title || 'Unknown Title',
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      description: item.volumeInfo?.description || item.description,
      thumbnail,
      publishedDate,
      categories: item.volumeInfo?.categories || item.categories,
    }
  }

  // Handle adding book to cart
  const handleAddToCart = (item: GoogleBookItem) => {
    const enhancedBook = createEnhancedBookFromGoogleItem(item)
    selectionActions.addToSelection(enhancedBook, 'search')
  }

  // Check if book is in cart
  const isBookInCart = (item: GoogleBookItem): boolean => {
    const enhancedBook = createEnhancedBookFromGoogleItem(item)
    return selectionActions.isBookSelected(enhancedBook)
  }

  // Handle removing book from cart
  const handleRemoveFromCart = (item: GoogleBookItem) => {
    const enhancedBook = createEnhancedBookFromGoogleItem(item)
    const bookKey = enhancedBook.isbn || enhancedBook.title || enhancedBook.id
    selectionActions.removeFromSelection(bookKey)
  }

  return (
    <Box>
      {/* Search Form */}
      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }} ref={searchFormRef}>
        {/* Search Field */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 1 },
          mb: 2
        }}>
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search by title, author, or keywords..."
            variant="outlined"
            disabled={isSearching || disabled}
            inputRef={searchInputRef}
            InputProps={{
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearSearch}
                    disabled={isSearching || disabled}
                    size="small"
                    aria-label="Clear search"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={isSearching ? <CircularProgress size={16} color="inherit" /> : <Search />}
            disabled={isSearching || !searchQuery.trim() || disabled}
            sx={{
              minWidth: { xs: 'auto', sm: 120 },
              width: { xs: '100%', sm: 'auto' },
              color: (theme) => theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
              '&.Mui-disabled': {
                color: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
              }
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </Box>
        
        {/* Mobile scanning tip for desktop users */}
        {!isMobile && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <PhoneAndroid sx={{ mr: 1, verticalAlign: 'middle' }} /> To scan ISBN codes using your camera (and add books more quickly), use this site on your mobile phone!
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Box data-testid="search-results-section">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" ref={searchResultsRef}>
                Search Results {hasOpenLibraryResults && <Chip label="Enhanced with OpenLibrary" size="small" color="success" sx={{ ml: 1 }} />}
              </Typography>
              {/* Hide books without covers toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={hideBooksWithoutCovers}
                    onChange={(e) => setHideBooksWithoutCovers(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Hide books without covers
                  </Typography>
                }
                sx={{ ml: 2 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Showing {Math.min(displayedResults, searchResults.length)} of {totalResults > searchResults.length ? `${searchResults.length}+ (${totalResults} total found)` : searchResults.length} results
            </Typography>
          </Box>
          
          {/* OpenLibrary Enhancement Option */}
          {showOpenLibraryOption && !hasOpenLibraryResults && session?.user?.email && (
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  startIcon={isEnhancingWithOpenLibrary ? <CircularProgress size={16} color="inherit" /> : <Public />}
                  onClick={enhanceWithOpenLibrary}
                  disabled={isEnhancingWithOpenLibrary || disabled}
                  sx={{ 
                    whiteSpace: 'nowrap',
                    borderColor: 'info.main',
                    color: 'info.main',
                    '&:hover': {
                      backgroundColor: 'info.main',
                      color: 'white'
                    }
                  }}
                >
                  {isEnhancingWithOpenLibrary ? 'Searching...' : 'Search OpenLibrary'}
                </Button>
              }
            >
              <Typography variant="body2">
                <strong>Didn't find what you were looking for?</strong> Search OpenLibrary for additional results including academic and historical books.
              </Typography>
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {searchResults
              .filter((item) => {
                if (!hideBooksWithoutCovers) return true;
                const { thumbnail } = getItemData(item);
                return thumbnail; // Only show books with covers when toggle is enabled
              })
              .slice(0, displayedResults)
              .map((item) => {
              const { isbn, title, authors, publishedDate, thumbnail } = getItemData(item)
              const bookKey = isbn || title
              
              // Helper function to get source icon
              const getSourceIcon = (source?: string) => {
                switch (source) {
                  case 'google':
                    return <Book fontSize="small" />
                  case 'openlibrary':
                    return <Public fontSize="small" />
                  default:
                    return <Book fontSize="small" />
                }
              }

              // Helper function to get source color
              const getSourceColor = (source?: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'default' => {
                switch (source) {
                  case 'google':
                    return 'primary'  // Blue
                  case 'openlibrary':
                    return 'success'  // Green
                  default:
                    return 'default'
                }
              }
              
              return (
              <Card key={item.id} data-book-key={bookKey} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  {/* Source attribution chip - show when we have mixed results */}
                  {hasOpenLibraryResults && item.source && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Tooltip title={item.sourceDisplayName || item.source}>
                        <Chip
                          icon={getSourceIcon(item.source)}
                          label={item.source === 'google' ? 'GB' : 'OL'}
                          size="small"
                          color={getSourceColor(item.source)}
                          variant="filled"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            '& .MuiChip-label': {
                              color: 'white'
                            },
                            '& .MuiChip-icon': {
                              color: 'white'
                            }
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}
                  
                  {/* Book cover or placeholder */}
                  <Box sx={{ width: 80, height: 120, mx: 'auto', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {thumbnail ? (
                      <CardMedia
                        component="img"
                        src={thumbnail}
                        alt={title}
                        sx={{ width: 80, height: 'auto', maxHeight: 120 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 120,
                          backgroundColor: 'grey.200',
                          border: '1px solid',
                          borderColor: 'grey.300',
                          borderRadius: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'grey.500'
                        }}
                      >
                        <Book sx={{ fontSize: 32, mb: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center', px: 0.5 }}>
                          No cover available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="h6" component="h3" gutterBottom>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {authors.join(', ') || 'Unknown Author'}
                    {publishedDate && `, ${new Date(publishedDate).getFullYear()}`}
                  </Typography>
                  
                  {/* Additional metadata for enhanced results */}
                  {hasOpenLibraryResults && (
                    <Box sx={{ mt: 1 }}>
                      {item.publisher && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Publisher: {item.publisher}
                        </Typography>
                      )}
                      {item.classification && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Classification: {item.classification}
                        </Typography>
                      )}
                      {item.lccn && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          LCCN: {item.lccn}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  {wasBookJustAdded(item) ? (
                    <Button 
                      variant="outlined"
                      size="small"
                      startIcon={<CheckCircle />}
                      disabled
                      fullWidth
                      sx={{ 
                        color: 'success.main',
                        borderColor: 'success.main',
                        '&.Mui-disabled': {
                          color: 'success.main',
                          borderColor: 'success.main'
                        }
                      }}
                    >
                      Book Added!
                    </Button>
                  ) : (() => {
                    const { isExactDuplicate, isPotentialDuplicate } = getBookDuplicateInfo(item)
                    
                    if (isExactDuplicate) {
                      // Exact duplicate - only show "Already in Your Library"
                      return (
                        <Button 
                          variant="outlined"
                          size="small"
                          startIcon={<CheckCircle />}
                          disabled
                          fullWidth
                          sx={{ 
                            color: 'text.secondary',
                            borderColor: 'grey.400',
                            '&.Mui-disabled': {
                              color: 'text.secondary',
                              borderColor: 'grey.400'
                            }
                          }}
                        >
                          Already in Your Library
                        </Button>
                      )
                    } else if (isPotentialDuplicate) {
                      // Potential duplicate - show both buttons
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                          <Button 
                            variant="outlined"
                            size="small"
                            startIcon={<CheckCircle />}
                            disabled
                            fullWidth
                            sx={{ 
                              color: 'warning.main',
                              borderColor: 'warning.main',
                              '&.Mui-disabled': {
                                color: 'warning.main',
                                borderColor: 'warning.main'
                              }
                            }}
                          >
                            Similar Book in Library
                          </Button>
                          <Button 
                            variant="text"
                            size="small"
                            startIcon={<Warning />}
                            onClick={() => handleAddAnyway(item)}
                            disabled={disabled || actionsDisabled}
                            fullWidth
                            sx={{ 
                              color: 'warning.main',
                              fontSize: '0.75rem',
                              minHeight: '32px'
                            }}
                          >
                            Add Anyway
                          </Button>
                        </Box>
                      )
                    } else {
                      // Not a duplicate - show dual action buttons (Scenario C)
                      // Always: "Add Now" primary, "Select" secondary
                      const isInCart = isBookInCart(item)
                      
                      return (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                          <Button 
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => handleBookSelect(item)}
                            disabled={disabled || actionsDisabled}
                            fullWidth
                          >
                            Add This Book
                          </Button>
                          <Button 
                            variant="outlined"
                            size="small"
                            startIcon={isInCart ? <CheckBox /> : <CheckBoxOutlineBlank />}
                            onClick={() => isInCart ? handleRemoveFromCart(item) : handleAddToCart(item)}
                            disabled={disabled || actionsDisabled}
                            sx={{ 
                              minWidth: '100px',
                              color: isInCart ? 'success.main' : 'primary.main',
                              borderColor: isInCart ? 'success.main' : 'primary.main'
                            }}
                          >
                            {isInCart ? 'Selected' : 'Select'}
                          </Button>
                        </Box>
                      )
                    }
                  })()}
                </CardActions>
              </Card>
              )
            })}
          </Box>
          
          {/* Load More Button */}
          {displayedResults < searchResults.length && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {Math.min(displayedResults, searchResults.length)} of {totalResults > searchResults.length ? `${searchResults.length}+ (${totalResults} total found)` : searchResults.length} results
              </Typography>
              <Button 
                variant="outlined"
                onClick={handleLoadMore}
                disabled={disabled}
                size="large"
                sx={{ minWidth: 200 }}
              >
                {(() => {
                  const remaining = searchResults.length - displayedResults
                  const toLoad = Math.min(remaining, 10)
                  return toLoad < 10 
                    ? `Load the last ${toLoad} book${toLoad === 1 ? '' : 's'}`
                    : `Load ${toLoad} more books`
                })()}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Add Anyway Confirmation Dialog */}
      <Dialog 
        open={addAnywayDialog.isOpen} 
        onClose={cancelAddAnyway}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Potential Duplicate Book
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This book appears to be similar to one already in your library. Adding it may create duplicates.
          </Alert>
          
          {addAnywayDialog.book && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Book to Add:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {getItemData(addAnywayDialog.book).title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                by {getItemData(addAnywayDialog.book).authors.join(', ') || 'Unknown Author'}
                {getItemData(addAnywayDialog.book).publishedDate && `, ${new Date(getItemData(addAnywayDialog.book).publishedDate!).getFullYear()}`}
              </Typography>
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                Are you sure you want to add this book anyway? This might be a different edition or you may have accidentally deleted it earlier.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelAddAnyway}>
            Cancel
          </Button>
          <Button 
            onClick={confirmAddAnyway} 
            variant="contained" 
            color="warning"
            startIcon={<Add />}
          >
            Add Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}