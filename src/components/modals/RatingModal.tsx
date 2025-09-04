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
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Close, Star } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import StarRatingInput from '../book/StarRatingInput'
import AccessibleIcon from '../ui/AccessibleIcon'
import CoverAttribution from '../common/CoverAttribution'

interface RatingModalProps {
  book: EnhancedBook
  isOpen: boolean
  onClose: () => void
  onRatingSubmit: (rating: number, reviewText?: string) => Promise<void>
  currentRating?: number | null
  currentReview?: string | null
  currentReviewStatus?: 'pending' | 'approved' | 'rejected' | null
}

export default function RatingModal({
  book,
  isOpen,
  onClose,
  onRatingSubmit,
  currentRating,
  currentReview,
  currentReviewStatus
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(currentRating || 0)
  const [reviewText, setReviewText] = useState<string>(currentReview || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')


  const handleSubmit = async () => {
    // Only show error if trying to submit 0 rating when there's no existing rating to clear
    if (rating === 0 && !currentRating) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onRatingSubmit(rating, reviewText.trim() || undefined)
      // Close modal immediately - user will see the rating update in the book list
      onClose()
    } catch (err) {
      setError('Failed to submit rating. Please try again.')
      console.error('Rating submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    setError('')
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star sx={{ color: 'warning.main' }} />
          <Typography variant="h6">
            Rate This Book
          </Typography>
        </Box>
        <AccessibleIcon
          icon={<Close />}
          ariaLabel="Close rating dialog"
          tooltip="Close"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ minWidth: 'auto', p: 0.5 }}
        />
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {/* Book Info */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          {book.thumbnail && (
            <Box sx={{ flexShrink: 0 }}>
              <Box
                component="img"
                src={book.thumbnail}
                alt={book.title}
                sx={{ 
                  width: 60, 
                  height: 90, 
                  objectFit: 'cover',
                  borderRadius: 1,
                  display: 'block'
                }}
              />
              <CoverAttribution coverUrl={book.thumbnail} variant="small" />
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {book.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              by {book.authors.join(', ')}
            </Typography>
            {book.publishedDate && (
              <Typography variant="caption" color="text.secondary">
                Published {new Date(book.publishedDate).getFullYear()}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Rating Input */}
        <Box sx={{ mb: 3 }}>
          <StarRatingInput
            currentRating={rating}
            onRatingChange={handleRatingChange}
            disabled={isSubmitting}
            size="large"
            label="Your Rating"
            showClearButton={true}
          />
        </Box>

        {/* Review Text */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Write a Review (Optional)"
            placeholder="Share your thoughts about this book..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            disabled={isSubmitting || currentReviewStatus === 'pending'}
            inputProps={{ maxLength: 1000 }}
            helperText={`${reviewText.length}/1000 characters`}
            sx={{ mb: 1 }}
          />
          
          {/* Moderation Notice */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
            Reviews will be submitted for moderation, while star ratings will be registered immediately.
          </Typography>
          
          {/* Review Status Messages */}
          {currentReviewStatus === 'pending' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your review is currently queued for approval by a location administrator.
            </Alert>
          )}
          
          {currentReviewStatus === 'rejected' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Your previous review was rejected. You can write a new review that will be submitted for approval.
            </Alert>
          )}
          
          {currentReviewStatus === 'approved' && currentReview && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your review has been approved. You can edit it, and changes will be resubmitted for approval.
            </Alert>
          )}
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}


        {/* Current Rating Info */}
        {book.averageRating && book.ratingCount && book.ratingCount > 0 && (
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Library Average:</strong> {book.averageRating.toFixed(1)} stars ({book.ratingCount} rating{book.ratingCount !== 1 ? 's' : ''})
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={isSubmitting}
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || (rating === 0 && !currentRating)}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Star />}
        >
          {isSubmitting ? 'Submitting...' : currentRating ? 'Update Rating' : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}