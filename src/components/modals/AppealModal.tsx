'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material'
import { ReportProblem, Send, Close } from '@mui/icons-material'
import { getApiBaseUrl } from '@/lib/apiConfig'

interface AppealModalProps {
  open: boolean
  onClose: () => void
  bookTitle: string
  bookAuthor: string
  rejectedImageDataUrl: string
  rejectionReason: string
  aiClassificationResults?: any
  onAppealSubmitted?: () => void
}

export default function AppealModal({
  open,
  onClose,
  bookTitle,
  bookAuthor,
  rejectedImageDataUrl,
  rejectionReason,
  aiClassificationResults,
  onAppealSubmitted
}: AppealModalProps) {
  const [appealReason, setAppealReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const { data: session } = useSession()

  const handleSubmit = async () => {
    if (!session?.user?.email) {
      setSubmitError('You must be logged in to submit an appeal')
      return
    }

    if (!appealReason.trim()) {
      setSubmitError('Please explain why you believe this is a legitimate book cover')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/appeals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          book_title: bookTitle,
          book_author: bookAuthor,
          image_data_url: rejectedImageDataUrl,
          appeal_reason: appealReason.trim(),
          rejection_reason: rejectionReason,
          ai_classification_results: aiClassificationResults
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit appeal')
      }

      // Clear form
      setAppealReason('')

      // Notify parent component immediately and close
      if (onAppealSubmitted) {
        onAppealSubmitted()
      }

      // Close modal immediately - confirmation will show in camera tab
      handleClose()

    } catch (error) {
      console.error('Error submitting appeal:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit appeal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return // Prevent closing while submitting

    setAppealReason('')
    setSubmitError('')
    setSubmitSuccess(false)
    onClose()
  }

  const getDetectedLabels = () => {
    if (!aiClassificationResults || !Array.isArray(aiClassificationResults)) {
      return []
    }

    return aiClassificationResults
      .slice(0, 5) // Show top 5 detected labels
      .map(prediction => ({
        label: prediction.label || 'Unknown',
        confidence: Math.round((prediction.score || 0) * 100)
      }))
  }

  if (submitSuccess) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="success" sx={{ mb: 3, p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              ✅ Appeal Submitted Successfully!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Your appeal for "<strong>{bookTitle}</strong>" has been submitted and will be reviewed by an admin.
            </Typography>
            <Typography variant="body2">
              We'll work to improve our AI verification system based on your feedback.
              You'll be able to see the status of your appeal in the admin notifications.
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary">
            This dialog will close automatically in 5 seconds...
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReportProblem color="warning" />
        Report AI Verification Issue
      </DialogTitle>

      <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Help us improve our AI verification system by reporting when legitimate book covers are incorrectly rejected.
        </Typography>

        {/* Book Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Book Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Title:</strong> {bookTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Author:</strong> {bookAuthor}
          </Typography>
        </Box>

        {/* Rejected Image Preview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Rejected Image
          </Typography>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2
          }}>
            <img
              src={rejectedImageDataUrl}
              alt="Rejected book cover"
              style={{
                maxWidth: '200px',
                maxHeight: '300px',
                objectFit: 'contain',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </Box>
        </Box>

        {/* AI Classification Results */}
        {aiClassificationResults && getDetectedLabels().length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Detection Results
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Our AI detected these elements in your image:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {getDetectedLabels().map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.label} (${item.confidence}%)`}
                  size="small"
                  variant="outlined"
                  color={item.confidence > 50 ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Rejection Reason */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Rejection Reason
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {rejectionReason}
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Appeal Form */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Your Appeal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please explain why you believe this is a legitimate book cover. Your feedback helps us improve our AI system.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="For example: 'This is the actual cover of the book. The AI may have misidentified the book cover as something else, but this is a clear photo of the front cover showing the title and author.'"
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            error={!!submitError}
            helperText={submitError}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" color="text.secondary">
            Your appeal will be reviewed by our admin team. We use this feedback to continuously improve our AI verification system.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !appealReason.trim()}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Send />}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}