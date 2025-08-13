'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { authenticatedApiCall } from '@/lib/api'
import { isAdmin, isSuperAdmin } from '@/lib/permissions'
import { authenticatedFetch } from '@/lib/auth-utils'
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material'
import {
  QrCodeScanner,
  LibraryBooks,
  AccountCircle,
  ExitToApp,
  Help,
  Dashboard,
  LocationOn,
  History,
  Settings,
  CreditCard,
} from '@mui/icons-material'
import Footer from './Footer'
import HelpModal from '@/components/modals/HelpModal'
import { useTheme } from '@/lib/ThemeContext'
import AccessibleIcon from '@/components/ui/AccessibleIcon'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'

interface AppLayoutProps {
  children: React.ReactNode
  currentPage: 'library' | 'add-books' | 'admin'
}

export default function AppLayout({ children, currentPage }: AppLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDarkMode: _isDarkMode, toggleTheme: _toggleTheme } = useTheme()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const [canAddBooks, setCanAddBooks] = useState<boolean>(true) // Assume true initially to avoid flash
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const dataLoadedRef = useRef(false)
  const { unreadCount } = useUnreadNotificationCount()

  useEffect(() => {
    if (session && !dataLoadedRef.current) {
      dataLoadedRef.current = true // Prevent multiple loads
      
      // Check for invitation token from Google OAuth redirect
      const invitationToken = searchParams.get('invitation')
      if (invitationToken) {
        handleInvitationAcceptance(invitationToken)
        return
      }

      // Load user data only once
      loadUserData()
      checkAddBooksPermission()
    }
  }, [session]) // Only depend on session
  
  // Reset data loaded flag when session changes
  useEffect(() => {
    if (!session) {
      dataLoadedRef.current = false
      setUserDataLoaded(false)
      setUserRole(null)
      setUserFirstName(null)
      setUserLocation(null)
      setCanAddBooks(true) // Reset to default
    }
  }, [session])

  const loadUserData = async () => {
    
    try {
      // Fetch both user profile and locations in parallel to avoid race condition
      const [profileData, locations] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.json()),
        fetch(`${getApiBaseUrl()}/api/locations`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.json())
      ])

      // Set user role and name from profile
      if (profileData.user_role) {
        setUserRole(profileData.user_role)
      }
      if (profileData.first_name) {
        setUserFirstName(profileData.first_name)
      }
      
      // Set user location from locations
      if (locations && locations.length > 0) {
        setUserLocation(locations[0].name)
      }
      
      // Mark data as loaded to prevent flicker
      setUserDataLoaded(true)
    } catch (err) {
      console.error('Failed to fetch user data:', err)
      // Still mark as loaded even on error to prevent infinite loading
      setUserDataLoaded(true)
    }
  }

  const checkAddBooksPermission = async () => {
    if (!session?.user?.email) return
    
    try {
      // Get all user's locations for permission checking
      const locationsResponse = await authenticatedFetch(session, '/api/locations')
      
      if (locationsResponse.success && Array.isArray(locationsResponse.data) && locationsResponse.data.length > 0) {
        const locations = locationsResponse.data as { id: number; name: string }[]
        
        // Check if user has can_add_books permission for ANY location
        let hasPermissionInAnyLocation = false
        
        for (const location of locations) {
          const permissionResult = await authenticatedFetch(
            session, 
            `/api/permissions/check?locationId=${location.id}&permission=can_add_books`
          )
          
          if (permissionResult.success) {
            const permissionData = permissionResult.data as { hasPermission: boolean }
            if (permissionData?.hasPermission) {
              hasPermissionInAnyLocation = true
              break // Found permission in at least one location, no need to check more
            }
          }
        }
        
        setCanAddBooks(hasPermissionInAnyLocation)
      } else {
        // If no locations, they can't add books
        setCanAddBooks(false)
      }
    } catch (err) {
      console.error('Error checking add books permission:', err)
      // On error, assume they can add books (fail open for better UX)
      setCanAddBooks(true)
    }
  }

  const handleInvitationAcceptance = async (token: string) => {
    
    try {
      const response = await authenticatedApiCall('/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          invitation_token: token,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const url = new URL(window.location.href)
        url.searchParams.delete('invitation')
        window.history.replaceState({}, '', url.toString())
        
        console.log(`Successfully joined ${data.location_name}!`)
        
        // Reload user data after successful invitation acceptance
        await loadUserData()
      } else {
        console.error('Failed to accept invitation:', data.error)
      }
    } catch (error) {
      console.error('Invitation acceptance error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      // Clear user cache on the worker before signing out
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Error clearing user cache on logout:', error)
      // Continue with logout even if cache clearing fails
    }
    
    signOut({ callbackUrl: '/auth/signin' })
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProfileClick = () => {
    router.push('/profile')
    handleMenuClose()
  }

  const handleLocationsClick = () => {
    router.push('/locations')
    handleMenuClose()
  }

  const handleCheckoutHistoryClick = () => {
    router.push('/checkout-history')
    handleMenuClose()
  }

  const handleSettingsClick = () => {
    router.push('/settings')
    handleMenuClose()
  }

  const handleHelpClick = () => {
    setHelpModalOpen(true)
    handleMenuClose()
  }

  const handleTabChange = (route: string) => {
    router.push(route)
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard sx={{ mr: 1, verticalAlign: 'middle' }} /> LibraryCard
          </Typography>
          
          <Typography variant="body2" sx={{ mr: 2 }}>
            Hello, {userFirstName || session?.user?.name?.split(' ')[0] || 'User'}!
          </Typography>
          
          <AccessibleIcon
            icon={<AccountCircle />}
            ariaLabel="Open user menu to access profile, settings, and account options"
            tooltip="Profile & Settings"
            onClick={handleMenuOpen}
            color="inherit"
            size="small"
          />
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLocationsClick}>
              <LocationOn sx={{ mr: 1 }} />
              Locations
            </MenuItem>
            <MenuItem onClick={handleCheckoutHistoryClick}>
              <History sx={{ mr: 1 }} />
              Checkout History
            </MenuItem>
            <MenuItem onClick={handleSettingsClick}>
              <Settings sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleHelpClick}>
              <Help sx={{ mr: 1 }} />
              Help
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <ExitToApp sx={{ mr: 1 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ pt: 2, pb: 0 }}>
        <Box sx={{ 
          borderRadius: 0, 
          backgroundColor: (theme) => theme.palette.background.default,
          boxShadow: 'none',
          paddingLeft: 2, // Match Paper component padding (24px)
          paddingRight: 2,
        }}>
          <Tabs 
            value={currentPage} 
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ style: { display: 'none' } }}
            sx={{
              '& .MuiTab-root.Mui-selected': {
                // Main navigation tabs need exact color match with content
                backgroundColor: (theme) => {
                  if (theme.palette.mode === 'dark') {
                    // Use the exact content background color for each theme variant
                    const primary = theme.palette.primary.main
                    
                    // Map primary colors to content backgrounds - use exact Paper component colors
                    // Check primary[300] values (used in dark mode)
                    if (primary.includes('d8b4fe')) return '#251a2d !important' // Purple (#d8b4fe)
                    if (primary.includes('86efac')) return '#1a2e20 !important' // Green (#86efac)  
                    if (primary.includes('fca5a5')) return '#2d1515 !important' // Red (#fca5a5)
                    if (primary.includes('93c5fd')) return '#1a2332 !important' // Blue (#93c5fd)
                    if (primary.includes('fcd34d')) return '#2d2415 !important' // Amber (#fcd34d)
                    return '#1e293b !important' // Indigo (default - #a5b4fc)
                  } else {
                    return theme.palette.background.paper + ' !important'
                  }
                },
              }
            }}
          >
            <Tab 
              value="library" 
              label={!userDataLoaded ? "..." : (isAdmin(userRole) ? "Libraries" : (userLocation ? `${userLocation}` : "My Library"))}
              icon={<LibraryBooks />}
              iconPosition="start"
              onClick={() => handleTabChange('/library')}
            />
            {(isAdmin(userRole) || canAddBooks) && (
              <Tab 
                value="add-books" 
                label="Add Books"
                icon={<QrCodeScanner />}
                iconPosition="start"
                onClick={() => handleTabChange('/add-books')}
              />
            )}
            {isAdmin(userRole) && (
              <Tab 
                value="admin" 
                label="Admin Dashboard"
                icon={
                  <Badge 
                    badgeContent={unreadCount > 0 ? unreadCount : undefined} 
                    color="primary"
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        height: '18px',
                        minWidth: '18px',
                        borderRadius: '9px',
                      }
                    }}
                  >
                    <Dashboard />
                  </Badge>
                }
                iconPosition="start"
                onClick={() => handleTabChange('/admin')}
              />
            )}
          </Tabs>
        </Box>
      </Container>

      <Container maxWidth="xl" sx={{ pt: 0, pb: 2 }}>
        {children}
      </Container>
      
      <Footer />
      
      <HelpModal 
        open={helpModalOpen} 
        onClose={() => setHelpModalOpen(false)} 
      />
    </Box>
  )
}