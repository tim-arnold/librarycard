'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Slider,
  FormControl,
  FormLabel,
} from '@mui/material'
import { Close, Add, Edit } from '@mui/icons-material'
import type { Series, CreateSeriesRequest, UpdateSeriesRequest } from '@/lib/types'

interface SeriesModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSeriesRequest | UpdateSeriesRequest) => Promise<Series | null>
  existingSeries?: Series | null
  title?: string
  userPermissions?: string[]
}


export default function SeriesModal({
  isOpen,
  onClose,
  onSubmit,
  existingSeries,
  title,
  userPermissions = []
}: SeriesModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const isEditing = Boolean(existingSeries)
  const modalTitle = title || (isEditing ? 'Edit Series' : 'Create New Series')
  
  // Check if user can create series without approval
  const canCreateSeries = userPermissions.includes('can_create_series')
  const needsApproval = !isEditing && !canCreateSeries

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingSeries) {
        setFormData({
          name: existingSeries.name,
          description: existingSeries.description || '',
          sort_order: existingSeries.sort_order
        })
      } else {
        setFormData({
          name: '',
          description: '',
          sort_order: 0
        })
      }
      setError('')
    }
  }, [isOpen, existingSeries])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Series name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sort_order: formData.sort_order
      }

      const result = await onSubmit(submitData)
      if (result) {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save series')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setError('')
      onClose()
    }
  }

  const handleFieldChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditing ? <Edit color="primary" /> : <Add color="primary" />}
          <Typography variant="h6">{modalTitle}</Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isSubmitting}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {needsApproval && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" component="div">
              <strong>Admin Approval Required:</strong> Your series will be created with "pending" status and will need to be approved by a location admin or super admin before it becomes visible to other users.
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label="Series Name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            fullWidth
            required
            disabled={isSubmitting}
            error={!formData.name.trim() && error === 'Series name is required'}
            helperText={!formData.name.trim() && error === 'Series name is required' ? 'Series name is required' : ''}
          />

          <TextField
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={isSubmitting}
            placeholder="Brief description of this series..."
          />


          <Box>
            <FormLabel>Sort Order</FormLabel>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Controls the order in which series appear in lists (lower numbers first)
            </Typography>
            <Slider
              value={formData.sort_order}
              onChange={(_, value) => handleFieldChange('sort_order', value as number)}
              min={0}
              max={100}
              step={1}
              marks
              valueLabelDisplay="auto"
              disabled={isSubmitting}
            />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !formData.name.trim()}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : (isEditing ? <Edit /> : <Add />)}
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Series' : 'Create Series')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}