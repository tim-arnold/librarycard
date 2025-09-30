import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import type { Location } from '../shared/types'

interface InvitationDialogProps {
  open: boolean
  onClose: () => void
  availableLocations: Location[]
  onSendSingle: (email: string, locationId: number | null, customMessage: string) => Promise<boolean>
  onSendBulk: (emails: string, locationId: number | null) => Promise<{email: string, success: boolean, error?: string}[]>
}

export default function InvitationDialog({
  open,
  onClose,
  availableLocations,
  onSendSingle,
  onSendBulk,
}: InvitationDialogProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteCustomMessage, setInviteCustomMessage] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [bulkInviteMode, setBulkInviteMode] = useState(false)
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkInviteResults, setBulkInviteResults] = useState<{email: string, success: boolean, error?: string}[]>([])
  const [bulkInviteLoading, setBulkInviteLoading] = useState(false)

  const handleClose = () => {
    setInviteEmail('')
    setInviteCustomMessage('')
    setBulkEmails('')
    setSelectedLocationId(null)
    setBulkInviteMode(false)
    setBulkInviteResults([])
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkInviteMode) {
      setBulkInviteLoading(true)
      const results = await onSendBulk(bulkEmails, selectedLocationId)
      setBulkInviteResults(results)
      setBulkInviteLoading(false)

      const failCount = results.filter(r => !r.success).length
      if (failCount === 0) {
        handleClose()
      }
    } else {
      const success = await onSendSingle(inviteEmail, selectedLocationId, inviteCustomMessage)
      if (success) {
        handleClose()
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        📧 Send Location Invitation{bulkInviteMode ? 's (Bulk Mode)' : ''}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {bulkInviteMode
                ? 'Send invitations to multiple users at once.'
                : 'Send an invitation to add a new user to a specific location.'
              }
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setBulkInviteMode(!bulkInviteMode)
                setInviteEmail('')
                setBulkEmails('')
                setBulkInviteResults([])
              }}
            >
              {bulkInviteMode ? 'Single Mode' : 'Bulk Mode'}
            </Button>
          </Box>

          {bulkInviteMode ? (
            <TextField
              label="Email Addresses"
              multiline
              rows={6}
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
              placeholder="user1@example.com, user2@example.com&#10;user3@example.com&#10;user4@example.com"
              helperText="Separate multiple emails with commas, semicolons, or new lines"
            />
          ) : (
            <TextField
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
              placeholder="user@example.com"
            />
          )}

          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>Select Location</InputLabel>
            <Select
              value={selectedLocationId || ''}
              onChange={(e) => setSelectedLocationId(Number(e.target.value))}
              label="Select Location"
            >
              {availableLocations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {location.name}
                    </Typography>
                    {location.description && (
                      <Typography variant="body2" color="text.secondary">
                        {location.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!bulkInviteMode && (
            <TextField
              label="Personal Message (Optional)"
              multiline
              rows={3}
              value={inviteCustomMessage}
              onChange={(e) => setInviteCustomMessage(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="Add a personal message to include with the invitation..."
              helperText="This message will be included in the invitation email to make it more personal"
            />
          )}

          {bulkInviteResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Results:
              </Typography>
              <List dense>
                {bulkInviteResults.map((result, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={result.email}
                      secondary={result.success ? <><CheckCircle sx={{ fontSize: 'inherit', verticalAlign: 'middle', mr: 0.5 }} /> Sent successfully</> : <>❌ {result.error}</>}
                      secondaryTypographyProps={{
                        color: result.success ? 'success.main' : 'error.main'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              bulkInviteLoading ||
              !selectedLocationId ||
              (bulkInviteMode ? !bulkEmails.trim() : !inviteEmail.trim())
            }
            startIcon={bulkInviteLoading ? <CircularProgress size={16} /> : undefined}
          >
            {bulkInviteLoading
              ? 'Sending...'
              : bulkInviteMode
                ? 'Send Bulk Invitations'
                : 'Send Invitation'
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
