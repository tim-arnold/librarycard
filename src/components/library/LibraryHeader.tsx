'use client'

import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress 
} from '@mui/material'
import { Refresh } from '@mui/icons-material'
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
      return `📚 ${locationFilter} (${filteredBooksCount} books)`
    }
    
    if (!currentLocation) {
      return `📖 My Library (${totalBooksCount} books)`
    }
    
    if (shelvesCount <= 1) {
      // Single shelf - show location and shelf name
      const shelfName = 'Main Library' // This would need to be passed as a prop if we need the actual shelf name
      return `📖 ${currentLocation.name}: ${shelfName} (${totalBooksCount} books)`
    }
    
    // Multiple shelves - show current filter or "All Shelves"
    if (shelfFilter) {
      return `📖 ${currentLocation.name}: ${shelfFilter} (${filteredBooksCount} books)`
    } else {
      return `📖 ${currentLocation.name}: All Shelves (${totalBooksCount} books)`
    }
  }

  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h4" component="h2">
        {getLibraryTitle()}
      </Typography>
      <Button
        variant="outlined"
        startIcon={isRefreshing ? <CircularProgress size={20} /> : <Refresh />}
        onClick={onRefresh}
        disabled={isRefreshing}
        size="small"
        sx={{ minWidth: 110 }}
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </Box>
  )
}