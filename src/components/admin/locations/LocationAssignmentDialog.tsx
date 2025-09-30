import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material'
import { LocationOn } from '@mui/icons-material'
import type { AdminUser, Location } from '../shared/types'
import GlobalPermissionsSection from './GlobalPermissionsSection'

interface LocationAssignmentDialogProps {
  open: boolean
  onClose: () => void
  user: AdminUser | null
  assignedLocations: Location[]
  availableLocations: Location[]
  globalPermissions: string[]
  onAssignLocation: (locationId: number) => void
  onUnassignLocation: (locationId: number) => void
  onTogglePermission: (permission: string, currentlyHas: boolean) => void
}

export default function LocationAssignmentDialog({
  open,
  onClose,
  user,
  assignedLocations,
  availableLocations,
  globalPermissions,
  onAssignLocation,
  onUnassignLocation,
  onTogglePermission,
}: LocationAssignmentDialogProps) {
  if (!user) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle><LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} /> Manage Location Access</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Managing location access for <strong>{user.first_name || user.email}</strong>
        </Typography>

        {assignedLocations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Currently Assigned Locations:
            </Typography>
            <List dense>
              {assignedLocations.map((location) => (
                <ListItem
                  key={location.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <ListItemText
                    primary={location.name}
                    secondary={location.description}
                  />
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => onUnassignLocation(location.id)}
                  >
                    Remove
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {assignedLocations.length > 1 && (
          <GlobalPermissionsSection
            permissions={globalPermissions}
            onTogglePermission={onTogglePermission}
          />
        )}

        {availableLocations.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Available Locations to Assign:
            </Typography>
            <List dense>
              {availableLocations.map((location) => (
                <ListItem
                  key={location.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <ListItemText
                    primary={location.name}
                    secondary={location.description}
                  />
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() => onAssignLocation(location.id)}
                  >
                    Assign
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {assignedLocations.length === 0 && availableLocations.length === 0 && (
          <Alert severity="info">
            This user has access to all available locations or no locations are available for assignment.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
