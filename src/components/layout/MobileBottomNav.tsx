'use client'

import { useState } from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box
} from '@mui/material'
import {
  Add,
  FilterList,
  Search,
  MenuBook,
} from '@mui/icons-material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface MobileBottomNavProps {
  onFilterToggle: () => void
  onSidebarToggle: () => void
  onAddBookClick: () => void
  activeFiltersCount?: number
  searchTerm?: string
  onSearchFocus?: () => void
}

export default function MobileBottomNav({
  onFilterToggle,
  onSidebarToggle,
  onAddBookClick,
  activeFiltersCount = 0,
  searchTerm = '',
  onSearchFocus,
}: MobileBottomNavProps) {
  const { isMobile } = useMobileBreakpoints()
  const [value, setValue] = useState('search')

  // Only show on mobile devices
  if (!isMobile) return null

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)

    switch (newValue) {
      case 'add-books':
        onAddBookClick()
        break
      case 'filters':
        onFilterToggle()
        break
      case 'activity':
        onSidebarToggle()
        break
      case 'search':
        onSearchFocus?.()
        break
      default:
        break
    }
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: 1,
        borderColor: 'divider',
      }}
      elevation={8}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64, // Ensure minimum touch target height
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            paddingTop: 1,
            paddingBottom: 1,
            minHeight: 44, // Minimum touch target size
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            lineHeight: 1.2,
          }
        }}
      >
        <BottomNavigationAction
          label="Add Books"
          value="add-books"
          icon={<Add />}
        />

        <BottomNavigationAction
          label={searchTerm ? 'Searching' : 'Search'}
          value="search"
          icon={<Search color={searchTerm ? 'primary' : 'inherit'} />}
        />

        <BottomNavigationAction
          label={`Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}
          value="filters"
          icon={
            <Box sx={{ position: 'relative' }}>
              <FilterList />
              {activeFiltersCount > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: 'error.main',
                    color: 'error.contrastText',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {activeFiltersCount > 9 ? '9+' : activeFiltersCount}
                </Box>
              )}
            </Box>
          }
        />

        <BottomNavigationAction
          label="Activity"
          value="activity"
          icon={<MenuBook />}
        />
      </BottomNavigation>
    </Paper>
  )
}