'use client'

import { useState, useEffect } from 'react'
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
import { ExpandMore, History, Email, Star, MenuBook, CollectionsBookmark, Add, Close } from '@mui/icons-material'
import type { EnhancedBook, BookRating, Series } from '@/lib/types'
import { isAdmin } from '@/lib/permissions'
import { useSession } from 'next-auth/react'
import { authenticatedFetch } from '@/lib/auth-utils'
import { useSeries } from '@/hooks/useSeries'
import SeriesModal from './SeriesModal'

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
  onBookUpdate?: () => void
}

export default function MoreDetailsModal({ book, isOpen, onClose, userRole, onBookUpdate }: MoreDetailsModalProps) {
  const { data: session } = useSession()
  const [checkoutHistory, setCheckoutHistory] = useState<CheckoutHistoryItem[]>([])
  const [showCheckoutHistory, setShowCheckoutHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [reviews, setReviews] = useState<BookRating[]>([])
  const [showReviews, setShowReviews] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [locationName, setLocationName] = useState<string>('')
  
  // Series management state
  const { series, addBooksToSeries, removeBookFromSeries, createSeries, refreshSeries } = useSeries()
  const [showSeries, setShowSeries] = useState(false)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [selectedSeriesForAdd, setSelectedSeriesForAdd] = useState<string>('')

  // Clear state when book changes to prevent cross-contamination of reviews
  useEffect(() => {
    if (book?.id) {
      setReviews([])
      setShowReviews(false)
      setCheckoutHistory([])
      setShowCheckoutHistory(false)
      setLocationName('')
    }
  }, [book?.id])

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

  const handleAddToSeries = async () => {
    if (!selectedSeriesForAdd || !book?.id) return
    
    const result = await addBooksToSeries(selectedSeriesForAdd, [book.id])
    if (result) {
      console.log('Book added to series successfully, calling onBookUpdate...')
      // Reset selection
      setSelectedSeriesForAdd('')
      // Refresh book data to update current_series
      onBookUpdate?.()
    }
  }

  const handleRemoveFromSeries = async (seriesId: string) => {
    if (!book?.id) return
    
    console.log('🔄 Removing book', book.id, 'from series', seriesId)
    const success = await removeBookFromSeries(seriesId, book.id)
    console.log('✅ Remove result:', success)
    if (success) {
      console.log('📞 Calling onBookUpdate...')
      // Refresh book data to update current_series
      onBookUpdate?.()
    } else {
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

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <MenuBook sx={{ mr: 1, verticalAlign: 'middle' }} /> More Details: {book.title}
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
                    {book?.current_series && book.current_series.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {book.current_series.map((bookSeries) => (
                          <Chip
                            key={bookSeries.id}
                            label={bookSeries.name}
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              borderColor: bookSeries.color || 'primary.main',
                              color: bookSeries.color || 'primary.main'
                            }}
                            deleteIcon={<Close />}
                            onDelete={() => handleRemoveFromSeries(bookSeries.id)}
                          />
                        ))}
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
                          onChange={(e) => setSelectedSeriesForAdd(e.target.value)}
                          label="Select Series"
                        >
                          {series
                            .filter(s => !book?.current_series?.some(cs => cs.id === s.id))
                            .map((seriesItem) => (
                              <MenuItem key={seriesItem.id} value={seriesItem.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {seriesItem.color && (
                                    <Box
                                      sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: seriesItem.color,
                                        borderRadius: '50%'
                                      }}
                                    />
                                  )}
                                  {seriesItem.name} ({seriesItem.book_count || 0} books)
                                </Box>
                              </MenuItem>
                            ))
                          }
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        onClick={handleAddToSeries}
                        disabled={!selectedSeriesForAdd}
                        startIcon={<Add />}
                      >
                        Add
                      </Button>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
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
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Series Creation Modal */}
      <SeriesModal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        onSubmit={handleCreateSeries}
      />
    </Dialog>
  )
}