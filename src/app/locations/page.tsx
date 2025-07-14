'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material'
import {
  ArrowBack,
  LocationOn,
  ExitToApp,
} from '@mui/icons-material'
import ConfirmationModal from '@/components/ConfirmationModal'
import AlertModal from '@/components/AlertModal'
import Footer from '@/components/Footer'
import { useModal } from '@/hooks/useModal'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'

interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
}

interface ProfileData {
  user_role: string
}

export default function LocationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { modalState, confirmAsync, alert, closeModal } = useModal()
  const [locations, setLocations] = useState<Location[]>([])
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }, [])

  const fetchLocations = useCallback(async () => {
    try {
      if (!session?.user?.email) return
      
      const response = await fetch(`${API_BASE}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const locationsData = await response.json()
        setLocations(locationsData)
      }
    } catch (error) {
      console.error('Failed to load locations:', error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
      fetchLocations()
    }
  }, [status, router, fetchProfile, fetchLocations])

  const leaveLocation = async (locationId: number, locationName: string) => {
    const confirmed = await confirmAsync(
      {
        title: 'Leave Location',
        message: `Are you sure you want to leave "${locationName}"? This will remove all your books from this location and cannot be undone.`,
        confirmText: 'Leave Location',
        variant: 'error'
      },
      async () => {
        const response = await fetch(`${API_BASE}/api/locations/${locationId}/leave`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          await fetchLocations() // Refresh locations list
          await alert({
            title: 'Left Location',
            message: `Successfully left "${locationName}". Your books from this location have been removed.`,
            variant: 'success'
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to leave "${locationName}"`)
        }
      }
    )

    if (!confirmed) {
      await alert({
        title: 'Leave Failed',
        message: 'Failed to leave the location. Please try again.',
        variant: 'error'
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  if (!session || !profile) {
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
            <LocationOn /> Library Locations
          </Typography>
        </Box>
        
        {locations.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
            <Typography color="text.secondary">
              You don&apos;t have access to any library locations yet. Contact an administrator to get invited.
            </Typography>
          </Paper>
        ) : (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You have access to {locations.length} library location{locations.length > 1 ? 's' : ''}.
              {profile?.user_role !== 'admin' && profile?.user_role !== 'super_admin' && ' You can leave locations you no longer need access to.'}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {locations.map(location => (
                <Card key={location.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6" component="h2">
                          {location.name}
                        </Typography>
                        {location.description && (
                          <Typography variant="body2" color="text.secondary">
                            {location.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Added: {new Date(location.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      {locations.length > 1 && profile?.user_role !== 'admin' && profile?.user_role !== 'super_admin' && (
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<ExitToApp />}
                          onClick={() => leaveLocation(location.id, location.name)}
                        >
                          Leave Location
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
            
            {locations.length === 1 && profile?.user_role !== 'admin' && profile?.user_role !== 'super_admin' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  You can&apos;t leave your last location. You need access to at least one library.
                </Typography>
              </Alert>
            )}
            
            {(profile?.user_role === 'admin' || profile?.user_role === 'super_admin') && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  As an admin, you cannot leave locations. Admins must maintain access to manage library settings.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
        
        {/* Modal Components */}
        {modalState.type === 'confirm' && (
          <ConfirmationModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onConfirm={modalState.onConfirm!}
            title={modalState.options.title}
            message={modalState.options.message}
            confirmText={modalState.options.confirmText}
            cancelText={modalState.options.cancelText}
            variant={modalState.options.variant}
            loading={modalState.loading}
          />
        )}
        
        {modalState.type === 'alert' && (
          <AlertModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            title={modalState.options.title}
            message={modalState.options.message}
            variant={modalState.options.variant}
            buttonText={modalState.options.buttonText}
          />
        )}
      </Paper>
      
      <Footer />
    </Container>
  )
}