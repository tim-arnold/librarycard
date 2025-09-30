import {
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Chip,
} from '@mui/material'
import { LocationOn, Book, Shelves, Schedule, Edit, Delete, Add } from '@mui/icons-material'
import type { Location } from '../shared/types'

interface LocationListProps {
  locations: Location[]
  selectedLocation: Location | null
  onSelectLocation: (location: Location) => void
  onEditLocation: (location: Location) => void
  onDeleteLocation: (id: number, name: string) => void
  onCreateLocation: () => void
  userRole: string | null
  locationPermissions: Record<number, boolean>
  deletingLocationId: number | null
  currentUserEmail: string | null
}

const isAdmin = (role: string | null): boolean => {
  return role === 'super_admin' || role === 'admin'
}

export default function LocationList({
  locations,
  selectedLocation,
  onSelectLocation,
  onEditLocation,
  onDeleteLocation,
  onCreateLocation,
  userRole,
  locationPermissions,
  deletingLocationId,
  currentUserEmail,
}: LocationListProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Your Locations</h3>
        {userRole === 'super_admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateLocation}
            size="small"
          >
            Create Location
          </Button>
        )}
      </div>

      <Paper variant="outlined">
        <List>
          {locations.map((location, index) => (
            <Box
              key={location.id}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                ...(deletingLocationId === location.id && {
                  animation: 'deleteLocation 1.2s ease-in-out forwards',
                  '@keyframes deleteLocation': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                    '30%': {
                      transform: 'scale(1.05)',
                      opacity: 1,
                    },
                    '60%': {
                      transform: 'scale(1.05)',
                      opacity: 1,
                    },
                    '80%': {
                      transform: 'scale(0.1)',
                      opacity: 0.8,
                      transformOrigin: 'center center',
                    },
                    '100%': {
                      transform: 'scale(0)',
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      transformOrigin: 'center center',
                    }
                  },
                })
              }}
            >
              <ListItem
                sx={{
                  cursor: deletingLocationId === location.id ? 'default' : 'pointer',
                  backgroundColor: selectedLocation?.id === location.id ? 'action.selected' : 'transparent',
                  '&:hover': { backgroundColor: deletingLocationId === location.id ? 'transparent' : 'action.hover' },
                  transition: 'background-color 0.2s',
                  pointerEvents: deletingLocationId === location.id ? 'none' : 'auto',
                }}
                onClick={() => deletingLocationId !== location.id && onSelectLocation(location)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <LocationOn />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" component="span">
                        {location.name}
                      </Typography>
                      {Boolean(location.single_shelf_location) && (
                        <Chip
                          label="Single Shelf"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {location.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {location.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Book fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            {(location.book_count ?? 0)} books
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Shelves fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            {(location.shelf_count ?? 0)} shelves
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(location.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {location.owner_name && (
                          <Typography variant="body2" color="text.secondary">
                            Owner: {location.owner_name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />
                {isAdmin(userRole) && (
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {(userRole === 'super_admin' || locationPermissions[location.id]) && (
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditLocation(location)
                          }}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {(userRole === 'super_admin' || location.owner_id === currentUserEmail) && (
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteLocation(location.id, location.name)
                          }}
                          size="small"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < locations.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>
    </div>
  )
}
