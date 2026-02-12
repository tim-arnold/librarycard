'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container, CircularProgress, Typography, Box } from '@mui/material'
import BookLibrary from '@/components/library/BookLibrary'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { slugToName, createSlugMap } from '@/lib/urlUtils'

export default function FilteredLibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [locationNames, setLocationNames] = useState<string[]>([])
  const [shelfNames, setShelfNames] = useState<string[]>([])
  const [namesLoaded, setNamesLoaded] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  // Load location and shelf names for slug conversion (only once)
  useEffect(() => {
    if (!session?.user?.email || namesLoaded) return

    const loadNamesForSlugConversion = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/locations`, {
          headers: {
            'Authorization': `Bearer ${session.user.email}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const locations = await response.json()
          const locationNamesList = locations.map((loc: { name: string }) => loc.name)
          setLocationNames(locationNamesList)
          
          // Load all shelf names
          const allShelfNames: string[] = []
          for (const location of locations) {
            const shelvesResponse = await fetch(`${getApiBaseUrl()}/api/locations/${location.id}/shelves`, {
              headers: {
                'Authorization': `Bearer ${session.user.email}`,
                'Content-Type': 'application/json',
              },
            })
            if (shelvesResponse.ok) {
              const shelves = await shelvesResponse.json()
              allShelfNames.push(...shelves.map((shelf: { name: string }) => shelf.name))
            }
          }
          setShelfNames(allShelfNames)
          setNamesLoaded(true)
        }
      } catch (error) {
        console.error('Failed to load location/shelf names for slug conversion:', error)
      }
    }

    loadNamesForSlugConversion()
  }, [session, namesLoaded])

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

  // Parse URL filters: /library/location/shelf (status moved to query params)
  const filters = Array.isArray(params.filters) ? params.filters : []
  const [locationSlug, shelfSlug] = filters

  // Convert slugs back to display names using reverse mapping
  const locationSlugMap = createSlugMap(locationNames)
  const shelfSlugMap = createSlugMap(shelfNames)

  // Support search params for search terms, status, and other filters
  const searchTerm = searchParams.get('search')
  const category = searchParams.get('category')
  const statusFilter = searchParams.get('status')


  const urlFilters = {
    location: locationSlug ? (locationSlugMap[locationSlug] || slugToName(locationSlug)) : '',
    shelf: shelfSlug ? (shelfSlugMap[shelfSlug] || slugToName(shelfSlug)) : '',
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