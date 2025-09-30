import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material'
import { Email as EmailIcon } from '@mui/icons-material'
import type { AdminUser } from '../shared/types'
import { useModal } from '@/hooks/useModal'

interface EmailDialogProps {
  open: boolean
  onClose: () => void
  recipient: AdminUser | null
}

export default function EmailDialog({ open, onClose, recipient }: EmailDialogProps) {
  const { alert } = useModal()
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  const handleClose = () => {
    setEmailSubject('')
    setEmailMessage('')
    onClose()
  }

  const sendEmail = async () => {
    if (!recipient || !emailSubject.trim() || !emailMessage.trim()) {
      await alert({
        title: 'Missing Information',
        message: 'Please fill in both subject and message fields.',
        variant: 'warning'
      })
      return
    }

    try {
      await alert({
        title: 'Email Composed',
        message: `Email would be sent to: ${recipient.email}\nSubject: ${emailSubject}\n\nMessage: ${emailMessage}`,
        variant: 'info'
      })

      handleClose()
    } catch (error) {
      console.error('Error sending email:', error)
      await alert({
        title: 'Email Failed',
        message: 'Failed to send email. Please try again.',
        variant: 'error'
      })
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>📧 Send Email</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sending email to: <strong>{recipient?.email}</strong>
        </Typography>

        <TextField
          autoFocus
          label="Subject"
          fullWidth
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          placeholder="Enter email subject"
          sx={{ mb: 2 }}
        />

        <TextField
          label="Message"
          fullWidth
          multiline
          rows={6}
          value={emailMessage}
          onChange={(e) => setEmailMessage(e.target.value)}
          placeholder="Enter your message"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={sendEmail}
          color="primary"
          variant="contained"
          disabled={!emailSubject.trim() || !emailMessage.trim()}
          startIcon={<EmailIcon />}
        >
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  )
}
