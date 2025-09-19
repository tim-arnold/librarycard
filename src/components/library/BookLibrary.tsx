'use client'

import { useState, useMemo } from 'react'
import { Alert, Typography, Box, CircularProgress, Fab, Drawer } from '@mui/material'
import { LibraryBooks, MenuBook } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { useModal } from '@/hooks/useModal'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'
import useScrollLock from '@/hooks/useScrollLock'
import { useBookLibraryEnhanced as useBookLibrary } from '@/hooks/useBookLibraryEnhanced'
import { useBookActions } from '@/hooks/useBookActions'
import { useBookFilters } from '@/hooks/useBookFilters'
import { isAdmin } from '@/lib/permissions'
import { featureFlags } from '@/lib/featureFlags'
import PerformanceMonitor from '../dev/PerformanceMonitor'
import ConfirmationModal from '../modals/ConfirmationModal'
import AlertModal from '../modals/AlertModal'
import BookFilters from './BookFilters'
import RemovalReasonModal from '../modals/RemovalReasonModal'
import RatingModal from '../modals/RatingModal'
import GenreEditModal from '../modals/GenreEditModal'
import CoverSelectionModal from '../modals/CoverSelectionModal'
import MoreDetailsModal from '../modals/MoreDetailsModal'
import BookRelocateModal from '../modals/BookRelocateModal'
import LibraryHeader from './LibraryHeader'
import ActiveFilters from './ActiveFilters'
import ViewModeControls from './ViewModeControls'
import BookViews from './BookViews'
import LibrarySidebar from './sidebar/LibrarySidebar'
import PageContainer from '../layout/PageContainer'
import MobileBottomNav from '../layout/MobileBottomNav'
import MobileFilterDrawer from '../layout/MobileFilterDrawer'
import MobileSearchPanel from './MobileSearchPanel'

interface BookLibraryProps {
  initialFilters?: {
    location?: string
    shelf?: string
    status?: string
    searchTerm?: string
    category?: string
  }
}

