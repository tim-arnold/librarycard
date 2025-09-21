'use client'

import { useState } from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
} from '@mui/material'
import HelpModal from '@/components/modals/HelpModal'
import {
  LibraryBooks,
  Person,
  LocationOn,
  Security,
  Notifications,
  History,
  Help,
} from '@mui/icons-material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface ProfileSettingsMobileBottomNavProps {
  currentPage: 'profile' | 'settings' | 'locations' | 'notifications' | 'checkout-history' | 'help' | string
  onLibraryClick: () => void
  onAccountClick: () => void
  onLocationsClick: () => void
  onSecurityClick: () => void
  onNotificationsClick: () => void
  onCheckoutHistoryClick: () => void
  onHelpClick: () => void
  notificationCount?: number
}

export default function ProfileSettingsMobileBottomNav({
  currentPage,
  onLibraryClick,
  onAccountClick,
  onLocationsClick,
  onSecurityClick,
  onNotificationsClick,
  onCheckoutHistoryClick,
  onHelpClick,
  notificationCount = 0,
}: ProfileSettingsMobileBottomNavProps) {
  const { isMobile } = useMobileBreakpoints()
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  // Set default based on current page
  const [value, setValue] = useState(() => {
    switch (currentPage) {
      case 'profile':
        return 'account'
      case 'settings':
        return 'security'
      case 'locations':
        return 'locations'
      case 'notifications':
        return 'notifications'
      case 'checkout-history':
        return 'checkout-history'
      case 'help':
        return 'help'
      default:
        return 'account'
    }
  })

  // Only show on mobile devices
  if (!isMobile) return null

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)

    // Add visual feedback
    const target = event.currentTarget as HTMLElement
    target.style.transform = 'scale(0.95)'
    setTimeout(() => {
      target.style.transform = 'scale(1)'
    }, 100)

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
      case 'security':
        onSecurityClick()
        break
      case 'notifications':
        onNotificationsClick()
        break
      case 'checkout-history':
        onCheckoutHistoryClick()
        break
      case 'help':
        setHelpModalOpen(true)
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
        sx={{
          height: 64, // Ensure minimum touch target height
          overflowX: 'auto', // Enable horizontal scrolling
          '& .MuiBottomNavigation-root': {
            minWidth: 'max-content', // Allow content to expand beyond container
          },
          '& .MuiBottomNavigationAction-root': {
            minWidth: 80, // Fixed minimum width for each action
            maxWidth: 100, // Maximum width to prevent overcrowding
            paddingTop: 1,
            paddingBottom: 1,
            minHeight: 44, // Minimum touch target size
            flex: '0 0 auto', // Don't shrink, maintain size
            transition: 'all 0.2s ease-in-out',
            borderRadius: 2,
            margin: '2px 1px',
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
            fontSize: '0.65rem', // Slightly smaller for more items
            lineHeight: 1.1,
            whiteSpace: 'nowrap', // Prevent label wrapping
            transition: 'all 0.2s ease-in-out',
          },
          // Hide scrollbar for cleaner look
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none', // Firefox
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
          label="Security"
          value="security"
          icon={<Security color={currentPage === 'settings' ? 'primary' : 'inherit'} />}
        />

        <BottomNavigationAction
          label="Notifications"
          value="notifications"
          icon={
            <Box sx={{ position: 'relative' }}>
              <Notifications color={currentPage === 'notifications' ? 'primary' : 'inherit'} />
              {notificationCount > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: 'error.main',
                    color: 'error.contrastText',
                    borderRadius: '50%',
                    minWidth: 16,
                    height: 16,
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Box>
              )}
            </Box>
          }
        />

        <BottomNavigationAction
          label="History"
          value="checkout-history"
          icon={<History color={currentPage === 'checkout-history' ? 'primary' : 'inherit'} />}
        />

        <BottomNavigationAction
          label="Help"
          value="help"
          icon={<Help color={currentPage === 'help' ? 'primary' : 'inherit'} />}
        />

      </BottomNavigation>

      {/* Help Modal */}
      <HelpModal
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </Paper>
  )
}