'use client'

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { 
  GridView,
  ViewList,
  FormatListBulleted,
} from '@mui/icons-material'

interface ViewModeControlsProps {
  viewMode: 'card' | 'compact' | 'list'
  booksPerPage: number
  filteredBooksCount: number
  onViewModeChange: (newViewMode: 'card' | 'compact' | 'list') => void
  onBooksPerPageChange: (newBooksPerPage: number) => void
}

export default function ViewModeControls({
  viewMode,
  booksPerPage,
  filteredBooksCount,
  onViewModeChange,
  onBooksPerPageChange
}: ViewModeControlsProps) {
  // Only show if there are books to display
  if (filteredBooksCount === 0) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
      >
        <ToggleButton value="card" aria-label="card view">
          <GridView sx={{ mr: 1 }} />
          Cards
        </ToggleButton>
        <ToggleButton value="compact" aria-label="compact view">
          <ViewList sx={{ mr: 1 }} />
          Compact
        </ToggleButton>
        <ToggleButton value="list" aria-label="list view">
          <FormatListBulleted sx={{ mr: 1 }} />
          List
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}