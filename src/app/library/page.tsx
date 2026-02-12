'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { Container, CircularProgress, Typography, Box } from '@mui/material'
import BookLibrary from '@/components/library/BookLibrary'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

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

  if (!session) {
    return null
  }

  // Extract URL parameters for search functionality
  const searchTerm = searchParams.get('search')
  const category = searchParams.get('category')
  const statusFilter = searchParams.get('status')


  const urlFilters = {
    location: '',
    shelf: '',
    status: statusFilter || '',
    searchTerm: searchTerm || '',
    category: category || '',
  }


  return (
    <ErrorBoundary>
      <BookLibrary initialFilters={urlFilters} />
    </ErrorBoundary>
  )
}