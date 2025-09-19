'use client'

import { 
  Box, 
  Typography
} from '@mui/material'
import { LibraryBooks, MenuBook } from '@mui/icons-material'
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
}

export default function LibraryHeader({
  userRole,
  currentLocation,
  locationFilter,
  filteredBooksCount,
  totalBooksCount,
  shelfFilter,
  shelvesCount,
  allLocationsCount
}: LibraryHeaderProps) {
  // Generate title based on user role and current filters
  const getLibraryTitle = () => {
    if (isAdmin(userRole)) {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <LibraryBooks sx={{ mr: 1 }} />
          {locationFilter}
        </Box>
      )
    }

    if (!currentLocation) {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          My Library
        </Box>
      )
    }

    if (shelvesCount <= 1) {
      // Single shelf - show location and shelf name
      const shelfName = 'Main Library' // This would need to be passed as a prop if we need the actual shelf name
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          {currentLocation.name}: {shelfName}
        </Box>
      )
    }

    // Multiple shelves - show current filter or "All Shelves"
    if (shelfFilter) {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          {currentLocation.name}: {shelfFilter}
        </Box>
      )
    } else {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1 }} />
          {currentLocation.name}: All Shelves
        </Box>
      )
    }
  }

  return (
    <Box sx={{ mb: 3 }} data-tour="library-header">
      <Typography variant="h4" component="h2">
        {getLibraryTitle()}
      </Typography>
    </Box>
  )
}