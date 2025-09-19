'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
} from '@mui/material'
import {
  ArrowBack,
  Notifications,
} from '@mui/icons-material'
import UserNotificationCenter from '@/components/user/UserNotificationCenter'
import ProfileSettingsMobileBottomNav from '@/components/layout/ProfileSettingsMobileBottomNav'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Container>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Container maxWidth="md" sx={{ py: 3, pb: { xs: '80px', md: 3 } }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications /> Notifications
          </Typography>
        </Box>

        <UserNotificationCenter />
      </Paper>


      {/* Mobile Bottom Navigation */}
      <ProfileSettingsMobileBottomNav
        currentPage="notifications"
        onLibraryClick={() => router.push('/library')}
        onAccountClick={() => router.push('/profile')}
        onLocationsClick={() => router.push('/locations')}
        onSecurityClick={() => router.push('/security')}
        onNotificationsClick={() => router.push('/notifications')}
        onCheckoutHistoryClick={() => router.push('/checkout-history')}
        onHelpClick={() => {
          // TODO: Implement help modal or page
          console.log('Help clicked')
        }}
        notificationCount={0} // TODO: Get actual notification count from UserNotificationCenter
      />
    </Container>
  )
}