'use client'

import {
  Box,
  List,
  ListItem,
  Typography,
  Chip,
  IconButton,
  Grow,
  Tooltip,
} from '@mui/material'
import { Info, Star, Edit, EditOutlined } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import BookActions from './BookActions'
import StarRating from './StarRating'
import AnimatedCheckoutStatus from './AnimatedCheckoutStatus'
import { getDisplayGenres } from '@/lib/genreUtils'
import { getCategoryColor } from '@/lib/theme'

interface BookTextProps {
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
}

export default function BookText({
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
}: BookTextProps) {
  return (
    <List sx={{ width: '100%', p: 0 }}>
      {books.map(book => (
        <ListItem
          key={book.id}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 0.5,
            p: 1,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
              borderColor: 'primary.main'
            },
            transition: 'all 0.2s ease-in-out',
            minHeight: 48
          }}
        >
          {/* Book Information - Single Line */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            flex: 1,
            width: { xs: '100%', sm: 'auto' },
            minWidth: 0,
            overflow: 'hidden'
          }}>
            {/* Title and Author */}
            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <Typography 
                variant="body1" 
                component="div"
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
                noWrap
              >
                {book.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                component="div"
              >
                {book.authors.map((author, index) => (
                  <span key={index}>
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: 'primary.main', 
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': { textDecoration: 'none', color: 'primary.dark' },
                        fontWeight: 500
                      }}
                      onClick={() => onAuthorClick(author)}
                    >
                      {author}
                    </Typography>
                    {index < book.authors.length - 1 && ', '}
                  </span>
                ))}
                {book.publishedDate && (
                  <Typography component="span" sx={{ fontStyle: 'italic' }}>
                    , {new Date(book.publishedDate).getFullYear()}
                  </Typography>
                )}
              </Typography>
              
              {/* Series information */}
              {book.series && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mt: 0.5 }}
                >
                  <Typography 
                    component="span" 
                    sx={{ 
                      color: 'primary.main', 
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      '&:hover': { textDecoration: 'none', color: 'primary.dark' },
                      fontWeight: 500
                    }}
                    onClick={() => onSeriesClick(book.series!)}
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
                  sx={{ mt: 0.5, fontWeight: 600, lineHeight: 1.2, margin: 0 }}
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
                        '&:hover': { textDecoration: 'none', color: 'primary.dark' },
                        fontWeight: 600
                      }}
                      onClick={() => onSeriesClick(series.name)}
                    >
                      {series.name}
                      {index < book.current_series!.length - 1 && ', '}
                    </Typography>
                  ))}
                </Typography>
              )}
            </Box>

            {/* Compact info chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              {/* Star rating - compact chip variant */}
              <StarRating
                userRating={book.userRating}
                averageRating={book.averageRating}
                ratingCount={book.ratingCount}
                size="small"
                variant="chip"
                onClick={onRateBook ? () => onRateBook(book) : undefined}
                userReview={book.userReview}
                userReviewStatus={book.userReviewStatus}
                userReviewRejectionReason={book.userReviewRejectionReason}
              />
              
              {/* Rate this book button - ultra compact */}
              {!book.userRating && onRateBook && (
                <IconButton
                  size="small"
                  onClick={() => onRateBook(book)}
                  sx={{ 
                    p: 0.5,
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? theme.palette.primary.light 
                      : theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? `${theme.palette.primary.light}15` 
                        : `${theme.palette.primary.main}15`
                    }
                  }}
                  title="Rate this book"
                >
                  <Star sx={{ fontSize: '1rem' }} />
                </IconButton>
              )}
              
              {/* Checkout status */}
              <AnimatedCheckoutStatus book={book} currentUserId={currentUserId} variant="chip" />
              
              {/* Genre */}
              {(() => {
                const { genres, source } = getDisplayGenres(book)
                if (genres.length === 0) return null
                
                const genreColor = getCategoryColor(genres[0])
                const isAssigned = source === 'assigned'
                const handleGenreEditClick = () => onGenreEdit?.(book)
                
                return (
                  <Grow in={true} timeout={isAssigned ? 800 : 0}>
                    <Chip 
                      label={genres[0]} 
                      size="small" 
                      onClick={onGenreEdit ? handleGenreEditClick : undefined}
                      deleteIcon={onGenreEdit ? <EditOutlined sx={{ fontSize: '11px !important' }} /> : undefined}
                      onDelete={onGenreEdit ? handleGenreEditClick : undefined}
                      sx={(theme) => ({ 
                        fontSize: '0.7rem', 
                        height: 20,
                        maxWidth: onGenreEdit ? '130px' : '120px',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? `${genreColor}40` 
                          : `${genreColor}20`,
                        color: theme.palette.mode === 'dark' 
                          ? '#ffffff' 
                          : genreColor,
                        border: theme.palette.mode === 'dark' 
                          ? `1px solid ${genreColor}60` 
                          : `1px solid ${genreColor}40`,
                        fontWeight: 500,
                        cursor: onGenreEdit ? 'pointer' : 'default',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: isAssigned ? 'genrePulse 2s ease-in-out' : undefined,
                        '&:hover': onGenreEdit ? {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? `${genreColor}50` 
                            : `${genreColor}30`,
                          border: theme.palette.mode === 'dark' 
                            ? `1px solid ${genreColor}80` 
                            : `1px solid ${genreColor}60`,
                          transform: 'scale(1.05)',
                          '& .MuiChip-deleteIcon': {
                            color: theme.palette.mode === 'dark' ? '#ffffff' : genreColor,
                            transform: 'scale(1.1)',
                          },
                        } : {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? `${genreColor}50` 
                            : `${genreColor}30`,
                          transform: 'scale(1.05)',
                        },
                        '&:active': onGenreEdit ? {
                          transform: 'scale(1.02)',
                        } : {},
                        '& .MuiChip-deleteIcon': {
                          color: theme.palette.mode === 'dark' 
                            ? '#ffffff90' 
                            : `${genreColor}80`,
                          margin: '0 1px 0 2px',
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
                            boxShadow: `0 0 0 3px ${genreColor}00`
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
              
              {/* Shelf info */}
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {book.shelf_name}
              </Typography>

              {/* More Details button */}
              {(book.extendedDescription || book.subjects || book.pageCount || book.averageRating || book.publisherInfo || book.openLibraryKey) && (
                <Tooltip title="View/edit book details" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onMoreDetailsClick(book)}
                    aria-label="View/edit book details and information"
                    sx={{ 
                      p: 0.5,
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.50'
                      }
                    }}
                  >
                    <Info sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              )}
              

            </Box>
          </Box>

          {/* Action Controls - Compact */}
          <Box sx={{ 
            ml: { xs: 0, sm: 2 }, 
            mt: { xs: 1, sm: 0 }, 
            flexShrink: 0
          }}>
            <BookActions
              book={book}
              userRole={userRole}
              userPermissions={userPermissions}
              userGlobalPermissions={userGlobalPermissions}
              userLocations={userLocations}
              shelves={shelves}
              pendingRemovalRequests={pendingRemovalRequests}
              currentUserId={currentUserId}
              viewMode="list"
              onCheckout={onCheckout}
              onCheckin={onCheckin}
              onDelete={onDelete}
              onRelocate={onRelocate}
              onRequestRemoval={onRequestRemoval}
              onCancelRemovalRequest={onCancelRemovalRequest}
              onMoreDetailsClick={onMoreDetailsClick}
            />
          </Box>
        </ListItem>
      ))}
    </List>
  )
}