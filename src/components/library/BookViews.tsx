'use client'

import { Box, Typography, Pagination, Fade } from '@mui/material'
import { LocationOn } from '@mui/icons-material'
import BookGrid from '@/components/book/BookGrid'
import VirtualizedBookGrid from '@/components/book/VirtualizedBookGrid'
import BookList from '@/components/book/BookList'
import type { EnhancedBook } from '@/lib/types'
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

interface BookViewsProps {
  viewMode: 'card' | 'list'
  userRole: string | null
  userPermissions: string[]
  userGlobalPermissions: string[]
  userLocations: Location[]
  currentUserId: string | null
  shelves: Shelf[]
  pendingRemovalRequests: Record<string, number>
  filteredBooks: EnhancedBook[]
  paginatedBooks: EnhancedBook[]
  booksByLocation: any[] | null
  locationFilter: string
  shelfFilter: string
  categoryFilter: string[]
  checkoutFilter: string
  authorFilter: string
  searchTerm: string
  currentPage: number
  booksPerPage: number
  onCheckout: (bookId: string, bookTitle: string) => Promise<void>
  onCheckin: (bookId: string, bookTitle: string) => Promise<void>
  onDelete: (bookId: string, bookTitle: string) => Promise<void>
  onRelocate: (book: EnhancedBook) => void
  onRequestRemoval: (bookId: string, bookTitle: string) => Promise<void>
  onCancelRemovalRequest: (bookId: string, bookTitle: string) => Promise<void>
  onMoreDetailsClick: (book: EnhancedBook) => void
  onAuthorClick: (authorName: string) => void
  onSeriesClick: (seriesName: string) => void
  onRateBook: (book: EnhancedBook) => void
  onGenreEdit?: (book: EnhancedBook) => void
  onCoverEdit?: (book: EnhancedBook) => void
  animatingCovers?: Set<string>
  onCoverAnimationComplete?: (bookId: string) => void
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void
  getTotalPages: (books: EnhancedBook[]) => number
  getPaginatedBooksForView: () => any[]
  enableVirtualization?: boolean
}

