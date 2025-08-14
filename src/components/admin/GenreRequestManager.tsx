'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material'
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { authenticatedApiCall } from '@/lib/api'

interface GenreRequest {
  id: number
  genre_name: string
  description?: string
  reason: string
  requested_by: string
  requester_name: string
  requester_email: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  notes?: string
}

interface GenreRequestManagerProps {
  onCountChange?: () => void;
}

export default function GenreRequestManager({ onCountChange }: GenreRequestManagerProps = {}) {
  const [genreRequests, setGenreRequests] = useState<GenreRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<GenreRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewNotes, setReviewNotes] = useState('')
  const [createGenre, setCreateGenre] = useState(true)

  // Load genre requests
  const loadGenreRequests = async () => {
    setLoading(true)
    try {
      const response = await authenticatedApiCall('/api/admin/genre-requests')
      if (response.ok) {
        const requests = await response.json()
        setGenreRequests(requests)
      } else {
        setError('Failed to load genre requests')
      }
    } catch (error) {
      setError('Failed to load genre requests')
    } finally {
      setLoading(false)
    }
  }

  // Handle approve/reject
  const handleReview = async () => {
    if (!selectedRequest) return

    try {
      const endpoint = reviewAction === 'approve' ? 'approve' : 'reject'
      const response = await authenticatedApiCall(`/api/admin/genre-requests/${selectedRequest.id}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({
          notes: reviewNotes.trim() || undefined,
          createGenre: reviewAction === 'approve' ? createGenre : false
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(
          reviewAction === 'approve' 
            ? `Genre request approved${createGenre ? ' and genre created' : ''}!`
            : 'Genre request rejected.'
        )
        setReviewDialogOpen(false)
        setSelectedRequest(null)
        setReviewNotes('')
        setCreateGenre(true)
        loadGenreRequests()
        // Notify parent about count change
        onCountChange?.()
      } else {
        const error = await response.json()
        setError(error.error || `Failed to ${reviewAction} genre request`)
      }
    } catch (error) {
      setError(`Failed to ${reviewAction} genre request`)
    }
  }

  // Open review dialog
  const openReviewDialog = (request: GenreRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setReviewAction(action)
    setReviewNotes('')
    setCreateGenre(action === 'approve')
    setReviewDialogOpen(true)
  }

  useEffect(() => {
    loadGenreRequests()
  }, [])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusChip = (status: GenreRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<ScheduleIcon />} label="Pending" color="warning" size="small" />
      case 'approved':
        return <Chip icon={<CheckIcon />} label="Approved" color="success" size="small" />
      case 'rejected':
        return <Chip icon={<CloseIcon />} label="Rejected" color="error" size="small" />
    }
  }

  const pendingRequests = genreRequests.filter(req => req.status === 'pending')
  const processedRequests = genreRequests.filter(req => req.status !== 'pending')

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Genre Requests
        </Typography>
        <Button onClick={loadGenreRequests} variant="outlined" size="small">
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Typography>Loading genre requests...</Typography>
          ) : genreRequests.length === 0 ? (
            <Typography color="text.secondary">No genre requests found.</Typography>
          ) : (
            <>
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="warning" />
                    Pending Requests ({pendingRequests.length})
                  </Typography>
                  <List>
                    {pendingRequests.map((request) => (
                      <React.Fragment key={request.id}>
                        <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CategoryIcon />
                                  <strong>{request.genre_name}</strong>
                                  {getStatusChip(request.status)}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  {request.description && (
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>Description:</strong> {request.description}
                                    </Typography>
                                  )}
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Reason:</strong> {request.reason}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Requested by {request.requester_name} ({request.requester_email}) on {formatDate(request.created_at)}
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckIcon />}
                                  onClick={() => openReviewDialog(request, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CloseIcon />}
                                  onClick={() => openReviewDialog(request, 'reject')}
                                >
                                  Reject
                                </Button>
                              </Box>
                            </ListItemSecondaryAction>
                          </Box>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}

              {/* Processed Requests */}
              {processedRequests.length > 0 && (
                <>
                  {pendingRequests.length > 0 && <Box sx={{ mt: 3, mb: 2 }} />}
                  <Typography variant="subtitle1" gutterBottom>
                    Processed Requests ({processedRequests.length})
                  </Typography>
                  <List>
                    {processedRequests.map((request) => (
                      <React.Fragment key={request.id}>
                        <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CategoryIcon />
                                <span>{request.genre_name}</span>
                                {getStatusChip(request.status)}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                {request.description && (
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Description:</strong> {request.description}
                                  </Typography>
                                )}
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Reason:</strong> {request.reason}
                                </Typography>
                                {request.notes && (
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Admin Notes:</strong> {request.notes}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  Requested by {request.requester_name} on {formatDate(request.created_at)}
                                  {request.reviewed_at && ` • Reviewed on ${formatDate(request.reviewed_at)}`}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approve' ? 'Approve' : 'Reject'} Genre Request
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{selectedRequest.genre_name}</Typography>
              {selectedRequest.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {selectedRequest.description}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Reason:</strong> {selectedRequest.reason}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Requested by {selectedRequest.requester_name} ({selectedRequest.requester_email})
              </Typography>
            </Box>
          )}

          {reviewAction === 'approve' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={createGenre}
                  onChange={(e) => setCreateGenre(e.target.checked)}
                />
              }
              label="Create the genre in the system"
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            label="Notes (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder={
              reviewAction === 'approve' 
                ? "Add any notes about the approval..." 
                : "Explain why this request was rejected..."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReview} 
            variant="contained" 
            color={reviewAction === 'approve' ? 'success' : 'error'}
          >
            {reviewAction === 'approve' ? 'Approve' : 'Reject'} Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}