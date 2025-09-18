'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Fade,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  QrCodeScanner,
  MenuBook,
  Save,
  Cancel,
  LibraryBooks,
} from '@mui/icons-material'
import { fetchEnhancedBookData, fetchEnhancedBookFromSearch } from '@/lib/bookApi'
import type { EnhancedBook, CuratedGenre, GoogleBookItem } from '@/lib/types'
import { saveBook as saveBookAPI, getBooks } from '@/lib/api'
import { authenticatedFetch } from '@/lib/auth-utils'
import ConfirmationModal from '../modals/ConfirmationModal'
import AlertModal from '../modals/AlertModal'
import ShelfSelector from '../library/ShelfSelector'
import ISBNScanner from '@/components/library/ISBNScanner'
import BookSearch from './BookSearch'
import BookPreview from './BookPreview'
import { useModal } from '@/hooks/useModal'
import { getStorageItem, setStorageItem } from '@/lib/storage'
import { BookSelectionProvider, useBookSelection } from '@/contexts/BookSelectionContext'
import CartIndicator from '@/components/library/CartIndicator'
import BulkReviewModal from '../modals/BulkReviewModal'
import GenreSelector from './GenreSelector'
import { Container, Paper } from '@mui/material'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { authenticatedApiCall } from '@/lib/api'
import AddBooksMobileBottomNav from '../layout/AddBooksMobileBottomNav'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

// More Details Modal Component
interface MoreDetailsModalProps {
  book: EnhancedBook
  isOpen: boolean
  onClose: () => void
}

function MoreDetailsModal({ book, isOpen, onClose }: MoreDetailsModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <MenuBook sx={{ mr: 1 }} /> View details: {book.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          {book.extendedDescription && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Extended Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {book.extendedDescription}
              </Typography>
            </Box>
          )}
          
          {book.subjects && book.subjects.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Subjects & Topics
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {book.subjects.slice(0, 10).map((subject, index) => (
                  <Chip key={index} label={subject} size="small" variant="outlined" />
                ))}
                {book.subjects.length > 10 && (
                  <Chip label={`+${book.subjects.length - 10} more`} size="small" variant="outlined" />
                )}
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {book.publisherInfo && (
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Publisher
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.publisherInfo}
                </Typography>
              </Box>
            )}
            
            {book.pageCount && (
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Page Count
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.pageCount} pages
                </Typography>
              </Box>
            )}
            
            {book.averageRating && (
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Average Rating
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.averageRating}/5 ({book.ratingCount || 0} ratings)
                </Typography>
              </Box>
            )}
            
            {book.openLibraryKey && (
              <Box>
                <Typography variant="subtitle2" color="primary">
                  OpenLibrary ID
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.openLibraryKey}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
}

interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
}


interface AddBooksInternalProps {
  initialTab?: 'scan' | 'search'
}