export default function BookViews({
  viewMode,
  userRole,
  userPermissions,
  userGlobalPermissions,
  userLocations,
  currentUserId,
  shelves,
  pendingRemovalRequests,
  filteredBooks,
  paginatedBooks,
  booksByLocation,
  locationFilter,
  shelfFilter,
  categoryFilter,
  checkoutFilter,
  authorFilter,
  searchTerm,
  currentPage,
  booksPerPage,
  onCheckout,
  onCheckin,
  onDelete,
  onRelocate,
  onRequestRemoval,
  onCancelRemovalRequest,
  onMoreDetailsClick,
  onAuthorClick,
  onSeriesClick,
  onRateBook,
  onGenreEdit,
  onCoverEdit,
  animatingCovers,
  onCoverAnimationComplete,
  onPageChange,
  getTotalPages,
  getPaginatedBooksForView,
  enableVirtualization = false
}: BookViewsProps) {
  // Choose between regular and virtualized BookGrid based on book count and setting
  const shouldUseVirtualization = enableVirtualization || paginatedBooks.length > 100
  const GridComponent = shouldUseVirtualization ? VirtualizedBookGrid : BookGrid
  
  // Common props for both grid components
  const gridProps = {
    userRole,
    userPermissions,
    userGlobalPermissions,
    userLocations,
    currentUserId,
    shelves,
    pendingRemovalRequests,
    onCheckout,
    onCheckin,
    onDelete,
    onRelocate,
    onRequestRemoval,
    onCancelRemovalRequest,
    onMoreDetailsClick,
    onAuthorClick,
    onSeriesClick,
    onRateBook,
    onGenreEdit,
    onCoverEdit,
    animatingCovers,
    onCoverAnimationComplete
  }

  if (filteredBooks.length === 0) {
    return (
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ textAlign: 'center', p: 4 }}
      >
        No books match your filters.
      </Typography>
    )
  }

  const renderLocationHeader = (location: any) => (
    <Box sx={{ 
      bgcolor: 'action.hover',
      p: '0.75rem 1rem', 
      borderRadius: 1, 
      mb: 2,
      border: 1,
      borderColor: 'divider',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Typography variant="h6" sx={{ m: 0, fontSize: '1.1rem' }}>
        <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} /> {location.name} ({(location.books || []).length} book{(location.books || []).length !== 1 ? 's' : ''})
      </Typography>
      {location.description && (
        <Typography variant="body2" color="text.secondary" sx={{ m: 0, fontStyle: 'italic' }}>
          {location.description}
        </Typography>
      )}
    </Box>
  )

  const renderBooks = () => {
    if (viewMode === 'list') {
      // List view (text only)
      if (isAdmin(userRole) && booksByLocation) {
        // Admin list view with location grouping (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`admin-list-${locationFilter}-${shelfFilter}-${categoryFilter.join(',')}-${checkoutFilter}-${authorFilter}-${searchTerm}-${currentPage}`}
          >
            <Box>
              {getPaginatedBooksForView().map((location: any) => (
                <div key={location.id} style={{ marginBottom: '2rem' }}>
                  {/* Only show location header when viewing all locations (no location filter active) */}
                  {!locationFilter && renderLocationHeader(location)}
                  
                  <BookList
                    books={location.books || []}
                    userRole={userRole}
                    userPermissions={userPermissions}
                    userGlobalPermissions={userGlobalPermissions}
                    userLocations={userLocations}
                    currentUserId={currentUserId}
                    shelves={shelves}
                    pendingRemovalRequests={pendingRemovalRequests}
                    onCheckout={onCheckout}
                    onCheckin={onCheckin}
                    onDelete={onDelete}
                    onRelocate={onRelocate}
                    onRequestRemoval={onRequestRemoval}
                    onCancelRemovalRequest={onCancelRemovalRequest}
                    onMoreDetailsClick={onMoreDetailsClick}
                    onAuthorClick={onAuthorClick}
                    onRateBook={onRateBook}
                    onGenreEdit={onGenreEdit}
                  />
                </div>
              ))}
            </Box>
          </Fade>
        )
      } else {
        // Regular user list view (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`list-${locationFilter}-${shelfFilter}-${categoryFilter.join(',')}-${checkoutFilter}-${authorFilter}-${searchTerm}-${currentPage}`}
          >
            <Box>
              <BookList
                books={paginatedBooks}
                userRole={userRole}
                userPermissions={userPermissions}
                userGlobalPermissions={userGlobalPermissions}
                userLocations={userLocations}
                currentUserId={currentUserId}
                shelves={shelves}
                pendingRemovalRequests={pendingRemovalRequests}
                onCheckout={onCheckout}
                onCheckin={onCheckin}
                onDelete={onDelete}
                onRelocate={onRelocate}
                onRequestRemoval={onRequestRemoval}
                onCancelRemovalRequest={onCancelRemovalRequest}
                onMoreDetailsClick={onMoreDetailsClick}
                onAuthorClick={onAuthorClick}
                onRateBook={onRateBook}
                onGenreEdit={onGenreEdit}
              />
            </Box>
          </Fade>
        )
      }
    } else {
      // Card view (default)
      if (isAdmin(userRole) && booksByLocation) {
        // Admin card view with location grouping (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`admin-card-${locationFilter}-${shelfFilter}-${categoryFilter.join(',')}-${checkoutFilter}-${authorFilter}-${searchTerm}-${currentPage}`}
          >
            <Box>
              {getPaginatedBooksForView().map((location: any) => (
                <div key={location.id} style={{ marginBottom: '2rem' }}>
                  {/* Only show location header when viewing all locations (no location filter active) */}
                  {!locationFilter && renderLocationHeader(location)}
                  
                  <GridComponent
                    books={location.books || []}
                    {...gridProps}
                    containerHeight={shouldUseVirtualization ? 600 : undefined}
                  />
                </div>
              ))}
            </Box>
          </Fade>
        )
      } else {
        // Regular user card view (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`card-${locationFilter}-${shelfFilter}-${categoryFilter.join(',')}-${checkoutFilter}-${authorFilter}-${searchTerm}-${currentPage}`}
          >
            <Box>
              <GridComponent
                books={paginatedBooks}
                {...gridProps}
                containerHeight={shouldUseVirtualization ? 600 : undefined}
              />
            </Box>
          </Fade>
        )
      }
    }
  }

  return (
    <Box>
      {renderBooks()}
      
      {/* Pagination Controls */}
      {filteredBooks.length > booksPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={getTotalPages(filteredBooks)}
            page={currentPage}
            onChange={onPageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  )
}