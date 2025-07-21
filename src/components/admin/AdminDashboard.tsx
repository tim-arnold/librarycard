'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Fade,
} from '@mui/material'
import {
  Dashboard,
  Analytics,
  People,
  Notifications,
  LocationOn,
  Refresh,
  PersonAdd,
} from '@mui/icons-material'
import AdminAnalytics from './AdminAnalytics'
import AdminUserManager from './AdminUserManager'
import AdminNotificationCenter from './AdminNotificationCenter'
import AdminSignupManager from './AdminSignupManager'
import LocationManager from './LocationManager'
import PageContainer from '../layout/PageContainer'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'

const TAB_NAMES = ['overview', 'analytics', 'users', 'locations', 'signup-requests', 'notifications']
const TAB_INDEX_MAP: { [key: string]: number } = {
  'overview': 0,
  'analytics': 1,
  'users': 2,
  'locations': 3,
  'signup-requests': 4,
  'notifications': 5,
}

interface AdminOverview {
  totalBooks: number
  totalUsers: number
  totalLocations: number
  pendingRequests: number
  unorganizedBooks: number
  recentBooks: number
  recentCheckouts: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && TAB_INDEX_MAP[tabFromUrl] !== undefined) {
      setActiveTab(TAB_INDEX_MAP[tabFromUrl])
    }
  }, [searchParams])

  useEffect(() => {
    if (session?.user?.email && !dataLoaded) {
      loadOverview()
      setDataLoaded(true)
    }
  }, [session?.user?.email, dataLoaded])

  const loadOverview = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOverview(data.overview)
        setError('')
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
    setActiveTab(newValue)
    const tabName = TAB_NAMES[newValue]
    const params = new URLSearchParams(searchParams.toString())
    
    if (tabName === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', tabName)
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/admin${newUrl}`, { scroll: false })
  }

  if (loading) {
    return (
      <PageContainer>
        <Typography variant="h4" component="h1" gutterBottom>
          🔧 Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress sx={{ mr: 2 }} />
          <Typography color="text.secondary">
            Loading admin dashboard...
          </Typography>
        </Box>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <Typography variant="h4" component="h1" gutterBottom>
          🔧 Admin Dashboard
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab 
            icon={<Dashboard />} 
            label="Overview" 
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
            icon={<PersonAdd />} 
            label="Signup Requests" 
            iconPosition="start"
          />
          <Tab 
            icon={<Notifications />} 
            label={`Notifications ${overview?.pendingRequests ? `(${overview.pendingRequests})` : ''}`}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 3, minHeight: '400px', position: 'relative' }}>
        <Fade in={activeTab === 0} timeout={300}>
          <Box sx={{ position: activeTab === 0 ? 'relative' : 'absolute', width: '100%', display: activeTab === 0 ? 'block' : 'none' }}>
            <Typography variant="h6" gutterBottom>
              📊 Dashboard Overview
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Welcome to the LibraryCard admin dashboard. Use the tabs above to navigate between different administrative functions:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" paragraph>
                <strong>Analytics:</strong> Detailed insights into library usage, popular genres, and user activity
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Users:</strong> Manage user accounts, roles, and permissions
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Locations:</strong> Manage physical locations, shelves, and invitations
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Signup Requests:</strong> Review and approve or deny new user signup requests
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Notifications:</strong> Review pending book removal requests and system notifications
              </Typography>
            </Box>
          </Box>
        </Fade>

        <Fade in={activeTab === 1} timeout={300}>
          <Box sx={{ position: activeTab === 1 ? 'relative' : 'absolute', width: '100%', display: activeTab === 1 ? 'block' : 'none' }}>
            <AdminAnalytics />
          </Box>
        </Fade>

        <Fade in={activeTab === 2} timeout={300}>
          <Box sx={{ position: activeTab === 2 ? 'relative' : 'absolute', width: '100%', display: activeTab === 2 ? 'block' : 'none' }}>
            <AdminUserManager />
          </Box>
        </Fade>

        <Fade in={activeTab === 3} timeout={300}>
          <Box sx={{ position: activeTab === 3 ? 'relative' : 'absolute', width: '100%', display: activeTab === 3 ? 'block' : 'none' }}>
            <LocationManager />
          </Box>
        </Fade>

        <Fade in={activeTab === 4} timeout={300}>
          <Box sx={{ position: activeTab === 4 ? 'relative' : 'absolute', width: '100%', display: activeTab === 4 ? 'block' : 'none' }}>
            <AdminSignupManager />
          </Box>
        </Fade>

        <Fade in={activeTab === 5} timeout={300}>
          <Box sx={{ position: activeTab === 5 ? 'relative' : 'absolute', width: '100%', display: activeTab === 5 ? 'block' : 'none' }}>
            <AdminNotificationCenter />
          </Box>
        </Fade>
      </Box>
    </PageContainer>
  )
}