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
import { Close, Add, Edit, Palette } from '@mui/icons-material'
import type { Series, CreateSeriesRequest, UpdateSeriesRequest } from '@/lib/types'

interface SeriesModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSeriesRequest | UpdateSeriesRequest) => Promise<Series | null>
  existingSeries?: Series | null
  title?: string
}

const COLOR_OPTIONS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
]

export default function SeriesModal({
  isOpen,
  onClose,
  onSubmit,
  existingSeries,
  title
}: SeriesModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2196f3',
    sort_order: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const isEditing = Boolean(existingSeries)
  const modalTitle = title || (isEditing ? 'Edit Series' : 'Create New Series')

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingSeries) {
        setFormData({
          name: existingSeries.name,
          description: existingSeries.description || '',
          color: existingSeries.color || '#2196f3',
          sort_order: existingSeries.sort_order
        })
      } else {
        setFormData({
          name: '',
          description: '',
          color: '#2196f3',
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
        color: formData.color || undefined,
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
            <FormControl fullWidth>
              <FormLabel sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Palette fontSize="small" />
                Series Color
              </FormLabel>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(8, 1fr)', 
                gap: 1,
                maxWidth: 400
              }}>
                {COLOR_OPTIONS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => handleFieldChange('color', color)}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: color,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid #000' : '1px solid #ddd',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: 2
                      }
                    }}
                  />
                ))}
              </Box>
            </FormControl>
          </Box>

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