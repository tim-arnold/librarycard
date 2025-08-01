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
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Security,
  PhoneAndroid,
  VpnKey,
  CheckCircle,
  ContentCopy,
  QrCodeScanner,
  Download
} from '@mui/icons-material'
import TOTPInput from './TOTPInput'
import { twoFactorAPI } from '@/lib/twoFactorApi'
import { TOTPSetupResponse } from '@/lib/types'

interface TwoFactorSetupProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const steps = [
  'Install App',
  'Scan QR Code', 
  'Verify Code',
  'Save Backup Codes'
]

export default function TwoFactorSetup({ open, onClose, onComplete }: TwoFactorSetupProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [setupData, setSetupData] = useState<TOTPSetupResponse | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedCodes, setCopiedCodes] = useState(false)

  const handleStart = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await twoFactorAPI.initializeSetup()
      setSetupData(data)
      setActiveStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start setup')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!setupData || totpCode.length !== 6) return

    try {
      setLoading(true)
      setError('')
      
      await twoFactorAPI.completeSetup(setupData.secret, totpCode, setupData.backupCodes)
      setActiveStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackupCodes = async () => {
    if (!setupData) return
    
    const codesText = setupData.backupCodes.join('\n')
    await navigator.clipboard.writeText(codesText)
    setCopiedCodes(true)
  }

  const handleDownloadBackupCodes = () => {
    if (!setupData) return
    
    const codesText = `LibraryCard 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes safe! Each can only be used once.`
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

  const handleComplete = () => {
    onComplete()
    onClose()
    setActiveStep(0)
    setSetupData(null)
    setTotpCode('')
    setError('')
    setCopiedCodes(false)
  }

  const handleCancel = () => {
    onClose()
    setActiveStep(0)
    setSetupData(null)
    setTotpCode('')
    setError('')
    setCopiedCodes(false)
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Security sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" component="div">
          Enable Two-Factor Authentication
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add an extra layer of security to your account
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Step 0: Install App */}
        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <PhoneAndroid sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Install an Authenticator App
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You'll need an authenticator app on your phone to generate verification codes.
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Google Authenticator
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    iOS & Android
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Authy
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    iOS & Android
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Alert severity="info">
              Other compatible apps: Microsoft Authenticator, 1Password, Bitwarden
            </Alert>
          </Box>
        )}

        {/* Step 1: Scan QR Code */}
        {activeStep === 1 && setupData && (
          <Box sx={{ textAlign: 'center' }}>
            <QrCodeScanner sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Scan QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Open your authenticator app and scan this QR code
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3,
              p: 2,
              backgroundColor: 'grey.50',
              borderRadius: 2
            }}>
              <img 
                src={setupData.qrCodeUrl} 
                alt="2FA QR Code"
                style={{ maxWidth: '200px', height: 'auto' }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Can't scan? Enter this code manually:
            </Typography>
            <Chip 
              label={setupData.secret} 
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
          </Box>
        )}

        {/* Step 2: Verify Code */}
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <VpnKey sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Enter Verification Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the 6-digit code from your authenticator app
            </Typography>

            <TOTPInput
              value={totpCode}
              onChange={setTotpCode}
              onComplete={handleVerifyCode}
              disabled={loading}
              error={!!error}
              helperText="Code refreshes every 30 seconds"
            />
          </Box>
        )}

        {/* Step 3: Save Backup Codes */}
        {activeStep === 3 && setupData && (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                2FA Enabled Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Save these backup codes in a safe place
              </Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Important: Save these backup codes!
              </Typography>
              <Typography variant="body2">
                Each code can only be used once. If you lose your phone, you'll need these to access your account.
              </Typography>
            </Alert>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Backup Codes ({setupData.backupCodes.length})
                  </Typography>
                  <Box>
                    <Tooltip title="Copy to clipboard">
                      <IconButton size="small" onClick={handleCopyBackupCodes}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download as text file">
                      <IconButton size="small" onClick={handleDownloadBackupCodes}>
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {setupData.backupCodes.map((code, index) => (
                    <Typography 
                      key={index}
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        p: 1.5,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        textAlign: 'center',
                        color: 'grey.900',
                        fontWeight: 'bold',
                        border: '2px solid',
                        borderColor: 'grey.400',
                        fontSize: '0.9rem'
                      }}
                    >
                      {code}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {copiedCodes && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Backup codes copied to clipboard!
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleCancel}>
          {activeStep === 3 ? 'Skip' : 'Cancel'}
        </Button>
        
        {activeStep === 0 && (
          <Button 
            variant="contained" 
            onClick={handleStart}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <PhoneAndroid />}
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </Button>
        )}

        {activeStep === 1 && (
          <Button 
            variant="contained" 
            onClick={() => setActiveStep(2)}
          >
            I've Scanned the Code
          </Button>
        )}

        {activeStep === 2 && (
          <Button 
            variant="contained" 
            onClick={handleVerifyCode}
            disabled={loading || totpCode.length !== 6}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        )}

        {activeStep === 3 && (
          <Button 
            variant="contained" 
            onClick={handleComplete}
            color="success"
            startIcon={<CheckCircle />}
          >
            Complete Setup
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}