'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Badge,
  Button,
} from '@mui/material'
import {
  Notifications,
  CheckCircle,
  Schedule,
  Refresh,
  Event,
} from '@mui/icons-material'
import RemovalRequestManager from './RemovalRequestManager'
import GenreRequestManager from './GenreRequestManager'
import AdminSignupManager from './AdminSignupManager'
import { lazy, Suspense } from 'react'
import { getApiBaseUrl } from '@/lib/apiConfig'

const ReviewModeration = lazy(() => import('../../app/admin/reviews/page'))

interface NotificationCounts {
  pendingRemovalRequests: number
  pendingReviews: number
  pendingSignupRequests: number
  overdueCheckouts: number
  monthlyReminders: number
  pendingInvitations: number
  pendingGenreRequests: number
}

interface AdminNotificationCenterProps {
  onDataChange?: () => void;
}

export default function AdminNotificationCenter({ onDataChange }: AdminNotificationCenterProps = {}) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState(0)
  const [counts, setCounts] = useState<NotificationCounts>({
    pendingRemovalRequests: 0,
    pendingReviews: 0,
    pendingSignupRequests: 0,
    overdueCheckouts: 0,
    monthlyReminders: 0,
    pendingInvitations: 0,
    pendingGenreRequests: 0
  })
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (session?.user?.email && !dataLoaded) {
      loadNotificationCounts()
      setDataLoaded(true)
    }
  }, [session?.user?.email, dataLoaded])

  const loadNotificationCounts = async () => {
    if (!session?.user?.email) return

    try {
      // Load analytics data to get pending requests count
      const analyticsResponse = await fetch(`${getApiBaseUrl()}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setCounts(prev => ({
          ...prev,
          pendingRemovalRequests: analyticsData.overview.pendingRequests || 0,
          pendingReviews: analyticsData.overview.pendingReviews || 0,
          pendingSignupRequests: analyticsData.overview.pendingSignupRequests || 0
        }))
      }

      // Load genre requests count
      const genreRequestsResponse = await fetch(`${getApiBaseUrl()}/api/admin/genre-requests`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (genreRequestsResponse.ok) {
        const genreRequests = await genreRequestsResponse.json()
        const pendingCount = genreRequests.filter((req: any) => req.status === 'pending').length
        setCounts(prev => ({
          ...prev,
          pendingGenreRequests: pendingCount
        }))
      }


      // TODO: Implement other notification counts when features are added
      // - Overdue checkouts (books checked out > 30 days)
      // - Monthly reminders (books still checked out for monthly notification)
      // - Pending invitations across all locations

      // Notify parent components about data change for immediate badge updates
      onDataChange?.()

    } catch (error) {
      console.error('Error loading notification counts:', error)
    }
  }

  // Set up automatic refresh every 30 seconds for dynamic updates
  useEffect(() => {
    if (session?.user?.email) {
      const interval = setInterval(loadNotificationCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.email]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} /> Notification Center
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadNotificationCounts}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Notification Detail Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab 
              label={
                <Badge badgeContent={counts.pendingRemovalRequests} color="warning">
                  Removal Requests
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={counts.pendingReviews} color="primary">
                  Review Moderation
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={counts.pendingSignupRequests} color="success">
                  Signup Requests
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={counts.pendingGenreRequests} color="info">
                  Genre Requests
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={counts.overdueCheckouts} color="error">
                  Overdue Checkouts
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={counts.monthlyReminders} color="info">
                  Monthly Reminders
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={counts.pendingInvitations} color="success">
                  Pending Invitations
                </Badge>
              }
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <RemovalRequestManager onCountChange={loadNotificationCounts} />
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Loading review moderation...</Box>}>
                <ReviewModeration onCountChange={loadNotificationCounts} />
              </Suspense>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <AdminSignupManager onCountChange={loadNotificationCounts} />
            </Box>
          )}

          {activeTab === 3 && (
            <Box sx={{ p: 3 }}>
              <GenreRequestManager onCountChange={loadNotificationCounts} />
            </Box>
          )}

          {activeTab === 4 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Overdue Checkout Tracking
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This feature will track books that have been checked out for extended periods and require follow-up.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Event sx={{ mr: 1, verticalAlign: 'middle' }} /> Coming soon: Automatic detection of books checked out for more than 30 days
              </Typography>
            </Box>
          )}

          {activeTab === 5 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Monthly Reminder System
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Automated monthly reminders for users who still have books checked out, without strict due dates.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📧 Coming soon: Gentle monthly email reminders for ongoing checkouts
              </Typography>
            </Box>
          )}

          {activeTab === 6 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Invitation Management
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Track and manage pending location invitations across the entire system.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📨 Coming soon: Centralized view of all pending invitations from all locations
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}