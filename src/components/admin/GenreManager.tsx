'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  ContactMail as ContactIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { authenticatedApiCall } from '@/lib/api'

interface CuratedGenre {
  id: number
  name: string
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export default function GenreManager() {
  const { data: session } = useSession()
  
  // User role state (fetched from API like other admin components)
  const [userRole, setUserRole] = useState<string | null>(null)
  const isSuperAdmin = userRole === 'super_admin'
  
  // Global genres state
  const [globalGenres, setGlobalGenres] = useState<CuratedGenre[]>([])
  const [loadingGlobalGenres, setLoadingGlobalGenres] = useState(false)
  
  // Dialog states
  const [createGenreOpen, setCreateGenreOpen] = useState(false)
  const [editGenreOpen, setEditGenreOpen] = useState(false)
  const [requestGenreOpen, setRequestGenreOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<CuratedGenre | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ affectedBooks: number, examples: any[] } | null>(null)
  
  // Form states
  const [genreName, setGenreName] = useState('')
  const [genreDescription, setGenreDescription] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [requestDescription, setRequestDescription] = useState('')
  
  // Error and success states
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch user role from API (like other admin components do)
  const fetchUserRole = async () => {
    try {
      const response = await authenticatedApiCall('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user_role || 'user')
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error)
      setUserRole('user')
    }
  }

  // Load global genres
  const loadGlobalGenres = async () => {
    setLoadingGlobalGenres(true)
    try {
      // Super admins can see all genres (including inactive), location admins see only active genres
      const endpoint = isSuperAdmin ? '/api/admin/genres' : '/api/genres'
      const response = await authenticatedApiCall(endpoint)
      if (response.ok) {
        const genres = await response.json()
        setGlobalGenres(genres)
      } else {
        setError('Failed to load genres')
      }
    } catch (error) {
      setError('Failed to load genres')
    } finally {
      setLoadingGlobalGenres(false)
    }
  }

  // Create new genre (super admin only)
  const handleCreateGenre = async () => {
    if (!genreName.trim()) return

    try {
      const response = await authenticatedApiCall('/api/admin/genres', {
        method: 'POST',
        body: JSON.stringify({
          name: genreName.trim(),
          description: genreDescription.trim() || undefined
        })
      })

      if (response.ok) {
        setSuccess('Genre created successfully')
        setCreateGenreOpen(false)
        setGenreName('')
        setGenreDescription('')
        loadGlobalGenres()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create genre')
      }
    } catch (error) {
      setError('Failed to create genre')
    }
  }

  // Edit existing genre (super admin only)
  const handleEditGenre = async () => {
    if (!selectedGenre || !genreName.trim()) return

    try {
      const response = await authenticatedApiCall(`/api/admin/genres/${selectedGenre.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: genreName.trim(),
          description: genreDescription.trim() || undefined
        })
      })

      if (response.ok) {
        setSuccess('Genre updated successfully')
        setEditGenreOpen(false)
        setSelectedGenre(null)
        setGenreName('')
        setGenreDescription('')
        loadGlobalGenres()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update genre')
      }
    } catch (error) {
      setError('Failed to update genre')
    }
  }

  // Request new genre (any admin)
  const handleRequestGenre = async () => {
    if (!genreName.trim() || !requestReason.trim()) return

    try {
      const response = await authenticatedApiCall('/api/admin/genre-request', {
        method: 'POST',
        body: JSON.stringify({
          genreName: genreName.trim(),
          description: requestDescription.trim() || undefined,
          reason: requestReason.trim(),
          requesterName: session?.user?.name || session?.user?.email,
          requesterEmail: session?.user?.email
        })
      })

      if (response.ok) {
        setSuccess('Genre request sent successfully! A super admin will review your request.')
        setRequestGenreOpen(false)
        setGenreName('')
        setRequestReason('')
        setRequestDescription('')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to send genre request')
      }
    } catch (error) {
      setError('Failed to send genre request')
    }
  }

  // Handle delete genre - first get the info
  const handleDeleteGenre = async (genre: CuratedGenre) => {
    setSelectedGenre(genre)
    
    try {
      const response = await authenticatedApiCall(`/api/admin/genres/${genre.id}/delete-info`)
      if (response.ok) {
        const info = await response.json()
        setDeleteInfo(info)
        setDeleteConfirmOpen(true)
      } else {
        setError('Failed to get genre deletion information')
      }
    } catch (error) {
      setError('Failed to get genre deletion information')
    }
  }

  // Confirm delete genre
  const handleConfirmDelete = async () => {
    if (!selectedGenre) return

    try {
      const response = await authenticatedApiCall(`/api/admin/genres/${selectedGenre.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(`Genre deleted successfully. ${result.affectedBooks} books were untagged from this genre.`)
        setDeleteConfirmOpen(false)
        setSelectedGenre(null)
        setDeleteInfo(null)
        loadGlobalGenres()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to delete genre')
      }
    } catch (error) {
      setError('Failed to delete genre')
    }
  }

  useEffect(() => {
    fetchUserRole()
    loadGlobalGenres()
  }, [])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Genre Management
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This is the curated genre list for LibraryCard. These genres can be assigned to books and used for filtering your library. 
        Books may also display additional genres from their original sources (Google Books, Open Library) which appear alongside these curated genres.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {isSuperAdmin ? 'Global Genre List' : 'Available Genres'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isSuperAdmin ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateGenreOpen(true)}
                >
                  Add Genre
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<ContactIcon />}
                  onClick={() => setRequestGenreOpen(true)}
                >
                  Request New Genre
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isSuperAdmin 
              ? 'Manage the global genre list. These genres are available to all locations.'
              : 'View available genres and request new ones. All genre requests are sent to super administrators for review.'
            }
          </Typography>

