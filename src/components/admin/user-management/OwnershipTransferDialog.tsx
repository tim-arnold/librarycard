import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material'
import { authenticatedApiCall } from '@/lib/api'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { useModal } from '@/hooks/useModal'

interface OwnershipTransferDialogProps {
  open: boolean
  onClose: () => void
  userToDelete: string
  ownedLocations: any[]
  onSuccess: () => void
}

export default function OwnershipTransferDialog({
  open,
  onClose,
  userToDelete,
  ownedLocations,
  onSuccess,
}: OwnershipTransferDialogProps) {
  const { data: session } = useSession()
  const { confirmAsync, alert } = useModal()
  const [selectedOwners, setSelectedOwners] = useState<Record<string, string>>({})
  const [locationsToDelete, setLocationsToDelete] = useState<Record<string, boolean>>({})
  const [availableAdmins, setAvailableAdmins] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      loadAvailableAdmins()
      setSelectedOwners({})
      setLocationsToDelete({})
    }
  }, [open])

  const loadAvailableAdmins = async () => {
    const adminsResponse = await fetch(`${getApiBaseUrl()}/api/admin/available-admins`, {
      headers: {
        'Authorization': `Bearer ${session?.user?.email}`,
        'Content-Type': 'application/json',
      },
    })

    if (adminsResponse.ok) {
      const admins = await adminsResponse.json()
      setAvailableAdmins(admins)
    }
  }

  const completeOwnershipTransfer = async () => {
    const unassignedLocations = ownedLocations.filter(loc => !selectedOwners[loc.id] && !locationsToDelete[loc.id])
    if (unassignedLocations.length > 0) {
      await alert({
        title: 'Missing Assignments',
        message: `Please assign new owners or mark for deletion for all locations: ${unassignedLocations.map(loc => loc.name).join(', ')}`,
        variant: 'warning'
      })
      return
    }

    const locationsToTransfer = ownedLocations.filter(loc => selectedOwners[loc.id])
    const locationsToDeleteList = ownedLocations.filter(loc => locationsToDelete[loc.id])

    const confirmed = await confirmAsync(
      {
        title: 'Transfer Ownership & Delete User',
        message: `This will:\n\n${locationsToTransfer.length > 0 ? `• Transfer ownership of ${locationsToTransfer.length} location(s) to selected admins\n` : ''}${locationsToDeleteList.length > 0 ? `• Delete ${locationsToDeleteList.length} location(s) and all their books\n` : ''}• Delete the user "${userToDelete}"\n\nBooks added by this user will remain in transferred locations but no longer show the original author. This action cannot be undone!`,
        confirmText: 'Transfer & Delete User',
        variant: 'error'
      },
      async () => {
        const response = await authenticatedApiCall('/api/admin/cleanup-user', {
          method: 'POST',
          body: JSON.stringify({
            email_to_delete: userToDelete,
            new_location_owners: selectedOwners,
            locations_to_delete: Object.keys(locationsToDelete).filter(id => locationsToDelete[id]).map(id => parseInt(id))
          })
        })

        if (response.ok) {
          const result = await response.json()
          await alert({
            title: 'User Cleaned Up',
            message: result.message,
            variant: 'success'
          })
          onSuccess()
          onClose()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to complete ownership transfer')
        }
      }
    )

    if (!confirmed) {
      await alert({
        title: 'Transfer Failed',
        message: 'Ownership transfer was cancelled.',
        variant: 'error'
      })
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>🏢 Transfer Location Ownership</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          The user &quot;{userToDelete}&quot; owns {ownedLocations.length} location(s). For each location, you can either assign a new admin owner or delete the location entirely.
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          For transferred locations: Books and shelves will be preserved. Books added by this user will remain but no longer show the original author.
        </Alert>

        <Alert severity="warning" sx={{ mb: 3 }}>
          For deleted locations: All books, shelves, and location data will be permanently deleted and cannot be recovered.
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Location Management:
        </Typography>

        <List>
          {ownedLocations.map((location) => (
            <ListItem key={location.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ListItemText
                  primary={location.name}
                  secondary={`Location ID: ${location.id}`}
                  sx={{ flex: 1 }}
                />
                <Checkbox
                  checked={locationsToDelete[location.id] || false}
                  onChange={(e) => {
                    const isDelete = e.target.checked
                    setLocationsToDelete(prev => ({
                      ...prev,
                      [location.id]: isDelete
                    }))
                    if (isDelete) {
                      setSelectedOwners(prev => {
                        const newState = { ...prev }
                        delete newState[location.id]
                        return newState
                      })
                    }
                  }}
                  color="error"
                />
                <Typography variant="body2" color="error.main" sx={{ minWidth: 100 }}>
                  Delete Location
                </Typography>
              </Box>

              {!locationsToDelete[location.id] && (
                <Box sx={{ ml: 2 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>New Owner</InputLabel>
                    <Select
                      value={selectedOwners[location.id] || ''}
                      onChange={(e) => setSelectedOwners(prev => ({
                        ...prev,
                        [location.id]: e.target.value
                      }))}
                      label="New Owner"
                      size="small"
                    >
                      {availableAdmins.map((admin) => (
                        <MenuItem key={admin.id} value={admin.id}>
                          {admin.first_name && admin.last_name
                            ? `${admin.first_name} ${admin.last_name} (${admin.email})`
                            : admin.email
                          }
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={completeOwnershipTransfer}
          color="error"
          variant="contained"
          disabled={ownedLocations.some(loc => !selectedOwners[loc.id] && !locationsToDelete[loc.id])}
        >
          Complete User Deletion
        </Button>
      </DialogActions>
    </Dialog>
  )
}