// Internal component that has access to BookSelectionContext
function AddBooksInternal({ initialTab }: AddBooksInternalProps) {
  const { data: session } = useSession()
  const { modalState, alert, closeModal } = useModal()
  const { state: selectionState, actions: selectionActions } = useBookSelection()
  const { isMobile } = useMobileBreakpoints()
  
  const [activeTab, setActiveTab] = useState(() => {
    // If initialTab is provided (from URL), use that
    if (initialTab) return initialTab === 'search' ? 0 : 1
    
    // Otherwise, remember user's preferred tab choice
    const savedTab = getStorageItem('addBooks_preferredTab', 'functional') as 'scan' | 'search'
    return (savedTab === 'scan') ? 1 : 0
  })

  useEffect(() => {
    // Only run on initial mount to set tab from URL/prop
    let tabName = 'search' // default
    
    if (initialTab) {
      tabName = initialTab
    }
    // Note: We don't read pathname here to avoid re-renders on URL changes
    // The initial tab is set via initialTab prop or localStorage
    
    const newTabIndex = tabName === 'scan' ? 1 : 0
    setActiveTab(newTabIndex)
    setFadeIn(true)
  }, [initialTab]) // Only depend on initialTab

  // Handle responsive tab changes - switch to search tab if on desktop and scan tab is selected
  useEffect(() => {
    if (!isMobile && activeTab === 1) {
      setActiveTab(0) // Switch to search tab on desktop
    }
  }, [isMobile, activeTab])
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDisplayedResults, setSearchDisplayedResults] = useState(10)
  const [preserveSearchState, setPreserveSearchState] = useState(false)
  const [cancelledBookKey, setCancelledBookKey] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<GoogleBookItem[]>([])
  const [searchTotalResults, setSearchTotalResults] = useState(0)
  const [autoSearchAfterAdd, setAutoSearchAfterAdd] = useState(false)
  
  // Common state
  const [selectedBook, setSelectedBook] = useState<EnhancedBook | null>(null)
  const [selectedCoverData, setSelectedCoverData] = useState<{ source: string; url: string; width?: number; height?: number } | null>(null)
  const [showMoreDetailsModal, setShowMoreDetailsModal] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [allShelves, setAllShelves] = useState<Shelf[]>([])
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null)
  const [customTags, setCustomTags] = useState<string>('')
  const [selectedGenres, setSelectedGenres] = useState<CuratedGenre[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [existingBooks, setExistingBooks] = useState<EnhancedBook[]>([])
  const [justAddedBooks, setJustAddedBooks] = useState<Set<string>>(new Set())
  const [showBulkReviewModal, setShowBulkReviewModal] = useState(false)
  const [canAddBooks, setCanAddBooks] = useState<boolean>(true) // Assume true initially to avoid flash
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false)
  const [allowedLocationIds, setAllowedLocationIds] = useState<Set<number>>(new Set()) // Track locations user can add books to
  const [fadeIn, setFadeIn] = useState(true)

  // Refs for scroll targets
  const bookSelectedRef = useRef<HTMLDivElement>(null)
  const [lastAddedBookKey, setLastAddedBookKey] = useState<string | null>(null)

  // Scroll utility function
  const scrollToElement = (ref: React.RefObject<HTMLElement>, offset: number = 0) => {
    if (ref.current) {
      const elementTop = ref.current.offsetTop + offset
      window.scrollTo({
        top: elementTop,
        behavior: 'smooth'
      })
    }
  }

  // Scroll to newly added book when it's added
  useEffect(() => {
    if (lastAddedBookKey) {
      setTimeout(() => {
        // Find the book card element that was just added
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
  }, [lastAddedBookKey])

  // Scroll to book selected section when a book is selected
  useEffect(() => {
    if (selectedBook) {
      setTimeout(() => {
        scrollToElement(bookSelectedRef, 0)
      }, 100)
    }
  }, [selectedBook])

  useEffect(() => {
    // Load locations, shelves, and check permissions when session is available
    if (session?.user?.email) {
      loadLocationsAndShelves()
      checkAddBooksPermission()
    }
  }, [session])

  const loadLocationsAndShelves = async () => {
    if (!session?.user?.email) return
    
    try {
      setLoadingData(true)
      const locationsResponse = await fetch(`${getApiBaseUrl()}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json()
        setLocations(locationsData)
        
        // Load shelves for all locations
        const allShelvesData: Shelf[] = []
        for (const location of locationsData) {
          const shelvesResponse = await fetch(`${getApiBaseUrl()}/api/locations/${location.id}/shelves`, {
            headers: {
              'Authorization': `Bearer ${session.user.email}`,
              'Content-Type': 'application/json',
            },
          })
          if (shelvesResponse.ok) {
            const shelvesData = await shelvesResponse.json()
            allShelvesData.push(...shelvesData)
          }
        }
        setAllShelves(allShelvesData)
        
        // Auto-selection will happen after permissions are loaded to ensure we only select from allowed locations
      }
      
      // Load existing books for duplicate detection
      const savedBooks = await getBooks()
      setExistingBooks(savedBooks)
    } catch {
      // Handle error silently
    } finally {
      setLoadingData(false)
    }
  }

  const checkAddBooksPermission = async () => {
    if (!session?.user?.email) return
    
    try {
      // Get all user's locations for permission checking
      const locationsResponse = await authenticatedFetch(session, '/api/locations')
      
      if (locationsResponse.success && Array.isArray(locationsResponse.data) && locationsResponse.data.length > 0) {
        const locations = locationsResponse.data as { id: number; name: string }[]
        
        // Check permissions for each location and track which ones allow adding books
        let hasPermissionInAnyLocation = false
        const allowedIds = new Set<number>()
        
        for (const location of locations) {
          const permissionResult = await authenticatedFetch(
            session, 
            `/api/permissions/check?locationId=${location.id}&permission=can_add_books`
          )
          
          if (permissionResult.success) {
            const permissionData = permissionResult.data as { hasPermission: boolean }
            if (permissionData?.hasPermission) {
              hasPermissionInAnyLocation = true
              allowedIds.add(location.id)
            }
          }
        }
        
        setCanAddBooks(hasPermissionInAnyLocation)
        setAllowedLocationIds(allowedIds)
        
        // Smart UI: Auto-select shelf after permissions are loaded
        // Filter shelves to only those from allowed locations
        const allowedShelves = allShelves.filter(shelf => allowedIds.has(shelf.location_id))
        
        if (allowedShelves.length === 1) {
          setSelectedShelfId(allowedShelves[0].id)
        } else if (allowedShelves.length > 1) {
          // For multi-shelf users, restore the last selected shelf if it still exists and is from an allowed location
          const lastSelectedShelfId = getStorageItem('lastSelectedShelfId', 'functional')
          if (lastSelectedShelfId) {
            const shelfId = parseInt(lastSelectedShelfId)
            const shelfExists = allowedShelves.some(shelf => shelf.id === shelfId)
            if (shelfExists) {
              setSelectedShelfId(shelfId)
            }
          }
        }
      } else {
        // If no locations, they can't add books
        setCanAddBooks(false)
        setAllowedLocationIds(new Set())
      }
    } catch (err) {
      console.error('Error checking add books permission:', err)
      // On error, assume they can add books (fail open for better UX)
      setCanAddBooks(true)
      setAllowedLocationIds(new Set()) // Don't filter anything on error
      
      // Fallback auto-selection when permissions fail
      if (allShelves.length === 1) {
        setSelectedShelfId(allShelves[0].id)
      } else if (allShelves.length > 1) {
        const lastSelectedShelfId = getStorageItem('lastSelectedShelfId', 'functional')
        if (lastSelectedShelfId) {
          const shelfId = parseInt(lastSelectedShelfId)
          const shelfExists = allShelves.some(shelf => shelf.id === shelfId)
          if (shelfExists) {
            setSelectedShelfId(shelfId)
          }
        }
      }
    } finally {
      setPermissionChecked(true)
    }
  }

  const handleISBNDetected = async (isbn: string) => {
    setIsLoading(true)
    
    try {
      const bookData = await fetchEnhancedBookData(isbn)
      if (bookData) {
        setSelectedBook(bookData)
        setSelectedGenres([])
        setIsLoading(false)
      } else {
        setIsLoading(false)
        await alert({
          title: 'Book Not Found',
          message: 'Book not found for this ISBN. Please try a different ISBN or use the search feature.',
          variant: 'warning'
        })
      }
    } catch {
      setIsLoading(false)
      await alert({
        title: 'Lookup Error',
        message: 'Failed to fetch book data. Please check your internet connection and try again.',
        variant: 'error'
      })
    }
  }



  const selectBookFromSearch = async (item: GoogleBookItem) => {
    setIsLoading(true)
    try {
      const enhancedBook = await fetchEnhancedBookFromSearch(item)
      if (enhancedBook) {
        setSelectedBook(enhancedBook)
        setSelectedGenres([])
        // Keep search results populated - don't clear them
      } else {
        // This should never happen now, but keep as safety fallback
        await alert({
          title: 'Selection Error',
          message: 'Failed to select book. Please try again.',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Book selection error:', error)
      await alert({
        title: 'Selection Error',
        message: 'Failed to select book. Please try again.',
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Common functions
  const handleCoverChange = (coverUrl: string, coverData: any) => {
    if (selectedBook) {
      setSelectedBook({
        ...selectedBook,
        thumbnail: coverUrl
      })
      setSelectedCoverData(coverData)
    }
  }

  const saveBook = async () => {
    if (!selectedBook || !selectedShelfId) return
    if (!canAddBooks) {
      handleError('Permission Denied', 'You don\'t have permission to add books to this location.')
      return
    }

    const bookToSave = {
      ...selectedBook,
      shelf_id: selectedShelfId,
      tags: customTags.split(',').map(tag => tag.trim()).filter(Boolean),
      ...(selectedCoverData && {
        alternative_covers: [selectedCoverData],
        selected_cover_source: {
          source: 'google_books',
          url: selectedCoverData.url,
          selectedAt: new Date().toISOString(),
          selectedBy: session?.user?.email || 'unknown'
        }
      })
    }

    const success = await saveBookAPI(bookToSave)
    
    if (success) {
      // Save selected genres if any
      if (selectedGenres.length > 0) {
        try {
          // Get the saved book ID from the API response or find it by ISBN
          const updatedBooks = await getBooks()
          const savedBook = updatedBooks.find(book => book.isbn === selectedBook.isbn)
          
          if (savedBook) {
            // Assign each selected genre to the book
            for (const genre of selectedGenres) {
              const response = await authenticatedApiCall(`/api/books/${savedBook.id}/genres`, {
                method: 'POST',
                body: JSON.stringify({ genreId: genre.id, isAutoAssigned: false })
              })
              
              if (!response.ok) {
                const errorText = await response.text()
                console.error('Failed to assign genre:', genre.name, 'Error:', errorText)
              }
            }
          }
        } catch (error) {
          console.error('Failed to save genre assignments:', error)
          // Don't block the success flow if genre assignment fails
        }
      }
      
      const _bookTitle = selectedBook.title
      setSelectedBook(null)
      setSelectedGenres([])
      setCustomTags('')
      
      // Persist the selected shelf for future use, but don't clear it
      if (selectedShelfId) {
        setStorageItem('lastSelectedShelfId', selectedShelfId.toString(), 'functional')
      }
      
      // Update existing books list to include the newly added book for accurate duplicate detection
      try {
        const updatedBooks = await getBooks()
        setExistingBooks(updatedBooks)
        
        // Mark this book as just added for display purposes
        const bookKey = selectedBook.isbn || selectedBook.title
        setJustAddedBooks(prev => new Set(prev).add(bookKey))
        setLastAddedBookKey(bookKey)
      } catch (error) {
        // If we can't refresh the books list, continue anyway
        console.error('Failed to refresh books list:', error)
      }
      
      // Trigger auto-search when returning to search screen
      if (activeTab === 0 || searchQuery.trim()) {
        setAutoSearchAfterAdd(true)
      }
    } else {
      await alert({
        title: 'Save Failed',
        message: 'Failed to save book. Please check your connection and try again.',
        variant: 'error'
      })
    }
  }

  // Bulk save function for cart functionality
  const handleBulkSave = async () => {
    const selectedBooks = selectionActions.getSelectedBooks()
    if (selectedBooks.length === 0 || !selectedShelfId) return
    if (!canAddBooks) {
      handleError('Permission Denied', 'You don\'t have permission to add books to this location.')
      return
    }

    setIsLoading(true)
    
try {
      // Save each book individually for now (we'll optimize to bulk API later)
      const results = []
      
      for (const selectedBook of selectedBooks) {
        const bookToSave = {
          ...selectedBook.book,
          shelf_id: selectedShelfId,
          tags: selectionState.bulkTags.split(',').map(tag => tag.trim()).filter(Boolean)
        }

        const success = await saveBookAPI(bookToSave)
        results.push({ book: selectedBook.book, success })
        
        if (success) {
          // Mark this book as just added for display purposes
          const bookKey = selectedBook.book.isbn || selectedBook.book.title
          setJustAddedBooks(prev => new Set(prev).add(bookKey))
        }
      }

      // Clear selections after successful bulk save
      selectionActions.clearSelections()
      
      // Close the bulk review modal
      setShowBulkReviewModal(false)
      
      // Update existing books list
      try {
        const updatedBooks = await getBooks()
        setExistingBooks(updatedBooks)
      } catch (error) {
        console.error('Failed to refresh books list:', error)
      }

      // Reset loading state 
      setIsLoading(false)

      // Trigger auto-search when returning to search screen
      if (activeTab === 0 || searchQuery.trim()) {
        setAutoSearchAfterAdd(true)
      }

    } catch (_error) {
      setIsLoading(false)
      await alert({
        title: 'Bulk Save Failed',
        message: 'Failed to save books. Please check your connection and try again.',
        variant: 'error'
      })
    }
  }

  const handleAuthorClick = (authorName: string) => {
    alert({
      title: 'Author Search',
      message: `This feature will search your library for other books by ${authorName}. Feature coming soon!`,
      variant: 'info'
    })
  }

  const handleSeriesClick = (seriesName: string) => {
    alert({
      title: 'Series Search', 
      message: `This feature will search your library for other books in the ${seriesName} series. Feature coming soon!`,
      variant: 'info'
    })
  }

  const handleGenreClick = (genreName: string) => {
    alert({
      title: 'Genre Search',
      message: `This feature will search your library for other books in the ${genreName} genre. Feature coming soon!`,
      variant: 'info'
    })
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // If switching to a different tab, trigger fade out
    if (newValue !== activeTab) {
      setFadeIn(false)
      
      setTimeout(() => {
        setActiveTab(newValue)
        
        // Convert number to string for URL and storage
        const tabName = newValue === 0 ? 'search' : 'scan'
        
        // Save user's preferred tab choice
        setStorageItem('addBooks_preferredTab', tabName, 'functional')
        
        // Clear search query when switching away from search
        if (newValue !== 0) {
          setSearchQuery('')
        }
        
        // Fade in the new content after a short delay to ensure content is ready
        setTimeout(() => {
          setFadeIn(true)
          
          // URL updates disabled for subtabs to prevent flash during transitions
          
        }, 50)
      }, 250) // Half of the timeout to create smooth transition
    }
  }

  // Enhanced duplicate detection helper function for selected book
  const isSelectedBookDuplicate = (): boolean => {
    if (!selectedBook) return false
    
    return existingBooks.some(existingBook => {
      // Primary check: exact ISBN match (most reliable)
      if (existingBook.isbn === selectedBook.isbn) {
        return true
      }
      
      // Secondary check: title and author combination
      const titleMatch = existingBook.title.toLowerCase() === selectedBook.title.toLowerCase()
      const authorMatch = selectedBook.authors.some(author => 
        existingBook.authors.some(existingAuthor => 
          existingAuthor.toLowerCase() === author.toLowerCase()
        )
      )
      
      // If title and author match, check additional criteria for better accuracy
      if (titleMatch && authorMatch) {
        // If both books have publication dates, they should match for it to be a duplicate
        if (selectedBook.publishedDate && existingBook.publishedDate) {
          // Extract year from dates for comparison (handles different date formats)
          const newBookYear = selectedBook.publishedDate.split('-')[0]
          const existingBookYear = existingBook.publishedDate.split('-')[0]
          
          // Only consider it a duplicate if published in the same year
          return newBookYear === existingBookYear
        }
        
        // If one or both books lack publication date, be more conservative
        // This reduces false positives for books with identical titles/authors but different editions
        return false
      }
      
      return false
    })
  }

  // Error handler for components
  const handleError = async (title: string, message: string, variant: 'error' | 'warning' | 'info' = 'error') => {
    await alert({ title, message, variant })
  }

  return (
    <Container maxWidth="xl" sx={{ pb: { xs: 1, sm: 2 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          <LibraryBooks sx={{ mr: 1 }} /> Add Books
        </Typography>

        {/* Permission Warning */}
        {permissionChecked && !canAddBooks && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You don&apos;t have permission to add books to this location. You can search for books to view their details, but the add and select buttons will be disabled. Contact a location administrator to request permission.
            </Typography>
          </Alert>
        )}

        {/* Tab Navigation - show on desktop only (mobile uses bottom navigation) */}
        {!isMobile && (
          <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab
                label="Search"
                icon={<MenuBook />}
                iconPosition="start"
              />
              <Tab
                label="Scan ISBN"
                icon={<QrCodeScanner />}
                iconPosition="start"
              />
              {/*
              <Tab
                value="bookshelf"
                label="Scan Shelf"
                icon={<PhotoLibrary />}
                iconPosition="start"
              />
              */}
            </Tabs>
          </Box>
        )}

        {/* Tab Content with Transitions */}
        {!selectedBook && (
          <Box sx={{ mt: 3, position: 'relative', minHeight: '400px' }}>
            <Fade 
              in={fadeIn} 
              timeout={500}
            >
              <Box>
                {activeTab === 0 && (
                  <BookSearch
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onBookSelected={selectBookFromSearch}
                    onError={handleError}
                    existingBooks={existingBooks}
                    justAddedBooks={justAddedBooks}
                    disabled={loadingData || isLoading}
                    actionsDisabled={!canAddBooks}
                    shouldAutoSearch={autoSearchAfterAdd && !preserveSearchState}
                    onSearchComplete={() => {
                      setAutoSearchAfterAdd(false)
                      setPreserveSearchState(false)
                    }}
                    displayedResults={searchDisplayedResults}
                    onDisplayedResultsChange={setSearchDisplayedResults}
                    lastAddedBookKey={lastAddedBookKey}
                    cancelledBookKey={cancelledBookKey}
                    onCancelledBookScrollComplete={() => setCancelledBookKey(null)}
                    searchResults={searchResults}
                    onSearchResultsChange={setSearchResults}
                    totalResults={searchTotalResults}
                    onTotalResultsChange={setSearchTotalResults}
                  />
                )}

                {activeTab === 1 && (
                  <ISBNScanner
                    onISBNDetected={handleISBNDetected}
                    onError={handleError}
                    isLoading={isLoading}
                    disabled={loadingData}
                  />
                )}
              </Box>
            </Fade>
          </Box>
        )}


        {/* Selected Book Display (shared between tabs) */}
        {selectedBook && (
          <Box sx={{ mt: { xs: 2, sm: 3 } }} data-testid="book-selected-section" ref={bookSelectedRef}>
            <BookPreview
              book={selectedBook}
              customTags={customTags}
              onCustomTagsChange={setCustomTags}
              onSave={saveBook}
              onCancel={() => {
                const bookKey = selectedBook?.isbn || selectedBook?.title || null
                setSelectedBook(null)
                setSelectedGenres([])
                setPreserveSearchState(true)
                setAutoSearchAfterAdd(false)
                setCancelledBookKey(bookKey)
                setSelectedCoverData(null)
              }}
              onMoreDetails={() => setShowMoreDetailsModal(true)}
              onAuthorClick={handleAuthorClick}
              onSeriesClick={handleSeriesClick}
              onGenreClick={handleGenreClick}
              onCoverChange={handleCoverChange}
              isDuplicate={isSelectedBookDuplicate()}
              isLoading={isLoading}
              isSaveDisabled={!selectedShelfId}
              saveButtonText={allShelves.length === 1 ? 'Add to Library' : 'Save to Library'}
              showActionButtons={false}
              canSelectCover={canAddBooks}
            />
            
            {/* Genre Selector */}
            <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
              <GenreSelector
                book={selectedBook}
                selectedGenres={selectedGenres}
                onGenresChange={setSelectedGenres}
                onError={(message) => alert({ title: 'Genre Error', message, variant: 'error' })}
              />
            </Box>
            
            {/* Shelf selector */}
            <Box sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 1.5, sm: 2 } }}>
              <ShelfSelector
                shelves={allowedLocationIds.size > 0 ? allShelves.filter(shelf => allowedLocationIds.has(shelf.location_id)) : allShelves}
                locations={allowedLocationIds.size > 0 ? locations.filter(location => allowedLocationIds.has(location.id)) : locations}
                selectedShelfId={selectedShelfId}
                onShelfChange={setSelectedShelfId}
                isLoading={loadingData}
              />
            </Box>

            {/* Action buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: 1, 
              mt: 2,
              position: { xs: 'sticky', sm: 'static' },
              bottom: { xs: 0, sm: 'auto' },
              bgcolor: { xs: 'background.paper', sm: 'transparent' },
              p: { xs: 2, sm: 0 },
              mx: { xs: -2, sm: 0 },
              borderTop: { xs: '1px solid', sm: 'none' },
              borderColor: { xs: 'divider', sm: 'transparent' },
              zIndex: { xs: 1, sm: 'auto' }
            }}>
              <Button 
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                onClick={saveBook}
                disabled={!selectedShelfId || isLoading}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {isLoading ? 'Saving...' : (allShelves.length === 1 ? 'Add to Library' : 'Save to Library')}
              </Button>
              <Button 
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => {
                  const bookKey = selectedBook?.isbn || selectedBook?.title || null
                  setSelectedBook(null)
                  setPreserveSearchState(true)
                  setAutoSearchAfterAdd(false) // Prevent auto-search when returning
                  setCancelledBookKey(bookKey)
                }}
                disabled={isLoading}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {/* Modal Components */}
        {modalState.type === 'confirm' && (
          <ConfirmationModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onConfirm={modalState.onConfirm!}
            title={modalState.options.title}
            message={modalState.options.message}
            confirmText={modalState.options.confirmText}
            cancelText={modalState.options.cancelText}
            variant={modalState.options.variant}
            loading={modalState.loading}
          />
        )}
        
        {modalState.type === 'alert' && (
          <AlertModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            title={modalState.options.title}
            message={modalState.options.message}
            variant={modalState.options.variant}
            buttonText={modalState.options.buttonText}
          />
        )}
        
        {/* More Details Modal */}
        {showMoreDetailsModal && selectedBook && (
          <MoreDetailsModal
            book={selectedBook}
            isOpen={showMoreDetailsModal}
            onClose={() => setShowMoreDetailsModal(false)}
          />
        )}

        {/* Bulk Review Modal */}
        <BulkReviewModal
          isOpen={showBulkReviewModal}
          onClose={() => setShowBulkReviewModal(false)}
          onBulkSave={handleBulkSave}
          locations={allowedLocationIds.size > 0 ? locations.filter(location => allowedLocationIds.has(location.id)) : locations}
          shelves={allowedLocationIds.size > 0 ? allShelves.filter(shelf => allowedLocationIds.has(shelf.location_id)) : allShelves}
          selectedShelfId={selectedShelfId}
          onShelfChange={setSelectedShelfId}
        />

        {/* Floating Selection Indicator */}
        <CartIndicator
          onViewSelection={() => setShowBulkReviewModal(true)}
        />

        {/* Mobile Bottom Navigation */}
        <AddBooksMobileBottomNav
          activeTab={activeTab}
          onLibraryClick={() => window.location.href = '/library'}
          onCameraClick={() => {
            // Switch to the scan tab for ISBN scanning
            if (activeTab !== 1) {
              setActiveTab(1)
              setStorageItem('addBooks_preferredTab', 'scan', 'functional')
            }
          }}
          onManualClick={() => {
            // Switch to search tab and focus search input
            if (activeTab !== 0) {
              setActiveTab(0)
              setStorageItem('addBooks_preferredTab', 'search', 'functional')
            }
            setTimeout(() => {
              const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
              searchInput?.focus()
            }, 100)
          }}
          onRecentClick={() => {
            // Show recent activity or additions
            alert({
              title: 'Recent Activity',
              message: 'Recent book additions and scan history feature coming soon!',
              variant: 'info'
            })
          }}
        />
      </Paper>
    </Container>
  )
}

interface AddBooksProps {
  initialTab?: 'scan' | 'search'
}

// Main component wrapper with provider
export default function AddBooks({ initialTab }: AddBooksProps = {}) {
  return (
    <BookSelectionProvider>
      <AddBooksInternal initialTab={initialTab} />
    </BookSelectionProvider>
  )
}