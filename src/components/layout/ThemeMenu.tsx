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
    setFocusedVariantIndex(currentIndex >= 0 ? currentIndex : 0)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setFocusedVariantIndex(0)
  }

  const handleThemeVariantChange = (variant: ThemeVariant) => {
    setThemeVariant(variant)
    // Keep menu open so user can continue making changes
  }

  // Enhanced keyboard navigation for theme variants
  const handleVariantKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = (index + 1) % variantKeys.length
        setFocusedVariantIndex(nextIndex)
        variantRefs.current[nextIndex]?.focus()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = (index - 1 + variantKeys.length) % variantKeys.length
        setFocusedVariantIndex(prevIndex)
        variantRefs.current[prevIndex]?.focus()
        break
      case 'Home':
        event.preventDefault()
        setFocusedVariantIndex(0)
        variantRefs.current[0]?.focus()
        break
      case 'End':
        event.preventDefault()
        const lastIndex = variantKeys.length - 1
        setFocusedVariantIndex(lastIndex)
        variantRefs.current[lastIndex]?.focus()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        handleThemeVariantChange(variantKeys[index])
        break
      case 'Escape':
        event.preventDefault()
        handleMenuClose()
        break
    }
  }, [variantKeys])

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

  // Auto-focus management when menu opens
  useEffect(() => {
    if (isOpen && darkModeToggleRef.current) {
      // Small delay to ensure menu is rendered
      setTimeout(() => {
        darkModeToggleRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

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
      
      <Menu
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
        {/* Dark Mode Toggle */}
        <MenuItem onClick={(e) => e.stopPropagation()} disableRipple>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Theme Color Section */}
        <MenuItem onClick={(e) => e.stopPropagation()} disableRipple>
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
                <Chip
                  key={key}
                  label={variant.name}
                  onClick={() => handleThemeVariantChange(key as ThemeVariant)}
                  onKeyDown={(e) => {
                    handleVariantKeyDown(e, index)
                    // Handle shift+tab for first variant to go back to dark mode toggle
                    if (index === 0) {
                      handleFirstVariantShiftTab(e)
                    }
                  }}
                  variant={themeVariant === key ? 'filled' : 'outlined'}
                  size="small"
                  role="button"
                  tabIndex={0}
                  ref={(el) => {
                    if (variantRefs.current) {
                      variantRefs.current[index] = el as unknown as HTMLButtonElement
                    }
                  }}
                  aria-pressed={themeVariant === key}
                  aria-label={`Select ${variant.name} theme color${themeVariant === key ? ' (currently selected)' : ''}. Use arrow keys to navigate, Enter to select.`}
                  sx={{
                    backgroundColor: themeVariant === key
                      ? variant.primary[isDarkMode ? 300 : 600]
                      : 'transparent',
                    borderColor: variant.primary[isDarkMode ? 300 : 600],
                    color: themeVariant === key
                      ? (isDarkMode ? '#000000' : '#ffffff')
                      : variant.primary[isDarkMode ? 300 : 600],
                    '&:hover': {
                      backgroundColor: variant.primary[isDarkMode ? 400 : 500],
                      color: isDarkMode ? '#000000' : '#ffffff',
                    },
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    },
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
            <Typography
              id="variant-navigation-help"
              variant="caption"
              sx={{ position: 'absolute', left: '-9999px' }}
            >
              Use arrow keys to navigate between theme colors, Enter or Space to select, Escape to close menu
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </>
  )
}