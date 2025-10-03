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
  Button,
} from '@mui/material'
import {
  GridView,
  FormatListBulleted,
  Download,
} from '@mui/icons-material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface ViewModeControlsProps {
  viewMode: 'card' | 'list'
  booksPerPage: number
  filteredBooksCount: number
  totalBooksCount?: number
  onViewModeChange: (newViewMode: 'card' | 'list') => void
  onBooksPerPageChange: (newBooksPerPage: number) => void
  onExportClick?: () => void
}

export default function ViewModeControls({
  viewMode,
  booksPerPage,
  filteredBooksCount,
  totalBooksCount,
  onViewModeChange,
  onBooksPerPageChange,
  onExportClick
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
        flexDirection: 'row',
        justifyContent: { xs: 'center', md: 'space-between' },
        alignItems: 'center',
        gap: { xs: 2, md: 0 },
        flexWrap: 'wrap'
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

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Export button */}
          {onExportClick && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={onExportClick}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {!isMobile && 'Export'}
            </Button>
          )}

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
    </Box>
  )
}