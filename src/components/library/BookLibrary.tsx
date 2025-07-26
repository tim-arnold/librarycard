'use client'

import { useState, useMemo } from 'react'
import { Alert, Typography, Box, CircularProgress } from '@mui/material'
import { LibraryBooks, MenuBook } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { useModal } from '@/hooks/useModal'
import { useBookLibrary } from '@/hooks/useBookLibrary'
import { useBookActions } from '@/hooks/useBookActions'
import { useBookFilters } from '@/hooks/useBookFilters'
import { isAdmin } from '@/lib/permissions'
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
import ShelfTiles from './ShelfTiles'
import ViewModeControls from './ViewModeControls'
import BookViews from './BookViews'
import PageContainer from '../layout/PageContainer'

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
  } = useBookLibrary({ initialFilters })

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
    showRemovalReasonModal,
    handleRemovalReasonModalClose,
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
  const [genreUpdateSuccessful, setGenreUpdateSuccessful] = useState(false)

  // Modal handlers
  const handleMoreDetailsClick = (book: EnhancedBook) => {
    setSelectedBookForDetails(book)
  }

  const handleRelocateClick = (book: EnhancedBook) => {
    setSelectedBookForRelocate(book)
  }

  const handleRateBook = (book: EnhancedBook) => {
    setSelectedBookForRating(book)
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
    alert({
      title: 'Series Search', 
      message: `This feature will search your library for other books in the ${seriesName} series. Feature coming soon!`,
      variant: 'info'
    })
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
    setShelves(prevShelves => [...prevShelves, newShelf])
  }

  // Rating modal handlers
  const handleRatingModalSubmit = async (rating: number, reviewText?: string) => {
    if (!selectedBookForRating) return
    await handleRatingSubmit(selectedBookForRating.id, rating, reviewText)
  }

  // Genre edit handlers
  const handleGenreEditModalClose = () => {
    setSelectedBookForGenreEdit(null)
    if (genreUpdateSuccessful) {
      alert({
        title: 'Genres Updated',
        message: 'Book genres have been updated successfully.',
        variant: 'success'
      })
      setGenreUpdateSuccessful(false)
    }
  }

  const handleGenreUpdateWrapper = async (bookId: string, genres: any[]) => {
    await handleGenreUpdate(bookId, genres)
    setGenreUpdateSuccessful(true)
  }

  // Cover edit handlers
  const handleCoverSelectWrapper = async (coverOption: any) => {
    if (!selectedBookForCoverEdit) return
    const success = await handleCoverSelect(selectedBookForCoverEdit.id, coverOption)
    if (success) {
      setSelectedBookForCoverEdit(null)
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
    filteredBooks.forEach(book => {
      const shelf = shelves.find(s => s.id === book.shelf_id)
      if (shelf) {
        const locationData = locationMap.get(shelf.location_id)
        if (locationData) {
          locationData.books.push(book)
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
      // For regular users, simple pagination
      return paginatedBooks
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
          isRefreshing={isRefreshing}
          onRefresh={async () => {
            const result = await handleManualRefresh()
            if (result?.success) {
              await alert({
                title: 'Library Refreshed',
                message: 'Your library has been refreshed with the latest data.',
                variant: 'success'
              })
            } else {
              await alert({
                title: 'Refresh Failed',
                message: 'Failed to refresh library. Please try again.',
                variant: 'error'
              })
            }
          }}
        />

        {/* Contextual help text based on user role and library state */}
        {books.length === 0 ? (
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
        ) : (
          <Alert 
            severity="info" 
            variant="outlined"
            sx={{ mb: 3 }}
          >
            {shelves.length <= 1 ? (
              <Typography variant="body2">
                <MenuBook sx={{ mr: 1, verticalAlign: 'middle' }} /> <strong>Your Library:</strong> Use search and category filters to find what you&apos;re looking for.{!isAdmin(userRole) && ' Click &quot;Request Removal&quot; to submit requests to an administrator.'}
              </Typography>
            ) : isAdmin(userRole) ? (
              <Typography variant="body2">
                <strong>Admin View:</strong> {books.length} books across {allLocations.length} location{allLocations.length !== 1 ? 's' : ''} and {shelves.length} shelves.
              </Typography>
            ) : (
              <Typography variant="body2">
                <LibraryBooks sx={{ mr: 1, verticalAlign: 'middle' }} /> <strong>Your Collection:</strong> Browse your {books.length} books across {shelves.length} shelves. Click shelf tiles to filter, or use the search bar to find specific titles. Click &quot;Request Removal&quot; to submit requests to an administrator.
              </Typography>
            )}
          </Alert>
        )}

        <ShelfTiles
          userRole={userRole}
          shelves={isAdmin(userRole) ? shelves : shelves.filter(shelf => currentLocation && shelf.location_id === currentLocation.id)}
          books={filteredBooks}
          shelfFilter={shelfFilter}
          onShelfTileClick={(shelfName) => setShelfFilter(shelfFilter === shelfName ? '' : shelfName)}
          onAllShelvesClick={() => setShelfFilter('')}
        />

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
          allLocations={allLocations}
          userLocations={userLocations}
          currentLocation={currentLocation}
          onLocationSwitch={switchToLocation}
          allCategories={allCategories}
        />

        <ActiveFilters
          authorFilter={authorFilter}
          shelfFilter={shelfFilter}
          categoryFilter={categoryFilter}
          locationFilter={locationFilter}
          checkoutFilter={checkoutFilter}
          allLocationsCount={allLocations.length}
          onAuthorRemove={() => setAuthorFilter('')}
          onShelfRemove={() => setShelfFilter('')}
          onGenreRemove={handleGenreRemove}
          onLocationRemove={() => setLocationFilter('')}
          onCheckoutRemove={() => setCheckoutFilter('')}
        />

        <ViewModeControls
          viewMode={viewMode}
          booksPerPage={booksPerPage}
          filteredBooksCount={filteredBooks.length}
          onViewModeChange={handleViewModeChange}
          onBooksPerPageChange={handleBooksPerPageChange}
        />

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
        />

        {selectedBookForRating && (
          <RatingModal
            book={selectedBookForRating}
            isOpen={true}
            onClose={() => setSelectedBookForRating(null)}
            onRatingSubmit={handleRatingModalSubmit}
            currentRating={selectedBookForRating.userRating}
            currentReview={selectedBookForRating.userReview}
          />
        )}

        {selectedBookForGenreEdit && (
          <GenreEditModal
            book={selectedBookForGenreEdit}
            isOpen={true}
            onClose={handleGenreEditModalClose}
            onGenreUpdate={handleGenreUpdateWrapper}
          />
        )}

        {selectedBookForCoverEdit && (
          <CoverSelectionModal
            title={selectedBookForCoverEdit.title}
            author={selectedBookForCoverEdit.authors.join(', ')}
            currentCover={selectedBookForCoverEdit.thumbnail}
            onCoverSelect={handleCoverSelectWrapper}
            onClose={() => setSelectedBookForCoverEdit(null)}
            open={true}
          />
        )}
    </PageContainer>
  )
}