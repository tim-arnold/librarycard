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
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material'
import {
  ArrowBack,
  Settings,
  DarkMode,
  LightMode,
  Palette,
  Security,
} from '@mui/icons-material'
import Footer from '@/components/layout/Footer'
import { useTheme } from '@/lib/ThemeContext'
import SecuritySettings from '@/components/settings/SecuritySettings'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
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
    <Container maxWidth="md" sx={{ py: 3 }}>
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
            Customize your LibraryCard experience with these settings.
          </Typography>
        </Alert>

        {/* Appearance Settings */}
        <Typography variant="h5" component="h2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Palette /> Appearance
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" component="h3" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isDarkMode ? <DarkMode /> : <LightMode />}
                  Dark Mode
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isDarkMode ? 'Using dark theme' : 'Using light theme'}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                  />
                }
                label=""
              />
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Security Settings */}
        <Typography variant="h5" component="h2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security /> Security
        </Typography>
        
        <SecuritySettings />

        <Divider sx={{ my: 3 }} />

        {/* Future Settings Section */}
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          More Settings Coming Soon
        </Typography>
        
        <Alert severity="info">
          <Typography variant="body2">
            Additional customization options will be added here in future updates, including notification preferences, display options, and more.
          </Typography>
        </Alert>
      </Paper>
      
      <Footer />
    </Container>
  )
}