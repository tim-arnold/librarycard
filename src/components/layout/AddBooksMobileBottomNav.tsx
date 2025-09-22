'use client'

import { useEffect } from 'react'
import {
  MenuBook,
  CameraAlt,
  Keyboard,
  History,
} from '@mui/icons-material'
import { setStorageItem } from '@/lib/storage'
import DynamicMobileBottomNav, { NavigationItem } from './DynamicMobileBottomNav'

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
  // Set default based on current tab - camera if on scan tab, manual if on search tab
  const defaultValue = activeTab === 1 ? 'camera' : 'manual'

  // Note: localStorage is updated in the individual button handlers below
  // We don't use useEffect here to avoid race conditions

  // Enhanced action handlers that remember the last selected method
  const handleManualClick = () => {
    setStorageItem('addBooks_preferredTab', 'search', 'functional')
    onManualClick()
  }

  const handleCameraClick = () => {
    setStorageItem('addBooks_preferredTab', 'scan', 'functional')
    onCameraClick()
  }

  const navigationItems: NavigationItem[] = [
    {
      value: 'library',
      label: 'Library',
      icon: <MenuBook />,
      action: onLibraryClick,
    },
    {
      value: 'manual',
      label: 'Search',
      icon: <Keyboard color={activeTab === 0 ? 'primary' : 'inherit'} />,
      action: handleManualClick,
    },
    {
      value: 'camera',
      label: 'Scan',
      icon: <CameraAlt color={activeTab === 1 ? 'primary' : 'inherit'} />,
      action: handleCameraClick,
    },
    {
      value: 'recent',
      label: 'Recent',
      icon: <History />,
      action: onRecentClick,
    },
  ]

  return (
    <DynamicMobileBottomNav
      navigationItems={navigationItems}
      defaultValue={defaultValue}
    />
  )
}