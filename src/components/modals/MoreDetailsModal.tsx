'use client'

import { useState, useEffect, useRef } from 'react'
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
import { ExpandMore, History, Email, Star, MenuBook, CollectionsBookmark, Add, Close, LibraryBooks, Edit, Share } from '@mui/icons-material'
import type { EnhancedBook, BookRating, Series } from '@/lib/types'
import { isAdmin, canManageSeriesBooks } from '@/lib/permissions'
import { useSession } from 'next-auth/react'
import { authenticatedFetch } from '@/lib/auth-utils'
import { useSeries } from '@/hooks/useSeries'
import SeriesModal from './SeriesModal'
import CoverAttribution from '@/components/common/CoverAttribution'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

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
}

export default function MoreDetailsModal({ book, isOpen, onClose, userRole, userPermissions, onBookUpdate }: MoreDetailsModalProps) {
  const { data: session } = useSession()
  const { isMobile } = useMobileBreakpoints()
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

  // Mobile swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    setStartY(e.touches[0].clientY)
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || startY === null) return

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

  if (!book) return null
  
  // Debug: Log current_series data after any changes
  console.log('MoreDetailsModal render - book data:', { 
    id: book.id, 
    title: book.title, 
    current_series: book.current_series,
    series: book.series 
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

  // Mobile navigation action handlers
  const handleLibraryAction = () => {
    handleClose()
    // The user will naturally return to the library view when modal closes
  }

  const handleEditAction = () => {
    // This would trigger edit mode - for now, just expand the series section which has edit functionality
    if (!showSeries) {
      setShowSeries(true)
    }
  }

  const handleRateAction = () => {
    // This would trigger rating modal - for now, just expand the reviews section
    if (!showReviews) {
      setShowReviews(true)
    }
  }

  const handleShareAction = () => {
    // Share the book details
    if (navigator.share && book) {
      navigator.share({
        title: `${book.title} by ${book.authors.join(', ')}`,
        text: `Check out "${book.title}" by ${book.authors.join(', ')} in our library!`,
        url: window.location.href
      }).catch(console.error)
    } else if (book) {
      // Fallback to copy to clipboard
      const shareText = `Check out "${book.title}" by ${book.authors.join(', ')} in our library!`
      navigator.clipboard.writeText(shareText).then(() => {
        // Could show a toast notification here
        console.log('Book details copied to clipboard')
      }).catch(console.error)
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
            height: '100vh',
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
        borderBottom: isMobile ? '1px solid' : 'none',
        borderColor: 'divider',
        bgcolor: isMobile ? 'background.default' : 'transparent',
        position: isMobile ? 'sticky' : 'relative',
        top: 0,
        zIndex: 1
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
            {book.title}
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={handleClose}
            sx={{ ml: 1, flexShrink: 0 }}
            aria-label="Close"
          >
            <Close />
          </IconButton>
        )}
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
            {/* Cover Image - Shows first on mobile, right on desktop */}
            {book.thumbnail && (
              <Box sx={{ 
                flexShrink: 0,
                order: { xs: 1, sm: 2 },
                alignSelf: { xs: 'center', sm: 'flex-start' }
              }}>
                <img
                  src={book.thumbnail}
                  alt={`Cover of ${book.title}`}
                  style={{
                    width: '120px',
                    height: 'auto',
                    maxHeight: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <CoverAttribution coverUrl={book.thumbnail} variant="small" />
              </Box>
            )}
            
            {/* Main content area - Shows second on mobile, left on desktop */}
            <Box sx={{ 
              flex: 1,
              order: { xs: 2, sm: 1 }
            }}>
              {/* Basic Description */}
              {book.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.description}
                  </Typography>
                </Box>
              )}
              
              {book.extendedDescription && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Extended Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {book.extendedDescription}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
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
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
        p: isMobile ? 2 : 2,
        bgcolor: isMobile ? 'background.default' : 'transparent',
        borderTop: isMobile ? '1px solid' : 'none',
        borderColor: 'divider',
        position: isMobile ? 'sticky' : 'relative',
        bottom: 0,
        zIndex: 1
      }}>
        {isMobile && (
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
              startIcon={<LibraryBooks />}
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
              Library
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit />}
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
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Star />}
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
              Rate
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Share />}
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
              Share
            </Button>
          </Box>
        )}
        {!isMobile && (
          <Button
            onClick={handleClose}
            variant="outlined"
          >
            Close
          </Button>
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