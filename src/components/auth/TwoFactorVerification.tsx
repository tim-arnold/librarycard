'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  Divider
} from '@mui/material'
import {
  Security,
  VpnKey,
  Backup
} from '@mui/icons-material'
import TOTPInput from './TOTPInput'
import { twoFactorAPI } from '@/lib/twoFactorApi'

interface TwoFactorVerificationProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  userEmail?: string
}

export default function TwoFactorVerification({ 
  open, 
  onClose, 
  onSuccess,
  userEmail 
}: TwoFactorVerificationProps) {
  const [verificationMode, setVerificationMode] = useState<'totp' | 'backup'>('totp')
  const [totpCode, setTotpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTOTPVerify = async () => {
    if (totpCode.length !== 6) return

    try {
      setLoading(true)
      setError('')
      
      await twoFactorAPI.verifyTOTP(totpCode)
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleBackupVerify = async () => {
    if (!backupCode.trim()) return

    try {
      setLoading(true)
      setError('')
      
      const result = await twoFactorAPI.verifyBackupCode(backupCode.trim())
      
      if (result.warning) {
        // Show warning about low backup codes but still proceed
        console.warn(result.warning)
      }
      
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid backup code')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setVerificationMode('totp')
    setTotpCode('')
    setBackupCode('')
    setError('')
  }

  const switchMode = (mode: 'totp' | 'backup') => {
    setVerificationMode(mode)
    setTotpCode('')
    setBackupCode('')
    setError('')
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Security sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" component="div">
          Two-Factor Authentication
        </Typography>
        {userEmail && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Signing in as {userEmail}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {verificationMode === 'totp' ? (
          <Box sx={{ textAlign: 'center' }}>
            <VpnKey sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Enter Authentication Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Open your authenticator app and enter the 6-digit code
            </Typography>

            <TOTPInput
              value={totpCode}
              onChange={setTotpCode}
              onComplete={handleTOTPVerify}
              disabled={loading}
              error={!!error}
              helperText="Code refreshes every 30 seconds"
            />

            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Having trouble?
              </Typography>
              <Link
                component="button"
                variant="body2"
                onClick={() => switchMode('backup')}
                sx={{ cursor: 'pointer' }}
              >
                Use a backup code instead
              </Link>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Backup sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Enter Backup Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter one of your saved backup codes
            </Typography>

            <Box sx={{ mb: 3 }}>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && backupCode.trim()) {
                    handleBackupVerify()
                  }
                }}
                disabled={loading}
                placeholder="XXXX-XXXX"
                style={{
                  width: '150px',
                  padding: '12px 16px',
                  fontSize: '1.1rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  border: `2px solid ${error ? '#f44336' : '#ddd'}`,
                  borderRadius: '8px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = error ? '#f44336' : '#1976d2'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error ? '#f44336' : '#ddd'
                }}
              />
            </Box>

            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Note:</strong> Each backup code can only be used once. 
                After using this code, it will no longer be valid.
              </Typography>
            </Alert>

            <Box>
              <Divider sx={{ mb: 2 }} />
              <Link
                component="button"
                variant="body2"
                onClick={() => switchMode('totp')}
                sx={{ cursor: 'pointer' }}
              >
                ← Back to authenticator code
              </Link>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        
        {verificationMode === 'totp' ? (
          <Button 
            variant="contained" 
            onClick={handleTOTPVerify}
            disabled={loading || totpCode.length !== 6}
            startIcon={loading ? <CircularProgress size={16} /> : <VpnKey />}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleBackupVerify}
            disabled={loading || !backupCode.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Backup />}
          >
            {loading ? 'Verifying...' : 'Use Backup Code'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}