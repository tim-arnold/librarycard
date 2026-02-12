'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
  Link,
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
  Lock,
  Notifications,
} from '@mui/icons-material'
import Footer from './Footer'
import HelpModal from '@/components/modals/HelpModal'
import ThemeMenu from './ThemeMenu'
import { useTheme } from '@/lib/ThemeContext'
import AccessibleIcon from '@/components/ui/AccessibleIcon'
import { SkipLinks } from '@/components/ui/SkipLink'
import { useUnreadNotificationCount, useNotifications } from '@/hooks/useNotifications'
import { useAdminPendingCounts } from '@/hooks/useAdminPendingCounts'
import { useRejectedReviewNotifications } from '@/hooks/useRejectedReviewNotifications'

interface AppLayoutProps {
  children: React.ReactNode
  currentPage: 'library' | 'add-books' | 'admin'
}

export default function AppLayout({ children, currentPage }: AppLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { isDarkMode: _isDarkMode, toggleTheme: _toggleTheme } = useTheme()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const [canAddBooks, setCanAddBooks] = useState<boolean>(true) // Assume true initially to avoid flash
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const dataLoadedRef = useRef(false)
  const { unreadCount, refreshCount } = useUnreadNotificationCount()
  const { counts: adminCounts } = useAdminPendingCounts()
  const { unreadRejectedCount, refreshRejectedReviews } = useRejectedReviewNotifications()

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

  // Refresh notification counts when user returns to the page/tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.email) {
        // User returned to the tab, refresh notification counts
        refreshCount()
        refreshRejectedReviews()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also refresh when the component mounts or session changes
    if (session?.user?.email) {
      refreshCount()
      refreshRejectedReviews()
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.user?.email, refreshCount, refreshRejectedReviews])

  // Refresh notification counts when user navigates to different pages
  useEffect(() => {
    if (session?.user?.email) {
      refreshCount()
      refreshRejectedReviews()
    }
  }, [pathname, session?.user?.email, refreshCount, refreshRejectedReviews])

  // Listen for notification updates from other components
  useEffect(() => {
    const handleNotificationUpdate = () => {
      if (session?.user?.email) {
        refreshCount()
        refreshRejectedReviews()
      }
    }

    window.addEventListener('notificationUpdated', handleNotificationUpdate)
    
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate)
    }
  }, [session?.user?.email, refreshCount, refreshRejectedReviews])

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
    router.push('/security')
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
      <SkipLinks />
      <AppBar position="static" color="primary" component="header" role="banner">
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard sx={{ mr: 1, verticalAlign: 'middle' }} aria-hidden="true" /> LibraryCard
          </Typography>
          
          <Typography variant="body2" sx={{ mr: 2 }}>
            Hello, {userFirstName || session?.user?.name?.split(' ')[0] || 'User'}!
          </Typography>
          
          <ThemeMenu />
          
          <Badge 
            badgeContent={(unreadCount + unreadRejectedCount) > 0 ? (unreadCount + unreadRejectedCount) : undefined} 
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.85rem',
                height: '22px',
                minWidth: '22px',
                borderRadius: '11px',
                fontWeight: 'bold',
                top: '8px',
                right: '8px',
              }
            }}
          >
            <AccessibleIcon
              icon={<AccountCircle sx={{ fontSize: '2.5rem' }} />}
              ariaLabel="Open user menu to access profile, settings, and account options"
              tooltip="Profile & Settings"
              onClick={handleMenuOpen}
              color="inherit"
              size="medium"
              sx={{ '& button': { id: 'user-menu-button' } }}
            />
          </Badge>
          
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
            aria-labelledby="user-menu-button"
            role="menu"
          >
            <MenuItem onClick={handleProfileClick}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); router.push('/notifications'); }}>
              <Badge 
                badgeContent={(unreadCount + unreadRejectedCount) > 0 ? (unreadCount + unreadRejectedCount) : undefined} 
                color="error"
                sx={{ mr: 1 }}
              >
                <Notifications />
              </Badge>
              Notifications
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
              <Lock sx={{ mr: 1 }} />
              Security
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
      
      <Container maxWidth="xl" sx={{ pt: 2, pb: 0 }} component="nav" role="navigation" aria-label="Main navigation" id="main-navigation">
        <Box sx={{
          borderRadius: 0,
          backgroundColor: (theme) => theme.palette.background.default,
          boxShadow: 'none',
          paddingLeft: 2, // Match Paper component padding (24px)
          paddingRight: 2,
        }}>
          <Box
            component="nav"
            role="navigation"
            aria-label="Primary navigation"
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/library"
              underline="none"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.5,
                borderRadius: 1,
                color: 'text.primary',
                backgroundColor: currentPage === 'library' ? (theme) => {
                  if (theme.palette.mode === 'dark') {
                    const primary = theme.palette.primary.main
                    if (primary.includes('d8b4fe')) return '#251a2d' // Purple
                    if (primary.includes('86efac')) return '#1a2e20' // Green
                    if (primary.includes('fca5a5')) return '#2d1515' // Red
                    if (primary.includes('93c5fd')) return '#1a2332' // Blue
                    if (primary.includes('fcd34d')) return '#2d2415' // Amber
                    return '#1e293b' // Indigo (default)
                  } else {
                    return theme.palette.background.paper
                  }
                } : 'transparent',
                transition: 'all 0.2s ease',
                fontWeight: currentPage === 'library' ? 600 : 400,
                '&:hover': {
                  backgroundColor: currentPage !== 'library' ? 'rgba(0, 0, 0, 0.04)' : undefined,
                },
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px'
                }
              }}
            >
              <LibraryBooks aria-hidden="true" />
              {!userDataLoaded ? "..." : (isAdmin(userRole) ? "Libraries" : (userLocation ? `${userLocation}` : "My Library"))}
            </Link>

            {(isAdmin(userRole) || canAddBooks) && (
              <Link
                href="/add-books"
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  color: 'text.primary',
                  backgroundColor: currentPage === 'add-books' ? (theme) => {
                    if (theme.palette.mode === 'dark') {
                      const primary = theme.palette.primary.main
                      if (primary.includes('d8b4fe')) return '#251a2d' // Purple
                      if (primary.includes('86efac')) return '#1a2e20' // Green
                      if (primary.includes('fca5a5')) return '#2d1515' // Red
                      if (primary.includes('93c5fd')) return '#1a2332' // Blue
                      if (primary.includes('fcd34d')) return '#2d2415' // Amber
                      return '#1e293b' // Indigo (default)
                    } else {
                      return theme.palette.background.paper
                    }
                  } : 'transparent',
                  transition: 'all 0.2s ease',
                  fontWeight: currentPage === 'add-books' ? 600 : 400,
                  '&:hover': {
                    backgroundColor: currentPage !== 'add-books' ? 'rgba(0, 0, 0, 0.04)' : undefined,
                  },
                  '&:focus': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '2px'
                  }
                }}
              >
                <QrCodeScanner aria-hidden="true" />
                Add Books
              </Link>
            )}

            {isAdmin(userRole) && (
              <Link
                href="/admin"
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  color: 'text.primary',
                  backgroundColor: currentPage === 'admin' ? (theme) => {
                    if (theme.palette.mode === 'dark') {
                      const primary = theme.palette.primary.main
                      if (primary.includes('d8b4fe')) return '#251a2d' // Purple
                      if (primary.includes('86efac')) return '#1a2e20' // Green
                      if (primary.includes('fca5a5')) return '#2d1515' // Red
                      if (primary.includes('93c5fd')) return '#1a2332' // Blue
                      if (primary.includes('fcd34d')) return '#2d2415' // Amber
                      return '#1e293b' // Indigo (default)
                    } else {
                      return theme.palette.background.paper
                    }
                  } : 'transparent',
                  transition: 'all 0.2s ease',
                  fontWeight: currentPage === 'admin' ? 600 : 400,
                  '&:hover': {
                    backgroundColor: currentPage !== 'admin' ? 'rgba(0, 0, 0, 0.04)' : undefined,
                  },
                  '&:focus': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '2px'
                  }
                }}
              >
                <Badge
                  badgeContent={adminCounts.total > 0 ? adminCounts.total : undefined}
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
                  <Dashboard aria-hidden="true" />
                </Badge>
                Admin Dashboard
              </Link>
            )}
          </Box>
        </Box>
      </Container>

      <Container maxWidth="xl" sx={{ pt: 0, pb: 2 }} component="main" role="main" id="main-content">
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