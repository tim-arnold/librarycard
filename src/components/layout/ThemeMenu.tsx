'use client'

import { useState } from 'react'
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleThemeVariantChange = (variant: ThemeVariant) => {
    setThemeVariant(variant)
    // Keep menu open so user can continue making changes
  }

  const isOpen = Boolean(anchorEl)

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
                />
              }
              label=""
              sx={{ m: 0 }}
            />
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
            >
              {Object.entries(themeVariants).map(([key, variant]) => (
                <Chip
                  key={key}
                  label={variant.name}
                  onClick={() => handleThemeVariantChange(key as ThemeVariant)}
                  variant={themeVariant === key ? 'filled' : 'outlined'}
                  size="small"
                  role="button"
                  aria-pressed={themeVariant === key}
                  aria-label={`Select ${variant.name} theme color${themeVariant === key ? ' (currently selected)' : ''}`}
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
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
          </Box>
        </MenuItem>
      </Menu>
    </>
  )
}