'use client'

import { Box, Typography, Button } from '@mui/material'
import { LibraryBooks } from '@mui/icons-material'
import { isAdmin } from '@/lib/permissions'

interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
}

interface ShelfTilesProps {
  userRole: string | null
  shelves: Shelf[]
  books: any[] // Using any[] to avoid circular dependency with EnhancedBook
  shelfFilter: string
  onShelfTileClick: (shelfName: string) => void
  onAllShelvesClick: () => void
}

export default function ShelfTiles({
  userRole,
  shelves,
  books,
  shelfFilter,
  onShelfTileClick,
  onAllShelvesClick
}: ShelfTilesProps) {
  // Don't show shelf tiles for admins or if there's only one shelf
  if (isAdmin(userRole) || shelves.length <= 1) {
    return null
  }

  // Calculate books per shelf
  const booksByShelf = shelves.reduce((acc: Record<string, number>, shelf) => {
    acc[shelf.name] = books.filter(book => book.shelf_name === shelf.name).length
    return acc
  }, {})

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        <LibraryBooks sx={{ mr: 1, verticalAlign: 'middle' }} /> My Shelves
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, mt: 1 }}>
        {/* All Shelves tile */}
        <Button
          variant={!shelfFilter ? 'contained' : 'outlined'}
          onClick={onAllShelvesClick}
          sx={{ 
            p: 1,
            textAlign: 'center',
            flexDirection: 'column',
            height: 'auto',
            minHeight: '60px'
          }}
        >
          <Typography variant="h6" component="div">
            {books.length}
          </Typography>
          <Typography variant="caption">
            All Shelves
          </Typography>
        </Button>
        
        {/* Individual shelf tiles */}
        {shelves.map(shelf => (
          <Button
            key={shelf.id}
            variant={shelfFilter === shelf.name ? 'contained' : 'outlined'}
            onClick={() => onShelfTileClick(shelf.name)}
            sx={{ 
              p: 1,
              textAlign: 'center',
              flexDirection: 'column',
              height: 'auto',
              minHeight: '60px'
            }}
          >
            <Typography variant="h6" component="div">
              {booksByShelf[shelf.name] || 0}
            </Typography>
            <Typography variant="caption">
              {shelf.name}
            </Typography>
          </Button>
        ))}
      </Box>
    </Box>
  )
}