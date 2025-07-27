'use client'

import { Box, Chip, Button } from '@mui/material'
import { ClearAll } from '@mui/icons-material'

interface ActiveFiltersProps {
  authorFilter: string
  shelfFilter: string
  categoryFilter: string[]
  locationFilter: string
  checkoutFilter: string
  allLocationsCount: number
  onAuthorRemove: () => void
  onShelfRemove: () => void
  onGenreRemove: (genre: string) => void
  onLocationRemove: () => void
  onCheckoutRemove: () => void
  onClearAll?: () => void
}

export default function ActiveFilters({
  authorFilter,
  shelfFilter,
  categoryFilter,
  locationFilter,
  checkoutFilter,
  allLocationsCount,
  onAuthorRemove,
  onShelfRemove,
  onGenreRemove,
  onLocationRemove,
  onCheckoutRemove,
  onClearAll
}: ActiveFiltersProps) {
  const hasActiveFilters = authorFilter || shelfFilter || categoryFilter.length > 0 || locationFilter || checkoutFilter

  if (!hasActiveFilters) {
    return null
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
    </Box>
  )
}