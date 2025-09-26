'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ReportProblem,
} from '@mui/icons-material'
import RemovalRequestManager from './RemovalRequestManager'
import GenreRequestManager from './GenreRequestManager'
import AdminSignupManager from './AdminSignupManager'
import { lazy, Suspense } from 'react'

const AppealManagement = lazy(() => import('./AppealManagement'))
import { getApiBaseUrl } from '@/lib/apiConfig'
import { useAdminPendingCounts } from '@/hooks/useAdminPendingCounts'

const ReviewModeration = lazy(() => import('./ReviewModerationComponent'))
const AdminSeriesReview = lazy(() => import('./AdminSeriesReview'))

interface NotificationCounts {
  pendingRemovalRequests: number
  pendingReviews: number
  pendingSignupRequests: number
  overdueCheckouts: number
  monthlyReminders: number
  pendingInvitations: number
  pendingGenreRequests: number
  pendingSeries: number
  pendingAppeals: number
}

interface AdminNotificationCenterProps {
  onDataChange?: () => void;
}

export default function AdminNotificationCenter({ onDataChange }: AdminNotificationCenterProps = {}) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState(0)
  const { counts: adminCounts, refreshCounts } = useAdminPendingCounts()
  const [genreRequests, setGenreRequests] = useState(0)
  const [pendingAppeals, setPendingAppeals] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  const loadNotificationCounts = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      // Refresh the shared admin counts (handles pendingRequests, pendingReviews, pendingSignupRequests, pendingSeries)
      await refreshCounts()

      // Load genre requests count separately (not included in shared hook yet)
      const genreRequestsResponse = await fetch(`${getApiBaseUrl()}/api/admin/genre-requests`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (genreRequestsResponse.ok) {
        const genreRequestsData = await genreRequestsResponse.json()
        const pendingCount = genreRequestsData.filter((req: any) => req.status === 'pending').length
        setGenreRequests(pendingCount)
      }

      // Load appeals count
      const appealsResponse = await fetch(`${getApiBaseUrl()}/api/appeals`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (appealsResponse.ok) {
        const appealsData = await appealsResponse.json()
        const pendingAppealsCount = appealsData.appeals.filter((appeal: any) => appeal.status === 'pending').length
        setPendingAppeals(pendingAppealsCount)
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
  }, [session?.user?.email, refreshCounts, onDataChange])

  // Map shared counts to local counts interface for backwards compatibility
  const counts = {
    pendingRemovalRequests: adminCounts.pendingRequests,
    pendingReviews: adminCounts.pendingReviews,
    pendingSignupRequests: adminCounts.pendingSignupRequests,
    pendingSeries: adminCounts.pendingSeries,
    pendingGenreRequests: genreRequests,
    pendingAppeals: pendingAppeals,
    overdueCheckouts: 0,
    monthlyReminders: 0,
    pendingInvitations: 0
  }

  useEffect(() => {
    if (session?.user?.email && !dataLoaded) {
      loadNotificationCounts()
      setDataLoaded(true)
    }
  }, [session?.user?.email, dataLoaded, loadNotificationCounts])

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
                <Badge badgeContent={counts.pendingSeries} color="secondary">
                  Series Reviews
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={counts.pendingAppeals} color="primary">
                  Appeals
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
            <Box sx={{ p: 3 }}>
              <Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Loading series reviews...</Box>}>
                <AdminSeriesReview onCountChange={loadNotificationCounts} />
              </Suspense>
            </Box>
          )}

          {activeTab === 5 && (
            <Box sx={{ p: 3 }}>
              <Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Loading appeals...</Box>}>
                <AppealManagement onCountChange={loadNotificationCounts} />
              </Suspense>
            </Box>
          )}

          {activeTab === 6 && (
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

          {activeTab === 7 && (
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

          {activeTab === 8 && (
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