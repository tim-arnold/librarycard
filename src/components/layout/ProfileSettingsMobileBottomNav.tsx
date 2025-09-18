'use client'

import { useState } from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material'
import {
  LibraryBooks,
  Person,
  LocationOn,
  Settings,
} from '@mui/icons-material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface ProfileSettingsMobileBottomNavProps {
  currentPage: 'profile' | 'settings' | 'locations' | string
  onLibraryClick: () => void
  onAccountClick: () => void
  onLocationsClick: () => void
  onSettingsClick: () => void
}

export default function ProfileSettingsMobileBottomNav({
  currentPage,
  onLibraryClick,
  onAccountClick,
  onLocationsClick,
  onSettingsClick,
}: ProfileSettingsMobileBottomNavProps) {
  const { isMobile } = useMobileBreakpoints()

  // Set default based on current page
  const [value, setValue] = useState(() => {
    switch (currentPage) {
      case 'profile':
        return 'account'
      case 'settings':
        return 'settings'
      case 'locations':
        return 'locations'
      default:
        return 'account'
    }
  })

  // Only show on mobile devices
  if (!isMobile) return null

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)

    switch (newValue) {
      case 'library':
        onLibraryClick()
        break
      case 'account':
        onAccountClick()
        break
      case 'locations':
        onLocationsClick()
        break
      case 'settings':
        onSettingsClick()
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
          label="Library"
          value="library"
          icon={<LibraryBooks />}
        />

        <BottomNavigationAction
          label="Account"
          value="account"
          icon={<Person color={currentPage === 'profile' ? 'primary' : 'inherit'} />}
        />

        <BottomNavigationAction
          label="Locations"
          value="locations"
          icon={<LocationOn color={currentPage === 'locations' ? 'primary' : 'inherit'} />}
        />

        <BottomNavigationAction
          label="Settings"
          value="settings"
          icon={<Settings color={currentPage === 'settings' ? 'primary' : 'inherit'} />}
        />
      </BottomNavigation>
    </Paper>
  )
}