'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Fade,
  Container,
  Paper,
  Badge
} from '@mui/material'
import {
  Analytics,
  People,
  Notifications,
  LocationOn,
  Refresh,
  Category,
  LibraryBooks,
} from '@mui/icons-material'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { useAdminPendingCounts } from '@/hooks/useAdminPendingCounts'

// Lazy load admin components for better performance
const AdminAnalytics = lazy(() => import('./AdminAnalytics'))
const AdminUserManager = lazy(() => import('./AdminUserManager'))
const AdminNotificationCenter = lazy(() => import('./AdminNotificationCenter'))
const LocationManager = lazy(() => import('./LocationManager'))
const GenreManager = lazy(() => import('./GenreManager'))

// Loading component for lazy-loaded admin components
const AdminComponentLoader = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight={400}
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      Loading admin component...
    </Typography>
  </Box>
)

const TAB_NAMES = ['notifications', 'analytics', 'users', 'locations', 'genres']
const TAB_INDEX_MAP: { [key: string]: number } = {
  'notifications': 0,
  'analytics': 1,
  'users': 2,
  'locations': 3,
  'genres': 4,
}

interface AdminOverview {
  totalBooks: number
  totalUsers: number
  totalLocations: number
  pendingRequests: number
  pendingReviews: number
  pendingSignupRequests: number
  unorganizedBooks: number
  recentBooks: number
  recentCheckouts: number
}

interface AdminDashboardProps {
  initialTab?: string
  onDataChange?: () => void
}

export default function AdminDashboard({ initialTab, onDataChange }: AdminDashboardProps = {}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { counts: adminCounts } = useAdminPendingCounts()

  useEffect(() => {
    // Only run on initial mount to set tab from URL/prop
    let tabName = 'notifications' // default
    
    if (initialTab) {
      tabName = initialTab
    }
    // Note: We don't read pathname here to avoid re-renders on URL changes
    // The initial tab is set via initialTab prop passed from page components
    
    const newTabIndex = TAB_INDEX_MAP[tabName] ?? 0
    setActiveTab(newTabIndex)
    setFadeIn(true)
  }, [initialTab]) // Only depend on initialTab

  useEffect(() => {
    if (session?.user?.email && !dataLoaded) {
      loadOverview()
      setDataLoaded(true)
    }
  }, [session?.user?.email, dataLoaded])

  // Removed automatic refresh - users can manually refresh when needed

  const loadOverview = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      const response = await fetch(`${getApiBaseUrl()}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOverview(data.overview)
        setError('')
        // Notify parent about data change
        onDataChange?.()
      } else if (response.status === 403) {
        setError('Admin privileges required to access this dashboard')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load admin dashboard')
      }
    } catch (error) {
      console.error('Error loading admin overview:', error)
      setError('Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setDataLoaded(false)
    loadOverview()
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // If switching to a different tab, trigger fade out
    if (newValue !== activeTab) {
      setIsTransitioning(true)
      setFadeIn(false)
      
      setTimeout(() => {
        setActiveTab(newValue)
        const tabName = TAB_NAMES[newValue]
        
        // Fade in the new content after a short delay to ensure content is ready
        setTimeout(() => {
          setFadeIn(true)
          
          // URL updates disabled for subtabs to prevent flash during transitions
          
          // Clear transition flag after fade completes
          setTimeout(() => {
            setIsTransitioning(false)
          }, 500)
        }, 50)
      }, 250) // Half of the timeout to create smooth transition
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pb: 2 }}>
        <Paper sx={{ p: 3, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            🔧 Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography color="text.secondary">
              Loading admin dashboard...
            </Typography>
          </Box>
        </Paper>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ pb: 2 }}>
        <Paper sx={{ p: 3, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            🔧 Admin Dashboard
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ pb: 2 }}>
      <Paper sx={{ p: 3, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🔧 Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadOverview}
          size="small"
        >
          Refresh
        </Button>
      </Box>


      {/* Navigation Tabs */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto" 
          TabIndicatorProps={{ style: { display: 'none' } }}
          sx={{
            '& .MuiTab-root.Mui-selected': {
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: (theme) => theme.palette.background.paper,
              }
            }
          }}
        >
          <Tab
            icon={
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
                <Notifications />
              </Badge>
            }
            label="Notifications"
            iconPosition="start"
          />
          <Tab
            icon={<Analytics />}
            label={`Analytics ${overview ? `(${overview.totalBooks} books)` : ''}`}
            iconPosition="start"
          />
          <Tab
            icon={<People />}
            label={`Users ${overview ? `(${overview.totalUsers})` : ''}`}
            iconPosition="start"
          />
          <Tab
            icon={<LocationOn />}
            label={`Locations ${overview ? `(${overview.totalLocations})` : ''}`}
            iconPosition="start"
          />
          <Tab
            icon={<Category />}
            label="Genres"
            iconPosition="start"
          />
        </Tabs>
        {/* Border line that appears behind tabs */}
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.12)',
          zIndex: 0,
        }} />
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 3, position: 'relative', minHeight: '400px' }}>
        <Fade 
          in={fadeIn} 
          timeout={500}
        >
          <Box>
            {activeTab === 0 && (
              <Suspense fallback={<AdminComponentLoader />}>
                <AdminNotificationCenter onDataChange={onDataChange} />
              </Suspense>
            )}

            {activeTab === 1 && (
              <Suspense fallback={<AdminComponentLoader />}>
                <AdminAnalytics />
              </Suspense>
            )}

            {activeTab === 2 && (
              <Suspense fallback={<AdminComponentLoader />}>
                <AdminUserManager />
              </Suspense>
            )}

            {activeTab === 3 && (
              <Suspense fallback={<AdminComponentLoader />}>
                <LocationManager />
              </Suspense>
            )}

            {activeTab === 4 && (
              <Suspense fallback={<AdminComponentLoader />}>
                <GenreManager />
              </Suspense>
            )}

          </Box>
        </Fade>
      </Box>
      </Paper>
    </Container>
  )
}