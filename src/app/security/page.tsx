'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
} from '@mui/material'
import {
  ArrowBack,
  Security,
} from '@mui/icons-material'
import Footer from '@/components/layout/Footer'
import SecuritySettings from '@/components/settings/SecuritySettings'
import ProfileSettingsMobileBottomNav from '@/components/layout/ProfileSettingsMobileBottomNav'

export default function SecurityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      setLoading(false)
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <Typography>Loading...</Typography>
        </Box>
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
            <Security /> Security
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Manage your account security settings including passwords, two-factor authentication, and passkeys.
          </Typography>
        </Alert>

        <SecuritySettings />
      </Paper>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <ProfileSettingsMobileBottomNav
        currentPage="settings"
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
        notificationCount={0} // TODO: Get actual notification count
      />
    </Container>
  )
}