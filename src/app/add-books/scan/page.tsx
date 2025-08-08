'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, lazy, Suspense } from 'react'
import { Container, CircularProgress, Typography, Box } from '@mui/material'

// Lazy load AddBooks component for better initial page load performance
const AddBooks = lazy(() => import('@/components/book/AddBooks'))

// Loading component for the ISBN scanner feature
const ScannerLoader = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight={400}
      flexDirection="column"
      gap={2}
    >
      <CircularProgress size={40} />
      <Typography variant="h6" color="text.secondary">
        Loading ISBN scanner...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Camera and barcode detection tools
      </Typography>
    </Box>
  </Container>
)

export default function AddBooksScanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return null
  }

  return (
    <Suspense fallback={<ScannerLoader />}>
      <AddBooks initialTab="scan" />
    </Suspense>
  )
}