'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material'
import { Close, Add, Search, LibraryBooks, FilterList } from '@mui/icons-material'
import type { EnhancedBook, Series } from '@/lib/types'

interface AddBooksToSeriesModalProps {
  isOpen: boolean
  onClose: () => void
  onAddBooks: (seriesId: string, bookIds: string[]) => Promise<{ added: number, skipped: number } | null>
  series: Series
  availableBooks: EnhancedBook[]
}

export default function AddBooksToSeriesModal({
  isOpen,
  onClose,
  onAddBooks,
  series,
  availableBooks
}: AddBooksToSeriesModalProps) {
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedBookIds(new Set())
      setSearchTerm('')
      setError('')
      setSuccessMessage('')
    }
  }, [isOpen])

  // Filter books based on search term
  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return availableBooks
    
    const term = searchTerm.toLowerCase()
    return availableBooks.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.authors.some(author => author.toLowerCase().includes(term)) ||
      (book.categories && book.categories.some(cat => cat.toLowerCase().includes(term)))
    )
  }, [availableBooks, searchTerm])

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookId)) {
        newSet.delete(bookId)
      } else {
        newSet.add(bookId)
      }
      return newSet
    })
    if (error) setError('')
  }

  const handleSelectAll = () => {
    if (selectedBookIds.size === filteredBooks.length) {
      setSelectedBookIds(new Set())
    } else {
      setSelectedBookIds(new Set(filteredBooks.map(book => book.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedBookIds.size === 0) {
      setError('Please select at least one book')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await onAddBooks(series.id, Array.from(selectedBookIds))
      if (result) {
        const { added, skipped } = result
        let message = `Successfully added ${added} book${added !== 1 ? 's' : ''} to "${series.name}"`
        if (skipped > 0) {
          message += `. ${skipped} book${skipped !== 1 ? 's were' : ' was'} already in the series.`
        }
        setSuccessMessage(message)
        setSelectedBookIds(new Set())
        
        // Auto-close after success message is shown
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add books to series')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setError('')
      setSuccessMessage('')
      onClose()
    }
  }

  const isAllSelected = filteredBooks.length > 0 && selectedBookIds.size === filteredBooks.length

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add color="primary" />
          <Typography variant="h6">Add Books to Series</Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isSubmitting}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Series: {series.name}
          </Typography>
          {series.description && (
            <Typography variant="body2" color="text.secondary">
              {series.description}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {availableBooks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LibraryBooks sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No books available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All your books are already in this series or you don't have any books yet.
            </Typography>
          </Box>
        ) : (
          <>
            <TextField
              fullWidth
              placeholder="Search books by title, author, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  size="small"
                  startIcon={<FilterList />}
                  onClick={handleSelectAll}
                  disabled={filteredBooks.length === 0}
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedBookIds.size > 0 && (
                  <Chip
                    label={`${selectedBookIds.size} selected`}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} available
              </Typography>
            </Box>

            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredBooks.map((book) => (
                <ListItem
                  key={book.id}
                  onClick={() => handleToggleBook(book.id)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    borderRadius: 1,
                    mb: 0.5
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedBookIds.has(book.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemAvatar>
                    <Avatar
                      src={book.thumbnail}
                      sx={{ width: 40, height: 56 }}
                      variant="rounded"
                    >
                      <LibraryBooks />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={book.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          by {book.authors.join(', ')}
                        </Typography>
                        {book.categories && book.categories.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {book.categories.slice(0, 2).map((category, index) => (
                              <Chip
                                key={index}
                                label={category}
                                size="small"
                                sx={{ mr: 0.5, fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {successMessage ? 'Close' : 'Cancel'}
        </Button>
        {!successMessage && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || selectedBookIds.size === 0 || availableBooks.length === 0}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Add />}
          >
            {isSubmitting ? 'Adding...' : `Add ${selectedBookIds.size} Book${selectedBookIds.size !== 1 ? 's' : ''}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}