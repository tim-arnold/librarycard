'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Home } from '@mui/icons-material'
import ConfirmationModal from '../modals/ConfirmationModal'
import AlertModal from '../modals/AlertModal'
import { useModal } from '@/hooks/useModal'
import LocationPermissionManager from './LocationPermissionManager'
import LocationOnboardingStepper from './LocationOnboardingStepper'
import { useLocationPermissions } from './location-management/useLocationPermissions'
import { useShelfManagement } from './location-management/useShelfManagement'
import { useLocationManagement } from './location-management/useLocationManagement'
import EmptyLocationState from './location-management/EmptyLocationState'
import LocationList from './location-management/LocationList'
import ShelfList from './location-management/ShelfList'
import LocationFormDialog from './location-management/LocationFormDialog'
import ShelfFormDialog from './location-management/ShelfFormDialog'
import type { Location, Shelf } from './shared/types'

const isAdmin = (role: string | null): boolean => {
  return role === 'super_admin' || role === 'admin'
}

export default function LocationManager() {
  const { data: session } = useSession()
  const { modalState, confirmAsync, alert, closeModal } = useModal()

  const {
    userRole,
    locationPermissions,
    canManageLocationPermissions,
    loadUserRole,
    checkAllLocationPermissions,
    checkLocationManagePermission,
  } = useLocationPermissions()

  const {
    locations,
    loading,
    error,
    setError,
    deletingLocationId,
    loadLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  } = useLocationManagement({
    confirmAsync,
    alert,
    checkAllLocationPermissions,
    userRole,
  })

  const {
    shelves,
    setShelves,
    loadShelves,
    createShelf,
    updateShelf,
    deleteShelf,
  } = useShelfManagement({ confirmAsync, alert })

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [showShelfForm, setShowShelfForm] = useState(false)
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null)
  const [showOnboardingStepper, setShowOnboardingStepper] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadLocations()
      loadUserRole()
    }
  }, [session])

  useEffect(() => {
    if (selectedLocation && session?.user) {
      loadShelves(selectedLocation.id)
      checkLocationManagePermission(selectedLocation.id)
    } else {
      setShelves([])
    }
  }, [selectedLocation, session])

  useEffect(() => {
    if (locations.length === 0 && userRole === 'super_admin') {
      setShowCreateForm(true)
    } else if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0])
    }
  }, [locations, userRole])

  const handleCreateLocation = async (formData: any) => {
    const newLocation = await createLocation(formData)
    if (newLocation) {
      setSelectedLocation(newLocation)
      setShowCreateForm(false)
      setEditingLocation(null)
      await loadShelves(newLocation.id)
    }
  }

  const handleUpdateLocation = async (locationId: number, formData: any) => {
    const success = await updateLocation(locationId, formData)
    if (success) {
      setShowCreateForm(false)
      setEditingLocation(null)
    }
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setShowCreateForm(true)
    checkLocationManagePermission(location.id)
  }

  const handleDeleteLocation = async (locationId: number, locationName: string) => {
    await deleteLocation(locationId, locationName)
    if (selectedLocation?.id === locationId) {
      const remainingLocations = locations.filter(loc => loc.id !== locationId)
      setSelectedLocation(remainingLocations[0] || null)
    }
  }

  const handleCreateShelf = async (locationId: number, name: string) => {
    await createShelf(locationId, name)
  }

  const handleUpdateShelf = async (locationId: number, shelfId: number, name: string) => {
    await updateShelf(locationId, shelfId, name)
  }

  const handleEditShelf = (shelf: Shelf) => {
    setEditingShelf(shelf)
    setShowShelfForm(true)
  }

  const handleLocationCreated = async () => {
    await loadLocations()
    setShowOnboardingStepper(false)
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pb: 2 }}>
        <Paper sx={{ p: 3, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
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
    <Container maxWidth="xl" sx={{ pb: 2 }}>
      <Paper sx={{ p: 3, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
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
          <EmptyLocationState
            userRole={userRole}
            onCreateLocation={() => setShowOnboardingStepper(true)}
          />
        ) : (
          <div>
            <LocationList
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
              onEditLocation={handleEditLocation}
              onDeleteLocation={handleDeleteLocation}
              onCreateLocation={() => setShowOnboardingStepper(true)}
              userRole={userRole}
              locationPermissions={locationPermissions}
              deletingLocationId={deletingLocationId}
              currentUserEmail={session?.user?.email || null}
            />

            {selectedLocation && (
              <div>
                <ShelfList
                  shelves={shelves}
                  locationName={selectedLocation.name}
                  onEditShelf={handleEditShelf}
                  onDeleteShelf={deleteShelf}
                  onAddShelf={() => setShowShelfForm(true)}
                  isAdmin={isAdmin(userRole)}
                />

                {selectedLocation && userRole && (
                  <LocationPermissionManager
                    locationId={selectedLocation.id}
                    locationName={selectedLocation.name}
                    userRole={userRole}
                    singleShelfLocation={Boolean(selectedLocation.single_shelf_location)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <LocationFormDialog
          open={showCreateForm}
          onClose={() => {
            setShowCreateForm(false)
            setEditingLocation(null)
          }}
          editingLocation={editingLocation}
          existingShelves={shelves}
          onCreate={handleCreateLocation}
          onUpdate={handleUpdateLocation}
        />

        <ShelfFormDialog
          open={showShelfForm}
          onClose={() => {
            setShowShelfForm(false)
            setEditingShelf(null)
          }}
          editingShelf={editingShelf}
          locationId={selectedLocation?.id || null}
          onCreate={handleCreateShelf}
          onUpdate={handleUpdateShelf}
        />

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

        <LocationOnboardingStepper
          open={showOnboardingStepper}
          onClose={() => setShowOnboardingStepper(false)}
          onLocationCreated={handleLocationCreated}
          userRole={userRole}
        />
      </Paper>
    </Container>
  )
}
