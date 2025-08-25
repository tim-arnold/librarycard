'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, CircularProgress, Typography, Box } from '@mui/material'
import HomePage from '@/components/marketing/pages/HomePage'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // Check for invitation token from Google OAuth redirect
      const invitationToken = searchParams.get('invitation')
      if (invitationToken) {
        // Redirect to library with invitation token
        router.push(`/library?invitation=${invitationToken}`)
        return
      }

      // Default redirect to library for authenticated users
      router.push('/library')
    }
    // If not authenticated, show marketing homepage (no redirect)
  }, [session, status, router, searchParams])

  if (status === 'loading') {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  // If authenticated, let the useEffect handle redirection and show loading
  if (session) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography>Redirecting to your library...</Typography>
        </Box>
      </Container>
    )
  }

  // Show marketing homepage for unauthenticated users
  return <HomePage />
}