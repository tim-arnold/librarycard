'use client'

import { Box, Chip, Button } from '@mui/material'
import { ClearAll } from '@mui/icons-material'

interface ActiveFiltersProps {
  searchTerm: string
  authorFilter: string
  shelfFilter: string
  categoryFilter: string[]
  locationFilter: string
  checkoutFilter: string
  seriesFilter: string
  allLocationsCount: number
  onSearchRemove: () => void
  onAuthorRemove: () => void
  onShelfRemove: () => void
  onGenreRemove: (genre: string) => void
  onLocationRemove: () => void
  onCheckoutRemove: () => void
  onSeriesRemove: () => void
  onClearAll?: () => void
}

export default function ActiveFilters({
  searchTerm,
  authorFilter,
  shelfFilter,
  categoryFilter,
  locationFilter,
  checkoutFilter,
  seriesFilter,
  allLocationsCount,
  onSearchRemove,
  onAuthorRemove,
  onShelfRemove,
  onGenreRemove,
  onLocationRemove,
  onCheckoutRemove,
  onSeriesRemove,
  onClearAll
}: ActiveFiltersProps) {
  const hasActiveFilters = searchTerm || authorFilter || shelfFilter || categoryFilter.length > 0 || locationFilter || checkoutFilter || seriesFilter

  return (
    <Box sx={{ 
      mb: hasActiveFilters ? 3 : 0, 
      transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
      opacity: hasActiveFilters ? 1 : 0,
      transform: hasActiveFilters ? 'translateY(0)' : 'translateY(-8px)',
      pointerEvents: hasActiveFilters ? 'auto' : 'none'
    }}>
      {hasActiveFilters && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      {searchTerm && (
        <Chip
          label={`Search: "${searchTerm}"`}
          onDelete={onSearchRemove}
          color="primary"
          variant="outlined"
          sx={{
            fontSize: '0.9rem',
            height: 32,
            fontWeight: 500,
            '& .MuiChip-deleteIcon': {
              color: 'primary.main'
            }
          }}
        />
      )}
      {authorFilter && (
        <Chip
          label={`Author: ${authorFilter}`}
          onDelete={onAuthorRemove}
          color="primary"
          variant="filled"
          sx={{ 
            fontSize: '0.9rem',
            height: 32,
            '& .MuiChip-deleteIcon': {
              color: 'primary.contrastText'
            }
          }}
        />
      )}
      {seriesFilter && (
        <Chip
          label={`Series: ${seriesFilter}`}
          onDelete={onSeriesRemove}
          color="success"
          variant="filled"
          sx={{ 
            fontSize: '0.9rem',
            height: 32,
            '& .MuiChip-deleteIcon': {
              color: 'success.contrastText'
            }
          }}
        />
      )}
      {shelfFilter && (
        <Chip
          label={`Shelf: ${shelfFilter}`}
          onDelete={onShelfRemove}
          color="secondary"
          variant="filled"
          sx={{ 
            fontSize: '0.9rem',
            height: 32,
            '& .MuiChip-deleteIcon': {
              color: 'secondary.contrastText'
            }
          }}
        />
      )}
      {categoryFilter.map((genre) => (
        <Chip
          key={genre}
          label={`Genre: ${genre}`}
          onDelete={() => onGenreRemove(genre)}
          color="info"
          variant="filled"
          sx={{ 
            fontSize: '0.9rem',
            height: 32,
            '& .MuiChip-deleteIcon': {
              color: 'info.contrastText'
            }
          }}
        />
      ))}
      {locationFilter && allLocationsCount > 1 && (
        <Chip
          label={`Location: ${locationFilter}`}
          onDelete={onLocationRemove}
          color="success"
          variant="filled"
          sx={{ 
            fontSize: '0.9rem',
            height: 32,
            '& .MuiChip-deleteIcon': {
              color: 'success.contrastText'
            }
          }}
        />
      )}
      {checkoutFilter && (
        <Chip
          label={`Status: ${checkoutFilter === 'available' ? 'Available' : 'Checked Out'}`}
          onDelete={onCheckoutRemove}
          color="warning"
          variant="filled"
          sx={{ 
            fontSize: '0.9rem',
            height: 32,
            '& .MuiChip-deleteIcon': {
              color: 'warning.contrastText'
            }
          }}
        />
      )}
        
        {/* Clear All button */}
        {onClearAll && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearAll />}
            onClick={onClearAll}
            sx={{ ml: 1 }}
          >
            Clear All
          </Button>
        )}
        </Box>
      )}
    </Box>
  )
}