'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isAdmin } from '@/lib/permissions'
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
} from '@mui/icons-material'
import Footer from '@/components/Footer'
import HelpModal from '@/components/modals/HelpModal'
import { useTheme } from '@/lib/ThemeContext'

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const dataLoadedRef = useRef(false)

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
    }
  }, [session])

  const loadUserData = async () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'
    
    try {
      // Fetch both user profile and locations in parallel to avoid race condition
      const [profileData, locations] = await Promise.all([
        fetch('/api/profile').then(res => res.json()),
        fetch(`${API_BASE}/api/locations`, {
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

  const handleInvitationAcceptance = async (token: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'
    
    try {
      const response = await fetch(`${API_BASE}/api/invitations/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
          'Content-Type': 'application/json',
        },
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
            📚 LibraryCard
          </Typography>
          
          <Typography variant="body2" sx={{ mr: 2 }}>
            Hello, {userFirstName || session?.user?.name?.split(' ')[0] || 'User'}!
          </Typography>
          
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            size="small"
          >
            <AccountCircle />
          </IconButton>
          
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
      
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Paper sx={{ mb: 2 }}>
          <Tabs 
            value={currentPage} 
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              value="library" 
              label={!userDataLoaded ? "..." : (isAdmin(userRole) ? "Libraries" : (userLocation ? `${userLocation}` : "My Library"))}
              icon={<LibraryBooks />}
              iconPosition="start"
              onClick={() => handleTabChange('/library')}
            />
            <Tab 
              value="add-books" 
              label="Add Books"
              icon={<QrCodeScanner />}
              iconPosition="start"
              onClick={() => handleTabChange('/add-books')}
            />
            {isAdmin(userRole) && (
              <Tab 
                value="admin" 
                label="Admin Dashboard"
                icon={<Dashboard />}
                iconPosition="start"
                onClick={() => handleTabChange('/admin')}
              />
            )}
          </Tabs>
        </Paper>

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