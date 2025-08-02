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
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import { LocationOn, LibraryBooks } from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { authenticatedApiCall } from '@/lib/api'

interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
}

interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
}

interface BookRelocateModalProps {
  book: EnhancedBook | null
  isOpen: boolean
  onClose: () => void
  shelves: Shelf[]
  allLocations: Location[]
  userPermissions: string[]
  onRelocateSuccess: (shelfId: number, shelfName: string) => void
  onCreateShelfSuccess: (newShelf: Shelf) => void
}

export default function BookRelocateModal({
  book,
  isOpen,
  onClose,
  shelves,
  allLocations,
  userPermissions,
  onRelocateSuccess,
  onCreateShelfSuccess
}: BookRelocateModalProps) {
  const { data: session } = useSession()
  const [showCreateShelfOption, setShowCreateShelfOption] = useState(false)
  const [newShelfName, setNewShelfName] = useState('')
  const [isCreatingShelf, setIsCreatingShelf] = useState(false)

  if (!book) return null

  const handleCreateShelfAndMove = async () => {
    if (!newShelfName.trim() || !session?.user?.email) return

    setIsCreatingShelf(true)

    try {
      // Determine the location ID for the new shelf
      let locationId = allLocations.length > 0 ? allLocations[0].id : null

      if (!locationId) {
        throw new Error('No location available for shelf creation')
      }

      // Create the new shelf
      const response = await authenticatedApiCall(`/api/locations/${locationId}/shelves`, {
        method: 'POST',
        body: JSON.stringify({ name: newShelfName.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to create shelf')
      }

      const newShelf = await response.json()
      
      // Notify parent of new shelf creation
      onCreateShelfSuccess(newShelf)

      // Trigger relocation
      onRelocateSuccess(newShelf.id, newShelf.name)
      
      // Reset modal state
      setShowCreateShelfOption(false)
      setNewShelfName('')
      onClose()
    } catch (error) {
      console.error('Error creating shelf and moving book:', error)
      throw error // Let parent handle error display
    } finally {
      setIsCreatingShelf(false)
    }
  }

  const handleRelocateBook = async (newShelfId: number) => {
    const shelfName = shelves.find(s => s.id === newShelfId)?.name || ''
    onRelocateSuccess(newShelfId, shelfName)
    onClose()
  }

  const handleClose = () => {
    setShowCreateShelfOption(false)
    setNewShelfName('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        📦 Relocate &quot;{book.title}&quot;
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Current shelf: <strong>{book.shelf_name || 'No shelf assigned'}</strong>
          </Typography>
          
          <RadioGroup
            value={showCreateShelfOption ? 'create' : 'existing'}
            onChange={(e) => setShowCreateShelfOption(e.target.value === 'create')}
            sx={{ mb: 2 }}
          >
            <FormControlLabel 
              value="existing" 
              control={<Radio />} 
              label="Move to existing shelf" 
            />
            {userPermissions.includes('can_create_shelves') && (
              <FormControlLabel 
                value="create" 
                control={<Radio />} 
                label="Create new shelf and move book there" 
              />
            )}
          </RadioGroup>

          {showCreateShelfOption ? (
            <Box>
              <TextField
                fullWidth
                label="New Shelf Name"
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="Enter name for new shelf..."
                sx={{ mb: 2 }}
                disabled={isCreatingShelf}
              />
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select Shelf</InputLabel>
              <Select
                value=""
                label="Select Shelf"
                onChange={(e) => {
                  const newShelfId = parseInt(String(e.target.value))
                  handleRelocateBook(newShelfId)
                }}
              >
                {(() => {
                  const availableShelves = shelves.filter(shelf => shelf.id !== book.shelf_id)
                  
                  if (allLocations.length === 1) {
                    // Single location - simple list without grouping
                    return availableShelves.map(shelf => (
                      <MenuItem key={shelf.id} value={shelf.id}>
                        {shelf.name}
                      </MenuItem>
                    ))
                  } else {
                    // Multiple locations - group by location
                    return allLocations.map(location => {
                      const locationShelves = availableShelves.filter(shelf => shelf.location_id === location.id)
                      
                      // Skip locations with no available shelves
                      if (locationShelves.length === 0) {
                        return null
                      }

                      return [
                        <MenuItem 
                          key={`${location.id}-header`} 
                          disabled 
                          sx={{ 
                            fontWeight: 'bold',
                            backgroundColor: 'action.hover',
                            '&.Mui-disabled': {
                              opacity: 1,
                              color: 'text.primary'
                            }
                          }}
                        >
                          <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} /> {location.name}
                        </MenuItem>,
                        ...locationShelves.map(shelf => (
                          <MenuItem 
                            key={shelf.id} 
                            value={shelf.id} 
                            sx={{ pl: 3 }}
                          >
                            <LibraryBooks sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'inherit' }} /> {shelf.name}
                          </MenuItem>
                        ))
                      ]
                    }).filter(Boolean).flat()
                  }
                })()}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          disabled={isCreatingShelf}
        >
          Cancel
        </Button>
        {showCreateShelfOption && (
          <Button 
            onClick={handleCreateShelfAndMove}
            variant="contained"
            disabled={!newShelfName.trim() || isCreatingShelf}
            startIcon={isCreatingShelf ? <CircularProgress size={16} /> : undefined}
          >
            {isCreatingShelf ? 'Creating...' : 'Create Shelf & Move Book'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}