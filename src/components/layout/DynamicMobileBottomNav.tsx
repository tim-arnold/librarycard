'use client'

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  SxProps,
  Theme,
} from '@mui/material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

export interface NavigationItem {
  value: string
  label: string
  icon: ReactNode
  action: () => void
  ariaLabel?: string
  onKeyDown?: (e: React.KeyboardEvent, index: number) => void
}

interface DynamicMobileBottomNavProps {
  navigationItems: NavigationItem[]
  defaultValue?: string
  showLabels?: boolean
  elevation?: number
  sx?: SxProps<Theme>
  bottomNavigationSx?: SxProps<Theme>
  enableKeyboardNavigation?: boolean
  children?: ReactNode
}

export default function DynamicMobileBottomNav({
  navigationItems,
  defaultValue,
  showLabels = true,
  elevation = 8,
  sx,
  bottomNavigationSx,
  enableKeyboardNavigation = false,
  children,
}: DynamicMobileBottomNavProps) {
  const { isMobile } = useMobileBreakpoints()
  const [value, setValue] = useState(defaultValue || navigationItems[0]?.value || '')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const actionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Handle dynamic viewport height changes for mobile browsers
  useEffect(() => {
    if (!isMobile) return

    let timeoutId: NodeJS.Timeout

    const updateViewportHeight = () => {
      // Clear any pending updates
      clearTimeout(timeoutId)

      // Debounce the viewport height updates
      timeoutId = setTimeout(() => {
        const vh = window.visualViewport?.height ?? window.innerHeight
        const windowHeight = window.innerHeight
        const diff = windowHeight - vh

        // Only update if there's a significant difference (browser UI change)
        if (Math.abs(diff - viewportHeight) > 10) {
          setViewportHeight(diff)

          // Update the toolbar position to stick to the visual viewport bottom
          if (toolbarRef.current) {
            const transform = diff > 0 ? `translateY(-${diff}px)` : 'translateY(0)'
            toolbarRef.current.style.transform = transform
          }
        }
      }, 16) // ~60fps debounce
    }

    // Initial setup
    updateViewportHeight()

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight)
      window.visualViewport.addEventListener('scroll', updateViewportHeight)
    } else {
      // Fallback for browsers without visualViewport
      window.addEventListener('resize', updateViewportHeight)
      window.addEventListener('orientationchange', updateViewportHeight)
    }

    return () => {
      clearTimeout(timeoutId)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight)
        window.visualViewport.removeEventListener('scroll', updateViewportHeight)
      } else {
        window.removeEventListener('resize', updateViewportHeight)
        window.removeEventListener('orientationchange', updateViewportHeight)
      }
    }
  }, [isMobile, viewportHeight])

  // Enhanced keyboard navigation for mobile bottom navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    if (!enableKeyboardNavigation) return

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
  }, [navigationItems, enableKeyboardNavigation])

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

    // Find and execute the action for the selected value
    const item = navigationItems.find(item => item.value === newValue)
    if (item) {
      item.action()
    }
  }

  const defaultSx: SxProps<Theme> = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTop: 1,
    borderColor: 'divider',
    paddingBottom: 'env(safe-area-inset-bottom)',
    transform: 'translateY(0)',
    transition: 'transform 0.3s ease-out',
    ...sx,
  }

  const defaultBottomNavigationSx: SxProps<Theme> = {
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
      ...(enableKeyboardNavigation && {
        '&:focus': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        }
      })
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.75rem',
      lineHeight: 1.2,
      transition: 'all 0.2s ease-in-out',
    },
    ...bottomNavigationSx,
  }

  return (
    <Paper
      ref={toolbarRef}
      sx={defaultSx}
      elevation={elevation}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels={showLabels}
        role="navigation"
        aria-label="Mobile navigation"
        aria-describedby={enableKeyboardNavigation ? "mobile-nav-help" : undefined}
        sx={defaultBottomNavigationSx}
      >
        {navigationItems.map((item, index) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            aria-label={item.ariaLabel}
            onKeyDown={enableKeyboardNavigation ? (e) => {
              // Use custom handler if provided, otherwise use default
              if (item.onKeyDown) {
                item.onKeyDown(e, index)
              } else {
                handleKeyDown(e, index)
              }
            } : undefined}
            ref={enableKeyboardNavigation ? (el) => {
              if (actionRefs.current) {
                actionRefs.current[index] = el as HTMLButtonElement
              }
            } : undefined}
          />
        ))}
      </BottomNavigation>

      {/* Additional children content */}
      {children}

      {/* Screen reader navigation help */}
      {enableKeyboardNavigation && (
        <Box
          id="mobile-nav-help"
          sx={{ position: 'absolute', left: '-9999px' }}
        >
          Use left and right arrow keys to navigate between options, Enter or Space to activate
        </Box>
      )}
    </Paper>
  )
}