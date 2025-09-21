'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material'
import { ExpandMore, History, Email, Star, MenuBook, CollectionsBookmark, Add, Close, LibraryBooks, Edit, Share, Image, EditOutlined, SwapHoriz, Delete, CheckCircle, Undo } from '@mui/icons-material'
import type { EnhancedBook, BookRating, Series } from '@/lib/types'
import { isAdmin, canManageSeriesBooks } from '@/lib/permissions'
import { useSession } from 'next-auth/react'
import { authenticatedFetch } from '@/lib/auth-utils'
import { useSeries } from '@/hooks/useSeries'
import SeriesModal from './SeriesModal'
import CoverAttribution from '@/components/common/CoverAttribution'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'
import { getDisplayGenres } from '@/lib/genreUtils'

interface CheckoutHistoryItem {
  id: number
  book_id: number
  user_id: string
  action: string
  action_date: string
  due_date?: string
  notes?: string
  user_name?: string
  user_email?: string
}

interface MoreDetailsModalProps {
  book: EnhancedBook | null
  isOpen: boolean
  onClose: () => void
  userRole: string | null
  userPermissions: string[]
  onBookUpdate?: (bookId: string, updatedBookData: Partial<EnhancedBook>) => void
  // Action handlers
  onRateBook?: (book: EnhancedBook) => void
  onGenreEdit?: (book: EnhancedBook) => void
  onCoverEdit?: (book: EnhancedBook) => void
  onRelocate?: (book: EnhancedBook) => void
  onDelete?: (bookId: string, bookTitle: string) => Promise<void>
  onCheckout?: (bookId: string, bookTitle: string) => Promise<void>
  onCheckin?: (bookId: string, bookTitle: string) => Promise<void>
  // Additional data needed for actions
  shelves?: Array<{ id: number; name: string; location_id: number; created_at: string }>
  currentUserId?: string | null
  pendingRemovalRequests?: Record<string, number>
}

