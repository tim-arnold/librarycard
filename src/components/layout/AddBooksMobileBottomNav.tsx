'use client'

import { useState } from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material'
import {
  LibraryBooks,
  CameraAlt,
  Search,
  History,
} from '@mui/icons-material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface AddBooksMobileBottomNavProps {
  activeTab: number // 0 = search, 1 = scan
  onLibraryClick: () => void
  onCameraClick: () => void
  onManualClick: () => void
  onRecentClick: () => void
}

export default function AddBooksMobileBottomNav({
  activeTab,
  onLibraryClick,
  onCameraClick,
  onManualClick,
  onRecentClick,
}: AddBooksMobileBottomNavProps) {
  const { isMobile } = useMobileBreakpoints()

  // Set default based on current tab - camera if on scan tab, manual if on search tab
  const [value, setValue] = useState(activeTab === 1 ? 'camera' : 'manual')

  // Only show on mobile devices
  if (!isMobile) return null

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)

    switch (newValue) {
      case 'library':
        onLibraryClick()
        break
      case 'camera':
        onCameraClick()
        break
      case 'manual':
        onManualClick()
        break
      case 'recent':
        onRecentClick()
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
          label="Text"
          value="manual"
          icon={<Search color={activeTab === 0 ? 'primary' : 'inherit'} />}
        />

        <BottomNavigationAction
          label="Scan"
          value="camera"
          icon={<CameraAlt color={activeTab === 1 ? 'primary' : 'inherit'} />}
        />

        <BottomNavigationAction
          label="Recent"
          value="recent"
          icon={<History />}
        />
      </BottomNavigation>
    </Paper>
  )
}