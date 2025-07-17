'use client'

import { useState } from 'react'
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
} from '@mui/material'
import { ExpandMore, History, Email } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { isAdmin } from '@/lib/permissions'

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
  book: EnhancedBook
  isOpen: boolean
  onClose: () => void
  userRole: string | null
}

export default function MoreDetailsModal({ book, isOpen, onClose, userRole }: MoreDetailsModalProps) {
  const [checkoutHistory, setCheckoutHistory] = useState<CheckoutHistoryItem[]>([])
  const [showCheckoutHistory, setShowCheckoutHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchCheckoutHistory = async () => {
    if (!isAdmin(userRole)) return
    
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/books/${book.id}/checkout-history`)
      if (response.ok) {
        const history = await response.json()
        setCheckoutHistory(history)
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

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        📖 More Details: {book.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* ISBN Number */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ISBN
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {book.isbn}
            </Typography>
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
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}