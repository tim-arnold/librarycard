'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  QrCodeScanner,
  MenuBook,
  Save,
  Cancel,
} from '@mui/icons-material'
import { fetchEnhancedBookData, fetchEnhancedBookFromSearch } from '@/lib/bookApi'
import type { EnhancedBook, CuratedGenre } from '@/lib/types'
import { saveBook as saveBookAPI, getBooks } from '@/lib/api'
import { authenticatedFetch } from '@/lib/auth-utils'
import ConfirmationModal from './ConfirmationModal'
import AlertModal from './AlertModal'
import ShelfSelector from './ShelfSelector'
import ISBNScanner from './ISBNScanner'
import BookSearch from './BookSearch'
import BookPreview from './BookPreview'
import { useModal } from '@/hooks/useModal'
import { getStorageItem, setStorageItem } from '@/lib/storage'
import { BookSelectionProvider, useBookSelection } from '@/contexts/BookSelectionContext'
import CartIndicator from './CartIndicator'
import BulkReviewModal from './BulkReviewModal'
import GenreSelector from './GenreSelector'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'

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
        📖 More Details: {book.title}
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

interface GoogleBookItem {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    publishedDate?: string
    categories?: string[]
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
  }
}

interface AddBooksInternalProps {
  initialTab?: 'scan' | 'search'
}

// Internal component that has access to BookSelectionContext
function AddBooksInternal({ initialTab }: AddBooksInternalProps) {
  const { data: session } = useSession()
  const { modalState, alert, closeModal } = useModal()
  const { state: selectionState, actions: selectionActions } = useBookSelection()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'scan' | 'search'>(() => {
    // If initialTab is provided (from URL), use that
    if (initialTab) return initialTab
    
    // Otherwise, remember user's preferred tab choice
    const savedTab = getStorageItem('addBooks_preferredTab', 'functional') as 'scan' | 'search'
    return savedTab || 'search'
  })
  
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
      const locationsResponse = await fetch(`${API_BASE}/api/locations`, {
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
          const shelvesResponse = await fetch(`${API_BASE}/api/locations/${location.id}/shelves`, {
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
        
        // Smart UI: Auto-select shelf if only one available
        if (allShelvesData.length === 1) {
          setSelectedShelfId(allShelvesData[0].id)
        } else {
          // For multi-shelf users, restore the last selected shelf if it still exists
          const lastSelectedShelfId = getStorageItem('lastSelectedShelfId', 'functional')
          if (lastSelectedShelfId) {
            const shelfId = parseInt(lastSelectedShelfId)
            const shelfExists = allShelvesData.some(shelf => shelf.id === shelfId)
            if (shelfExists) {
              setSelectedShelfId(shelfId)
            }
          }
        }
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
      // Get user's current location for permission checking
      // We'll use the first location they have access to
      const locationsResponse = await authenticatedFetch(session, '/api/locations')
      
      if (locationsResponse.success && locationsResponse.data?.length > 0) {
        const firstLocation = locationsResponse.data[0]
        
        // Check if user has can_add_books permission for this location
        const permissionResult = await authenticatedFetch(
          session, 
          `/api/permissions/check?locationId=${firstLocation.id}&permission=can_add_books`
        )
        
        if (permissionResult.success) {
          setCanAddBooks(permissionResult.data?.hasPermission || false)
        } else {
          // If permission check fails, assume they can add books (default behavior)
          setCanAddBooks(true)
        }
      } else {
        // If no locations, they can't add books
        setCanAddBooks(false)
      }
    } catch (err) {
      console.error('Error checking add books permission:', err)
      // On error, assume they can add books (fail open for better UX)
      setCanAddBooks(true)
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
      } else {
        await alert({
          title: 'Book Not Found',
          message: 'Book not found for this ISBN. Please try a different ISBN or use the search feature.',
          variant: 'warning'
        })
      }
    } catch {
      await alert({
        title: 'Lookup Error',
        message: 'Failed to fetch book data. Please check your internet connection and try again.',
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
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
        await alert({
          title: 'Book Enhancement Failed',
          message: 'Failed to get enhanced book data. Using basic information instead.',
          variant: 'warning'
        })
        
        // Fallback to basic book data
        const isbn = item.volumeInfo.industryIdentifiers?.find(
          id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier || item.id

        const book: EnhancedBook = {
          id: item.id,
          isbn: isbn,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ['Unknown Author'],
          description: item.volumeInfo.description,
          thumbnail: item.volumeInfo.imageLinks?.thumbnail,
          publishedDate: item.volumeInfo.publishedDate,
          categories: item.volumeInfo.categories,
        }

        setSelectedBook(book)
        // Keep search results populated - don't clear them
      }
    } catch {
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
          google_id: selectedCoverData.id,
          selection_reason: 'user_selected'
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
              const response = await fetch(`${API_BASE}/books/${savedBook.id}/genres`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.user?.email}`
                },
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
      
      const bookTitle = selectedBook.title
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
      if (activeTab === 'search' || searchQuery.trim()) {
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
      if (activeTab === 'search' || searchQuery.trim()) {
        setAutoSearchAfterAdd(true)
      }

    } catch (error) {
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'scan' | 'search') => {
    setActiveTab(newValue)
    
    // Navigate to the appropriate URL
    router.push(`/add-books/${newValue}`)
    
    // Save user's preferred tab choice
    setStorageItem('addBooks_preferredTab', newValue, 'functional')
    
    // Clear search query when switching away from search
    if (newValue !== 'search') {
      setSearchQuery('')
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
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            📚  Add Books
          </Typography>

          {/* Permission Warning */}
          {permissionChecked && !canAddBooks && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                You don't have permission to add books to this location. You can search for books to view their details, but the add and select buttons will be disabled. Contact a location administrator to request permission.
              </Typography>
            </Alert>
          )}

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab 
              value="search" 
              label="Search"
              icon={<MenuBook />}
              iconPosition="start"
            />
            <Tab 
              value="scan" 
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
        </Paper>

        {/* ISBN Scanner Tab */}
        {activeTab === 'scan' && !selectedBook && (
          <ISBNScanner
            onISBNDetected={handleISBNDetected}
            onError={handleError}
            isLoading={isLoading}
            disabled={loadingData}
          />
        )}

        {/* Search Tab */}
        {activeTab === 'search' && !selectedBook && (
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


        {/* Selected Book Display (shared between tabs) */}
        {selectedBook && (
          <Box sx={{ mt: 3 }} data-testid="book-selected-section" ref={bookSelectedRef}>
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
            <GenreSelector
              book={selectedBook}
              selectedGenres={selectedGenres}
              onGenresChange={setSelectedGenres}
              onError={(message) => alert({ title: 'Genre Error', message, variant: 'error' })}
            />
            
            {/* Shelf selector */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <ShelfSelector
                shelves={allShelves}
                locations={locations}
                selectedShelfId={selectedShelfId}
                onShelfChange={setSelectedShelfId}
                isLoading={loadingData}
              />
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button 
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                onClick={saveBook}
                disabled={!selectedShelfId || isLoading}
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
          locations={locations}
          shelves={allShelves}
          selectedShelfId={selectedShelfId}
          onShelfChange={setSelectedShelfId}
        />

        {/* Floating Selection Indicator */}
        <CartIndicator 
          onViewSelection={() => setShowBulkReviewModal(true)}
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