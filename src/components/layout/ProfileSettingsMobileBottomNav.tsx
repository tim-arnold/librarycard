'use client'

import { useState } from 'react'
import { Box } from '@mui/material'
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
import DynamicMobileBottomNav, { NavigationItem } from './DynamicMobileBottomNav'

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
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  // Set default based on current page
  const defaultValue = (() => {
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
  })()

  const handleHelpClick = () => {
    setHelpModalOpen(true)
    onHelpClick()
  }

  const navigationItems: NavigationItem[] = [
    {
      value: 'library',
      label: 'Library',
      icon: <LibraryBooks />,
      action: onLibraryClick,
    },
    {
      value: 'account',
      label: 'Account',
      icon: <Person color={currentPage === 'profile' ? 'primary' : 'inherit'} />,
      action: onAccountClick,
    },
    {
      value: 'locations',
      label: 'Locations',
      icon: <LocationOn color={currentPage === 'locations' ? 'primary' : 'inherit'} />,
      action: onLocationsClick,
    },
    {
      value: 'security',
      label: 'Security',
      icon: <Security color={currentPage === 'settings' ? 'primary' : 'inherit'} />,
      action: onSecurityClick,
    },
    {
      value: 'notifications',
      label: 'Notifications',
      icon: (
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
      ),
      action: onNotificationsClick,
    },
    {
      value: 'checkout-history',
      label: 'History',
      icon: <History color={currentPage === 'checkout-history' ? 'primary' : 'inherit'} />,
      action: onCheckoutHistoryClick,
    },
    {
      value: 'help',
      label: 'Help',
      icon: <Help color={currentPage === 'help' ? 'primary' : 'inherit'} />,
      action: handleHelpClick,
    },
  ]

  return (
    <>
      <DynamicMobileBottomNav
        navigationItems={navigationItems}
        defaultValue={defaultValue}
        bottomNavigationSx={{
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
        {/* Help Modal */}
        <HelpModal
          open={helpModalOpen}
          onClose={() => setHelpModalOpen(false)}
        />
      </DynamicMobileBottomNav>
    </>
  )
}