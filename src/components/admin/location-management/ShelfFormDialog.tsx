import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material'
import { Cancel, Save } from '@mui/icons-material'
import type { Shelf } from '../shared/types'

interface ShelfFormDialogProps {
  open: boolean
  onClose: () => void
  editingShelf: Shelf | null
  locationId: number | null
  onCreate: (locationId: number, name: string) => Promise<void>
  onUpdate: (locationId: number, shelfId: number, name: string) => Promise<void>
}

export default function ShelfFormDialog({
  open,
  onClose,
  editingShelf,
  locationId,
  onCreate,
  onUpdate,
}: ShelfFormDialogProps) {
  const [shelfName, setShelfName] = useState('')

  useEffect(() => {
    if (editingShelf) {
      setShelfName(editingShelf.name)
    } else {
      setShelfName('')
    }
  }, [editingShelf])

  const handleClose = () => {
    setShelfName('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shelfName.trim() || !locationId) return

    try {
      if (editingShelf) {
        await onUpdate(locationId, editingShelf.id, shelfName)
      } else {
        await onCreate(locationId, shelfName)
      }
      handleClose()
    } catch (error) {
      console.error('Error submitting shelf form:', error)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingShelf ? 'Edit Shelf' : 'Add New Shelf'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            label="Shelf Name"
            type="text"
            fullWidth
            required
            value={shelfName}
            onChange={(e) => setShelfName(e.target.value)}
            placeholder="e.g., Fiction, Cookbooks, Reference"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" startIcon={<Save />}>
            {editingShelf ? 'Update Shelf' : 'Add Shelf'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