          {loadingGlobalGenres ? (
            <Typography>Loading genres...</Typography>
          ) : (
            <List>
              {globalGenres.map((genre) => (
                <React.Fragment key={genre.id}>
                  <ListItem>
                    <ListItemText
                      primary={genre.name}
                      secondary={genre.description || 'No description'}
                    />
                    {isSuperAdmin && (
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => {
                            setSelectedGenre(genre)
                            setGenreName(genre.name)
                            setGenreDescription(genre.description || '')
                            setEditGenreOpen(true)
                          }}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteGenre(genre)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Create Genre Dialog - Super admin only */}
      {isSuperAdmin && (
        <Dialog open={createGenreOpen} onClose={() => setCreateGenreOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Genre</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Genre Name"
              fullWidth
              variant="outlined"
              value={genreName}
              onChange={(e) => setGenreName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={genreDescription}
              onChange={(e) => setGenreDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateGenreOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGenre} variant="contained" disabled={!genreName.trim()}>
              Create Genre
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Genre Dialog - Super admin only */}
      {isSuperAdmin && (
        <Dialog open={editGenreOpen} onClose={() => setEditGenreOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Genre</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Genre Name"
              fullWidth
              variant="outlined"
              value={genreName}
              onChange={(e) => setGenreName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={genreDescription}
              onChange={(e) => setGenreDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setEditGenreOpen(false)
              setSelectedGenre(null)
              setGenreName('')
              setGenreDescription('')
            }}>Cancel</Button>
            <Button onClick={handleEditGenre} variant="contained" disabled={!genreName.trim()}>
              Update Genre
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Request Genre Dialog - All admins */}
      <Dialog open={requestGenreOpen} onClose={() => setRequestGenreOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request New Genre</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            New genre requests are sent to super administrators for review. Please provide a clear name and justification.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Requested Genre Name"
            fullWidth
            variant="outlined"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Genre Description (Optional)"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={requestDescription}
            onChange={(e) => setRequestDescription(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Describe what types of books should be categorized under this genre..."
          />
          <TextField
            margin="dense"
            label="Why is this genre needed?"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
            required
            placeholder="Please explain why this genre would be useful for your library..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRequestGenreOpen(false)
            setGenreName('')
            setRequestReason('')
            setRequestDescription('')
          }}>Cancel</Button>
          <Button 
            onClick={handleRequestGenre} 
            variant="contained" 
            disabled={!genreName.trim() || !requestReason.trim()}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>
          Delete Genre: {selectedGenre?.name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Warning:</strong> This action cannot be undone!
          </Alert>
          
          {deleteInfo && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                This genre is currently applied to <strong>{deleteInfo.affectedBooks}</strong> book{deleteInfo.affectedBooks !== 1 ? 's' : ''}.
              </Typography>
              
              {deleteInfo.affectedBooks > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Deleting this genre will:
                  </Typography>
                  <Typography component="ul" variant="body2" sx={{ mb: 2, pl: 2 }}>
                    <li>Remove the genre assignment from all {deleteInfo.affectedBooks} book{deleteInfo.affectedBooks !== 1 ? 's' : ''}</li>
                    <li>Those books may have no genres left if this was their only genre</li>
                    <li>This change will be permanent and immediate</li>
                  </Typography>
                  
                  {deleteInfo.examples.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Example affected books:
                      </Typography>
                      {deleteInfo.examples.map((book: any, index: number) => (
                        <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                          • {book.title}{book.authors ? ` by ${Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}` : ''}
                        </Typography>
                      ))}
                      {deleteInfo.affectedBooks > 5 && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 1 }}>
                          ...and {deleteInfo.affectedBooks - 5} more books
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
              
              {deleteInfo.affectedBooks === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This genre is not currently applied to any books, so deletion will have no impact on the library.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteConfirmOpen(false)
            setSelectedGenre(null)
            setDeleteInfo(null)
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            {deleteInfo?.affectedBooks === 0 ? 'Delete Genre' : `Delete & Untag ${deleteInfo?.affectedBooks} Books`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}