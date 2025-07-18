'use client'

import { Box, Typography, Pagination, Fade } from '@mui/material'
import BookGrid from '@/components/book/BookGrid'
import BookCompact from '@/components/book/BookCompact'
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
  viewMode: 'card' | 'compact' | 'list'
  userRole: string | null
  userPermissions: string[]
  currentUserId: string | null
  shelves: Shelf[]
  pendingRemovalRequests: Record<string, number>
  filteredBooks: EnhancedBook[]
  paginatedBooks: EnhancedBook[]
  booksByLocation: any[] | null
  locationFilter: string
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
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void
  getTotalPages: (books: EnhancedBook[]) => number
  getPaginatedBooksForView: () => any[]
}

export default function BookViews({
  viewMode,
  userRole,
  userPermissions,
  currentUserId,
  shelves,
  pendingRemovalRequests,
  filteredBooks,
  paginatedBooks,
  booksByLocation,
  locationFilter,
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
  onPageChange,
  getTotalPages,
  getPaginatedBooksForView
}: BookViewsProps) {
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
        📍 {location.name} ({(location.books || []).length} book{(location.books || []).length !== 1 ? 's' : ''})
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
      // Ultra-compact list view (text only)
      if (isAdmin(userRole) && booksByLocation) {
        // Admin ultra-compact view with location grouping (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`admin-list-${locationFilter}-${currentPage}`}
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
        // Regular user ultra-compact view (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`list-${locationFilter}-${currentPage}`}
          >
            <Box>
              <BookList
                books={paginatedBooks}
                userRole={userRole}
                userPermissions={userPermissions}
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
    } else if (viewMode === 'compact') {
      // Compact list view (with images)
      if (isAdmin(userRole) && booksByLocation) {
        // Admin compact list view with location grouping (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`admin-compact-${locationFilter}-${currentPage}`}
          >
            <Box>
              {getPaginatedBooksForView().map((location: any) => (
                <div key={location.id} style={{ marginBottom: '2rem' }}>
                  {/* Only show location header when viewing all locations (no location filter active) */}
                  {!locationFilter && renderLocationHeader(location)}
                  
                  <BookCompact
                    books={location.books || []}
                    userRole={userRole}
                    userPermissions={userPermissions}
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
                    onSeriesClick={onSeriesClick}
                    onRateBook={onRateBook}
                    onGenreEdit={onGenreEdit}
                    onCoverEdit={onCoverEdit}
                  />
                </div>
              ))}
            </Box>
          </Fade>
        )
      } else {
        // Regular user compact list view (paginated)
        return (
          <Fade 
            in={true} 
            timeout={500}
            key={`compact-${locationFilter}-${currentPage}`}
          >
            <Box>
              <BookCompact
                books={paginatedBooks}
                userRole={userRole}
                userPermissions={userPermissions}
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
                onSeriesClick={onSeriesClick}
                onRateBook={onRateBook}
                onGenreEdit={onGenreEdit}
                onCoverEdit={onCoverEdit}
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
            key={`admin-card-${locationFilter}-${currentPage}`}
          >
            <Box>
              {getPaginatedBooksForView().map((location: any) => (
                <div key={location.id} style={{ marginBottom: '2rem' }}>
                  {/* Only show location header when viewing all locations (no location filter active) */}
                  {!locationFilter && renderLocationHeader(location)}
                  
                  <BookGrid
                    books={location.books || []}
                    userRole={userRole}
                    userPermissions={userPermissions}
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
                    onSeriesClick={onSeriesClick}
                    onRateBook={onRateBook}
                    onGenreEdit={onGenreEdit}
                    onCoverEdit={onCoverEdit}
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
            key={`card-${locationFilter}-${currentPage}`}
          >
            <Box>
              <BookGrid
                books={paginatedBooks}
                userRole={userRole}
                userPermissions={userPermissions}
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
                onSeriesClick={onSeriesClick}
                onRateBook={onRateBook}
                onGenreEdit={onGenreEdit}
                onCoverEdit={onCoverEdit}
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