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
  onSearchToggle: () => void
  activeFiltersCount?: number
  searchTerm?: string
}

export default function MobileBottomNav({
  onFilterToggle,
  onSidebarToggle,
  onAddBookClick,
  onSearchToggle,
  activeFiltersCount = 0,
  searchTerm = '',
}: MobileBottomNavProps) {
  const { isMobile } = useMobileBreakpoints()
  const [value, setValue] = useState('search')

  // Only show on mobile devices
  if (!isMobile) return null

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)

    // Add visual feedback with haptic-like delay
    const target = event.currentTarget as HTMLElement
    target.style.transform = 'scale(0.95)'
    setTimeout(() => {
      target.style.transform = 'scale(1)'
    }, 100)

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
        onSearchToggle()
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
        role="navigation"
        aria-label="Mobile navigation"
        sx={{
          height: 64, // Ensure minimum touch target height
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            paddingTop: 1,
            paddingBottom: 1,
            minHeight: 44, // Minimum touch target size
            transition: 'all 0.2s ease-in-out',
            borderRadius: 2,
            margin: '4px 2px',
            '&.Mui-selected': {
              backgroundColor: 'primary.50',
              '& .MuiBottomNavigationAction-label': {
                color: 'primary.main',
                fontWeight: 600,
              }
            },
            '&:active': {
              transform: 'scale(0.95)',
            }
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            lineHeight: 1.2,
            transition: 'all 0.2s ease-in-out',
          }
        }}
      >
        <BottomNavigationAction
          label="Add Books"
          value="add-books"
          icon={<Add />}
          aria-label="Add new books to library"
        />

        <BottomNavigationAction
          label={searchTerm ? 'Searching' : 'Search'}
          value="search"
          icon={<Search color={searchTerm ? 'primary' : 'inherit'} />}
          aria-label={searchTerm ? `Currently searching for: ${searchTerm}` : 'Search books'}
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
                  aria-hidden="true"
                >
                  {activeFiltersCount > 9 ? '9+' : activeFiltersCount}
                </Box>
              )}
            </Box>
          }
          aria-label={activeFiltersCount > 0 ? `Book filters (${activeFiltersCount} active)` : 'Book filters'}
        />

        <BottomNavigationAction
          label="Activity"
          value="activity"
          icon={<MenuBook />}
          aria-label="View library activity and recent books"
        />
      </BottomNavigation>
    </Paper>
  )
}