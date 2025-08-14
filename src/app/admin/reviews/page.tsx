'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Chip,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider
} from '@mui/material'
import { 
  CheckCircle, 
  Cancel, 
  Delete, 
  Star,
  Person,
  Book,
  Schedule,
  Warning
} from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { authenticatedFetch } from '@/lib/auth-utils'
import type { PendingReview } from '@/lib/types'

export default function ReviewModerationPage() {
  const { data: session } = useSession()
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Dialog state for rejection reason
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    reviewId: number | null
    rejectionReason: string
  }>({
    open: false,
    reviewId: null,
    rejectionReason: ''
  })

  // Fetch pending reviews
  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const result = await authenticatedFetch(session, '/api/admin/reviews/pending')
      
      if (result.success) {
        const data = result.data as { pendingReviews: PendingReview[], count: number }
        setPendingReviews(data?.pendingReviews || [])
      } else {
        setError('Failed to fetch pending reviews')
      }
    } catch (err) {
      setError('Error loading pending reviews')
      console.error('Error fetching pending reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.email) {
      fetchPendingReviews()
    }
  }, [session])

  // Moderate review (approve, reject, delete)
  const moderateReview = async (reviewId: number, action: 'approve' | 'reject' | 'delete', rejectionReason?: string) => {
    try {
      setProcessing(reviewId)
      setError('')
      setSuccess('')

      const result = await authenticatedFetch(session, `/api/admin/reviews/${reviewId}/moderate`, {
        method: 'POST',
        body: {
          action,
          rejectionReason
        }
      })

      if (result.success) {
        setSuccess(`Review ${action}d successfully`)
        // Remove the review from the pending list
        setPendingReviews(prev => prev.filter(review => review.id !== reviewId))
      } else {
        setError(result.error || `Failed to ${action} review`)
      }
    } catch (err) {
      setError(`Error ${action}ing review`)
      console.error(`Error ${action}ing review:`, err)
    } finally {
      setProcessing(null)
    }
  }

  // Handle approve action
  const handleApprove = (reviewId: number) => {
    moderateReview(reviewId, 'approve')
  }

  // Handle delete action  
  const handleDelete = (reviewId: number) => {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      moderateReview(reviewId, 'delete')
    }
  }

  // Handle reject action (with reason dialog)
  const handleReject = (reviewId: number) => {
    setRejectDialog({
      open: true,
      reviewId,
      rejectionReason: ''
    })
  }

  // Submit rejection with reason
  const submitRejection = async () => {
    if (rejectDialog.reviewId) {
      await moderateReview(rejectDialog.reviewId, 'reject', rejectDialog.rejectionReason)
      setRejectDialog({ open: false, reviewId: null, rejectionReason: '' })
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          Review Moderation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and moderate written book reviews submitted by users. Star ratings are approved automatically.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Review Count */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip 
          icon={<Schedule />}
          label={`${pendingReviews.length} Pending Review${pendingReviews.length !== 1 ? 's' : ''}`}
          color={pendingReviews.length > 0 ? "warning" : "success"}
          variant="filled"
        />
        <Button 
          onClick={fetchPendingReviews} 
          variant="outlined" 
          size="small"
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Pending Reviews List */}
      {pendingReviews.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Pending Reviews
          </Typography>
          <Typography color="text.secondary">
            All written reviews have been moderated. New reviews will appear here for approval.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={3}>
          {pendingReviews.map((review) => (
            <Card key={review.id} sx={{ position: 'relative' }}>
              <CardContent>
                {/* Review Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  {/* User Avatar */}
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  
                  {/* Review Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" component="span">
                        {review.userName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    {/* Star Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          sx={{
                            fontSize: 16,
                            color: star <= review.rating ? 'warning.main' : 'action.disabled'
                          }}
                        />
                      ))}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {review.rating}/5 stars
                      </Typography>
                    </Box>
                  </Box>

                  {/* Processing Indicator */}
                  {processing === review.id && (
                    <CircularProgress size={24} />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Book Info */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {review.bookThumbnail && (
                    <Box
                      component="img"
                      src={review.bookThumbnail}
                      alt={review.bookTitle}
                      sx={{
                        width: 60,
                        height: 90,
                        objectFit: 'cover',
                        borderRadius: 1,
                        flexShrink: 0
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Book fontSize="small" />
                      {review.bookTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      by {review.bookAuthors.join(', ')}
                    </Typography>
                  </Box>
                </Box>

                {/* Review Text */}
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="body1">
                    "{review.reviewText}"
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', gap: 1, p: 2 }}>
                <Button
                  startIcon={<CheckCircle />}
                  onClick={() => handleApprove(review.id)}
                  disabled={processing === review.id}
                  color="success"
                  variant="contained"
                >
                  Approve
                </Button>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => handleReject(review.id)}
                  disabled={processing === review.id}
                  color="warning"
                  variant="outlined"
                >
                  Reject
                </Button>
                <Button
                  startIcon={<Delete />}
                  onClick={() => handleDelete(review.id)}
                  disabled={processing === review.id}
                  color="error"
                  variant="outlined"
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={() => setRejectDialog({ open: false, reviewId: null, rejectionReason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Reject Review
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this review. This will be recorded for audit purposes.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectDialog.rejectionReason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, rejectionReason: e.target.value }))}
            placeholder="e.g., Contains inappropriate content, spam, etc."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRejectDialog({ open: false, reviewId: null, rejectionReason: '' })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={submitRejection}
            color="warning"
            variant="contained"
            disabled={!rejectDialog.rejectionReason.trim()}
          >
            Reject Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}