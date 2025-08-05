'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material'
import {
  Security,
  Shield,
  Warning,
  CheckCircle,
  Add,
  Refresh,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { twoFactorAPI } from '@/lib/twoFactorApi'
import { TwoFactorStatus } from '@/lib/types'
import TwoFactorSetup from '@/components/auth/TwoFactorSetup'
import PasskeyManager from '@/components/auth/PasskeyManager'

export default function SecuritySettings() {
  const { data: session } = useSession()
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupOpen, setSetupOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    loadTwoFactorStatus()
  }, [])

  const loadTwoFactorStatus = async () => {
    try {
      setLoading(true)
      const status = await twoFactorAPI.getStatus()
      setTwoFactorStatus(status)
    } catch (err) {
      console.error('Failed to load 2FA status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    loadTwoFactorStatus()
    setSuccess('Two-factor authentication has been enabled successfully!')
    setTimeout(() => setSuccess(''), 5000)
  }

  const handleDisable2FA = async () => {
    if (!password.trim()) return

    try {
      setActionLoading(true)
      setError('')
      
      await twoFactorAPI.disable2FA(password)
      
      setDisableOpen(false)
      setPassword('')
      loadTwoFactorStatus()
      setSuccess('Two-factor authentication has been disabled.')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    try {
      setActionLoading(true)
      setError('')
      
      const result = await twoFactorAPI.regenerateBackupCodes()
      
      setNewBackupCodes(result.backupCodes)
      loadTwoFactorStatus()
      setSuccess('New backup codes generated successfully!')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate backup codes')
      setRegenerateOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  const downloadBackupCodes = (codes: string[]) => {
    const codesText = `LibraryCard 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${codes.join('\n')}\n\nKeep these codes safe! Each can only be used once.`
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'librarycard-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const closeRegenerateModal = () => {
    setRegenerateOpen(false)
    setNewBackupCodes([])
    setError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required')
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long')
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setPasswordSuccess(''), 5000)
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch {
      setPasswordError('Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Security />
            <Typography variant="h6">Security</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Security />
            <Typography variant="h6">Security</Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Two-Factor Authentication */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Shield />
                Two-Factor Authentication
                {twoFactorStatus?.enabled && (
                  <Chip
                    icon={<CheckCircle />}
                    label="Enabled"
                    color="success"
                    size="small"
                  />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {twoFactorStatus?.enabled 
                  ? 'Your account is protected with two-factor authentication using an authenticator app.'
                  : 'Add an extra layer of security to your account with two-factor authentication.'
                }
              </Typography>
              
              {twoFactorStatus?.enabled && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Backup Codes:</strong> {twoFactorStatus.backupCodes.remaining} of {twoFactorStatus.backupCodes.total} remaining
                  </Typography>
                  
                  {twoFactorStatus.backupCodes.remaining <= 2 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        You're running low on backup codes. Consider regenerating new ones.
                      </Typography>
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      startIcon={<Refresh />}
                      onClick={() => setRegenerateOpen(true)}
                    >
                      Regenerate Backup Codes
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
            
            <Box>
              {twoFactorStatus?.enabled ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Warning />}
                  onClick={() => setDisableOpen(true)}
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setSetupOpen(true)}
                >
                  Enable 2FA
                </Button>
              )}
            </Box>
          </Box>

          {session?.user?.authProvider === 'google' && !twoFactorStatus?.enabled && (
            <Alert severity="info">
              <Typography variant="body2">
                Since you sign in with Google, you may already have 2FA enabled through your Google account. 
                Enabling 2FA here adds an additional layer specific to LibraryCard.
              </Typography>
            </Alert>
          )}

          {/* Password Change Section - Only for email/password users */}
          {session?.user?.authProvider !== 'google' && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Lock />
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Update your account password to keep your library secure.
                </Typography>

                <Box component="form" onSubmit={handlePasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {passwordError && (
                    <Alert severity="error" onClose={() => setPasswordError('')}>
                      {passwordError}
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert severity="success" onClose={() => setPasswordSuccess('')}>
                      {passwordSuccess}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    type={showCurrentPassword ? 'text' : 'password'}
                    label="Current Password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="New Password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    helperText="Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ alignSelf: 'flex-start' }}
                    disabled={passwordLoading}
                    startIcon={passwordLoading ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                  >
                    {passwordLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Passkeys Section */}
      {session?.user?.email && (
        <Box sx={{ mt: 3 }}>
          <PasskeyManager 
            userEmail={session.user.email}
            onError={(error) => {
              setError(error)
              setTimeout(() => setError(''), 5000)
            }}
            onSuccess={(message) => {
              setSuccess(message)
              setTimeout(() => setSuccess(''), 5000)
            }}
          />
        </Box>
      )}

      {/* 2FA Setup Dialog */}
      <TwoFactorSetup
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onComplete={handleSetupComplete}
      />

      {/* Disable 2FA Dialog */}
      <Dialog
        open={disableOpen}
        onClose={() => {
          setDisableOpen(false)
          setPassword('')
          setError('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Disable Two-Factor Authentication
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> Disabling two-factor authentication will make your account less secure. 
              You'll no longer need a verification code to sign in.
            </Typography>
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter your password to confirm:
          </Typography>
          
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDisableOpen(false)
            setPassword('')
            setError('')
          }}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDisable2FA}
            disabled={actionLoading || !password.trim()}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <Warning />}
          >
            {actionLoading ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog
        open={regenerateOpen}
        onClose={closeRegenerateModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {newBackupCodes.length > 0 ? 'New Backup Codes Generated' : 'Regenerate Backup Codes'}
        </DialogTitle>
        <DialogContent>
          {newBackupCodes.length > 0 ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Your old backup codes are no longer valid. 
                  Save these new codes in a safe place.
                </Typography>
              </Alert>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 1, 
                mb: 2,
                p: 2,
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                {newBackupCodes.map((code, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      p: 1,
                      backgroundColor: 'white',
                      borderRadius: 0.5
                    }}
                  >
                    {code}
                  </Typography>
                ))}
              </Box>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => downloadBackupCodes(newBackupCodes)}
                sx={{ mb: 2 }}
              >
                Download as Text File
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                This will generate 8 new backup codes and invalidate your existing ones. 
                Make sure you have access to your authenticator app before proceeding.
              </Typography>
              
              <Alert severity="info">
                <Typography variant="body2">
                  Each backup code can only be used once. Store them in a secure location.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRegenerateModal}>
            {newBackupCodes.length > 0 ? 'Done' : 'Cancel'}
          </Button>
          {newBackupCodes.length === 0 && (
            <Button
              variant="contained"
              onClick={handleRegenerateBackupCodes}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={16} /> : <Refresh />}
            >
              {actionLoading ? 'Generating...' : 'Generate New Codes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}