'use client'

import { useState, useEffect } from 'react'
import { isAdmin } from '@/lib/permissions'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Shelves,
  Cancel,
  Save,
  Home,
} from '@mui/icons-material'
import ConfirmationModal from '../modals/ConfirmationModal'
import AlertModal from '../modals/AlertModal'
import { useModal } from '@/hooks/useModal'
import LocationPermissionManager from './LocationPermissionManager'


interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
  single_shelf_location?: boolean
}

interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
}



export default function LocationManager() {
  const { data: session } = useSession()
  const { modalState, confirmAsync, alert, closeModal } = useModal()
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationDescription, setNewLocationDescription] = useState('')
  const [newLocationSingleShelf, setNewLocationSingleShelf] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null)
  const [showShelfForm, setShowShelfForm] = useState(false)
  const [newShelfName, setNewShelfName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [canManageLocationPermissions, setCanManageLocationPermissions] = useState<boolean>(false)
  const [locationPermissions, setLocationPermissions] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (session?.user) {
      loadLocations()
      loadUserRole()
    }
  }, [session])

  useEffect(() => {
    if (selectedLocation && session?.user) {
      checkLocationManagePermission(selectedLocation.id)
    }
  }, [selectedLocation, session])

  const loadUserRole = async () => {
    if (!session?.user?.email) return
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user_role || 'user')
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error)
      setUserRole('user')
    }
  }

  const loadLocations = async () => {
    if (!session?.user?.email) return
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
        
        // Check permissions for each location
        await checkAllLocationPermissions(data)
        
        if (data.length === 0 && isAdmin(userRole)) {
          setShowCreateForm(true)
        } else {
          setSelectedLocation(data[0])
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load locations')
      }
    } catch (_error) {
      setError('Failed to load locations')
    } finally {
      setLoading(false)
    }
  }

  const loadShelves = async (locationId: number) => {
    if (!session?.user?.email) return
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/locations/${locationId}/shelves`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setShelves(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load shelves')
      }
    } catch (_error) {
      setError('Failed to load shelves')
    }
  }

  useEffect(() => {
    if (selectedLocation) {
      loadShelves(selectedLocation.id)
    }
  }, [selectedLocation])

  const createLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocationName.trim()) return

    if (!session?.user?.email) return
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLocationName.trim(),
          description: newLocationDescription.trim() || null,
          single_shelf_location: newLocationSingleShelf,
        }),
      })

      if (response.ok) {
        const newLocation = await response.json()
        setLocations([...locations, newLocation])
        setSelectedLocation(newLocation)
        setNewLocationName('')
        setNewLocationDescription('')
        setShowCreateForm(false)
        // The API will create default shelves, so reload them
        await loadShelves(newLocation.id)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create location')
      }
    } catch (_error) {
      setError('Failed to create location')
    }
  }

  const updateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLocation || !newLocationName.trim()) return

    if (!session?.user?.email) return
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLocationName.trim(),
          description: newLocationDescription.trim() || null,
          single_shelf_location: newLocationSingleShelf,
        }),
      })

      if (response.ok) {
        const updatedLocation = await response.json()
        setLocations(locations.map(loc => 
          loc.id === editingLocation.id ? updatedLocation : loc
        ))
        if (selectedLocation?.id === editingLocation.id) {
          setSelectedLocation(updatedLocation)
        }
        setEditingLocation(null)
        setNewLocationName('')
        setNewLocationDescription('')
        setNewLocationSingleShelf(false)
        setShowCreateForm(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update location')
      }
    } catch (_error) {
      setError('Failed to update location')
    }
  }

  const deleteLocation = async (locationId: number, locationName: string) => {
    const confirmed = await confirmAsync(
      {
        title: 'Delete Location',
        message: `Are you sure you want to delete &quot;${locationName}&quot;? This will permanently delete all shelves and books in this location. This action cannot be undone.`,
        confirmText: 'Delete Location',
        variant: 'error'
      },
      async () => {
        if (!session?.user?.email) throw new Error('Not authenticated')
        
        const response = await fetch(`${getApiBaseUrl()}/api/locations/${locationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.user.email}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const updatedLocations = locations.filter(loc => loc.id !== locationId)
          setLocations(updatedLocations)
          if (selectedLocation?.id === locationId) {
            setSelectedLocation(updatedLocations[0] || null)
            setShelves([])
          }
          await alert({
            title: 'Location Deleted',
            message: `&quot;${locationName}&quot; and all its contents have been successfully deleted.`,
            variant: 'success'
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete location')
        }
      }
    )

    if (!confirmed) {
      await alert({
        title: 'Delete Failed',
        message: 'Failed to delete the location. Please try again.',
        variant: 'error'
      })
    }
  }

  const checkAllLocationPermissions = async (locations: Location[]) => {
    if (!session?.user?.email) return
    
    const permissions: Record<number, boolean> = {}
    
    // Check permissions for each location
    for (const location of locations) {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/permissions/check?locationId=${location.id}&permission=can_manage_location_settings`, {
          headers: {
            'Authorization': `Bearer ${session.user.email}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          permissions[location.id] = data.hasPermission || false
        } else {
          permissions[location.id] = false
        }
      } catch (error) {
        console.error(`Failed to check permission for location ${location.id}:`, error)
        permissions[location.id] = false
      }
    }
    
    setLocationPermissions(permissions)
  }

  const checkLocationManagePermission = async (locationId: number) => {
    if (!session?.user?.email) {
      setCanManageLocationPermissions(false)
      return
    }
    
    try {
      // Use the general permission check for can_manage_location_settings capability
      const response = await fetch(`${getApiBaseUrl()}/api/permissions/check?locationId=${locationId}&permission=can_manage_location_settings`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Check if user has the location management capability
        const hasLocationManageCapability = data.hasPermission || false
        setCanManageLocationPermissions(hasLocationManageCapability)
      } else {
        setCanManageLocationPermissions(false)
      }
    } catch (error) {
      console.error('Failed to check location manage permission:', error)
      setCanManageLocationPermissions(false)
    }
  }

  const canManageLocationSettings = () => {
    return userRole === 'super_admin' || canManageLocationPermissions
  }

  const startEditLocation = (location: Location) => {
    setEditingLocation(location)
    setNewLocationName(location.name)
    setNewLocationDescription(location.description || '')
    setNewLocationSingleShelf(location.single_shelf_location || false)
    setShowCreateForm(true)
    // Check permissions for the specific location being edited
    checkLocationManagePermission(location.id)
  }

  // Shelf management functions
  const createShelf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation || !newShelfName.trim()) return

    if (!session?.user?.email) return
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/locations/${selectedLocation.id}/shelves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newShelfName.trim(),
        }),
      })

      if (response.ok) {
        const newShelf = await response.json()
        setShelves([...shelves, newShelf])
        setNewShelfName('')
        setShowShelfForm(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create shelf')
      }
    } catch (_error) {
      setError('Failed to create shelf')
    }
  }

  const updateShelf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation || !editingShelf || !newShelfName.trim()) return

    if (!session?.user?.email) return
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/shelves/${editingShelf.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newShelfName.trim(),
        }),
      })

      if (response.ok) {
        const updatedShelf = await response.json()
        setShelves(shelves.map(shelf => 
          shelf.id === editingShelf.id ? updatedShelf : shelf
        ))
        setEditingShelf(null)
        setNewShelfName('')
        setShowShelfForm(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update shelf')
      }
    } catch (_error) {
      setError('Failed to update shelf')
    }
  }

  const deleteShelf = async (shelfId: number, shelfName: string) => {
    const confirmed = await confirmAsync(
      {
        title: 'Delete Shelf',
        message: `Are you sure you want to delete "${shelfName}"? If this shelf contains books, you'll need to move them first or choose to delete them as well.`,
        confirmText: 'Delete Shelf',
        variant: 'error'
      },
      async () => {
        if (!selectedLocation || !session?.user?.email) throw new Error('Invalid state')
        
        const response = await fetch(`${getApiBaseUrl()}/api/shelves/${shelfId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.user.email}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        if (response.ok) {
          setShelves(shelves.filter(shelf => shelf.id !== shelfId))
          await alert({
            title: 'Shelf Deleted',
            message: `"${shelfName}" has been successfully deleted.`,
            variant: 'success'
          })
        } else {
          const errorData = await response.json()
          
          // Handle special case where shelf contains books
          if (errorData.error && (errorData.error.includes('contains books') || errorData.bookCount > 0)) {
            await alert({
              title: 'Cannot Delete Shelf',
              message: errorData.warningMessage || errorData.error,
              variant: 'warning'
            })
            return
          }
          
          throw new Error(errorData.error || 'Failed to delete shelf')
        }
      }
    )

    if (!confirmed) {
      await alert({
        title: 'Delete Failed',
        message: 'Failed to delete the shelf. Please try again.',
        variant: 'error'
      })
    }
  }

  const startEditShelf = (shelf: Shelf) => {
    setEditingShelf(shelf)
    setNewShelfName(shelf.name)
    setShowShelfForm(true)
  }


  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            <Home sx={{ mr: 1, verticalAlign: 'middle' }} /> Locations
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography color="text.secondary">
              Loading locations...
            </Typography>
          </Box>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          <Home sx={{ mr: 1, verticalAlign: 'middle' }} /> Locations
        </Typography>
        
        {error && (
          <Alert 
            severity={error.includes('success') || error.includes('Success') ? 'success' : 'error'} 
            sx={{ mb: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

      {locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            {isAdmin(userRole) 
              ? "You don't have any locations yet. Create your first location to start organizing your books!"
              : "No locations are available. Contact an administrator to create locations."
            }
          </p>
          {isAdmin(userRole) && (
            <Button 
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Location
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Your Locations</h3>
              {isAdmin(userRole) && (
                <Button 
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateForm(true)}
                  size="small"
                >
                  Add Location
                </Button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {locations.map(location => (
                <div 
                  key={location.id}
                  style={{
                    padding: '1rem',
                    border: selectedLocation?.id === location.id ? '2px solid #0070f3' : '1px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div onClick={() => setSelectedLocation(location)} style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{location.name}</h4>
                    {location.description && (
                      <p style={{ fontSize: '0.9em', color: '#666', margin: 0 }}>{location.description}</p>
                    )}
                  </div>
                  {isAdmin(userRole) && (
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      {(userRole === 'super_admin' || locationPermissions[location.id]) && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Edit />}
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditLocation(location)
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<Delete />}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteLocation(location.id, location.name)
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedLocation && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Shelves in {selectedLocation.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isAdmin(userRole) && (
                    <>
                      <Button 
                        variant="contained"
                        startIcon={<Shelves />}
                        onClick={() => setShowShelfForm(true)}
                        size="small"
                      >
                        Add Shelf
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {shelves.map(shelf => (
                  <Paper key={shelf.id} sx={{ 
                    p: 1.5,
                    borderRadius: 1,
                    position: 'relative',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                      <strong>{shelf.name}</strong>
                    </div>
                    {isAdmin(userRole) && (
                      <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => startEditShelf(shelf)}
                          sx={{ 
                            p: 0.5,
                            backgroundColor: 'action.hover',
                            '&:hover': { backgroundColor: 'action.selected' }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteShelf(shelf.id, shelf.name)}
                          sx={{ 
                            p: 0.5,
                            backgroundColor: 'error.main',
                            color: 'white',
                            '&:hover': { backgroundColor: 'error.dark' }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Paper>
                ))}
              </div>

              {/* Permission Management Section */}
              {selectedLocation && userRole && (
                <LocationPermissionManager 
                  locationId={selectedLocation.id}
                  locationName={selectedLocation.name}
                  userRole={userRole}
                  singleShelfLocation={selectedLocation.single_shelf_location}
                />
              )}

            </div>
          )}
        </div>
      )}

      <Dialog 
        open={showCreateForm} 
        onClose={() => {
          setShowCreateForm(false)
          setEditingLocation(null)
          setNewLocationName('')
          setNewLocationDescription('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Create New Location'}
        </DialogTitle>
        <form onSubmit={editingLocation ? updateLocation : createLocation}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                autoFocus
                label="Location Name"
                type="text"
                fullWidth
                required
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g., Finsbury Road, Main Office"
              />
              
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newLocationDescription}
                onChange={(e) => setNewLocationDescription(e.target.value)}
                placeholder="Brief description of this location"
                helperText="Optional"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newLocationSingleShelf}
                    onChange={(e) => setNewLocationSingleShelf(e.target.checked)}
                    disabled={!!editingLocation && shelves.length > 1}
                  />
                }
                label="Single shelf location"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1, mb: 1, display: 'block' }}>
                {editingLocation && shelves.length > 1 
                  ? "Cannot enable single shelf mode when multiple shelves exist. Delete shelves to enable this option."
                  : "When enabled, this location will operate with only one shelf. Users cannot create additional shelves or move books between shelves."
                }
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowCreateForm(false)
                setEditingLocation(null)
                setNewLocationName('')
                setNewLocationDescription('')
                setNewLocationSingleShelf(false)
              }}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              startIcon={<Save />}
            >
              {editingLocation ? 'Update Location' : 'Create Location'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog 
        open={showShelfForm} 
        onClose={() => {
          setShowShelfForm(false)
          setEditingShelf(null)
          setNewShelfName('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingShelf ? 'Edit Shelf' : 'Add New Shelf'}
        </DialogTitle>
        <form onSubmit={editingShelf ? updateShelf : createShelf}>
          <DialogContent>
            <TextField
              autoFocus
              label="Shelf Name"
              type="text"
              fullWidth
              required
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="e.g., Fiction, Cookbooks, Reference"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowShelfForm(false)
                setEditingShelf(null)
                setNewShelfName('')
              }}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              startIcon={<Save />}
            >
              {editingShelf ? 'Update Shelf' : 'Add Shelf'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

        
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
    </Container>
  )
}