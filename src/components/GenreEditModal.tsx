'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material'
import { Close, Edit } from '@mui/icons-material'
import type { EnhancedBook, CuratedGenre } from '@/lib/types'
import GenreSelector from './GenreSelector'

interface GenreEditModalProps {
  book: EnhancedBook
  isOpen: boolean
  onClose: () => void
  onGenreUpdate: (bookId: string, genres: CuratedGenre[]) => Promise<void>
}

export default function GenreEditModal({
  book,
  isOpen,
  onClose,
  onGenreUpdate
}: GenreEditModalProps) {
  const [selectedGenres, setSelectedGenres] = useState<CuratedGenre[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // Initialize selected genres when modal opens
  useEffect(() => {
    if (isOpen && book.assignedGenres) {
      setSelectedGenres(book.assignedGenres)
    }
  }, [isOpen, book.assignedGenres])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      await onGenreUpdate(book.id, selectedGenres)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update genres')
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

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit color="primary" />
          <Typography variant="h6">
            Edit Genres
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isSubmitting}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Book: {book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            by {book.authors.join(', ')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <GenreSelector
          book={book}
          selectedGenres={selectedGenres}
          onGenresChange={setSelectedGenres}
          onError={setError}
        />
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Edit />}
        >
          {isSubmitting ? 'Updating...' : 'Update Genres'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}