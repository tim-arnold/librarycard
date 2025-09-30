import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from '@mui/material'
import { Cancel, Save } from '@mui/icons-material'
import type { Location, Shelf } from '../shared/types'

interface LocationFormDialogProps {
  open: boolean
  onClose: () => void
  editingLocation: Location | null
  existingShelves: Shelf[]
  onCreate: (formData: LocationFormData) => Promise<void>
  onUpdate: (locationId: number, formData: LocationFormData) => Promise<void>
}

export interface LocationFormData {
  name: string
  description: string
  single_shelf_location: boolean
  activity_visibility: 'private' | 'public'
}

export default function LocationFormDialog({
  open,
  onClose,
  editingLocation,
  existingShelves,
  onCreate,
  onUpdate,
}: LocationFormDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [singleShelfLocation, setSingleShelfLocation] = useState(false)
  const [activityVisibility, setActivityVisibility] = useState<'private' | 'public'>('private')

  useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name)
      setDescription(editingLocation.description || '')
      setSingleShelfLocation(editingLocation.single_shelf_location || false)
      setActivityVisibility(editingLocation.activity_visibility || 'private')
    } else {
      setName('')
      setDescription('')
      setSingleShelfLocation(false)
      setActivityVisibility('private')
    }
  }, [editingLocation, open])

  const handleClose = () => {
    setName('')
    setDescription('')
    setSingleShelfLocation(false)
    setActivityVisibility('private')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const formData: LocationFormData = {
      name,
      description,
      single_shelf_location: singleShelfLocation,
      activity_visibility: activityVisibility,
    }

    try {
      if (editingLocation) {
        await onUpdate(editingLocation.id, formData)
      } else {
        await onCreate(formData)
      }
      handleClose()
    } catch (error) {
      console.error('Error submitting location form:', error)
    }
  }

  const isSingleShelfDisabled = !!editingLocation && existingShelves.length > 1

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingLocation ? 'Edit Location' : 'Create New Location'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label="Location Name"
              type="text"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Finsbury Road, Main Office"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this location"
              helperText="Optional"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={singleShelfLocation}
                  onChange={(e) => setSingleShelfLocation(e.target.checked)}
                  disabled={isSingleShelfDisabled}
                />
              }
              label="Single shelf location"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, mb: 1, display: 'block' }}>
              {isSingleShelfDisabled
                ? "Cannot enable single shelf mode when multiple shelves exist. Delete shelves to enable this option."
                : "When enabled, this location will operate with only one shelf. Users cannot create additional shelves or move books between shelves."
              }
            </Typography>

            <Divider sx={{ my: 2 }} />

            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                Privacy Settings
              </FormLabel>
              <RadioGroup
                value={activityVisibility}
                onChange={(e) => setActivityVisibility(e.target.value as 'private' | 'public')}
              >
                <FormControlLabel
                  value="private"
                  control={<Radio />}
                  label="Private Activity (Anonymous)"
                  sx={{ mb: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2, display: 'block' }}>
                  All user activity (book additions, reviews, checkouts) will be anonymous to other members. Only "Library Member" will be shown.
                </Typography>

                <FormControlLabel
                  value="public"
                  control={<Radio />}
                  label="Public Activity with Privacy Controls"
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 1, display: 'block' }}>
                  Users can choose how their names appear and can set individual activities as anonymous. Members will see each other's activity based on their privacy preferences.
                </Typography>
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" startIcon={<Save />}>
            {editingLocation ? 'Update Location' : 'Create Location'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
