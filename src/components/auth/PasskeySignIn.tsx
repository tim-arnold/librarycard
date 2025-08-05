'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Box,
} from '@mui/material'
import {
  Fingerprint,
  Warning,
} from '@mui/icons-material'
import { signIn } from 'next-auth/react'
import { WebAuthnAPI } from '@/lib/webauthnApi'

interface PasskeySignInProps {
  disabled?: boolean
  onError: (error: string) => void
  onSuccess?: (message: string) => void
  invitationToken?: string | null
}

export default function PasskeySignIn({ disabled, onError, onSuccess, invitationToken }: PasskeySignInProps) {
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [isSupported, setIsSupported] = useState(false)

  // Check WebAuthn support on component mount
  useEffect(() => {
    setIsSupported(WebAuthnAPI.isSupported())
  }, [])

  const handlePasskeySignIn = async (email?: string) => {
    if (!isSupported) {
      onError('Passkeys are not supported in this browser')
      return
    }

    try {
      setLoading(true)
      
      const webauthnAPI = new WebAuthnAPI()
      
      // Start authentication
      const authResponse = await webauthnAPI.startAuthentication(email)
      
      // Complete authentication
      const result = await webauthnAPI.completeAuthentication(authResponse)
      
      if (result.success && result.token && result.userId) {
        // Use NextAuth's signIn function with custom JWT
        const authResult = await signIn('credentials', {
          token: result.token,
          userId: result.userId,  
          authMethod: 'webauthn',
          redirect: false,
        })

        if (authResult?.ok) {
          onSuccess?.('Successfully signed in with passkey!')
          
          // Handle invitation acceptance if needed
          if (invitationToken) {
            // The invitation will be handled by the main page
            window.location.href = `/?invitation=${invitationToken}`
          } else {
            window.location.href = '/'
          }
        } else {
          onError('Failed to complete sign in')
        }
      } else {
        onError('Passkey authentication failed')
      }
    } catch (error: any) {
      console.error('Passkey authentication error:', error)
      
      let errorMessage = 'Failed to sign in with passkey'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Passkey authentication was cancelled'
        } else if (error.name === 'InvalidStateError') {
          errorMessage = 'No passkey found for this device'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Passkeys are not supported on this device'  
        } else if (error.message.includes('No credential')) {
          // Offer to try with specific email
          setDialogOpen(true)
          return
        } else {
          errorMessage = error.message
        }
      }
      
      onError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailPasskeySignIn = async () => {
    if (!emailInput.trim()) {
      onError('Please enter your email address')
      return
    }

    setDialogOpen(false)
    await handlePasskeySignIn(emailInput.trim())
    setEmailInput('')
  }

  if (!isSupported) {
    return null // Don't show the button if not supported
  }

  return (
    <>
      <Button
        onClick={() => handlePasskeySignIn()}
        disabled={disabled || loading}
        variant="contained"
        fullWidth
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Fingerprint />}
        sx={{ 
          py: 1.5,
          mb: 2,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0'
          }
        }}
      >
        {loading ? 'Authenticating...' : (invitationToken ? 'Sign in with Passkey and Accept Invitation' : 'Sign in with Passkey')}
      </Button>

      {/* Email Dialog for usernameless authentication */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sign in with Passkey</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            We couldn't find a passkey for this device. Please enter your email address to locate your passkeys.
          </Typography>
          
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            autoFocus
            sx={{ mt: 1 }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This will help us find passkeys associated with your account.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEmailPasskeySignIn}
            variant="contained"
            disabled={!emailInput.trim()}
            startIcon={<Fingerprint />}
          >
            Continue with Passkey
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}