'use client'

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react'
import { VariableSizeGrid as Grid, GridChildComponentProps } from 'react-window'
import { Box, useMediaQuery, useTheme, Card, CardContent, CardActions, Typography, Chip, Button } from '@mui/material'
import { Info, Star, Edit, Image, MenuBook } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { getDisplayGenres } from '@/lib/genreUtils'
import BookActions from './BookActions'
import StarRating from './StarRating'
import AnimatedBookCover from './AnimatedBookCover'
import AnimatedCheckoutStatus from './AnimatedCheckoutStatus'

interface VirtualizedBookGridProps {
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
  containerHeight?: number
}

// Constants for sizing calculations
const BASE_CARD_HEIGHT = 280 // Base height without variable content
const COVER_HEIGHT = 120 // Book cover height
const TITLE_LINE_HEIGHT = 24 // Typography h6 line height
const BODY_LINE_HEIGHT = 16 // Typography body2 line height
const DESCRIPTION_MAX_CHARS = 200 // Max characters shown in description
const CHARS_PER_LINE = 60 // Approximate characters per line for description
const CHECKOUT_STATUS_HEIGHT = 40 // Height when book is checked out
const TAGS_HEIGHT = 20 // Height for tags section
const GAP_SIZE = 16 // Gap between cards (theme spacing * 2)
const CONTAINER_PADDING = 32 // Container padding

// Function to calculate dynamic height based on book content
const calculateBookCardHeight = (book: EnhancedBook): number => {
  let height = BASE_CARD_HEIGHT

  // Title height (can be multiple lines for long titles)
  const titleLines = Math.ceil(book.title.length / 40) // Roughly 40 chars per line for h6
  height += Math.max(1, titleLines) * TITLE_LINE_HEIGHT

  // Author line height
  height += BODY_LINE_HEIGHT

  // Series line (if present - legacy or new system)
  if (book.series || (book.current_series && book.current_series.length > 0)) {
    height += BODY_LINE_HEIGHT
  }

  // Description height (if present)
  if (book.description) {
    const descriptionLines = Math.ceil(Math.min(book.description.length, DESCRIPTION_MAX_CHARS) / CHARS_PER_LINE)
    height += Math.max(1, descriptionLines) * BODY_LINE_HEIGHT
  }

  // Tags height (if present)
  if (book.tags && book.tags.length > 0) {
    height += TAGS_HEIGHT
  }

  // Checkout status height (if checked out)
  if (book.status === 'checked_out') {
    height += CHECKOUT_STATUS_HEIGHT
  }

  // Add some padding for buttons, spacing, etc.
  height += 60

  return Math.max(height, 320) // Minimum height to prevent too-small cards
}

// Virtualized Book Card Component
interface VirtualizedBookCardProps {
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

const VirtualizedBookCard = React.memo<VirtualizedBookCardProps>(({
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
  // Memoized event handlers
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
r            <Typography variant="body2" color="text.secondary" gutterBottom>
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
            
            {/* Rating and Genre area */}
            <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
              
              {!book.userRating && onRateBook && (
                <Button
                  size="small"
                  startIcon={<Star />}
                  onClick={handleRateBookClick}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? theme.palette.primary.light 
                      : theme.palette.primary.main,
                    minHeight: 20,
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? `${theme.palette.primary.light}15` 
                        : `${theme.palette.primary.main}15`
                    }
                  }}
                >
                  Rate this book
                </Button>
              )}
              
