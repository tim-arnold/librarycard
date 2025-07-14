'use client'

import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
} from '@mui/material'
import { Info, Star, Edit, Image } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { isAdmin } from '@/lib/permissions'
import { getDisplayGenres } from '@/lib/genreUtils'
import BookActions from './BookActions'
import StarRating from './StarRating'

interface BookGridProps {
  books: EnhancedBook[]
  userRole: string | null
  userPermissions: string[]
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
}

export default function BookGrid({
  books,
  userRole,
  userPermissions,
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
}: BookGridProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
      {books.map(book => (
        <Card key={book.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                {book.thumbnail ? (
                  <Box
                    component="img"
                    src={book.thumbnail}
                    alt={book.title}
                    sx={{ 
                      width: 80, 
                      height: 120, 
                      objectFit: 'cover', 
                      flexShrink: 0,
                      borderRadius: 1,
                      cursor: onCoverEdit && userPermissions.includes('can_add_books') ? 'pointer' : 'default'
                    }}
                    onClick={() => onCoverEdit && userPermissions.includes('can_add_books') && onCoverEdit(book)}
                  />
                ) : (
                  <Box sx={{ 
                    width: 80, 
                    height: 120, 
                    borderRadius: 1, 
                    bgcolor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '2rem',
                    cursor: onCoverEdit && userPermissions.includes('can_add_books') ? 'pointer' : 'default'
                  }}
                  onClick={() => onCoverEdit && userPermissions.includes('can_add_books') && onCoverEdit(book)}
                  >
                    📖
                  </Box>
                )}
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
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <Image sx={{ color: 'white', fontSize: 12 }} />
                  </Box>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
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
                        onClick={() => onAuthorClick(author)}
                      >
                        {author}
                      </Typography>
                      {index < book.authors.length - 1 && ', '}
                    </span>
                  ))}
                  {book.publishedDate && (
                    <Typography component="span" color="text.secondary">
                      , {new Date(book.publishedDate).getFullYear()}
                    </Typography>
                  )}
                </Typography>
                {book.series && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Series:</strong> 
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: 'primary.main', 
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        ml: 0.5,
                        '&:hover': { textDecoration: 'none' }
                      }}
                      onClick={() => onSeriesClick(book.series!)}
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
                    onClick={onRateBook ? () => onRateBook(book) : undefined}
                  />
                  
                  {/* Rate this book button - only show when user hasn't rated yet */}
                  {!book.userRating && onRateBook && (
                    <Button
                      size="small"
                      startIcon={<Star />}
                      onClick={() => onRateBook(book)}
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
                      <Chip 
                        label={genres[0]} 
                        size="small" 
                        color={source === 'assigned' ? 'secondary' : source === 'enhanced' ? 'primary' : 'default'}
                        onClick={undefined}
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
                      onClick={() => onMoreDetailsClick(book)}
                      sx={{ textTransform: 'none' }}
                    >
                      More Details
                    </Button>
                  )}
                  {onGenreEdit && (
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => onGenreEdit(book)}
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
                  📖 Checked out
                  {book.checked_out_date && (() => {
                    const checkoutDate = new Date(book.checked_out_date)
                    const today = new Date()
                    const diffTime = Math.abs(today.getTime() - checkoutDate.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return ` since ${checkoutDate.toLocaleDateString()} (${diffDays} day${diffDays !== 1 ? 's' : ''})`
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
              shelves={shelves}
              pendingRemovalRequests={pendingRemovalRequests}
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
      ))}
    </Box>
  )
}