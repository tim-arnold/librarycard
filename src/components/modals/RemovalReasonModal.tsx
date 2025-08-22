'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material'
import { Cancel, Send } from '@mui/icons-material'

interface RemovalReasonModalProps {
  open: boolean
  onClose: (result: { value: string; label: string; details?: string } | null) => void
  bookStatus?: string
  allowCheckoutOverride?: boolean
}

export default function RemovalReasonModal({ open, onClose, bookStatus, allowCheckoutOverride }: RemovalReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')

  // Show "returned" option only for checked out books when user can't override checkout
  const shouldShowReturnedOption = bookStatus === 'checked_out' && !allowCheckoutOverride
  
  const reasonLabels: Record<string, string> = {
    lost: 'Book is lost',
    damaged: 'Book is damaged beyond repair',
    missing: 'Book is missing from its location',
    overdue: 'Book has been checked out for a very long time',
    ...(shouldShowReturnedOption && { returned: 'Book has been physically returned' }),
    other: 'Other reason'
  }

  const handleSubmit = () => {
    if (!selectedReason) {
      setError('Please select a reason for removal.')
      return
    }

    onClose({
      value: selectedReason,
      label: reasonLabels[selectedReason],
      details: details.trim() || undefined
    })

    // Reset form
    setSelectedReason('')
    setDetails('')
    setError('')
  }

  const handleCancel = () => {
    onClose(null)
    // Reset form
    setSelectedReason('')
    setDetails('')
    setError('')
  }

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Notify the Librarian
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
            <RadioGroup
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value)
                setError('')
              }}
            >
              <FormControlLabel 
                value="lost" 
                control={<Radio />} 
                label="Book is lost" 
              />
              <FormControlLabel 
                value="damaged" 
                control={<Radio />} 
                label="Book is damaged beyond repair" 
              />
              <FormControlLabel 
                value="missing" 
                control={<Radio />} 
                label="Book is missing from its location" 
              />
              {bookStatus === 'checked_out' && (
                <FormControlLabel 
                  value="overdue" 
                  control={<Radio />} 
                  label="Book has been checked out for a very long time" 
                />
              )}
              {shouldShowReturnedOption && (
                <FormControlLabel 
                  value="returned" 
                  control={<Radio />} 
                  label="Book has been physically returned" 
                />
              )}
              <FormControlLabel 
                value="other" 
                control={<Radio />} 
                label="Other reason" 
              />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Additional Details (optional)"
            multiline
            rows={3}
            fullWidth
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide any additional information about the reason for removal..."
            variant="outlined"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleCancel} 
          startIcon={<Cancel />}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="warning"
          startIcon={<Send />}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}