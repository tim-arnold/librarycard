'use client'

import { useCallback } from 'react'
import { Box } from '@mui/material'
import {
  Add,
  FilterList,
  Search,
  MenuBook,
} from '@mui/icons-material'
import DynamicMobileBottomNav, { NavigationItem } from './DynamicMobileBottomNav'

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
  // Enhanced keyboard navigation for mobile bottom navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const navigationItems = [
      { value: 'add-books', action: onAddBookClick },
      { value: 'search', action: onSearchToggle },
      { value: 'filters', action: onFilterToggle },
      { value: 'activity', action: onSidebarToggle }
    ]

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End':
        // Let the base component handle navigation
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        navigationItems[index].action()
        break
    }
  }, [onAddBookClick, onSearchToggle, onFilterToggle, onSidebarToggle])

  const navigationItems: NavigationItem[] = [
    {
      value: 'add-books',
      label: 'Add Books',
      icon: <Add />,
      action: onAddBookClick,
      ariaLabel: 'Add new books to library. Use left/right arrows to navigate.',
      onKeyDown: handleKeyDown,
    },
    {
      value: 'search',
      label: searchTerm ? 'Searching' : 'Search',
      icon: <Search color={searchTerm ? 'primary' : 'inherit'} />,
      action: onSearchToggle,
      ariaLabel: searchTerm ? `Currently searching for: ${searchTerm}. Use left/right arrows to navigate.` : 'Search books. Use left/right arrows to navigate.',
      onKeyDown: handleKeyDown,
    },
    {
      value: 'filters',
      label: `Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`,
      icon: (
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
      ),
      action: onFilterToggle,
      ariaLabel: activeFiltersCount > 0 ? `Book filters (${activeFiltersCount} active). Use left/right arrows to navigate.` : 'Book filters. Use left/right arrows to navigate.',
      onKeyDown: handleKeyDown,
    },
    {
      value: 'activity',
      label: 'Activity',
      icon: <MenuBook />,
      action: onSidebarToggle,
      ariaLabel: 'View library activity and recent books. Use left/right arrows to navigate.',
      onKeyDown: handleKeyDown,
    },
  ]

  return (
    <DynamicMobileBottomNav
      navigationItems={navigationItems}
      defaultValue="search"
      enableKeyboardNavigation={true}
    />
  )
}