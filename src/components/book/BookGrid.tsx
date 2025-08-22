'use client'

import React, { useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Grow,
} from '@mui/material'
import { Info, Star, Edit, Image, MenuBook } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { getDisplayGenres } from '@/lib/genreUtils'
import BookActions from './BookActions'
import StarRating from './StarRating'
import AnimatedBookCover from './AnimatedBookCover'

interface BookCardProps {
  book: EnhancedBook
  userRole: string | null
  userPermissions: string[]
  userGlobalPermissions: string[]
  userLocations: Array<{ id: number; name: string }>
  currentUserId: string | null
  shelves: Array<{ id: number; name: string; location_id: number; created_at: string }>
  pendingRemovalRequests: Record<string, number>
  onCheckout: (bookId: string, bookTitle: string) => Promise<void>
  onCheckin: (bookId: string, bookTitle: string) => Promise<void>
  onDelete: (bookId: string, bookTitle: string) => Promise<void>
  onRelocate: (book: EnhancedBook) => void
  onRequestRemoval: (bookId: string, bookTitle: string) => Promise<void>
  onCancelRemovalRequest: (bookId: string, bookTitle: string) => Promise<void>
  onMoreDetailsClick: (book: EnhancedBook) => void
  onAuthorClick: (authorName: string) => void
  onSeriesClick: (seriesName: string) => void
  onRateBook?: (book: EnhancedBook) => void
  onGenreEdit?: (book: EnhancedBook) => void
  onCoverEdit?: (book: EnhancedBook) => void
  isAnimating: boolean
  onCoverAnimationComplete?: (bookId: string) => void
}

interface BookGridProps {
  books: EnhancedBook[]
  userRole: string | null
  userPermissions: string[]
  userGlobalPermissions: string[]
  userLocations: Array<{ id: number; name: string }>
  currentUserId: string | null
  shelves: Array<{ id: number; name: string; location_id: number; created_at: string }>
  pendingRemovalRequests: Record<string, number>
  onCheckout: (bookId: string, bookTitle: string) => Promise<void>
  onCheckin: (bookId: string, bookTitle: string) => Promise<void>
  onDelete: (bookId: string, bookTitle: string) => Promise<void>
  onRelocate: (book: EnhancedBook) => void
  onRequestRemoval: (bookId: string, bookTitle: string) => Promise<void>
  onCancelRemovalRequest: (bookId: string, bookTitle: string) => Promise<void>
  onMoreDetailsClick: (book: EnhancedBook) => void
  onAuthorClick: (authorName: string) => void
  onSeriesClick: (seriesName: string) => void
  onRateBook?: (book: EnhancedBook) => void
  onGenreEdit?: (book: EnhancedBook) => void
  onCoverEdit?: (book: EnhancedBook) => void
  animatingCovers?: Set<string>
  onCoverAnimationComplete?: (bookId: string) => void
}

