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
import { Info, MenuBook } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { getDisplayGenres } from '@/lib/genreUtils'
import BookActions from './BookActions'
import StarRating from './StarRating'
import AnimatedBookCover from './AnimatedBookCover'
import AnimatedCheckoutStatus from './AnimatedCheckoutStatus'
import { getCategoryColor } from '@/lib/theme'

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
  isAnimating: boolean
  onCoverAnimationComplete?: (bookId: string) => void
  isFirstBook?: boolean
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
  isAnimating,
  onCoverAnimationComplete,
  isFirstBook,
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


  const handleCoverAnimationComplete = useCallback(() => {
    onCoverAnimationComplete?.(book.id)
  }, [onCoverAnimationComplete, book.id])

  return (
    <Card
      component="article"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          '& .book-cover': {
            transform: 'scale(1.05)',
          },
        },
      }}
      aria-labelledby={`book-title-${book.id}`}
      role="article"
      {...(isFirstBook && { 'data-tour': 'book-item' })}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <AnimatedBookCover
              src={book.thumbnail}
              alt={book.title}
              width={110}
              height={165}
              borderRadius={1}
              objectFit="cover"
              cursor="pointer"
              bookId={book.id}
              isAnimating={isAnimating}
              onAnimationComplete={handleCoverAnimationComplete}
              onClick={handleMoreDetailsClick}
              sx={{
                flexShrink: 0,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                }
              }}
              className="book-cover"
            />
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
              id={`book-title-${book.id}`}
            >
              {book.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {book.authors.map((author, index) => (
                <span key={index}>
                  <Typography
                    component="button"
                    sx={{
                      color: 'primary.main',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      '&:hover': { textDecoration: 'none' },
                      '&:focus': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px'
                      }
                    }}
                    onClick={() => handleAuthorClick(author)}
                    aria-label={`Filter books by author ${author}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleAuthorClick(author)
                      }
                    }}
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
            {book.current_series && book.current_series.length > 0 && (
              <Typography 
                component="p" 
                variant="caption" 
                color="text.secondary" 
                gutterBottom 
                sx={{ fontWeight: 600, lineHeight: 1.2, margin: 0 }}
              >
                Part of series:{' '}
                {book.current_series.map((series, index) => (
                  <Typography 
                    key={series.id}
                    component="span"
                    variant="caption"
                    sx={{ 
                      color: 'primary.main', 
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'none' }
                    }}
                    onClick={() => handleSeriesClick(series.name)}
                  >
                    {series.name}
                    {index < book.current_series!.length - 1 && ', '}
                  </Typography>
                ))}
              </Typography>
            )}
            {/* Star rating */}
            <Box sx={{ mt: 1, mb: 1 }}>
              <StarRating
                userRating={book.userRating}
                averageRating={book.averageRating}
                ratingCount={book.ratingCount}
                size="small"
                variant="display"
                showCount={true}
                onClick={undefined}
                userReview={book.userReview}
                userReviewStatus={book.userReviewStatus}
                userReviewRejectionReason={book.userReviewRejectionReason}
              />
            </Box>

            {/* Genre chip - separate line */}
            <Box sx={{ mb: 1 }}>
              {(() => {
                const { genres, source } = getDisplayGenres(book)
                if (genres.length === 0) return null

                const genreColor = getCategoryColor(genres[0])
                const isAssigned = source === 'assigned'

                return (
                  <Grow in={true} timeout={isAssigned ? 800 : 0}>
                    <Chip
                      label={genres[0]}
                      size="small"
                      onClick={undefined}
                      deleteIcon={undefined}
                      onDelete={undefined}
                      sx={(theme) => ({
                        fontSize: '0.7rem',
                        height: 20,
                        maxWidth: '120px',
                        // Dark mode: stronger background opacity and lighter text for better contrast
                        backgroundColor: theme.palette.mode === 'dark'
                          ? `${genreColor}40` // Stronger background in dark mode
                          : `${genreColor}20`, // Lighter background in light mode
                        color: theme.palette.mode === 'dark' 
                          ? '#ffffff' // White text in dark mode for maximum contrast
                          : genreColor, // Colored text in light mode
                        border: theme.palette.mode === 'dark' 
                          ? `1px solid ${genreColor}60` // Stronger border in dark mode
                          : `1px solid ${genreColor}40`, // Lighter border in light mode
                        fontWeight: 500,
                        cursor: 'default',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: isAssigned ? 'genrePulse 2s ease-in-out' : undefined,
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? `${genreColor}50`
                            : `${genreColor}30`,
                          border: theme.palette.mode === 'dark'
                            ? `1px solid ${genreColor}80`
                            : `1px solid ${genreColor}60`,
                          transform: 'scale(1.05)',
                        },
                        '& .MuiChip-deleteIcon': {
                          color: theme.palette.mode === 'dark' 
                            ? '#ffffff90' // Semi-transparent white in dark mode
                            : `${genreColor}80`, // Semi-transparent color in light mode
                          margin: '0 2px 0 4px',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: theme.palette.mode === 'dark' ? '#ffffff' : genreColor,
                          },
                        },
                        '@keyframes genrePulse': {
                          '0%': {
                            boxShadow: `0 0 0 0 ${genreColor}60`
                          },
                          '70%': {
                            boxShadow: `0 0 0 6px ${genreColor}00`
                          },
                          '100%': {
                            boxShadow: `0 0 0 0 ${genreColor}00`
                          }
                        },
                        '& .MuiChip-label': {
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }
                      })} 
                    />
                  </Grow>
                )
              })()}
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
        <AnimatedCheckoutStatus book={book} currentUserId={currentUserId} />
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
          onMoreDetailsClick={onMoreDetailsClick}
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
  animatingCovers = new Set(),
  onCoverAnimationComplete,
}) => {
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: 'repeat(auto-fit, minmax(320px, 1fr))', // Mobile: single column with better minimum width
        sm: 'repeat(2, 1fr)', // Tablet: 2 columns
        md: 'repeat(2, 1fr)', // Medium: 2 columns (was 3, now 2 for wider cards)
        lg: 'repeat(2, 1fr)' // Large Desktop: 2 columns (was 3, now 2 for wider cards)
      }, 
      gap: { xs: 2, sm: 2.5, lg: 3 },
      '& > *': {
        animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'both',
      },
      '@keyframes fadeInUp': {
        '0%': {
          opacity: 0,
          transform: 'translateY(20px)',
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
    }}>
      {books.map((book, index) => (
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
          isAnimating={animatingCovers.has(book.id)}
          onCoverAnimationComplete={onCoverAnimationComplete}
          isFirstBook={index === 0}
        />
      ))}
    </Box>
  )
})

// Add display name for debugging
BookGrid.displayName = 'BookGrid'

export default BookGrid