export default function MoreDetailsModal({
  book,
  isOpen,
  onClose,
  userRole,
  userPermissions,
  onBookUpdate,
  onRateBook,
  onGenreEdit,
  onCoverEdit,
  onRelocate,
  onDelete,
  onCheckout,
  onCheckin,
  shelves,
  currentUserId,
  pendingRemovalRequests
}: MoreDetailsModalProps) {
  const { data: session } = useSession()
  const { isMobile } = useMobileBreakpoints()

  // Local state for real-time updates
  const [localBook, setLocalBook] = useState<EnhancedBook | null>(book)
  const [checkoutHistory, setCheckoutHistory] = useState<CheckoutHistoryItem[]>([])
  const [showCheckoutHistory, setShowCheckoutHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [reviews, setReviews] = useState<BookRating[]>([])
  const [showReviews, setShowReviews] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [locationName, setLocationName] = useState<string>('')
  const [bookLocationId, setBookLocationId] = useState<number | undefined>(undefined)

  // Mobile swipe gesture state
  const dialogRef = useRef<HTMLDivElement>(null)
  const [startY, setStartY] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Series management state
  const { series, addBooksToSeries, removeBookFromSeries, createSeries, refreshSeries } = useSeries(bookLocationId)
  const [showSeries, setShowSeries] = useState(false)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [selectedSeriesForAdd, setSelectedSeriesForAdd] = useState<string>('')
  // Local state for current series memberships for immediate UI updates
  const [currentSeries, setCurrentSeries] = useState<Series[]>(book?.current_series || [])
  // Track if series have been modified for parent update on close
  const [seriesModified, setSeriesModified] = useState(false)

  // Enhanced action handlers that update local state for real-time feedback
  const handleRateBookWithUpdate = useCallback((book: EnhancedBook) => {
    console.log('🌟 Rating book:', book.id, book.title)
    if (onRateBook) {
      onRateBook(book)
      // Note: The actual rating update will come through the parent onBookUpdate callback
    }
  }, [onRateBook])

  const handleGenreEditWithUpdate = useCallback((book: EnhancedBook) => {
    console.log('🏷️ Editing genre for book:', book.id, book.title)
    if (onGenreEdit) {
      onGenreEdit(book)
      // Note: The actual genre update will come through the parent onBookUpdate callback
    }
  }, [onGenreEdit])

  const handleCoverEditWithUpdate = useCallback((book: EnhancedBook) => {
    console.log('🖼️ Editing cover for book:', book.id, book.title)
    if (onCoverEdit) {
      onCoverEdit(book)
      // Note: The actual cover update will come through the parent onBookUpdate callback
    }
  }, [onCoverEdit])

  const handleCheckoutWithUpdate = useCallback(async (bookId: string, bookTitle: string) => {
    console.log('📚 Checking out book:', bookId, bookTitle)
    if (onCheckout) {
      await onCheckout(bookId, bookTitle)
      // The parent should handle updating the book state, which will sync back to localBook
      console.log('✅ Checkout completed, waiting for parent update')
    }
  }, [onCheckout])

  const handleCheckinWithUpdate = useCallback(async (bookId: string, bookTitle: string) => {
    console.log('🔄 Checking in book:', bookId, bookTitle)
    if (onCheckin) {
      await onCheckin(bookId, bookTitle)
      // The parent should handle updating the book state, which will sync back to localBook
      console.log('✅ Checkin completed, waiting for parent update')
    }
  }, [onCheckin])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.position = ''
      document.body.style.width = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  // Fetch book's location_id immediately when modal opens
  useEffect(() => {
    const fetchBookLocation = async () => {
      if (!book?.id || !session) return
      
      try {
        const result = await authenticatedFetch(session, `/api/books/${book.id}/ratings`)
        if (result.success && result.data) {
          const data = result.data as any
          if (data.location_id) {
            setBookLocationId(data.location_id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch book location:', error)
      }
    }

    if (isOpen && book?.id) {
      fetchBookLocation()
    }
  }, [isOpen, book?.id, session])

  // Check if user can remove a book from a series
  const canRemoveFromSeries = (seriesItem: Series): boolean => {
    if (!session?.user?.email || !book) return false
    
    // Users with can_add_books permission can manage any series, OR
    // Series owners can manage their own series, OR  
    // Book owners can remove their own books
    const hasAddBooksPermission = userPermissions.includes('can_add_books')
    const userOwnsBook = book.added_by === session.user.email
    const userOwnsSeries = seriesItem.user_id === session.user.email
    
    return hasAddBooksPermission || userOwnsBook || userOwnsSeries
  }

  // Initialize local book state when book prop changes
  useEffect(() => {
    if (book?.id) {
      console.log('📖 Initializing localBook with:', book.id, book.title)
      setLocalBook(book)
    }
  }, [book?.id])

  // Clear state when book changes to prevent cross-contamination of reviews
  useEffect(() => {
    if (book?.id) {
      setReviews([])
      setShowReviews(false)
      setCheckoutHistory([])
      setShowCheckoutHistory(false)
      setLocationName('')
      // Sync local series state with book prop
      setCurrentSeries(book?.current_series || [])
    }
  }, [book?.id])
  
  // Sync currentSeries with book.current_series when it changes
  useEffect(() => {
    setCurrentSeries(book?.current_series || [])
  }, [book?.current_series])

  // Handle real-time updates from parent - sync localBook with book prop changes
  useEffect(() => {
    if (book?.id) {
      console.log('🔄 Syncing localBook with book prop changes:', book.id, {
        oldThumbnail: localBook?.thumbnail,
        newThumbnail: book.thumbnail,
        changed: localBook?.thumbnail !== book.thumbnail
      })
      setLocalBook(book)
    }
  }, [book, localBook?.thumbnail])

  // Mobile swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    setStartY(e.touches[0].clientY)
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || startY === null) return

    // Check if we're at the top of the scrollable content
    const dialogContent = dialogRef.current?.querySelector('.MuiDialogContent-root')
    const isAtTop = !dialogContent || dialogContent.scrollTop <= 0

    // Only allow swipe-to-close if we're at the top of the content
    if (!isAtTop) return

    const currentY = e.touches[0].clientY
    const diffY = currentY - startY

    // Only consider downward swipes
    if (diffY > 20) {
      setIsDragging(true)
      // Add visual feedback for swipe down
      if (dialogRef.current) {
        const transform = Math.min(diffY / 4, 50) // Limit the drag distance
        dialogRef.current.style.transform = `translateY(${transform}px)`
        dialogRef.current.style.opacity = String(Math.max(1 - diffY / 300, 0.7))
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isMobile || startY === null) return

    // Reset styles
    if (dialogRef.current) {
      dialogRef.current.style.transform = ''
      dialogRef.current.style.opacity = ''
    }

    // If dragged far enough, close the modal
    if (isDragging) {
      handleClose()
    }

    setStartY(null)
    setIsDragging(false)
  }

  if (!book || !localBook) return null
  
  // Debug: Log current_series data after any changes
  console.log('MoreDetailsModal render - book data:', {
    id: book.id,
    title: book.title,
    current_series: book.current_series,
    series: book.series,
    userRating: book.userRating,
    assignedGenres: book.assignedGenres,
    checked_out_by: book.checked_out_by,
    thumbnail: book.thumbnail
  })

  console.log('MoreDetailsModal render - localBook data:', {
    id: localBook?.id,
    title: localBook?.title,
    userRating: localBook?.userRating,
    assignedGenres: localBook?.assignedGenres,
    checked_out_by: localBook?.checked_out_by,
    thumbnail: localBook?.thumbnail
  })

  const fetchCheckoutHistory = async () => {
    if (!isAdmin(userRole)) return
    
    setLoadingHistory(true)
    try {
      const result = await authenticatedFetch(session, `/api/books/${book.id}/checkout-history`)
      if (result.success && result.data) {
        setCheckoutHistory(result.data as CheckoutHistoryItem[])
      }
    } catch (error) {
      console.error('Failed to fetch checkout history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleToggleCheckoutHistory = () => {
    if (!showCheckoutHistory && checkoutHistory.length === 0) {
      fetchCheckoutHistory()
    }
    setShowCheckoutHistory(!showCheckoutHistory)
  }

  const fetchReviews = async () => {
    setLoadingReviews(true)
    try {
      const result = await authenticatedFetch(session, `/api/books/${book?.id}/ratings`)
      if (result.success && result.data) {
        const data = result.data as any
        // Map API response to match frontend interface
        const mappedReviews = (data.all_ratings || []).map((review: any) => ({
          bookId: book?.id,
          userId: review.user_id,
          rating: review.rating,
          reviewText: review.review_text,
          userName: review.user_name,
          createdAt: review.created_at,
          updatedAt: review.updated_at
        }))
        setReviews(mappedReviews)
        
        // Get location name from the book's location_id in the API response
        if (data.location_id) {
          setBookLocationId(data.location_id)
          const locationResult = await authenticatedFetch(session, '/api/locations')
          if (locationResult.success && locationResult.data) {
            const locations = locationResult.data as any[]
            const bookLocation = locations.find(loc => loc.id === data.location_id)
            if (bookLocation) {
              setLocationName(bookLocation.name)
            } else if (locations.length > 0) {
              // Fallback to first location if book's location not found
              setLocationName(locations[0].name)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleToggleReviews = () => {
    if (!showReviews && reviews.length === 0) {
      fetchReviews()
    }
    setShowReviews(!showReviews)
  }

  const handleToggleSeries = () => {
    setShowSeries(!showSeries)
  }


  const handleRemoveFromSeries = async (seriesId: string) => {
    if (!book?.id) return
    
    // Store the original series for potential revert
    const seriesBeingRemoved = currentSeries.find(s => s.id === seriesId)
    
    // Optimistically update the local state immediately
    setCurrentSeries(prev => prev.filter(s => s.id !== seriesId))
    
    console.log('🔄 Removing book', book.id, 'from series', seriesId)
    const success = await removeBookFromSeries(seriesId, book.id)
    console.log('✅ Remove result:', success)
    if (success) {
      console.log('✅ Book removed from series successfully')
      // Mark that series have been modified
      setSeriesModified(true)
    } else {
      // Revert optimistic update on failure
      if (seriesBeingRemoved) {
        setCurrentSeries(prev => [...prev, seriesBeingRemoved])
      }
      console.error('❌ Failed to remove book from series')
    }
  }

  const handleCreateSeries = async (seriesData: any) => {
    try {
      const newSeries = await createSeries(seriesData)
      if (newSeries) {
        // Successfully created series, refresh series list
        await refreshSeries()
        return newSeries
      }
      return null
    } catch (error) {
      console.error('Failed to create series:', error)
      throw error
    }
  }

  // Enhanced close handler that updates parent if series were modified
  const handleClose = () => {
    if (seriesModified && onBookUpdate && book?.id) {
      // Update parent with new series data
      onBookUpdate(book.id, { current_series: currentSeries })
      setSeriesModified(false)
    }
    onClose()
  }

  // Mobile navigation action handlers - repurposed to match Quick Actions
  const handleLibraryAction = () => {
    // Library button becomes "Update Rating"
    if (onRateBook && localBook) {
      handleRateBookWithUpdate(localBook)
    }
  }

  const handleEditAction = () => {
    // Edit button becomes "Edit Genre"
    if (onGenreEdit && localBook) {
      handleGenreEditWithUpdate(localBook)
    }
  }

  const handleRateAction = () => {
    // Rate button becomes "Change Cover"
    if (onCoverEdit && localBook) {
      handleCoverEditWithUpdate(localBook)
    }
  }

  const handleShareAction = () => {
    // Share button becomes "Check Out" or "Check In"
    if (localBook) {
      if (localBook.checked_out_by) {
        // Book is checked out - show check in
        if (onCheckin && (localBook.checked_out_by === currentUserId || userPermissions.includes('can_manage_books'))) {
          handleCheckinWithUpdate(localBook.id, localBook.title)
        }
      } else {
        // Book is available - show check out
        if (onCheckout) {
          handleCheckoutWithUpdate(localBook.id, localBook.title)
        }
      }
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      ref={dialogRef}
      sx={{
        '& .MuiDialog-paper': {
          ...(isMobile && {
            margin: 0,
            borderRadius: 0,
            height: '100dvh', // Use dynamic viewport height for mobile
            maxHeight: '100dvh',
            transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          })
        }
      }}
      PaperProps={{
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        ...(isMobile && {
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
        })
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <MenuBook sx={{ mr: 1, flexShrink: 0 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          >
{localBook.title}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{ ml: 1, flexShrink: 0 }}
          aria-label="Close"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* Cover Image and Description Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 3, 
            mb: 3 
          }}>
            {/* Cover Image - Shows first on mobile, left on desktop */}
            {localBook.thumbnail && (
              <Box sx={{
                flexShrink: 0,
                order: { xs: 1, sm: 1 },
                alignSelf: { xs: 'center', sm: 'flex-start' },
                position: 'relative'
              }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '120px',
                    height: '180px',
                    cursor: onCoverEdit && userPermissions.includes('can_add_books') ? 'pointer' : 'default',
                    '&:hover': onCoverEdit && userPermissions.includes('can_add_books') ? {
                      transform: 'scale(1.02)',
                      '& .cover-overlay': {
                        opacity: 1
                      }
                    } : {}
                  }}
                  onClick={onCoverEdit && userPermissions.includes('can_add_books') ? () => handleCoverEditWithUpdate(localBook) : undefined}
                >
                  <img
                    src={localBook.thumbnail}
                    alt={`Cover of ${localBook.title}`}
                    key={localBook.thumbnail} // Force re-render when thumbnail URL changes
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease-in-out',
                      display: 'block'
                    }}
                  />
                  {/* Hover overlay for cover editing */}
                  {onCoverEdit && userPermissions.includes('can_add_books') && (
                    <Box
                      className="cover-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out',
                        pointerEvents: 'none'
                      }}
                    >
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'white'
                      }}>
                        <Image sx={{ fontSize: 24 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                          Change Cover
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                <CoverAttribution
                  coverUrl={localBook.thumbnail}
                  variant="small"
                  key={`attribution-${localBook.thumbnail}`}
                />
              </Box>
            )}
            
            {/* Main content area - Shows second on mobile, right on desktop */}
            <Box sx={{
              flex: 1,
              order: { xs: 2, sm: 2 }
            }}>
              {/* Basic Description */}
              {localBook.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {localBook.description}
                  </Typography>
                </Box>
              )}

              {localBook.extendedDescription && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Extended Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {localBook.extendedDescription}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Current Book Information Section */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Information
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1
            }}>
              {/* Current Rating */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Your Rating
                </Typography>
                {localBook.userRating ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          sx={{
                            fontSize: 16,
                            color: star <= (localBook.userRating || 0) ? 'warning.main' : 'action.disabled'
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      ({localBook.userRating}/5)
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Not rated yet
                  </Typography>
                )}
                {localBook.userReview && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    "{localBook.userReview}"
                  </Typography>
                )}
              </Box>

              {/* Current Genre */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Genre
                </Typography>
                {(() => {
                  const { genres, source } = getDisplayGenres(localBook)
                  if (genres.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No genre assigned
                      </Typography>
                    )
                  }

                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                      {genres.map((genre, index) => (
                        <Chip
                          key={index}
                          label={genre}
                          size="small"
                          color={source === 'assigned' ? 'success' : source === 'enhanced' ? 'info' : 'default'}
                          variant={source === 'assigned' ? 'filled' : 'outlined'}
                        />
                      ))}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: '0.7rem' }}>
                        ({source === 'assigned' ? 'Curated' : source === 'enhanced' ? 'Auto-classified' : 'Original'})
                      </Typography>
                    </Box>
                  )
                })()}
              </Box>

              {/* Book Status */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Status
                </Typography>
                {localBook.checked_out_by ? (
                  <Chip
                    label={localBook.checked_out_by === currentUserId ? "Checked out by you" : "Checked out"}
                    color="warning"
                    size="small"
                  />
                ) : (
                  <Chip
                    label="Available"
                    color="success"
                    size="small"
                  />
                )}
              </Box>

              {/* Average Rating */}
              {localBook.averageRating && (localBook.ratingCount || 0) > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Community Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          sx={{
                            fontSize: 16,
                            color: star <= Math.round(localBook.averageRating || 0) ? 'warning.main' : 'action.disabled'
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {(localBook.averageRating || 0).toFixed(1)}/5 ({localBook.ratingCount || 0} {(localBook.ratingCount || 0) === 1 ? 'rating' : 'ratings'})
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Quick Actions Section - Hidden since toolbar is now shown on all screen sizes */}
          {false && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 2
            }}>
              {/* Rate Book */}
              {onRateBook && localBook && (
                <Button
                  variant="outlined"
                  startIcon={<Star />}
                  onClick={() => handleRateBookWithUpdate(localBook!)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {localBook?.userRating ? 'Update Rating' : 'Rate Book'}
                </Button>
              )}

              {/* Edit Genre */}
              {onGenreEdit && localBook && (
                <Button
                  variant="outlined"
                  startIcon={<EditOutlined />}
                  onClick={() => handleGenreEditWithUpdate(localBook!)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Edit Genre
                </Button>
              )}

              {/* Change Cover */}
              {onCoverEdit && localBook && (
                <Button
                  variant="outlined"
                  startIcon={<Image />}
                  onClick={() => handleCoverEditWithUpdate(localBook!)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Change Cover
                </Button>
              )}

              {/* Checkout/Checkin */}
              {localBook && (localBook!.checked_out_by ? (
                onCheckin && (localBook!.checked_out_by === currentUserId || userPermissions.includes('can_manage_books')) ? (
                  <Button
                    variant="outlined"
                    startIcon={<Undo />}
                    onClick={() => handleCheckinWithUpdate(localBook!.id, localBook!.title)}
                    color="success"
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Check In
                  </Button>
                ) : null
              ) : (
                onCheckout && (
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircle />}
                    onClick={() => handleCheckoutWithUpdate(localBook!.id, localBook!.title)}
                    color="primary"
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Check Out
                  </Button>
                )
              ))}
            </Box>
          </Box>
          )}

          {/* Management Actions Section */}
          {(onRelocate || onDelete) && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Management
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 2
              }}>
                {/* Relocate */}
                {onRelocate && (
                  <Button
                    variant="outlined"
                    startIcon={<SwapHoriz />}
                    onClick={() => onRelocate(localBook)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Relocate
                  </Button>
                )}

                {/* Remove */}
                {onDelete && (isAdmin(userRole) || userPermissions.includes('can_delete_books')) && (
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    onClick={async () => {
                      try {
                        // Wait for the delete function to complete (including confirmation)
                        await onDelete(localBook.id, localBook.title)
                        // Only close modal if deletion was actually completed
                        onClose()
                      } catch (error) {
                        // If user cancelled or deletion failed, keep modal open
                        console.log('Deletion cancelled or failed')
                      }
                    }}
                    color="error"
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {/* Series Management Section */}
          <Box sx={{ mt: 3 }}>
            <Accordion expanded={showSeries} onChange={handleToggleSeries}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CollectionsBookmark sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">
                    Series Collections
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* Current Series Display */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Current Series Memberships
                    </Typography>
                    {currentSeries && currentSeries.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {currentSeries.map((bookSeries) => {
                          const canRemove = canRemoveFromSeries(bookSeries)
                          return (
                            <Chip
                              key={bookSeries.id}
                              label={bookSeries.name}
                              color="primary"
                              variant="outlined"
                              deleteIcon={canRemove ? <Close /> : undefined}
                              onDelete={canRemove ? () => handleRemoveFromSeries(bookSeries.id) : undefined}
                            />
                          )
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        This book is not part of any series yet.
                      </Typography>
                    )}
                  </Box>

                  {/* Legacy Series Display */}
                  {book?.series && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Legacy Series Information
                      </Typography>
                      <Typography variant="body2">
                        <strong>Series:</strong> {book.series}
                        {book.seriesNumber && ` (Book #${book.seriesNumber})`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This is legacy series data. Use the collections above for better organization.
                      </Typography>
                    </Box>
                  )}

                  {/* Add to Series Controls */}
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Add to Series
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Select Series</InputLabel>
                        <Select
                          value={selectedSeriesForAdd}
                          onChange={async (e) => {
                            const seriesId = e.target.value
                            setSelectedSeriesForAdd(seriesId)
                            
                            // Immediately add to series when selected
                            if (seriesId && book?.id) {
                              // Find the series being added for optimistic update
                              const seriesBeingAdded = series.find(s => s.id === seriesId)
                              if (seriesBeingAdded) {
                                // Optimistically update the local state immediately
                                setCurrentSeries(prev => [...prev, seriesBeingAdded])
                                
                                const result = await addBooksToSeries(seriesId, [book.id])
                                if (result) {
                                  console.log('Book added to series successfully')
                                  // Reset selection
                                  setSelectedSeriesForAdd('')
                                  // Mark that series have been modified
                                  setSeriesModified(true)
                                } else {
                                  // Revert optimistic update on failure
                                  setCurrentSeries(prev => prev.filter(s => s.id !== seriesId))
                                  console.error('Failed to add book to series')
                                }
                              }
                            }
                          }}
                          label="Select Series"
                        >
                          {series
                            .filter(s => !currentSeries?.some(cs => cs.id === s.id))
                            .map((seriesItem) => (
                              <MenuItem key={seriesItem.id} value={seriesItem.id}>
                                {seriesItem.name} ({seriesItem.book_count || 0} books)
                              </MenuItem>
                            ))
                          }
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        onClick={() => setIsSeriesModalOpen(true)}
                        startIcon={<Add />}
                        variant="outlined"
                      >
                        Create New Series
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
          
          {/* User Reviews Section */}
          <Box sx={{ mt: 3 }}>
            <Accordion expanded={showReviews} onChange={handleToggleReviews}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star sx={{ color: 'warning.main' }} />
                  <Typography variant="h6">
                    Reader Reviews
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {loadingReviews ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : reviews.length === 0 ? (
                  <Typography color="text.secondary">
                    No reviews found for this book.
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                      Reviews from other readers at {locationName}
                    </Typography>
                    <List>
                      {reviews.map((review, index) => (
                        <Box key={`${review.bookId}-${review.userId}`}>
                          <ListItem alignItems="flex-start">
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ display: 'flex' }}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          sx={{
                                            fontSize: 16,
                                            color: star <= review.rating ? 'warning.main' : 'action.disabled'
                                          }}
                                        />
                                      ))}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                      by {review.userName || 'Library Member'}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                review.reviewText ? (
                                  <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                                    {review.reviewText}
                                  </Typography>
                                ) : null
                              }
                            />
                          </ListItem>
                          {index < reviews.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
          
          {/* Checkout History Section - Only for admins */}
          {isAdmin(userRole) && (
            <Box sx={{ mt: 3 }}>
              <Accordion expanded={showCheckoutHistory} onChange={handleToggleCheckoutHistory}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History />
                    <Typography variant="h6">
                      Checkout History
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {loadingHistory ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : checkoutHistory.length === 0 ? (
                    <Typography color="text.secondary">
                      No checkout history found for this book.
                    </Typography>
                  ) : (
                    <List>
                      {checkoutHistory.map((item, index) => (
                        <Box key={item.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" color="text.primary">
                                    {item.action === 'checkout' ? 'Checked out' : 'Returned'} by {item.user_name || item.user_email}
                                  </Typography>
                                  {item.action === 'checkout' && book.checked_out_by === item.user_id && (
                                    <Chip label="Current" color="primary" size="small" />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(item.action_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                  {item.due_date && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                      • Due: {new Date(item.due_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </Typography>
                                  )}
                                  {item.notes && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      Note: {item.notes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            {item.action === 'checkout' && book.checked_out_by === item.user_id && (
                              <Button
                                size="small"
                                startIcon={<Email />}
                                onClick={() => {
                                  const email = item.user_email
                                  const subject = `Regarding "${book.title}" from the library`
                                  const body = `Hello,\n\nI hope this message finds you well. I wanted to reach out regarding the book "${book.title}" that you currently have checked out from our library.\n\nBest regards`
                                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                }}
                                sx={{ ml: 1 }}
                              >
                                Email
                              </Button>
                            )}
                          </ListItem>
                          {index < checkoutHistory.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
          
          {/* Additional Book Information */}
          <Box sx={{ mt: 3 }}>
            {/* ISBN Number */}
            {book.isbn && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ISBN
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.isbn}
                </Typography>
              </Box>
            )}
            
            {/* Book Details Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
              {book.publisherInfo && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Publisher
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.publisherInfo}
                  </Typography>
                </Box>
              )}
              
              {book.pageCount && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Page Count
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.pageCount} pages
                  </Typography>
                </Box>
              )}
              
              {book.googleAverageRating && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Google Books Rating
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.googleAverageRating}/5 ({book.googleRatingCount || 0} ratings)
                  </Typography>
                </Box>
              )}
              
              {book.openLibraryKey && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    OpenLibrary ID
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.openLibraryKey}
                  </Typography>
                </Box>
              )}
              
              {book.lccn && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Library of Congress Control Number
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.lccn}
                  </Typography>
                </Box>
              )}
              
              {book.classification && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Classification
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.classification}
                  </Typography>
                </Box>
              )}
              
              {book.language && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Language
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.language}
                  </Typography>
                </Box>
              )}
              
              {book.physicalDescription && (
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Physical Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.physicalDescription}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Assigned Genres (User-selected) */}
            {book.assignedGenres && book.assignedGenres.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Assigned Genres
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {book.assignedGenres.map((genre, index) => (
                    <Chip 
                      key={index} 
                      label={genre.name} 
                      size="small" 
                      color="success"
                      variant="filled"
                      onClick={undefined}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Curated Genres (Enhanced) */}
            {book.enhancedGenres && book.enhancedGenres.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Curated Genres
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {book.enhancedGenres.map((genre, index) => (
                    <Chip 
                      key={index} 
                      label={genre} 
                      size="small" 
                      color="primary"
                      onClick={undefined}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Google Books Categories (Raw) */}
            {book.categories && book.categories.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Google Books Categories
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {book.categories.map((category, index) => (
                    <Chip 
                      key={index} 
                      label={category} 
                      size="small" 
                      variant="outlined"
                      onClick={undefined}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* OpenLibrary Subjects */}
            {book.subjects && book.subjects.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  OpenLibrary Subjects
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {book.subjects.slice(0, 10).map((subject, index) => (
                    <Chip key={index} label={subject} size="small" variant="outlined" onClick={undefined} />
                  ))}
                  {book.subjects.length > 10 && (
                    <Chip label={`+${book.subjects.length - 10} more`} size="small" variant="outlined" onClick={undefined} />
                  )}
                </Box>
              </Box>
            )}

            {/* Library of Congress Subjects */}
            {book.locSubjects && book.locSubjects.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Library of Congress Subjects
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {book.locSubjects.slice(0, 10).map((subject, index) => (
                    <Chip 
                      key={index} 
                      label={subject} 
                      size="small" 
                      variant="outlined"
                      color="info"
                      onClick={undefined} 
                    />
                  ))}
                  {book.locSubjects.length > 10 && (
                    <Chip 
                      label={`+${book.locSubjects.length - 10} more`} 
                      size="small" 
                      variant="outlined"
                      color="info"
                      onClick={undefined} 
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Library of Congress Notes */}
            {book.notes && book.notes.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Library of Congress Notes
                </Typography>
                <Box>
                  {book.notes.map((note, index) => (
                    <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      • {note}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {/* Source Attribution */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Data Sources
              </Typography>
              {book.sourceAttribution ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`Title: ${book.sourceAttribution.title === 'google' ? 'Google Books' : book.sourceAttribution.title === 'openlibrary' ? 'Open Library' : 'Library of Congress'}`}
                    size="small"
                    variant="outlined"
                    color={book.sourceAttribution.title === 'google' ? 'primary' : book.sourceAttribution.title === 'openlibrary' ? 'secondary' : 'info'}
                  />
                  <Chip 
                    label={`Description: ${book.sourceAttribution.description === 'google' ? 'Google Books' : book.sourceAttribution.description === 'openlibrary' ? 'Open Library' : 'Library of Congress'}`}
                    size="small"
                    variant="outlined"
                    color={book.sourceAttribution.description === 'google' ? 'primary' : book.sourceAttribution.description === 'openlibrary' ? 'secondary' : 'info'}
                  />
                  <Chip 
                    label={`Authors: ${book.sourceAttribution.authors === 'google' ? 'Google Books' : book.sourceAttribution.authors === 'openlibrary' ? 'Open Library' : 'Library of Congress'}`}
                    size="small"
                    variant="outlined"
                    color={book.sourceAttribution.authors === 'google' ? 'primary' : book.sourceAttribution.authors === 'openlibrary' ? 'secondary' : 'info'}
                  />
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This book's data comes from external sources. Available source data includes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {/* Show Google Books if we have typical Google Books indicators */}
                    {(book.thumbnail || book.pageCount || book.googleAverageRating || 
                      (book.categories && book.categories.length > 0) || book.publisherInfo) && (
                      <Chip 
                        label="Google Books"
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                    
                    {/* Show OpenLibrary if we have typical OpenLibrary indicators */}
                    {(book.openLibraryKey || (book.subjects && book.subjects.length > 0) || book.series) && (
                      <Chip 
                        label="OpenLibrary"
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    )}
                    
                    {/* Show Library of Congress if we have LoC indicators */}
                    {(book.lccn || book.locSubjects || book.classification || book.language || book.physicalDescription || book.notes) && (
                      <Chip 
                        label="Library of Congress"
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    )}
                    
                    {/* Show more specific source indicators if available */}
                    {book.categories && book.categories.length > 0 && (
                      <Chip 
                        label="Google Books Categories"
                        size="small"
                        variant="filled"
                        color="primary"
                      />
                    )}
                    {book.subjects && book.subjects.length > 0 && (
                      <Chip 
                        label="OpenLibrary Subjects"
                        size="small"
                        variant="filled"
                        color="secondary"
                      />
                    )}
                    {book.locSubjects && book.locSubjects.length > 0 && (
                      <Chip 
                        label="Library of Congress Subjects"
                        size="small"
                        variant="filled"
                        color="info"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{
        flexDirection: 'column',
        gap: 1,
        p: 2,
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
        ...(isMobile && {
          paddingBottom: 'env(safe-area-inset-bottom)',
        })
      }}>
        {/* Action Toolbar - now shown on all screen sizes */}
        {(
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            width: '100%',
            gap: 1,
            mb: 2
          }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Star />}
              onClick={handleLibraryAction}
              sx={{
                minWidth: 0,
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
                borderRadius: 2,
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
            >
              Rate
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditOutlined />}
              onClick={handleEditAction}
              sx={{
                minWidth: 0,
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
                borderRadius: 2,
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
            >
              Genre
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Image />}
              onClick={handleRateAction}
              sx={{
                minWidth: 0,
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
                borderRadius: 2,
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
            >
              Cover
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={localBook?.checked_out_by ? <Undo /> : <CheckCircle />}
              onClick={handleShareAction}
              sx={{
                minWidth: 0,
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
                borderRadius: 2,
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
            >
              {localBook?.checked_out_by ? 'Check In' : 'Check Out'}
            </Button>
          </Box>
        )}
      </DialogActions>

      {/* Series Creation Modal */}
      <SeriesModal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        onSubmit={handleCreateSeries}
        userPermissions={userPermissions}
      />
    </Dialog>
  )
}