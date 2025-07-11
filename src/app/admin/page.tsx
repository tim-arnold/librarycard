'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container, CircularProgress, Typography, Box } from '@mui/material'
import AdminDashboard from '@/components/AdminDashboard'
import { isAdmin } from '@/lib/permissions'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Fetch user role to check admin permissions
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setUserRole(data.user_role)
        setIsLoading(false)
        
        // Redirect non-admin users to library
        if (!isAdmin(data.user_role)) {
          router.push('/library')
        }
      })
      .catch(err => {
        console.error('Failed to fetch user role:', err)
        setIsLoading(false)
        router.push('/library')
      })
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  if (!session || !isAdmin(userRole)) {
    return null
  }

  return <AdminDashboard />
}