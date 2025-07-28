'use client'

import { useState } from 'react'
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
  Divider,
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

const availableCapabilities = [
  { id: 'can_add_books', label: 'Add Books', description: 'Allow adding new books to shelves' },
  { id: 'can_edit_books', label: 'Edit Books', description: 'Allow editing book information' },
  { id: 'can_delete_books', label: 'Delete Books', description: 'Allow removing books from shelves' },
  { id: 'can_checkout_books', label: 'Checkout Books', description: 'Allow checking out books to users' },
  { id: 'can_manage_shelves', label: 'Manage Shelves', description: 'Add, edit, and delete shelves' },
]

export default function LocationOnboardingStepper({
  open,
  onClose,
  onLocationCreated,
  userRole,
}: LocationOnboardingStepperProps) {
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
    adminCapabilities: ['can_add_books', 'can_edit_books', 'can_manage_shelves'],
    userCapabilities: ['can_add_books', 'can_checkout_books'],
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
      adminCapabilities: ['can_add_books', 'can_edit_books', 'can_manage_shelves'],
      userCapabilities: ['can_add_books', 'can_checkout_books'],
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

  const toggleCapability = (capability: string, type: 'admin' | 'user') => {
    const field = type === 'admin' ? 'adminCapabilities' : 'userCapabilities'
    setLocationData(prev => ({
      ...prev,
      [field]: prev[field].includes(capability)
        ? prev[field].filter(cap => cap !== capability)
        : [...prev[field], capability]
    }))
  }

  const handleCreateLocation = async () => {
    setLoading(true)
    setError('')

    try {
      // TODO: Implement actual API call to create location with all settings
      console.log('Creating location with data:', locationData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onLocationCreated()
      handleClose()
    } catch (error) {
      setError('Failed to create location. Please try again.')
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
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Set default permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              These will be the default capabilities for users in this location
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Admin Capabilities
            </Typography>
            {availableCapabilities.map((capability) => (
              <FormControlLabel
                key={capability.id}
                control={
                  <Checkbox
                    checked={locationData.adminCapabilities.includes(capability.id)}
                    onChange={() => toggleCapability(capability.id, 'admin')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{capability.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {capability.description}
                    </Typography>
                  </Box>
                }
                sx={{ display: 'block', mb: 1 }}
              />
            ))}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Regular User Capabilities
            </Typography>
            {availableCapabilities.map((capability) => (
              <FormControlLabel
                key={capability.id}
                control={
                  <Checkbox
                    checked={locationData.userCapabilities.includes(capability.id)}
                    onChange={() => toggleCapability(capability.id, 'user')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{capability.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {capability.description}
                    </Typography>
                  </Box>
                }
                sx={{ display: 'block', mb: 1 }}
              />
            ))}
          </Box>
        )
      
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
        
        {renderStepContent(activeStep)}
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