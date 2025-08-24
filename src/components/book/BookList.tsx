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
import { Info, Star, Edit } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import BookActions from './BookActions'
import StarRating from './StarRating'
import { getDisplayGenres } from '@/lib/genreUtils'

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
            flexDirection: { xs: 'column', sm: 'row' },
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
            alignItems: 'center',
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
                component="span"
                sx={{ 
                  fontWeight: 700,
                  display: 'inline',
                  mr: 1,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
                noWrap
              >
                {book.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  display: 'inline'
                }}
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
              {book.status === 'checked_out' && (
                <Chip 
                  label={book.checked_out_by === currentUserId ? 'Checked out by you' : 'Checked out'}
                  size="small"
                  color="warning"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
              
              {/* Genre */}
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
                <Tooltip title="View additional book details" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onMoreDetailsClick(book)}
                    aria-label="View additional book details and information"
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
              
              {/* Edit Genres button */}
              {onGenreEdit && (
                <Tooltip title="Edit book genres" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onGenreEdit(book)}
                    aria-label="Edit and manage genres for this book"
                    sx={{ 
                      p: 0.5
                    }}
                  >
                    <Edit sx={{ fontSize: '1rem' }} />
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
            />
          </Box>
        </ListItem>
      ))}
    </List>
  )
}