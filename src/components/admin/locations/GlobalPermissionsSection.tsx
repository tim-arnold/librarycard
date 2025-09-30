import { Box, Typography, Switch } from '@mui/material'

interface GlobalPermissionsSectionProps {
  permissions: string[]
  onTogglePermission: (permission: string, currentlyHas: boolean) => void
}

export default function GlobalPermissionsSection({
  permissions,
  onTogglePermission,
}: GlobalPermissionsSectionProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Cross-Location Permissions:
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        These permissions apply across all locations this user has access to.
      </Typography>
      <Box sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}>
          <Box>
            <Typography variant="body1" fontWeight="medium">
              Move Books Between Locations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Allows this user to move books from shelves in one location to shelves in another location they have access to.
            </Typography>
          </Box>
          <Switch
            checked={permissions.includes('can_move_books_between_locations')}
            onChange={() => onTogglePermission(
              'can_move_books_between_locations',
              permissions.includes('can_move_books_between_locations')
            )}
            color="primary"
          />
        </Box>
      </Box>
    </Box>
  )
}