export default function BookLibrary({ initialFilters }: BookLibraryProps = {}) {
  const { isMobile } = useMobileBreakpoints()
  const { modalState, confirmAsync, alert, closeModal } = useModal()
  
  // Core data and state from hooks
  const {
    books,
    shelves,
    userRole,
    currentUserId,
    currentLocation,
    allLocations,
    userLocations,
    userPermissions,
    userGlobalPermissions,
    pendingRemovalRequests,
    isLoading,
    isRefreshing,
    handleManualRefresh,
    loadPendingRemovalRequests,
    switchToLocation,
    setBooks,
    setShelves,
    setPendingRemovalRequests,
  } = useBookLibrary({ 
    initialFilters,
    useReactQuery: featureFlags.useReactQuery,
    viewMode: 'grid' // Default viewMode for initial load
  })

  // Book actions
  const {
    deleteBook,
    cancelRemovalRequest,
    requestBookRemoval,
    updateBookShelf,
    checkoutBook,
    checkinBook,
    handleRatingSubmit,
    handleGenreUpdate,
    handleCoverSelect,
    animatingCovers,
    handleCoverAnimationComplete,
    startCoverAnimation,
    showRemovalReasonModal,
    handleRemovalReasonModalClose,
    currentBookForRemoval,
  } = useBookActions({
    books,
    setBooks,
    shelves,
    pendingRemovalRequests,
    setPendingRemovalRequests,
    loadPendingRemovalRequests,
    currentUserId,
    confirmAsync,
    alert
  })

  // Filtering and display logic
  const {
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
    seriesFilter,
    setSeriesFilter,
    sortField,
    sortDirection,
    viewMode,
    currentPage,
    booksPerPage,
    filteredBooks,
    paginatedBooks,
    allCategories,
    handleViewModeChange,
    handleBooksPerPageChange,
    handleGenreRemove,
    handleAuthorClick,
    handleSortFieldChange,
    handleSortDirectionChange,
    handlePageChange,
    getTotalPages,
  } = useBookFilters({
    books,
    shelves,
    allLocations,
    userLocations,
    currentLocation,
    userRole,
    isLoading,
    initialFilters
  })

  // Modal states
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<EnhancedBook | null>(null)
  const [selectedBookForRelocate, setSelectedBookForRelocate] = useState<EnhancedBook | null>(null)
  const [selectedBookForRating, setSelectedBookForRating] = useState<EnhancedBook | null>(null)
  const [selectedBookForGenreEdit, setSelectedBookForGenreEdit] = useState<EnhancedBook | null>(null)
  const [selectedBookForCoverEdit, setSelectedBookForCoverEdit] = useState<EnhancedBook | null>(null)
  
  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  // Lock scroll when any mobile panel is open
  useScrollLock(mobileSidebarOpen || mobileFiltersOpen || mobileSearchOpen)


  // Calculate active filters count for mobile bottom nav
  const activeFiltersCount = [
    locationFilter,
    shelfFilter,
    checkoutFilter,
    categoryFilter.length > 0 ? 'genre' : '',
  ].filter(Boolean).length

  // Modal handlers
  const handleMoreDetailsClick = (book: EnhancedBook) => {
    // Find the current book data from the books array to ensure we have the latest data
    const currentBook = books.find(b => b.id === book.id) || book
    setSelectedBookForDetails(currentBook)
  }

  const handleRelocateClick = (book: EnhancedBook) => {
    setSelectedBookForRelocate(book)
  }

  const handleRateBook = (book: EnhancedBook) => {
    // Find the current book data from the books array to ensure we have the latest data
    const currentBook = books.find(b => b.id === book.id) || book
    setSelectedBookForRating(currentBook)
  }

  const handleGenreEdit = (book: EnhancedBook) => {
    if (!userPermissions.includes('can_edit_genres')) {
      alert({
        title: 'Permission Required',
        message: 'You do not have permission to edit genres. Please contact your location administrator.',
        variant: 'warning'
      })
      return
    }
    setSelectedBookForGenreEdit(book)
  }

  const handleCoverEdit = (book: EnhancedBook) => {
    if (!userPermissions.includes('can_add_books')) {
      alert({
        title: 'Permission Required',
        message: 'You do not have permission to edit book covers. Please contact your location administrator.',
        variant: 'warning'
      })
      return
    }
    setSelectedBookForCoverEdit(book)
  }

  const handleSeriesClick = (seriesName: string) => {
    // Use the dedicated series filter for precise filtering
    setSeriesFilter(seriesName)
  }

  // Sidebar handlers
  const handleSidebarBookClick = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (book) {
      handleMoreDetailsClick(book)
      // Close mobile sidebar when action is taken
      if (isMobile) {
        setMobileSidebarOpen(false)
      }
    }
  }

  const handleSidebarAuthorClick = (authorName: string) => {
    handleAuthorClick(authorName)
    // Close mobile sidebar when filter is applied
    if (isMobile) {
      setMobileSidebarOpen(false)
    }
  }

  const handleSidebarFilterApply = (filterType: string, value: string) => {
    switch (filterType) {
      case 'shelf':
        setShelfFilter(value)
        break
      case 'category':
        setCategoryFilter([value])
        break
      case 'author':
        setAuthorFilter(value)
        break
      default:
        console.warn('Unknown filter type from sidebar:', filterType)
    }
    // Close mobile sidebar when filter is applied
    if (isMobile) {
      setMobileSidebarOpen(false)
    }
  }

  // Handle book relocation
  const handleRelocateSuccess = async (newShelfId: number, shelfName: string) => {
    if (!selectedBookForRelocate) return
    
    await updateBookShelf(selectedBookForRelocate.id, newShelfId, shelfName)
    await alert({
      title: 'Book Relocated',
      message: `"${selectedBookForRelocate.title}" has been moved to ${shelfName}.`,
      variant: 'success'
    })
  }

  const handleCreateShelfSuccess = (newShelf: any) => {
    setShelves((prevShelves: any) => [...prevShelves, newShelf])
  }

  // Rating modal handlers
  const handleRatingModalSubmit = async (rating: number, reviewText?: string) => {
    if (!selectedBookForRating) return
    await handleRatingSubmit(selectedBookForRating.id, rating, reviewText)
  }

  // Genre edit handlers
  const handleGenreEditModalClose = () => {
    setSelectedBookForGenreEdit(null)
  }

  // Cover edit handlers
  const handleCoverSelectWrapper = async (coverOption: any) => {
    if (!selectedBookForCoverEdit) return
    const success = await handleCoverSelect(selectedBookForCoverEdit.id, coverOption)
    if (success) {
      setSelectedBookForCoverEdit(null)
    }
  }

  const handleCoverAnimationStart = () => {
    if (selectedBookForCoverEdit) {
      startCoverAnimation(selectedBookForCoverEdit.id)
    }
  }

  // Group books by location for admin users
  const booksByLocation = useMemo(() => {

    if (!isAdmin(userRole)) {
      return null // Regular users don't need location grouping
    }

    // Create a map of location_id -> location info
    const locationMap = new Map()
    allLocations.forEach(location => {
      locationMap.set(location.id, {
        ...location,
        shelves: shelves.filter(shelf => shelf.location_id === location.id),
        books: []
      })
    })

    // Group filtered books by their location
    let booksGrouped = 0;
    filteredBooks.forEach(book => {
      const shelf = shelves.find(s => s.id === book.shelf_id)
      if (shelf) {
        const locationData = locationMap.get(shelf.location_id)
        if (locationData) {
          locationData.books.push(book)
          booksGrouped++;
        }
      }
    })

    return Array.from(locationMap.values()).filter(location => location.books.length > 0)
  }, [userRole, allLocations, shelves, filteredBooks])

  // Get paginated books for current view
  const getPaginatedBooksForView = () => {
    
    if (isAdmin(userRole) && booksByLocation) {
      // For admin view, we need to handle pagination across grouped locations
      // We'll flatten all books, paginate them, then regroup
      const allBooks = booksByLocation.flatMap(location => location.books || [])
      const paginatedBooksFlat = allBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage)
      
      // Regroup paginated books by location
      const locationMap = new Map()
      allLocations.forEach(location => {
        locationMap.set(location.id, {
          ...location,
          shelves: shelves.filter(shelf => shelf.location_id === location.id),
          books: []
        })
      })
      
      paginatedBooksFlat.forEach(book => {
        const shelf = shelves.find(s => s.id === book.shelf_id)
        if (shelf) {
          const locationData = locationMap.get(shelf.location_id)
          if (locationData) {
            locationData.books.push(book)
          }
        }
      })
      
      return Array.from(locationMap.values()).filter(location => location.books.length > 0)
    } else {
      // For regular users, wrap paginated books in location structure for consistency
      if (paginatedBooks.length === 0) {
        return []
      }
      
      // Group paginated books by location for consistent rendering
      const locationMap = new Map()
      userLocations.forEach(location => {
        locationMap.set(location.id, {
          ...location,
          books: []
        })
      })
      
      paginatedBooks.forEach(book => {
        const shelf = shelves.find(s => s.id === book.shelf_id)
        if (shelf) {
          const locationData = locationMap.get(shelf.location_id)
          if (locationData) {
            locationData.books.push(book)
          }
        }
      })
      
      return Array.from(locationMap.values()).filter(location => location.books.length > 0)
    }
  }

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" component="h2" gutterBottom>
            <LibraryBooks sx={{ mr: 1 }} /> Loading Your Library
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
            Please wait while we fetch your books, shelves, and settings...
          </Typography>
        </Box>
      </PageContainer>
    )
  }

  return (
    <PerformanceMonitor componentName="BookLibrary">
      <PageContainer>
        <LibraryHeader
          userRole={userRole}
          currentLocation={currentLocation}
          locationFilter={locationFilter}
          filteredBooksCount={filteredBooks.length}
          totalBooksCount={books.length}
          shelfFilter={shelfFilter}
          shelvesCount={shelves.length}
          allLocationsCount={allLocations.length}
        />

        {/* Show welcome message only for empty libraries */}
        {books.length === 0 && (
          <Alert 
            severity="info" 
            icon={<LibraryBooks />}
            sx={{ mb: 3, textAlign: 'center' }}
          >
            <Typography variant="h6" gutterBottom>
              Welcome to Your Library!
            </Typography>
            <Typography variant="body2">
              Your library is empty. Head over to the <strong>ISBN Scanner</strong> to add your first book!
            </Typography>
          </Alert>
        )}


        {/* Desktop Filters - Hidden on mobile (mobile uses bottom nav + filter drawer) */}
        {!isMobile && (
          <div data-tour="search-filters">
            <BookFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              shelfFilter={shelfFilter}
              setShelfFilter={setShelfFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
              checkoutFilter={checkoutFilter}
              setCheckoutFilter={setCheckoutFilter}
              sortField={sortField}
              setSortField={handleSortFieldChange}
              sortDirection={sortDirection}
              setSortDirection={handleSortDirectionChange}
              userRole={userRole || ''}
              shelves={isAdmin(userRole) ? shelves : shelves.filter(shelf => currentLocation && shelf.location_id === currentLocation.id)}
              books={books}
              allLocations={allLocations}
              userLocations={userLocations}
              currentLocation={currentLocation}
              onLocationSwitch={switchToLocation}
              allCategories={allCategories}
            />
          </div>
        )}

        <ActiveFilters
          searchTerm={searchTerm}
          authorFilter={authorFilter}
          shelfFilter={shelfFilter}
          categoryFilter={categoryFilter}
          locationFilter={locationFilter}
          checkoutFilter={checkoutFilter}
          seriesFilter={seriesFilter}
          allLocationsCount={allLocations.length}
          onSearchRemove={() => setSearchTerm('')}
          onAuthorRemove={() => setAuthorFilter('')}
          onShelfRemove={() => setShelfFilter('')}
          onGenreRemove={handleGenreRemove}
          onLocationRemove={() => setLocationFilter('')}
          onCheckoutRemove={() => setCheckoutFilter('')}
          onSeriesRemove={() => setSeriesFilter('')}
          onClearAll={() => {
            setSearchTerm('')
            setAuthorFilter('')
            setShelfFilter('')
            setCategoryFilter([])
            setLocationFilter('')
            setCheckoutFilter('')
            setSeriesFilter('')
          }}
        />

        <ViewModeControls
          viewMode={viewMode}
          booksPerPage={booksPerPage}
          filteredBooksCount={filteredBooks.length}
          totalBooksCount={books.length}
          onViewModeChange={handleViewModeChange}
          onBooksPerPageChange={handleBooksPerPageChange}
        />

        {/* Main Content Layout */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', md: 'row' },
          // Add bottom padding for mobile bottom navigation
          paddingBottom: { xs: '80px', md: 0 }
        }}>
          {/* Sidebar - Hidden on mobile, collapsible on larger screens */}
          {!isMobile && (
            <LibrarySidebar
              onBookClick={handleSidebarBookClick}
              onAuthorClick={handleSidebarAuthorClick}
              onFilterApply={handleSidebarFilterApply}
            />
          )}
          
          {/* Main Book Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <div data-tour="book-grid">
              <BookViews
            viewMode={viewMode}
            userRole={userRole}
            userPermissions={userPermissions}
            userGlobalPermissions={userGlobalPermissions}
            userLocations={userLocations}
            currentUserId={currentUserId}
            shelves={shelves}
            pendingRemovalRequests={pendingRemovalRequests}
            filteredBooks={filteredBooks}
            paginatedBooks={paginatedBooks}
            booksByLocation={booksByLocation}
            locationFilter={locationFilter}
            shelfFilter={shelfFilter}
            categoryFilter={categoryFilter}
            checkoutFilter={checkoutFilter}
            authorFilter={authorFilter}
            searchTerm={searchTerm}
            currentPage={currentPage}
            booksPerPage={booksPerPage}
            onCheckout={checkoutBook}
            onCheckin={checkinBook}
            onDelete={deleteBook}
            onRelocate={handleRelocateClick}
            onRequestRemoval={requestBookRemoval}
            onCancelRemovalRequest={cancelRemovalRequest}
            onMoreDetailsClick={handleMoreDetailsClick}
            onAuthorClick={handleAuthorClick}
            onSeriesClick={handleSeriesClick}
            onRateBook={handleRateBook}
            onGenreEdit={userPermissions.includes('can_edit_genres') ? handleGenreEdit : undefined}
            onCoverEdit={userPermissions.includes('can_add_books') ? handleCoverEdit : undefined}
            animatingCovers={animatingCovers}
            onCoverAnimationComplete={handleCoverAnimationComplete}
            onPageChange={handlePageChange}
            getTotalPages={getTotalPages}
            getPaginatedBooksForView={getPaginatedBooksForView}
          />
            </div>
          </Box>
        </Box>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          onFilterToggle={() => {
            setMobileFiltersOpen(!mobileFiltersOpen)
            setMobileSearchOpen(false)
            setMobileSidebarOpen(false)
          }}
          onSidebarToggle={() => {
            setMobileSidebarOpen(!mobileSidebarOpen)
            setMobileFiltersOpen(false)
            setMobileSearchOpen(false)
          }}
          onAddBookClick={() => window.location.href = '/add-books'}
          onSearchToggle={() => {
            setMobileSearchOpen(!mobileSearchOpen)
            setMobileFiltersOpen(false)
            setMobileSidebarOpen(false)
          }}
          activeFiltersCount={activeFiltersCount}
          searchTerm={searchTerm}
        />

        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <Drawer
            anchor="bottom"
            open={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            ModalProps={{
              keepMounted: false,
              // Restore backdrop for proper click-outside behavior
              BackdropProps: {
                sx: {
                  zIndex: 900, // Below toolbar (1000) but above content
                }
              }
            }}
            sx={{
              zIndex: 950, // Below toolbar (1000) but above backdrop (900)
              '& .MuiDrawer-paper': {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: 'calc(100vh - 80px)',
                minHeight: '60vh',
                bottom: 64,
                height: 'auto',
                zIndex: 950, // Same as drawer, below toolbar
              }
            }}
          >
            <LibrarySidebar
              onBookClick={handleSidebarBookClick}
              onAuthorClick={handleSidebarAuthorClick}
              onFilterApply={handleSidebarFilterApply}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
          </Drawer>
        )}

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          shelfFilter={shelfFilter}
          setShelfFilter={setShelfFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          checkoutFilter={checkoutFilter}
          setCheckoutFilter={setCheckoutFilter}
          sortField={sortField}
          setSortField={handleSortFieldChange}
          sortDirection={sortDirection}
          setSortDirection={handleSortDirectionChange}
          userRole={userRole || ''}
          shelves={isAdmin(userRole) ? shelves : shelves.filter(shelf => currentLocation && shelf.location_id === currentLocation.id)}
          books={books}
          allLocations={allLocations}
          userLocations={userLocations}
          currentLocation={currentLocation}
          onLocationSwitch={switchToLocation}
          allCategories={allCategories}
        />

        {/* Mobile Search Panel */}
        <MobileSearchPanel
          open={mobileSearchOpen}
          onClose={() => setMobileSearchOpen(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
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

        <MoreDetailsModal
          book={selectedBookForDetails}
          isOpen={!!selectedBookForDetails}
          onClose={() => setSelectedBookForDetails(null)}
          userRole={userRole}
          userPermissions={userPermissions}
          onBookUpdate={(bookId: string, updatedBookData: Partial<EnhancedBook>) => {
            console.log('📞 onBookUpdate called with targeted update for book:', bookId, updatedBookData)
            
            // Update the main books array so the card in the library view gets updated
            const updatedBooks = books.map(book => 
              book.id === bookId 
                ? { ...book, ...updatedBookData }
                : book
            )
            setBooks(updatedBooks)
            console.log('🔄 Updated main books array with fresh series data')
            
            // Also update the selectedBookForDetails if it matches
            if (selectedBookForDetails?.id === bookId) {
              console.log('🔄 Updating selectedBookForDetails with fresh data')
              setSelectedBookForDetails({ ...selectedBookForDetails, ...updatedBookData })
            }
            
            console.log('✅ Book updated successfully in both main library and modal')
          }}
        />

        <BookRelocateModal
          book={selectedBookForRelocate}
          isOpen={!!selectedBookForRelocate}
          onClose={() => setSelectedBookForRelocate(null)}
          shelves={shelves}
          allLocations={isAdmin(userRole) ? allLocations : userLocations}
          userPermissions={userPermissions}
          onRelocateSuccess={handleRelocateSuccess}
          onCreateShelfSuccess={handleCreateShelfSuccess}
        />

        <RemovalReasonModal
          open={showRemovalReasonModal}
          onClose={handleRemovalReasonModalClose}
          bookStatus={currentBookForRemoval?.status}
          allowCheckoutOverride={userPermissions.includes('allow_checkout_override')}
        />

        {selectedBookForRating && (
          <RatingModal
            book={selectedBookForRating}
            isOpen={true}
            onClose={() => setSelectedBookForRating(null)}
            onRatingSubmit={handleRatingModalSubmit}
            currentRating={selectedBookForRating.userRating}
            currentReview={selectedBookForRating.userReview}
            currentReviewStatus={selectedBookForRating.userReviewStatus}
          />
        )}

        {selectedBookForGenreEdit && (
          <GenreEditModal
            book={selectedBookForGenreEdit}
            isOpen={true}
            onClose={handleGenreEditModalClose}
            onGenreUpdate={handleGenreUpdate}
          />
        )}

        {selectedBookForCoverEdit && (
          <CoverSelectionModal
            title={selectedBookForCoverEdit.title}
            author={selectedBookForCoverEdit.authors.join(', ')}
            currentCover={selectedBookForCoverEdit.thumbnail}
            onCoverSelect={handleCoverSelectWrapper}
            onClose={() => setSelectedBookForCoverEdit(null)}
            onAnimationStart={handleCoverAnimationStart}
            open={true}
          />
        )}
      </PageContainer>
    </PerformanceMonitor>
  )
}