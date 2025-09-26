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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  Divider,
} from '@mui/material'
import { ReportProblem, CheckCircle, Cancel, Visibility, Delete } from '@mui/icons-material'
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

interface AppealManagementProps {
  onCountChange?: () => void | Promise<void>
}

export default function AppealManagement({ onCountChange }: AppealManagementProps) {
  const [appeals, setAppeals] = useState<BookCoverAppeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedAppeal, setSelectedAppeal] = useState<BookCoverAppeal | null>(null)
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [resolutionAction, setResolutionAction] = useState<'approve' | 'reject' | 'add_to_allowlist'>('approve')
  const [allowlistLabels, setAllowlistLabels] = useState<string>('')
  const [allowlistImageAction, setAllowlistImageAction] = useState<'approve' | 'reject'>('approve')
  const [isResolving, setIsResolving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [appealToDelete, setAppealToDelete] = useState<BookCoverAppeal | null>(null)
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

  // Add a manual refresh function for debugging
  const forceRefresh = () => {
    fetchAppeals()
  }

  const handleResolveAppeal = async () => {
    console.log('handleResolveAppeal called') // Debug
    console.log('selectedAppeal:', selectedAppeal) // Debug
    console.log('resolutionAction:', resolutionAction) // Debug
    
    if (!selectedAppeal) {
      console.log('No appeal selected') // Debug
      setError('No appeal selected')
      setResolutionModalOpen(false)
      return
    }

    if (!session?.user?.email) {
      console.log('No authentication') // Debug
      setError('Authentication required')
      setResolutionModalOpen(false)
      return
    }

    if (!selectedAppeal.id) {
      console.log('selectedAppeal:', selectedAppeal)
      console.log('selectedAppeal.id:', selectedAppeal.id)
      setError('Invalid appeal data')
      setResolutionModalOpen(false)
      return
    }

    console.log('Starting resolution process...') // Debug
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
        body.image_action = allowlistImageAction // Include whether to approve/reject the specific image
      }

      console.log('Making API call with body:', body) // Debug
      
      // Get CSRF token first
      const csrfResponse = await fetch(`${getApiBaseUrl()}/api/csrf-token`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`
        }
      })
      const csrfData = await csrfResponse.json()
      console.log('Got CSRF token:', csrfData.csrfToken) // Debug

      const response = await fetch(`${getApiBaseUrl()}/api/appeals/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfData.csrfToken,
        },
        body: JSON.stringify(body)
      })
      
      console.log('API response status:', response.status) // Debug

      const data = await response.json()

      if (!response.ok) {
        // Even if there's an error, the appeal might have been resolved
        // Refresh the list to check if it actually worked
        await fetchAppeals()
        throw new Error(data.error || 'Failed to resolve appeal')
      }

      // Refresh appeals list
      await fetchAppeals()

      // Notify parent component of count change
      if (onCountChange) {
        await onCountChange()
      }

      // Close modal and reset state
      setResolutionModalOpen(false)
      setSelectedAppeal(null)
      setAdminNotes('')
      setAllowlistLabels('')
      setAllowlistImageAction('approve')
      setResolutionAction('approve')

    } catch (err) {
      console.error('Error resolving appeal:', err)
      setError(err instanceof Error ? err.message : 'Failed to resolve appeal')
    } finally {
      setIsResolving(false)
    }
  }

  const confirmDeleteAppeal = (appeal: BookCoverAppeal) => {
    setAppealToDelete(appeal)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteAppeal = async () => {
    if (!session?.user?.email || !appealToDelete) return

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/appeals/${appealToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete appeal')
      }

      // Close confirmation dialog and reset state
      setDeleteConfirmOpen(false)
      setAppealToDelete(null)

      // Refresh appeals list
      await fetchAppeals()

      // Notify parent component of count change
      if (onCountChange) {
        await onCountChange()
      }

    } catch (err) {
      console.error('Error deleting appeal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete appeal')
      // Close dialog even on error
      setDeleteConfirmOpen(false)
      setAppealToDelete(null)
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
    if (!results) return []

    // Handle the actual format: { detectedLabels: ["person:0.92", "face:0.88", ...] }
    if (results.detectedLabels && Array.isArray(results.detectedLabels)) {
      return results.detectedLabels.slice(0, 5).map((labelString: string) => {
        // Each item is a string like "person:0.92"
        const parts = labelString.split(':')
        const label = parts[0] || 'Unknown'
        const confidence = parseFloat(parts[1]) || 0
        return {
          label: label,
          score: Math.round(confidence * 100)
        }
      })
    }

    // Fallback for old format: [{label: "...", score: 0.xx}, ...]
    if (Array.isArray(results)) {
      return results.slice(0, 5).map(r => ({
        label: r.label || 'Unknown',
        score: Math.round((r.score || 0) * 100)
      }))
    }

    return []
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          AI Verification Appeals
        </Typography>
        <Button onClick={forceRefresh} variant="outlined" size="small">
          Refresh Data
        </Button>
      </Box>

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
                        {getAILabels(appeal.ai_classification_results).map((item: { label: string; score: number }, index: number) => (
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
                  {appeal.status !== 'pending' && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => confirmDeleteAppeal(appeal)}
                      startIcon={<Delete />}
                    >
                      {appeal.status === 'rejected' ? 'Delete' : 'Archive'}
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
                <Box>
                  {/* Image Action Selection */}
                  <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      What should happen to this specific image?
                    </Typography>
                    <RadioGroup
                      row
                      value={allowlistImageAction}
                      onChange={(e) => setAllowlistImageAction(e.target.value as 'approve' | 'reject')}
                    >
                      <FormControlLabel value="approve" control={<Radio />} label="Approve this image" />
                      <FormControlLabel value="reject" control={<Radio />} label="Still reject this image" />
                    </RadioGroup>
                  </FormControl>

                  {/* Show AI Classification Results */}
                  {selectedAppeal && selectedAppeal.ai_classification_results && getAILabels(selectedAppeal.ai_classification_results).length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        AI Detected Labels (click to add to allowlist):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {getAILabels(selectedAppeal.ai_classification_results).map((item: { label: string; score: number }, index: number) => {
                          const isSelected = allowlistLabels.split(',').map(l => l.trim().toLowerCase()).includes(item.label.toLowerCase());
                          return (
                            <Chip
                              key={index}
                              label={`${item.label} (${item.score}%)`}
                              size="small"
                              clickable
                              color={isSelected ? 'primary' : 'default'}
                              variant={isSelected ? 'filled' : 'outlined'}
                              onClick={() => {
                                const currentLabels = allowlistLabels.split(',').map(l => l.trim()).filter(l => l.length > 0);
                                const labelToToggle = item.label.toLowerCase();

                                if (isSelected) {
                                  // Remove from allowlist
                                  const newLabels = currentLabels.filter(l => l.toLowerCase() !== labelToToggle);
                                  setAllowlistLabels(newLabels.join(', '));
                                } else {
                                  // Add to allowlist
                                  const newLabels = [...currentLabels, labelToToggle];
                                  setAllowlistLabels(newLabels.join(', '));
                                }
                              }}
                              disabled={isResolving}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    label="Labels to Add to Allowlist"
                    placeholder="book, cover, text (comma-separated)"
                    value={allowlistLabels}
                    onChange={(e) => setAllowlistLabels(e.target.value)}
                    disabled={isResolving}
                    sx={{ mb: 2 }}
                    helperText="Enter AI classification labels that should be allowed for future book covers, or click the detected labels above"
                  />
                </Box>
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
            onClick={() => {
              console.log('Resolve button clicked!') // Debug
              console.log('Button disabled?', isResolving) // Debug
              console.log('Resolution action:', resolutionAction) // Debug
              handleResolveAppeal()
            }}
            variant="contained"
            disabled={isResolving || !resolutionAction}
            startIcon={isResolving ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {isResolving ? 'Resolving...' : 'Resolve Appeal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {appealToDelete?.status === 'rejected' ? 'Delete Appeal' : 'Archive Appeal'}
        </DialogTitle>

        <DialogContent>
          {appealToDelete && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Are you sure you want to {appealToDelete.status === 'rejected' ? 'delete' : 'archive'} this appeal?
                </Typography>
              </Alert>

              <Typography variant="body2" gutterBottom>
                <strong>Appeal:</strong> #{appealToDelete.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Book:</strong> {appealToDelete.book_title} by {appealToDelete.book_author}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> {appealToDelete.status}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>User:</strong> {appealToDelete.user_first_name} {appealToDelete.user_last_name}
              </Typography>

              <Alert severity="error" sx={{ mt: 2 }}>
                This action cannot be undone.
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAppeal}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            {appealToDelete?.status === 'rejected' ? 'Delete' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}