'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { Container, CircularProgress, Typography, Box } from '@mui/material'
import BookLibrary from '@/components/BookLibrary'
import AppLayout from '@/components/AppLayout'

export default function FilteredLibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
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

  // Parse URL filters: /library/location/shelf/status
  const filters = Array.isArray(params.filters) ? params.filters : []
  const [location, shelf, checkoutStatus] = filters

  // Also support search params for search terms and other filters
  const searchTerm = searchParams.get('search')
  const category = searchParams.get('category')

  const urlFilters = {
    location: location ? decodeURIComponent(location) : '',
    shelf: shelf ? decodeURIComponent(shelf) : '',
    status: checkoutStatus ? decodeURIComponent(checkoutStatus) : '',
    searchTerm: searchTerm || '',
    category: category || '',
  }

  return (
    <AppLayout currentPage="library">
      <BookLibrary initialFilters={urlFilters} />
    </AppLayout>
  )
}