              {(() => {
                const { genres, source } = getDisplayGenres(book)
                return genres.length > 0 && (
                  <Chip 
                    label={genres[0]} 
                    size="small" 
                    color={source === 'assigned' ? 'secondary' : source === 'enhanced' ? 'primary' : 'default'}
                    sx={{ 
                      fontSize: '0.7rem', 
                      height: 20,
                      maxWidth: '120px',
                      '& .MuiChip-label': {
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }
                    }} 
                  />
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
                  View/edit details
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
        />
      </CardActions>
    </Card>
  )
})

VirtualizedBookCard.displayName = 'VirtualizedBookCard'

const VirtualizedBookGrid: React.FC<VirtualizedBookGridProps> = ({
  books,
  containerHeight = 600,
  animatingCovers = new Set(),
  ...props
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'))
  const gridRef = useRef<Grid>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const scrollPositionRef = useRef({ scrollLeft: 0, scrollTop: 0 })
  
  // Calculate responsive column count
  const columnCount = useMemo(() => {
    if (isMobile) return 1
    if (isTablet) return 2
    return 3 // Desktop
  }, [isMobile, isTablet])

  // Calculate row count
  const rowCount = useMemo(() => {
    return Math.ceil(books.length / columnCount)
  }, [books.length, columnCount])
  
  // Cache for calculated heights to improve performance
  const rowHeightCache = useMemo(() => {
    const cache: Record<number, number> = {}
    
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      let maxHeightInRow = 0
      
      // Calculate height for each book in this row
      for (let colIndex = 0; colIndex < columnCount; colIndex++) {
        const bookIndex = rowIndex * columnCount + colIndex
        if (bookIndex < books.length) {
          const book = books[bookIndex]
          const cardHeight = calculateBookCardHeight(book)
          maxHeightInRow = Math.max(maxHeightInRow, cardHeight)
        }
      }
      
      cache[rowIndex] = maxHeightInRow + GAP_SIZE
    }
    
    return cache
  }, [books, rowCount, columnCount])

  // Save scroll position when grid scrolls
  const handleScroll = useCallback(({ scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number }) => {
    scrollPositionRef.current = { scrollLeft, scrollTop }
  }, [])

  // Restore scroll position when books change (e.g., after filtering)
  // but only if the book count hasn't changed dramatically (indicating a filter change)
  const previousBooksLengthRef = useRef(books.length)
  
  useEffect(() => {
    const currentLength = books.length
    const previousLength = previousBooksLengthRef.current
    
    // Only restore scroll position if the change in book count is small
    // (indicating data update rather than filter change)
    const shouldRestoreScroll = Math.abs(currentLength - previousLength) < 10
    
    if (gridRef.current && scrollPositionRef.current && shouldRestoreScroll) {
      const { scrollLeft, scrollTop } = scrollPositionRef.current
      // Small delay to ensure grid is rendered
      setTimeout(() => {
        gridRef.current?.scrollTo({ scrollLeft, scrollTop })
      }, 50)
    } else if (!shouldRestoreScroll) {
      // Reset scroll position for major changes (like filtering)
      scrollPositionRef.current = { scrollLeft: 0, scrollTop: 0 }
    }
    
    previousBooksLengthRef.current = currentLength
  }, [books])

  // Column width calculation
  const getColumnWidth = useCallback((index: number) => {
    return Math.floor((containerWidth - GAP_SIZE * (columnCount - 1)) / columnCount)
  }, [containerWidth, columnCount])

  // Row height calculation using cached dynamic heights
  const getRowHeight = useCallback((index: number) => {
    return rowHeightCache[index] || 320 // Fallback height
  }, [rowHeightCache])

  // Grid cell renderer
  const Cell = useCallback(({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const bookIndex = rowIndex * columnCount + columnIndex
    const book = books[bookIndex]
    
    if (!book) {
      return <div style={style} /> // Empty cell
    }

    return (
      <div style={{ 
        ...style, 
        padding: GAP_SIZE / 2,
        left: (style.left as number) + GAP_SIZE / 2,
        top: (style.top as number) + GAP_SIZE / 2,
        width: (style.width as number) - GAP_SIZE,
        height: (style.height as number) - GAP_SIZE,
      }}>
        <VirtualizedBookCard
          book={book}
          isAnimating={animatingCovers.has(book.id)}
          {...props}
        />
      </div>
    )
  }, [books, columnCount, animatingCovers, props])

  // Handle window resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth - CONTAINER_PADDING)
      }
    }
    
    const handleResize = () => {
      updateContainerWidth()
      if (gridRef.current) {
        gridRef.current.resetAfterIndices({ columnIndex: 0, rowIndex: 0 })
      }
    }

    // Set initial width
    updateContainerWidth()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // For small lists, fall back to regular rendering to avoid virtualization overhead
  if (books.length < 50) {
    return (
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: 'repeat(auto-fit, minmax(350px, 1fr))',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)'
        }, 
        gap: 2 
      }}>
        {books.map(book => (
          <VirtualizedBookCard
            key={book.id}
            book={book}
            isAnimating={animatingCovers.has(book.id)}
            {...props}
          />
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ height: containerHeight, width: '100%' }}>
      <Grid
        ref={gridRef}
        height={containerHeight}
        width={containerWidth}
        columnCount={columnCount}
        rowCount={rowCount}
        columnWidth={getColumnWidth}
        rowHeight={getRowHeight}
        onScroll={handleScroll}
      >
        {Cell}
      </Grid>
    </Box>
  )
}

export default VirtualizedBookGrid