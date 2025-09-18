'use client'

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  GridView,
  FormatListBulleted,
} from '@mui/icons-material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface ViewModeControlsProps {
  viewMode: 'card' | 'list'
  booksPerPage: number
  filteredBooksCount: number
  totalBooksCount?: number
  onViewModeChange: (newViewMode: 'card' | 'list') => void
  onBooksPerPageChange: (newBooksPerPage: number) => void
}

export default function ViewModeControls({
  viewMode,
  booksPerPage,
  filteredBooksCount,
  totalBooksCount,
  onViewModeChange,
  onBooksPerPageChange
}: ViewModeControlsProps) {
  const { isSmallMobile: isMobile } = useMobileBreakpoints()

  // Only show if there are books to display
  if (filteredBooksCount === 0) {
    return null
  }

  // Generate count display text
  const getCountText = () => {
    if (totalBooksCount && filteredBooksCount !== totalBooksCount) {
      return `Showing ${filteredBooksCount} of ${totalBooksCount} books`
    }
    return `${filteredBooksCount} book${filteredBooksCount !== 1 ? 's' : ''}`
  }

  return (
    <Box sx={{ mb: 2 }}>
      {/* Book count display */}
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 1, textAlign: { xs: 'center', sm: 'left' } }}
      >
        {getCountText()}
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 }
      }}>
        {/* Books per page dropdown */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Books per page</InputLabel>
        <Select
          value={booksPerPage}
          label="Books per page"
          onChange={(e) => onBooksPerPageChange(Number(e.target.value))}
        >
          <MenuItem value={10}>10 books</MenuItem>
          <MenuItem value={25}>25 books</MenuItem>
          <MenuItem value={50}>50 books</MenuItem>
          <MenuItem value={100}>100 books</MenuItem>
        </Select>
      </FormControl>

      {/* View mode toggle */}
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newViewMode) => {
          if (newViewMode !== null) {
            onViewModeChange(newViewMode)
          }
        }}
        size="small"
        aria-label="view mode"
        sx={{ alignSelf: { xs: 'center', sm: 'auto' } }}
      >
        <ToggleButton value="card" aria-label="card view">
          <GridView sx={{ mr: isMobile ? 0 : 1 }} />
          {!isMobile && 'Grid'}
        </ToggleButton>
        <ToggleButton value="list" aria-label="list view">
          <FormatListBulleted sx={{ mr: isMobile ? 0 : 1 }} />
          {!isMobile && 'List'}
        </ToggleButton>
      </ToggleButtonGroup>
      </Box>
    </Box>
  )
}