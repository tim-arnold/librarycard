'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  MenuProps,
  useTheme as useMuiTheme,
  Popover,
  Card,
  CardContent,
} from '@mui/material'
import {
  Palette,
  DarkMode,
  LightMode,
  ColorLens,
} from '@mui/icons-material'
import { useTheme } from '@/lib/ThemeContext'
import { themeVariants, type ThemeVariant } from '@/lib/theme'
import AccessibleIcon from '@/components/ui/AccessibleIcon'

export default function ThemeMenu() {
  const { isDarkMode, themeVariant, toggleTheme, setThemeVariant } = useTheme()
  const muiTheme = useMuiTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [focusedVariantIndex, setFocusedVariantIndex] = useState(0)
  const variantRefs = useRef<(HTMLButtonElement | null)[]>([])
  const darkModeToggleRef = useRef<HTMLInputElement>(null)

  const variantKeys = Object.keys(themeVariants) as ThemeVariant[]

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    // Set initial focus to current theme variant
    const currentIndex = variantKeys.indexOf(themeVariant)
    const initialIndex = currentIndex >= 0 ? currentIndex : 0
    setFocusedVariantIndex(initialIndex)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setFocusedVariantIndex(0)
  }

  const handleThemeVariantChange = (variant: ThemeVariant) => {
    setThemeVariant(variant)
    // Keep menu open so user can continue making changes
  }

  // Enhanced 2D grid keyboard navigation for theme variants
  const GRID_COLUMNS = 2 // Two-column layout
  const GRID_ROWS = Math.ceil(variantKeys.length / GRID_COLUMNS)

  const handleVariantKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const allThemeButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
      btn.style.background?.includes('var(--marketing-primary)') ||
      btn.style.background?.includes('var(--marketing-gray-100)')
    )

    const totalButtons = allThemeButtons.length
    const currentRow = Math.floor(index / GRID_COLUMNS)
    const currentCol = index % GRID_COLUMNS

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        let nextColIndex = index
        if (currentCol < GRID_COLUMNS - 1 && index + 1 < totalButtons) {
          nextColIndex = index + 1
        } else {
          const nextRow = (currentRow + 1) % Math.ceil(totalButtons / GRID_COLUMNS)
          nextColIndex = Math.min(nextRow * GRID_COLUMNS, totalButtons - 1)
        }
        allThemeButtons[nextColIndex]?.focus()
        setFocusedVariantIndex(nextColIndex)
        break

      case 'ArrowLeft':
        event.preventDefault()
        let prevColIndex = index
        if (currentCol > 0) {
          prevColIndex = index - 1
        } else {
          const prevRow = (currentRow - 1 + Math.ceil(totalButtons / GRID_COLUMNS)) % Math.ceil(totalButtons / GRID_COLUMNS)
          const prevRowLastCol = Math.min((prevRow + 1) * GRID_COLUMNS - 1, totalButtons - 1)
          prevColIndex = prevRowLastCol
        }
        allThemeButtons[prevColIndex]?.focus()
        setFocusedVariantIndex(prevColIndex)
        break

      case 'ArrowDown':
        event.preventDefault()
        let nextRowIndex = index
        const nextRowCalc = currentRow + 1
        if (nextRowCalc < Math.ceil(totalButtons / GRID_COLUMNS)) {
          nextRowIndex = Math.min(nextRowCalc * GRID_COLUMNS + currentCol, totalButtons - 1)
        } else {
          nextRowIndex = currentCol
        }
        allThemeButtons[nextRowIndex]?.focus()
        setFocusedVariantIndex(nextRowIndex)
        break

      case 'ArrowUp':
        event.preventDefault()
        let prevRowIndex = index
        const prevRowCalc = currentRow - 1
        if (prevRowCalc >= 0) {
          prevRowIndex = prevRowCalc * GRID_COLUMNS + currentCol
        } else {
          const lastRow = Math.ceil(totalButtons / GRID_COLUMNS) - 1
          const targetIndex = lastRow * GRID_COLUMNS + currentCol
          prevRowIndex = Math.min(targetIndex, totalButtons - 1)
        }
        allThemeButtons[prevRowIndex]?.focus()
        setFocusedVariantIndex(prevRowIndex)
        break

      case 'Home':
        event.preventDefault()
        allThemeButtons[0]?.focus()
        setFocusedVariantIndex(0)
        break

      case 'End':
        event.preventDefault()
        const lastIndex = totalButtons - 1
        allThemeButtons[lastIndex]?.focus()
        setFocusedVariantIndex(lastIndex)
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        if (index < variantKeys.length) {
          handleThemeVariantChange(variantKeys[index])
        }
        break

      case 'Escape':
        event.preventDefault()
        handleMenuClose()
        break
    }
  }, [variantKeys, GRID_COLUMNS, handleThemeVariantChange, handleMenuClose])

  // Handle dark mode toggle keyboard navigation
  const handleDarkModeKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'Tab':
        if (!event.shiftKey) {
          event.preventDefault()
          // Move focus to first theme variant
          setFocusedVariantIndex(0)
          variantRefs.current[0]?.focus()
        }
        break
      case 'Escape':
        event.preventDefault()
        handleMenuClose()
        break
    }
  }, [])

  // Handle reverse tab navigation from theme variants back to dark mode toggle
  const handleFirstVariantShiftTab = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault()
      darkModeToggleRef.current?.focus()
    }
  }, [])

  const isOpen = Boolean(anchorEl)

  // Global keyboard handler when menu is open
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement

      const isThemeColorButton = activeElement?.tagName === 'BUTTON' &&
        activeElement?.style?.background?.includes('var(--marketing-primary)')

      if (isThemeColorButton && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()

        const allThemeButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
          btn.style.background?.includes('var(--marketing-primary)') ||
          btn.style.background?.includes('var(--marketing-gray-100)')
        )

        const currentIndex = allThemeButtons.indexOf(activeElement as HTMLButtonElement)

        if (currentIndex >= 0) {
          const syntheticEvent = {
            key: e.key,
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation()
          } as React.KeyboardEvent

          handleVariantKeyDown(syntheticEvent, currentIndex)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleMenuClose()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown, true) // Capture phase

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true)
    }
  }, [isOpen, handleVariantKeyDown, variantKeys])

  // Auto-focus management when menu opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure menu is rendered
      setTimeout(() => {
        // Focus the currently selected theme variant first, if available
        const currentIndex = variantKeys.indexOf(themeVariant)
        const targetIndex = currentIndex >= 0 ? currentIndex : 0

        if (variantRefs.current[targetIndex]) {
          variantRefs.current[targetIndex]?.focus()
          setFocusedVariantIndex(targetIndex)
        } else if (darkModeToggleRef.current) {
          darkModeToggleRef.current?.focus()
        }
      }, 100)
    }
  }, [isOpen, themeVariant, variantKeys])

  return (
    <>
      <AccessibleIcon
        icon={<Palette />}
        ariaLabel="Open theme settings to customize appearance and colors"
        tooltip="Theme Settings"
        onClick={handleMenuOpen}
        color="inherit"
        size="small"
        sx={{ mr: 1 }}
      />
      
      <Popover
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxWidth: 320,
            mt: 1,
          }
        }}
        aria-labelledby="theme-menu-button"
        aria-label="Theme customization menu"
      >
        <Card elevation={0}>
          <CardContent sx={{ p: 2 }}>
            {/* Dark Mode Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isDarkMode ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                <Typography variant="body2">
                  Dark Mode
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    size="small"
                    inputRef={darkModeToggleRef}
                    onKeyDown={handleDarkModeKeyDown}
                    inputProps={{
                      'aria-label': 'Toggle dark mode theme',
                      'aria-describedby': 'dark-mode-description'
                    }}
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
              <Typography
                id="dark-mode-description"
                variant="caption"
                sx={{ position: 'absolute', left: '-9999px' }}
              >
                Use arrow keys or tab to navigate to theme colors
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Theme Color Section */}
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontWeight: 500 }}>
              <ColorLens fontSize="small" />
              Theme Color
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Choose your preferred color scheme
            </Typography>
            
            <Box
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
              role="group"
              aria-label="Theme color variants"
              aria-describedby="variant-navigation-help"
            >
              {Object.entries(themeVariants).map(([key, variant], index) => (
                <Box
                  key={key}
                  component="button"
                  onClick={() => handleThemeVariantChange(key as ThemeVariant)}
                  onKeyDown={(e) => {
                    handleVariantKeyDown(e, index)
                    // Handle shift+tab for first variant to go back to dark mode toggle
                    if (index === 0) {
                      handleFirstVariantShiftTab(e)
                    }
                  }}
                  tabIndex={focusedVariantIndex === index ? 0 : -1}
                  ref={(el) => {
                    if (variantRefs.current) {
                      variantRefs.current[index] = el as HTMLButtonElement
                    }
                  }}
                  aria-pressed={themeVariant === key}
                  aria-label={`Select ${variant.name} theme color${themeVariant === key ? ' (currently selected)' : ''}. Use arrow keys to navigate in 2D grid, Enter to select.`}
                  sx={{
                    // Chip-like styling
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '24px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    lineHeight: 1,
                    padding: '6px 12px',
                    borderRadius: '12px',
                    border: '1px solid',
                    backgroundColor: themeVariant === key
                      ? variant.primary[isDarkMode ? 300 : 600]
                      : 'transparent',
                    borderColor: variant.primary[isDarkMode ? 300 : 600],
                    color: themeVariant === key
                      ? (isDarkMode ? '#000000' : '#ffffff')
                      : variant.primary[isDarkMode ? 300 : 600],
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    // Remove default button styles
                    background: 'none',
                    outline: 'none',
                    // Hover and focus styles
                    '&:hover': {
                      backgroundColor: variant.primary[isDarkMode ? 400 : 500],
                      color: isDarkMode ? '#000000' : '#ffffff',
                      transform: 'translateY(-1px)',
                    },
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                      backgroundColor: variant.primary[isDarkMode ? 400 : 500],
                      color: isDarkMode ? '#000000' : '#ffffff',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                    },
                  }}
                >
                  {variant.name}
                </Box>
              ))}
            </Box>
            <Typography
              id="variant-navigation-help"
              variant="caption"
              sx={{ position: 'absolute', left: '-9999px' }}
            >
              Use arrow keys to navigate theme colors in a 2-column grid: left/right for horizontal, up/down for vertical movement. Enter or Space to select, Escape to close menu
            </Typography>
          </Box>
          </CardContent>
        </Card>
      </Popover>
    </>
  )
}