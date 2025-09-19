'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import {
  Fingerprint,
  Delete,
  Add,
  Security,
  Smartphone,
  Computer,
  Warning,
} from '@mui/icons-material'
import { WebAuthnAPI, type WebAuthnCredential } from '@/lib/webauthnApi'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface PasskeyManagerProps {
  userEmail: string
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

export default function PasskeyManager({ userEmail, onError, onSuccess }: PasskeyManagerProps) {
  const { isMobile } = useMobileBreakpoints()
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [isSupported, setIsSupported] = useState(false)
  const [platformAvailable, setPlatformAvailable] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCredential, setSelectedCredential] = useState<WebAuthnCredential | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const webauthnAPI = new WebAuthnAPI()

  useEffect(() => {
    checkSupport()
    loadCredentials()
  }, [])

  const checkSupport = async () => {
    const supported = WebAuthnAPI.isSupported()
    const platformAuth = supported ? await WebAuthnAPI.isPlatformAuthenticatorAvailable() : false
    
    setIsSupported(supported)
    setPlatformAvailable(platformAuth)
    
    if (supported) {
      setDeviceName(WebAuthnAPI.getDeviceName())
    }
  }

  const loadCredentials = async () => {
    try {
      setLoading(true)
      const creds = await webauthnAPI.getCredentials(userEmail)
      setCredentials(creds)
    } catch (error) {
      console.error('Failed to load credentials:', error)
      onError?.(`Failed to load passkeys: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPasskey = async () => {
    if (!isSupported) {
      onError?.('WebAuthn is not supported in this browser')
      return
    }

    try {
      setActionLoading(true)
      
      // Start registration process
      const registrationResponse = await webauthnAPI.startRegistration(userEmail)
      
      // Complete registration
      const result = await webauthnAPI.completeRegistration(
        userEmail, 
        registrationResponse,
        deviceName || WebAuthnAPI.getDeviceName()
      )

      if (result.success) {
        onSuccess?.('Passkey added successfully!')
        setAddDialogOpen(false)
        setDeviceName('')
        await loadCredentials() // Reload the list
      } else {
        onError?.('Failed to add passkey')
      }
    } catch (error) {
      console.error('Failed to add passkey:', error)
      let errorMessage = 'Failed to add passkey'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Passkey creation was cancelled or not allowed'
        } else if (error.name === 'InvalidStateError') {
          errorMessage = 'This device already has a passkey registered'
        } else {
          errorMessage = error.message
        }
      }
      
      onError?.(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePasskey = async () => {
    if (!selectedCredential) return

    try {
      setActionLoading(true)
      
      const success = await webauthnAPI.deleteCredential(userEmail, selectedCredential.id.toString())
      
      if (success) {
        onSuccess?.('Passkey removed successfully!')
        setDeleteDialogOpen(false)
        setSelectedCredential(null)
        await loadCredentials() // Reload the list
      } else {
        onError?.('Failed to remove passkey')
      }
    } catch (error) {
      console.error('Failed to delete passkey:', error)
      onError?.(`Failed to remove passkey: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteDialog = (credential: WebAuthnCredential) => {
    setSelectedCredential(credential)
    setDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDeviceIcon = (deviceType: string) => {
    return deviceType === 'platform' ? <Smartphone /> : <Security />
  }

  if (!isSupported) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Warning color="warning" />
            <Typography variant="h6">Passkeys Not Supported</Typography>
          </Box>
          <Typography color="text.secondary">
            Your browser doesn't support passkeys (WebAuthn). Please use a modern browser like Chrome, Firefox, Safari, or Edge to use this feature.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Fingerprint />
              Passkeys
            </Typography>
            <Chip
              label={platformAvailable ? 'Available' : 'External Only'}
              color={platformAvailable ? 'success' : 'warning'}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Passkeys provide secure, passwordless authentication using your device's biometric sensors or security keys.
            {platformAvailable
              ? ' You can use Touch ID, Face ID, or Windows Hello on this device.'
              : ' Use an external security key or authenticator app.'
            }
          </Typography>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            disabled={loading}
            fullWidth={isMobile}
          >
            Add Passkey
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {credentials.length === 0 ? (
              <Alert severity="info">
                No passkeys configured. Add your first passkey to enable passwordless authentication.
              </Alert>
            ) : (
              <List>
                {credentials.map((credential) => (
                  <ListItem key={credential.id} divider>
                    <Box display="flex" alignItems="center" mr={2}>
                      {getDeviceIcon(credential.device_type)}
                    </Box>
                    <ListItemText
                      primary={credential.device_name || 'Unknown Device'}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Added: {formatDate(credential.created_at)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Last used: {formatDate(credential.last_used_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Remove passkey">
                        <IconButton
                          edge="end"
                          onClick={() => openDeleteDialog(credential)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </CardContent>

      {/* Add Passkey Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Passkey</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Your device will prompt you to create a new passkey using biometric authentication or your device's security features.
          </Typography>
          
          <TextField
            fullWidth
            label="Device Name (Optional)"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder={WebAuthnAPI.getDeviceName()}
            helperText="Give this passkey a memorable name"
            sx={{ mt: 2 }}
          />

          {!platformAvailable && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Platform authenticator not detected. You may need to use an external security key.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
          <Button onClick={() => setAddDialogOpen(false)} disabled={actionLoading} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPasskey}
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <Fingerprint />}
            fullWidth={isMobile}
          >
            Create Passkey
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Passkey</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the passkey "{selectedCredential?.device_name || 'Unknown Device'}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You won't be able to use this passkey to sign in anymore.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePasskey}
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <Delete />}
            fullWidth={isMobile}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}