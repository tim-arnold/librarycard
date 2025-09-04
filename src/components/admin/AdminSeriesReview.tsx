'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Person,
  Schedule,
  Book
} from '@mui/icons-material'
import { authenticatedApiCall } from '@/lib/api'

interface PendingSeries {
  id: string
  user_id: string
  name: string
  description?: string
  color?: string
  created_at: string
  updated_at: string
  sort_order: number
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  book_count?: number
  creator_name?: string
  creator_email?: string
}

interface ReviewDialogProps {
  series: PendingSeries | null
  open: boolean
  onClose: () => void
  onSubmit: (seriesId: string, approval_status: 'approved' | 'rejected', rejection_reason?: string) => void
}

function ReviewDialog({ series, open, onClose, onSubmit }: ReviewDialogProps) {
  const [action, setAction] = useState<'approved' | 'rejected'>('approved')
  const [rejectionReason, setRejectionReason] = useState('')

  const handleSubmit = () => {
    if (!series) return
    
    onSubmit(
      series.id, 
      action,
      action === 'rejected' ? rejectionReason : undefined
    )
  }

  const resetDialog = () => {
    setAction('approved')
    setRejectionReason('')
  }

  useEffect(() => {
    if (open) {
      resetDialog()
    }
  }, [open])

  if (!series) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Review Series: "{series.name}"
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Created by: {series.creator_name} ({series.creator_email})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Created: {new Date(series.created_at).toLocaleDateString()}
          </Typography>
          {series.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Description: {series.description}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <FormControl component="fieldset">
          <Typography variant="subtitle1" gutterBottom>
            Review Decision
          </Typography>
          <RadioGroup
            value={action}
            onChange={(e) => setAction(e.target.value as 'approved' | 'rejected')}
          >
            <FormControlLabel
              value="approved"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography>Approve Series</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="rejected"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Cancel color="error" fontSize="small" />
                  <Typography>Reject Series</Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {action === 'rejected' && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this series is being rejected..."
            sx={{ mt: 2 }}
            required
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={action === 'rejected' && !rejectionReason.trim()}
          color={action === 'approved' ? 'success' : 'error'}
        >
          {action === 'approved' ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface AdminSeriesReviewProps {
  onCountChange?: () => void;
}

export default function AdminSeriesReview({ onCountChange }: AdminSeriesReviewProps = {}) {
  const { data: session } = useSession()
  const [pendingSeries, setPendingSeries] = useState<PendingSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    series: PendingSeries | null
  }>({
    open: false,
    series: null
  })

  useEffect(() => {
    if (session?.user?.email) {
      loadPendingSeries()
    }
  }, [session?.user?.email])

  const loadPendingSeries = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      const response = await authenticatedApiCall('/api/admin/series/pending')

      if (response.ok) {
        const data = await response.json()
        setPendingSeries(data.series || [])
        setError('')
      } else if (response.status === 403) {
        setError('Admin privileges required to review series')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load pending series')
      }
    } catch (error) {
      console.error('Error loading pending series:', error)
      setError('Failed to load pending series')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSeries = async (
    seriesId: string, 
    approval_status: 'approved' | 'rejected', 
    rejection_reason?: string
  ) => {
    if (!session?.user?.email) return

    try {
      setProcessingId(seriesId)
      const response = await authenticatedApiCall(`/api/admin/series/${seriesId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approval_status,
          rejection_reason
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Remove the reviewed series from the pending list
        setPendingSeries(prev => prev.filter(s => s.id !== seriesId))
        
        // Close the dialog
        setReviewDialog({ open: false, series: null })
        
        // Notify parent component to refresh counts with a small delay 
        // to ensure database changes are reflected
        setTimeout(() => {
          onCountChange?.()
        }, 100)
        
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to review series')
      }
    } catch (error) {
      console.error('Error reviewing series:', error)
      setError('Failed to review series')
    } finally {
      setProcessingId(null)
    }
  }

  const openReviewDialog = (series: PendingSeries) => {
    setReviewDialog({ open: true, series })
  }

  const closeReviewDialog = () => {
    setReviewDialog({ open: false, series: null })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mr: 2 }} />
        <Typography color="text.secondary">
          Loading pending series...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          📋 Series Review Queue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve or reject new series created by users
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {pendingSeries.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Pending Series
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All series have been reviewed. Check back later for new submissions.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadPendingSeries}
                sx={{ mt: 2 }}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: 'repeat(auto-fit, minmax(300px, 1fr))',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          }, 
          gap: { xs: 2, sm: 2.5, lg: 3 },
          '& > *': {
            animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            animationFillMode: 'both',
          },
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}>
          {pendingSeries.map((series) => (
            <Card key={series.id}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom noWrap>
                      {series.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {series.creator_name || 'Unknown User'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(series.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Book fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {series.book_count || 0} books
                      </Typography>
                    </Box>


                    {series.description && (
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        {series.description}
                      </Typography>
                    )}
                  </Box>

                  <Chip
                    label="Pending Review"
                    color="warning"
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => openReviewDialog(series)}
                      disabled={processingId === series.id}
                      startIcon={processingId === series.id ? <CircularProgress size={16} /> : undefined}
                    >
                      {processingId === series.id ? 'Processing...' : 'Review'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>
      )}

      <ReviewDialog
        series={reviewDialog.series}
        open={reviewDialog.open}
        onClose={closeReviewDialog}
        onSubmit={handleReviewSeries}
      />
    </Box>
  )
}