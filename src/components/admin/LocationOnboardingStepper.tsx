'use client'

import { useState, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material'
import {
  Add,
  Delete,
  ArrowBack,
  ArrowForward,
  Check,
  Home,
  Shelves,
  Settings,
  People,
  Preview,
} from '@mui/icons-material'
import PermissionsStep from './PermissionsStep'

interface LocationOnboardingStepperProps {
  open: boolean
  onClose: () => void
  onLocationCreated: () => void
  userRole: string | null
}

interface LocationData {
  name: string
  description: string
  singleShelfLocation: boolean
  initialShelves: string[]
  adminEmail: string
  adminCapabilities: string[]
  userCapabilities: string[]
}

const steps = [
  { label: 'Basic Information', icon: <Home /> },
  { label: 'Location Settings', icon: <Settings /> },
  { label: 'Initial Shelves', icon: <Shelves /> },
  { label: 'Permissions', icon: <People /> },
  { label: 'Review & Create', icon: <Preview /> },
]

const adminCapabilities = [
  { id: 'can_control_user_capabilities', label: 'Control User Permissions', description: 'Grant/revoke user permissions' },
  { id: 'can_invite_users', label: 'Invite Users', description: 'Send location invitations' },
  { id: 'can_manage_shelves', label: 'Manage Shelves', description: 'Advanced shelf operations' },
  { id: 'can_manage_location_settings', label: 'Manage Location', description: 'Edit location details' },
]

const userPermissions = [
  { id: 'can_add_books', label: 'Add Books', description: 'Add new books to the location' },
  { id: 'can_delete_books', label: 'Delete Books', description: 'Remove books from the location' },
  { id: 'can_move_books', label: 'Move Books', description: 'Move books between shelves' },
  { id: 'can_create_shelves', label: 'Create Shelves', description: 'Create new shelves in the location' },
  { id: 'can_edit_genres', label: 'Edit Genres', description: 'Manage genre assignments' },
]

export default function LocationOnboardingStepper({
  open,
  onClose,
  onLocationCreated,
  userRole,
}: LocationOnboardingStepperProps) {
  const { data: session } = useSession()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newShelfName, setNewShelfName] = useState('')

  const [locationData, setLocationData] = useState<LocationData>({
    name: '',
    description: '',
    singleShelfLocation: false,
    initialShelves: [],
    adminEmail: '',
    adminCapabilities: ['can_control_user_capabilities', 'can_invite_users', 'can_manage_shelves', 'can_manage_location_settings'],
    userCapabilities: ['can_add_books', 'can_delete_books'],
  })

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1)
      setError('')
    }
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
    setError('')
  }

  const handleReset = () => {
    setActiveStep(0)
    setLocationData({
      name: '',
      description: '',
      singleShelfLocation: false,
      initialShelves: [],
      adminEmail: '',
      adminCapabilities: ['can_control_user_capabilities', 'can_invite_users', 'can_manage_shelves', 'can_manage_location_settings'],
      userCapabilities: ['can_add_books', 'can_delete_books'],
    })
    setError('')
    setNewShelfName('')
  }

  const validateCurrentStep = (): boolean => {
    switch (activeStep) {
      case 0: // Basic Information
        if (!locationData.name.trim()) {
          setError('Location name is required')
          return false
        }
        return true
      case 1: // Location Settings
        return true // No validation needed for settings
      case 2: // Initial Shelves
        if (!locationData.singleShelfLocation && locationData.initialShelves.length === 0) {
          setError('Please add at least one shelf for multi-shelf locations')
          return false
        }
        return true
      case 3: // Permissions
        return true // Default permissions are always set
      default:
        return true
    }
  }

  const addShelf = () => {
    if (newShelfName.trim() && !locationData.initialShelves.includes(newShelfName.trim())) {
      setLocationData(prev => ({
        ...prev,
        initialShelves: [...prev.initialShelves, newShelfName.trim()]
      }))
      setNewShelfName('')
    }
  }

  const removeShelf = (shelfName: string) => {
    setLocationData(prev => ({
      ...prev,
      initialShelves: prev.initialShelves.filter(name => name !== shelfName)
    }))
  }

  const toggleCapability = useCallback((capability: string, type: 'admin' | 'user') => {
    const field = type === 'admin' ? 'adminCapabilities' : 'userCapabilities'
    
    flushSync(() => {
      setLocationData(prev => {
        const currentCapabilities = prev[field]
        const hasCapability = currentCapabilities.includes(capability)
        
        return {
          ...prev,
          [field]: hasCapability
            ? currentCapabilities.filter(cap => cap !== capability)
            : [...currentCapabilities, capability]
        }
      })
    })
  }, [])

  const handleCreateLocation = async () => {
    setLoading(true)
    setError('')

    if (!session?.user?.email) {
      setError('Authentication required to create location')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create the basic location
      const response = await fetch(`${getApiBaseUrl()}/api/locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: locationData.name.trim(),
          description: locationData.description.trim() || null,
          single_shelf_location: locationData.singleShelfLocation,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create location')
      }

      const newLocation = await response.json()
      console.log('Location created successfully:', newLocation)

      // Step 2: Create initial shelves (if not single shelf and shelves specified)
      if (!locationData.singleShelfLocation && locationData.initialShelves.length > 0) {
        for (const shelfName of locationData.initialShelves) {
          try {
            const shelfResponse = await fetch(`${getApiBaseUrl()}/api/locations/${newLocation.id}/shelves`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.user.email}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: shelfName.trim(),
              }),
            })
            
            if (!shelfResponse.ok) {
              console.warn(`Failed to create shelf "${shelfName}":`, await shelfResponse.text())
            }
          } catch (shelfError) {
            console.warn(`Error creating shelf "${shelfName}":`, shelfError)
          }
        }
      }

      // Step 3: Set up default permissions for the location
      for (const permission of locationData.userCapabilities) {
        try {
          const permissionResponse = await fetch(`${getApiBaseUrl()}/api/locations/${newLocation.id}/default-permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.user.email}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              permission: permission,
              permission_type: 'user'
            }),
          })
          
          if (!permissionResponse.ok) {
            console.warn(`Failed to set default permission "${permission}":`, await permissionResponse.text())
          }
        } catch (permissionError) {
          console.warn(`Error setting default permission "${permission}":`, permissionError)
        }
      }

      // Set admin capabilities as default admin permissions for future reference
      for (const capability of locationData.adminCapabilities) {
        try {
          const capabilityResponse = await fetch(`${getApiBaseUrl()}/api/locations/${newLocation.id}/default-permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.user.email}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              permission: capability,
              permission_type: 'admin'
            }),
          })
          
          if (!capabilityResponse.ok) {
            console.warn(`Failed to set default admin capability "${capability}":`, await capabilityResponse.text())
          }
        } catch (capabilityError) {
          console.warn(`Error setting default admin capability "${capability}":`, capabilityError)
        }
      }

      onLocationCreated()
      handleClose()
    } catch (error) {
      console.error('Error creating location:', error)
      setError(error instanceof Error ? error.message : 'Failed to create location. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Let's start with basic information about your location
            </Typography>
            <TextField
              fullWidth
              label="Location Name"
              value={locationData.name}
              onChange={(e) => setLocationData(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              placeholder="e.g., Home Library, Office Collection, Study Room"
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={locationData.description}
              onChange={(e) => setLocationData(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
              placeholder="Brief description of this location and its purpose"
            />
          </Box>
        )
      
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configure location settings
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={locationData.singleShelfLocation}
                  onChange={(e) => setLocationData(prev => ({ ...prev, singleShelfLocation: e.target.checked }))}
                />
              }
              label="Single Shelf Location"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Check this if this location will only ever have one shelf (simpler UI)
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Single Shelf:</strong> Simplified interface, perfect for small collections<br />
                <strong>Multi-Shelf:</strong> Organize books across multiple shelves with full management capabilities
              </Typography>
            </Alert>
          </Box>
        )
      
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {locationData.singleShelfLocation ? 'Single Shelf Setup' : 'Create Initial Shelves'}
            </Typography>
            
            {locationData.singleShelfLocation ? (
              <Alert severity="success">
                <Typography>
                  Your single shelf location will be created with a default shelf. 
                  You can rename it after creation if needed.
                </Typography>
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Add the shelves you want to start with. You can always add more later.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    label="Shelf Name"
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    placeholder="e.g., Fiction, Non-Fiction, Technical"
                    onKeyPress={(e) => e.key === 'Enter' && addShelf()}
                    size="small"
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={addShelf}
                    disabled={!newShelfName.trim()}
                    startIcon={<Add />}
                  >
                    Add
                  </Button>
                </Box>
                
                {locationData.initialShelves.length > 0 && (
                  <List dense>
                    {locationData.initialShelves.map((shelfName, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={shelfName} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeShelf(shelfName)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </Box>
        )
      
      case 3:
        // Don't render permissions here - it's handled separately below
        return null
      
      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review and Create Location
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Location Details</strong>
              </Typography>
              <Typography><strong>Name:</strong> {locationData.name}</Typography>
              {locationData.description && (
                <Typography><strong>Description:</strong> {locationData.description}</Typography>
              )}
              <Typography>
                <strong>Type:</strong> {locationData.singleShelfLocation ? 'Single Shelf' : 'Multi-Shelf'}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Initial Shelves</strong>
              </Typography>
              {locationData.singleShelfLocation ? (
                <Typography>Default shelf will be created</Typography>
              ) : (
                locationData.initialShelves.map((shelf, index) => (
                  <Chip key={index} label={shelf} sx={{ mr: 1, mb: 1 }} />
                ))
              )}
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Permissions Summary</strong>
              </Typography>
              <Typography variant="body2">
                <strong>Admin capabilities:</strong> {locationData.adminCapabilities.length} selected
              </Typography>
              <Typography variant="body2">
                <strong>User capabilities:</strong> {locationData.userCapabilities.length} selected
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              All settings can be modified after creation through the location management interface.
            </Alert>
          </Box>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={undefined}
      disableEscapeKeyDown
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          overflowY: 'auto',
          scrollBehavior: 'auto'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Home />
          Create New Location
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel icon={step.icon}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {activeStep === 3 ? (
          <PermissionsStep
            adminCapabilities={locationData.adminCapabilities}
            userCapabilities={locationData.userCapabilities}
            onToggleCapability={toggleCapability}
          />
        ) : (
          renderStepContent(activeStep)
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleCreateLocation}
            disabled={loading}
            startIcon={<Check />}
          >
            {loading ? 'Creating...' : 'Create Location'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}