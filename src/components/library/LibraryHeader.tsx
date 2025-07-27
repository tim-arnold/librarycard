'use client'

import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress 
} from '@mui/material'
import { Refresh, LibraryBooks, MenuBook } from '@mui/icons-material'
import { isAdmin } from '@/lib/permissions'

interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
}

interface LibraryHeaderProps {
  userRole: string | null
  currentLocation: Location | null
  locationFilter: string
  filteredBooksCount: number
  totalBooksCount: number
  shelfFilter: string
  shelvesCount: number
  allLocationsCount: number
  isRefreshing: boolean
  onRefresh: () => void
}

export default function LibraryHeader({
  userRole,
  currentLocation,
  locationFilter,
  filteredBooksCount,
  totalBooksCount,
  shelfFilter,
  shelvesCount,
  allLocationsCount,
  isRefreshing,
  onRefresh
}: LibraryHeaderProps) {
  // Generate title based on user role and current filters
  const getLibraryTitle = () => {
    if (isAdmin(userRole)) {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <LibraryBooks sx={{ mr: 1 }} />
          {locationFilter} ({filteredBooksCount} books)
        </Box>
      )
    }
    
    if (!currentLocation) {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          My Library ({totalBooksCount} books)
        </Box>
      )
    }
    
    if (shelvesCount <= 1) {
      // Single shelf - show location and shelf name
      const shelfName = 'Main Library' // This would need to be passed as a prop if we need the actual shelf name
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          {currentLocation.name}: {shelfName} ({totalBooksCount} books)
        </Box>
      )
    }
    
    // Multiple shelves - show current filter or "All Shelves"
    if (shelfFilter) {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          {currentLocation.name}: {shelfFilter} ({filteredBooksCount} books)
        </Box>
      )
    } else {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          {currentLocation.name}: All Shelves ({totalBooksCount} books)
        </Box>
      )
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" component="h2">
          {getLibraryTitle()}
        </Typography>
        <Button
          variant="outlined"
          startIcon={isRefreshing ? <CircularProgress size={20} /> : <Refresh />}
          onClick={onRefresh}
          disabled={isRefreshing}
          size="small"
          sx={{ minWidth: 110, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
    </Box>
  )
}