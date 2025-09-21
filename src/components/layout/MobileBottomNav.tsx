'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
  const [focusedIndex, setFocusedIndex] = useState(0)
  const actionRefs = useRef<(HTMLButtonElement | null)[]>([])

  const navigationItems = [
    { value: 'add-books', action: onAddBookClick },
    { value: 'search', action: onSearchToggle },
    { value: 'filters', action: onFilterToggle },
    { value: 'activity', action: onSidebarToggle }
  ]

  // Enhanced keyboard navigation for mobile bottom navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        const prevIndex = (index - 1 + navigationItems.length) % navigationItems.length
        setFocusedIndex(prevIndex)
        actionRefs.current[prevIndex]?.focus()
        break
      case 'ArrowRight':
        event.preventDefault()
        const nextIndex = (index + 1) % navigationItems.length
        setFocusedIndex(nextIndex)
        actionRefs.current[nextIndex]?.focus()
        break
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        actionRefs.current[0]?.focus()
        break
      case 'End':
        event.preventDefault()
        const lastIndex = navigationItems.length - 1
        setFocusedIndex(lastIndex)
        actionRefs.current[lastIndex]?.focus()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        navigationItems[index].action()
        setValue(navigationItems[index].value)
        break
    }
  }, [navigationItems])

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
        bottom: 'env(safe-area-inset-bottom)',
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
        aria-describedby="mobile-nav-help"
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
            },
            '&:focus': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
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
          aria-label="Add new books to library. Use left/right arrows to navigate."
          onKeyDown={(e) => handleKeyDown(e, 0)}
          ref={(el) => {
            if (actionRefs.current) {
              actionRefs.current[0] = el as HTMLButtonElement
            }
          }}
        />

        <BottomNavigationAction
          label={searchTerm ? 'Searching' : 'Search'}
          value="search"
          icon={<Search color={searchTerm ? 'primary' : 'inherit'} />}
          aria-label={searchTerm ? `Currently searching for: ${searchTerm}. Use left/right arrows to navigate.` : 'Search books. Use left/right arrows to navigate.'}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          ref={(el) => {
            if (actionRefs.current) {
              actionRefs.current[1] = el as HTMLButtonElement
            }
          }}
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
          aria-label={activeFiltersCount > 0 ? `Book filters (${activeFiltersCount} active). Use left/right arrows to navigate.` : 'Book filters. Use left/right arrows to navigate.'}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          ref={(el) => {
            if (actionRefs.current) {
              actionRefs.current[2] = el as HTMLButtonElement
            }
          }}
        />

        <BottomNavigationAction
          label="Activity"
          value="activity"
          icon={<MenuBook />}
          aria-label="View library activity and recent books. Use left/right arrows to navigate."
          onKeyDown={(e) => handleKeyDown(e, 3)}
          ref={(el) => {
            if (actionRefs.current) {
              actionRefs.current[3] = el as HTMLButtonElement
            }
          }}
        />
      </BottomNavigation>

      {/* Screen reader navigation help */}
      <Box
        id="mobile-nav-help"
        sx={{ position: 'absolute', left: '-9999px' }}
      >
        Use left and right arrow keys to navigate between options, Enter or Space to activate
      </Box>
    </Paper>
  )
}