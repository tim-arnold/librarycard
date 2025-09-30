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
} from '@mui/material'
import { Shelves, Book, Edit, Delete } from '@mui/icons-material'
import type { Shelf } from '../shared/types'

interface ShelfListProps {
  shelves: Shelf[]
  locationName: string
  onEditShelf: (shelf: Shelf) => void
  onDeleteShelf: (id: number, name: string) => void
  onAddShelf: () => void
  isAdmin: boolean
}

export default function ShelfList({
  shelves,
  locationName,
  onEditShelf,
  onDeleteShelf,
  onAddShelf,
  isAdmin,
}: ShelfListProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Shelves in {locationName}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Shelves />}
              onClick={onAddShelf}
              size="small"
            >
              Add Shelf
            </Button>
          )}
        </div>
      </div>
      <Paper variant="outlined">
        <List>
          {shelves.map((shelf, index) => (
            <Box key={shelf.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Shelves />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={shelf.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Book fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {(shelf.book_count ?? 0)} books
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Created {new Date(shelf.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                {isAdmin && (
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        edge="end"
                        onClick={() => onEditShelf(shelf)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => onDeleteShelf(shelf.id, shelf.name)}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < shelves.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>
    </div>
  )
}