// Memoized BookCard component to prevent unnecessary re-renders
const BookCard = React.memo<BookCardProps>(({
  book,
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
  isAnimating,
  onCoverAnimationComplete,
}) => {
  // Memoized event handlers to prevent child re-renders
  const handleAuthorClick = useCallback((author: string) => {
    onAuthorClick(author)
  }, [onAuthorClick])

  const handleSeriesClick = useCallback((series: string) => {
    onSeriesClick(series)
  }, [onSeriesClick])

  const handleMoreDetailsClick = useCallback(() => {
    onMoreDetailsClick(book)
  }, [onMoreDetailsClick, book])

  const handleRateBookClick = useCallback(() => {
    onRateBook?.(book)
  }, [onRateBook, book])

  const handleGenreEditClick = useCallback(() => {
    onGenreEdit?.(book)
  }, [onGenreEdit, book])

  const handleCoverEditClick = useCallback(() => {
    if (onCoverEdit && userPermissions.includes('can_add_books')) {
      onCoverEdit(book)
    }
  }, [onCoverEdit, book, userPermissions])

  const handleCoverAnimationComplete = useCallback(() => {
    onCoverAnimationComplete?.(book.id)
  }, [onCoverAnimationComplete, book.id])

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <AnimatedBookCover
              src={book.thumbnail}
              alt={book.title}
              width={80}
              height={120}
              borderRadius={1}
              objectFit="cover"
              cursor={onCoverEdit && userPermissions.includes('can_add_books') ? 'pointer' : 'default'}
              onClick={handleCoverEditClick}
              bookId={book.id}
              isAnimating={isAnimating}
              onAnimationComplete={handleCoverAnimationComplete}
              sx={{ flexShrink: 0 }}
            />
            {onCoverEdit && userPermissions.includes('can_add_books') && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  '&:hover': { opacity: 1 },
                  pointerEvents: 'none'
                }}
              >
                <Image sx={{ color: 'white', fontSize: 12 }} />
              </Box>
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              component="h3"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {book.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {book.authors.map((author, index) => (
                <span key={index}>
                  <Typography 
                    component="span" 
                    sx={{ 
                      color: 'primary.main', 
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      '&:hover': { textDecoration: 'none' }
                    }}
                    onClick={() => handleAuthorClick(author)}
                  >
                    {author}
                  </Typography>
                  {index < book.authors.length - 1 && ', '}
                </span>
              ))}
              {book.publishedDate && (
                <Typography component="span" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  , {new Date(book.publishedDate).getFullYear()}
                </Typography>
              )}
            </Typography>
            {book.series && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <Typography 
                  component="span" 
                  sx={{ 
                    color: 'primary.main', 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    '&:hover': { textDecoration: 'none' }
                  }}
                  onClick={() => handleSeriesClick(book.series!)}
                >
                  {book.series}
                </Typography>
                {book.seriesNumber && ` (#${book.seriesNumber})`}
              </Typography>
            )}
            {/* Rating and Genre area - space-efficient layout */}
            <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {/* Star rating - displays user rating or average rating */}
              <StarRating
                userRating={book.userRating}
                averageRating={book.averageRating}
                ratingCount={book.ratingCount}
                size="small"
                variant="display"
                showCount={true}
                onClick={onRateBook ? handleRateBookClick : undefined}
                userReview={book.userReview}
                userReviewStatus={book.userReviewStatus}
                userReviewRejectionReason={book.userReviewRejectionReason}
              />
              
              {/* Rate this book button - only show when user hasn't rated yet */}
              {!book.userRating && onRateBook && (
                <Button
                  size="small"
                  startIcon={<Star />}
                  onClick={handleRateBookClick}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    color: 'warning.main',
                    minHeight: 20,
                    '&:hover': {
                      backgroundColor: 'warning.50'
                    }
                  }}
                >
                  Rate this book
                </Button>
              )}
              
              {/* Genre chip */}
              {(() => {
                const { genres, source } = getDisplayGenres(book)
                return genres.length > 0 && (
                  <Grow in={true} timeout={source === 'assigned' ? 800 : 0}>
                    <Chip 
                      label={genres[0]} 
                      size="small" 
                      color={source === 'assigned' ? 'secondary' : source === 'enhanced' ? 'primary' : 'default'}
                      onClick={undefined}
                      sx={{ 
                        fontSize: '0.7rem', 
                        height: 20,
                        maxWidth: '120px',
                        animation: source === 'assigned' ? 'pulse 2s ease-in-out' : undefined,
                        '@keyframes pulse': {
                          '0%': {
                            boxShadow: '0 0 0 0 rgba(156, 39, 176, 0.4)'
                          },
                          '70%': {
                            boxShadow: '0 0 0 10px rgba(156, 39, 176, 0)'
                          },
                          '100%': {
                            boxShadow: '0 0 0 0 rgba(156, 39, 176, 0)'
                          }
                        },
                        '& .MuiChip-label': {
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }
                      }} 
                    />
                  </Grow>
                )
              })()}
            </Box>
            {book.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {book.description.substring(0, 200)}...
              </Typography>
            )}
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(book.extendedDescription || book.subjects || book.pageCount || book.averageRating || book.publisherInfo || book.openLibraryKey) && (
                <Button
                  size="small"
                  startIcon={<Info />}
                  onClick={handleMoreDetailsClick}
                  sx={{ textTransform: 'none' }}
                >
                  More Details
                </Button>
              )}
              {onGenreEdit && (
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={handleGenreEditClick}
                  sx={{ textTransform: 'none' }}
                >
                  Edit Genres
                </Button>
              )}
            </Box>
            
            {/* Show shelf info for all users */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Shelf:</strong> {book.shelf_name || 'No shelf assigned'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {book.tags && book.tags.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Tags:</strong> {book.tags.join(', ')}
            </Typography>
          </Box>
        )}
        
        {/* Checkout status display */}
        {book.status === 'checked_out' && (
          <Box sx={{ mt: 2, p: 1, border: 1, borderColor: 'warning.main', borderRadius: 1 }}>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
              <MenuBook sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'inherit' }} />
              {book.checked_out_date && (() => {
                const checkoutDate = new Date(book.checked_out_date)
                const today = new Date()
                const diffTime = Math.abs(today.getTime() - checkoutDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (book.checked_out_by === currentUserId) {
                  return `You checked this book out ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
                } else {
                  return `Checked out since ${checkoutDate.toLocaleDateString()} (${diffDays} day${diffDays !== 1 ? 's' : ''})`
                }
              })()}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions>
        <BookActions
          book={book}
          userRole={userRole}
          userPermissions={userPermissions}
          userGlobalPermissions={userGlobalPermissions}
          userLocations={userLocations}
          shelves={shelves}
          pendingRemovalRequests={pendingRemovalRequests}
          currentUserId={currentUserId}
          viewMode="card"
          onCheckout={onCheckout}
          onCheckin={onCheckin}
          onDelete={onDelete}
          onRelocate={onRelocate}
          onRequestRemoval={onRequestRemoval}
          onCancelRemovalRequest={onCancelRemovalRequest}
        />
      </CardActions>
    </Card>
  )
})

// Add display name for debugging
BookCard.displayName = 'BookCard'

// Optimized BookGrid component with React.memo
const BookGrid = React.memo<BookGridProps>(({
  books,
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
  animatingCovers = new Set(),
  onCoverAnimationComplete,
}) => {
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: 'repeat(auto-fit, minmax(350px, 1fr))', // Mobile: better minimum width, auto-fit (no empty columns)
        sm: 'repeat(2, 1fr)', // Tablet: exactly 2 columns
        lg: 'repeat(3, 1fr)' // Large Desktop: exactly 3 columns (1200px+)
      }, 
      gap: 2 
    }}>
      {books.map(book => (
        <BookCard
          key={book.id}
          book={book}
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
          onSeriesClick={onSeriesClick}
          onRateBook={onRateBook}
          onGenreEdit={onGenreEdit}
          onCoverEdit={onCoverEdit}
          isAnimating={animatingCovers.has(book.id)}
          onCoverAnimationComplete={onCoverAnimationComplete}
        />
      ))}
    </Box>
  )
})

// Add display name for debugging
BookGrid.displayName = 'BookGrid'

export default BookGrid