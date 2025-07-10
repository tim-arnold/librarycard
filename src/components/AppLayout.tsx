'use client'

import { useState, useEffect } from 'react'
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
  DarkMode,
  LightMode,
  Help,
  Dashboard,
} from '@mui/icons-material'
import Footer from '@/components/Footer'
import HelpModal from '@/components/HelpModal'
import { useTheme } from '@/lib/ThemeContext'

interface AppLayoutProps {
  children: React.ReactNode
  currentPage: 'library' | 'add-books' | 'admin'
}

export default function AppLayout({ children, currentPage }: AppLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDarkMode, toggleTheme } = useTheme()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  useEffect(() => {
    if (session) {
      // Check for invitation token from Google OAuth redirect
      const invitationToken = searchParams.get('invitation')
      if (invitationToken) {
        handleInvitationAcceptance(invitationToken)
      }

      // Fetch user profile data
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user_role) {
            setUserRole(data.user_role)
          }
          if (data.first_name) {
            setUserFirstName(data.first_name)
          }
        })
        .catch(err => console.error('Failed to fetch user role:', err))

      // Fetch user's locations to get the location name for regular users
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'
      fetch(`${API_BASE}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${session.user?.email}`,
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(locations => {
          if (locations && locations.length > 0) {
            setUserLocation(locations[0].name)
          }
        })
        .catch(err => console.error('Failed to fetch user locations:', err))
    }
  }, [session, searchParams])

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
        
        const locationsResponse = await fetch(`${API_BASE}/api/locations`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        })
        const locations = await locationsResponse.json()
        if (locations && locations.length > 0) {
          setUserLocation(locations[0].name)
        }
      } else {
        console.error('Failed to accept invitation:', data.error)
      }
    } catch (error) {
      console.error('Invitation acceptance error:', error)
    }
  }

  const handleSignOut = () => {
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
            onClick={toggleTheme}
            size="small"
            sx={{ mr: 1 }}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
          
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
              label={isAdmin(userRole) ? "Libraries" : (userLocation ? `${userLocation} Library` : "My Library")}
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