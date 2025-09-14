'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { authenticatedApiCall } from '@/lib/api'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Save,
  Person,
} from '@mui/icons-material'
import ConfirmationModal from '@/components/modals/ConfirmationModal'
import AlertModal from '@/components/modals/AlertModal'
import Footer from '@/components/layout/Footer'
import { useModal } from '@/hooks/useModal'

interface ProfileData {
  id: string
  email: string
  first_name: string
  last_name: string
  auth_provider: string
  user_role: string
  display_name_preference: string
  custom_username?: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { modalState, closeModal } = useModal()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    display_name_preference: 'first_name',
    custom_username: ''
  })


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      // Fetch both profile and display preferences
      const [profileResponse, displayResponse] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${getApiBaseUrl()}/api/user/display-preferences`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        })
      ])

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        const displayData = displayResponse.ok ? await displayResponse.json() : {}

        const combinedData = {
          ...profileData,
          display_name_preference: displayData.display_name_preference || 'first_name',
          custom_username: displayData.custom_username || ''
        }

        setProfile(combinedData)
        setFormData({
          email: combinedData.email || '',
          first_name: combinedData.first_name || '',
          last_name: combinedData.last_name || '',
          display_name_preference: combinedData.display_name_preference,
          custom_username: combinedData.custom_username
        })
      } else {
        setError('Failed to load profile data')
      }
    } catch {
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Update profile data
      const profileUpdateData: {
        first_name: string
        last_name: string
        email?: string
      } = {
        first_name: formData.first_name,
        last_name: formData.last_name
      }

      // Only include email for email/password users
      if (profile?.auth_provider === 'email') {
        profileUpdateData.email = formData.email
      }

      // Update display preferences
      const displayUpdateData = {
        display_name_preference: formData.display_name_preference,
        custom_username: formData.custom_username
      }

      // Send both requests
      const [profileResponse, displayResponse] = await Promise.all([
        authenticatedApiCall('/api/profile', {
          method: 'PUT',
          body: JSON.stringify(profileUpdateData)
        }),
        authenticatedApiCall('/api/user/display-preferences', {
          method: 'PUT',
          body: JSON.stringify(displayUpdateData)
        })
      ])

      if (profileResponse.ok && displayResponse.ok) {
        setSuccess('Profile and display preferences updated successfully!')
        fetchProfile() // Refresh profile data
      } else {
        const profileError = profileResponse.ok ? null : await profileResponse.json()
        const displayError = displayResponse.ok ? null : await displayResponse.json()
        const errorMessage = profileError?.error || displayError?.error || 'Failed to update settings'
        setError(errorMessage)
      }
    } catch {
      setError('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDisplayPreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      display_name_preference: value
    }))
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
            <Person /> Profile
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Signed in with {profile.auth_provider === 'google' ? 'Google' : 'Email/Password'}
            {profile.auth_provider === 'email' && (
              <>
                {' '}• <Button variant="text" size="small" onClick={() => router.push('/security')} sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                  Change password in Security
                </Button>
              </>
            )}
          </Typography>
        </Alert>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <TextField
            fullWidth
            type="email"
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={profile.auth_provider === 'google'}
            required
            helperText={profile.auth_provider === 'google' ? 'Email cannot be changed for Google accounts' : ''}
            variant="outlined"
          />

          <TextField
            fullWidth
            type="text"
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            required
            variant="outlined"
          />

          <TextField
            fullWidth
            type="text"
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            variant="outlined"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Display Preferences
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Control how your name appears in public locations when activity visibility is enabled.
              These settings only apply to locations where privacy is set to "public".
            </Typography>
          </Alert>

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">When my name appears, show:</FormLabel>
            <RadioGroup
              value={formData.display_name_preference}
              onChange={handleDisplayPreferenceChange}
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                value="first_name"
                control={<Radio />}
                label={`First name only (${formData.first_name || 'e.g., "John"'})`}
              />
              <FormControlLabel
                value="full_name"
                control={<Radio />}
                label={`Full name (${formData.first_name} ${formData.last_name || 'Smith'})`}
              />
              <FormControlLabel
                value="email"
                control={<Radio />}
                label={`Email address (${formData.email})`}
              />
              <FormControlLabel
                value="custom_username"
                control={<Radio />}
                label="Custom username"
              />
              <FormControlLabel
                value="anonymous"
                control={<Radio />}
                label='Always anonymous ("Library Member")'
              />
            </RadioGroup>
          </FormControl>

          {formData.display_name_preference === 'custom_username' && (
            <TextField
              fullWidth
              type="text"
              label="Custom Username"
              name="custom_username"
              value={formData.custom_username}
              onChange={handleInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
              helperText="Choose a unique username (3-30 characters, letters, numbers, and underscores only)"
              inputProps={{ maxLength: 30 }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            sx={{ alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

        
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
      
      <Footer />
    </Container>
  )
}