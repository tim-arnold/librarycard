'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material'
import { ReportProblem, CheckCircle, Cancel, Visibility } from '@mui/icons-material'
import { getApiBaseUrl } from '@/lib/apiConfig'

interface BookCoverAppeal {
  id: number
  user_id: string
  book_title: string
  book_author: string
  appeal_reason?: string
  image_data_url: string
  image_metadata?: any
  ai_classification_results?: any
  rejection_reason: string
  status: 'pending' | 'approved' | 'rejected' | 'resolved'
  admin_notes?: string
  resolved_by?: string
  resolved_at?: string
  submitted_at: string
  updated_at: string
  user_email?: string
  user_first_name?: string
  user_last_name?: string
}

export default function AppealManagement() {
  const [appeals, setAppeals] = useState<BookCoverAppeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedAppeal, setSelectedAppeal] = useState<BookCoverAppeal | null>(null)
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [resolutionAction, setResolutionAction] = useState<'approve' | 'reject' | 'add_to_allowlist'>('approve')
  const [allowlistLabels, setAllowlistLabels] = useState<string>('')
  const [isResolving, setIsResolving] = useState(false)
  const { data: session } = useSession()

  const fetchAppeals = async () => {
    if (!session?.user?.email) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/appeals/admin`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appeals')
      }

      setAppeals(data.appeals || [])
    } catch (err) {
      console.error('Error fetching appeals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load appeals')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppeals()
  }, [session])

  const handleResolveAppeal = async () => {
    if (!selectedAppeal || !session?.user?.email) return

    setIsResolving(true)

    try {
      const body: any = {
        appeal_id: selectedAppeal.id,
        action: resolutionAction,
        admin_notes: adminNotes.trim() || undefined
      }

      if (resolutionAction === 'add_to_allowlist' && allowlistLabels.trim()) {
        body.allowlist_labels = allowlistLabels
          .split(',')
          .map(label => label.trim())
          .filter(label => label.length > 0)
      }

      const response = await fetch(`${getApiBaseUrl()}/api/appeals/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve appeal')
      }

      // Refresh appeals list
      await fetchAppeals()

      // Close modal and reset state
      setResolutionModalOpen(false)
      setSelectedAppeal(null)
      setAdminNotes('')
      setAllowlistLabels('')
      setResolutionAction('approve')

    } catch (err) {
      console.error('Error resolving appeal:', err)
      setError(err instanceof Error ? err.message : 'Failed to resolve appeal')
    } finally {
      setIsResolving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'resolved': return 'info'
      default: return 'default'
    }
  }

  const getAILabels = (results: any) => {
    if (!results || !Array.isArray(results)) return []
    return results.slice(0, 3).map(r => ({
      label: r.label || 'Unknown',
      score: Math.round((r.score || 0) * 100)
    }))
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Verification Appeals
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Manage appeals from users whose book cover photos were incorrectly rejected by AI verification.
        </Typography>
      </Box>

      {appeals.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Appeals to Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All AI verification appeals have been resolved.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {appeals.map((appeal) => (
            <Card key={appeal.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip
                      label={appeal.status}
                      color={getStatusColor(appeal.status) as any}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      #{appeal.id}
                    </Typography>
                  </Box>

                  <Typography variant="h6" gutterBottom noWrap>
                    {appeal.book_title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    by {appeal.book_author}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" gutterBottom>
                    <strong>User:</strong> {appeal.user_first_name} {appeal.user_last_name} ({appeal.user_email})
                  </Typography>

                  <Typography variant="body2" gutterBottom>
                    <strong>Rejection:</strong> {appeal.rejection_reason}
                  </Typography>

                  {appeal.appeal_reason && (
                    <Typography variant="body2" gutterBottom>
                      <strong>User's Explanation:</strong> {appeal.appeal_reason}
                    </Typography>
                  )}

                  {/* AI Classification Results */}
                  {appeal.ai_classification_results && getAILabels(appeal.ai_classification_results).length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>AI Detected:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {getAILabels(appeal.ai_classification_results).map((item, index) => (
                          <Chip
                            key={index}
                            label={`${item.label} (${item.score}%)`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <img
                      src={appeal.image_data_url}
                      alt="Appealed book cover"
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Submitted: {new Date(appeal.submitted_at).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions>
                  {appeal.status === 'pending' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedAppeal(appeal)
                        setResolutionModalOpen(true)
                      }}
                      startIcon={<Visibility />}
                    >
                      Resolve
                    </Button>
                  )}
                </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Resolution Modal */}
      <Dialog
        open={resolutionModalOpen}
        onClose={() => !isResolving && setResolutionModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Resolve Appeal #{selectedAppeal?.id}
        </DialogTitle>

        <DialogContent>
          {selectedAppeal && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAppeal.book_title} by {selectedAppeal.book_author}
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>AI Rejection:</strong> {selectedAppeal.rejection_reason}
              </Alert>

              {selectedAppeal.appeal_reason && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>User's Explanation:</strong> {selectedAppeal.appeal_reason}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Resolution Action</InputLabel>
                <Select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as any)}
                  disabled={isResolving}
                >
                  <MenuItem value="approve">Approve - Accept this as legitimate book cover</MenuItem>
                  <MenuItem value="reject">Reject - AI was correct to reject this</MenuItem>
                  <MenuItem value="add_to_allowlist">Add to Allowlist - Add AI labels to allowlist</MenuItem>
                </Select>
              </FormControl>

              {resolutionAction === 'add_to_allowlist' && (
                <TextField
                  fullWidth
                  label="Labels to Add to Allowlist"
                  placeholder="book, cover, text (comma-separated)"
                  value={allowlistLabels}
                  onChange={(e) => setAllowlistLabels(e.target.value)}
                  disabled={isResolving}
                  sx={{ mb: 2 }}
                  helperText="Enter AI classification labels that should be allowed for future book covers"
                />
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Admin Notes"
                placeholder="Optional notes about this resolution..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                disabled={isResolving}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setResolutionModalOpen(false)}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolveAppeal}
            variant="contained"
            disabled={isResolving}
            startIcon={isResolving ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {isResolving ? 'Resolving...' : 'Resolve Appeal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}