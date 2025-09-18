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
  Settings,
} from '@mui/icons-material'
import Footer from '@/components/layout/Footer'
import ProfileSettingsMobileBottomNav from '@/components/layout/ProfileSettingsMobileBottomNav'

export default function SettingsPage() {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button 
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/')}
          >
            Back to App
          </Button>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings /> Settings
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            General application settings. Theme settings are now available in the header menu (palette icon), 
            and security settings have moved to their own dedicated page.
          </Typography>
        </Alert>

        {/* Quick Links */}
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Quick Links
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/security')}
          >
            Security Settings
          </Button>
        </Box>

        {/* Future Settings Section */}
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          More Settings Coming Soon
        </Typography>
        
        <Alert severity="info">
          <Typography variant="body2">
            Additional customization options will be added here in future updates, including notification preferences, display options, and more.
            <br /><br />
            <strong>Theme settings</strong> (Dark Mode, Theme Color) are now available via the palette icon in the header.
            <br />
            <strong>Security settings</strong> (Password, 2FA, Passkeys) have moved to the Security page accessible from the user menu.
          </Typography>
        </Alert>
      </Paper>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <ProfileSettingsMobileBottomNav
        currentPage="settings"
        onLibraryClick={() => router.push('/library')}
        onAccountClick={() => router.push('/profile')}
        onLocationsClick={() => router.push('/locations')}
        onSettingsClick={() => router.push('/settings')}
      />
    </Container>
  )
}