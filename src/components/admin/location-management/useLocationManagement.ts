import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { authenticatedApiCall } from '@/lib/api'
import type { Location } from '../shared/types'

interface UseLocationManagementProps {
  confirmAsync: (options: any, asyncAction: () => Promise<void>) => Promise<boolean>
  alert: (options: any) => Promise<void>
  checkAllLocationPermissions: (locations: Location[]) => Promise<void>
  userRole: string | null
}

interface LocationFormData {
  name: string
  description: string
  single_shelf_location: boolean
  activity_visibility: 'private' | 'public'
}

export function useLocationManagement({
  confirmAsync,
  alert,
  checkAllLocationPermissions,
  userRole,
}: UseLocationManagementProps) {
  const { data: session } = useSession()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null)

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

        await checkAllLocationPermissions(data)

        return data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load locations')
        return []
      }
    } catch (_error) {
      setError('Failed to load locations')
      return []
    } finally {
      setLoading(false)
    }
  }

  const createLocation = async (formData: LocationFormData): Promise<Location | null> => {
    if (!session?.user?.email) return null

    try {
      const response = await authenticatedApiCall('/api/locations', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          single_shelf_location: formData.single_shelf_location,
          activity_visibility: formData.activity_visibility,
        }),
      })

      if (response.ok) {
        const newLocation = await response.json()
        setLocations([...locations, newLocation])
        return newLocation
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create location')
        return null
      }
    } catch (_error) {
      setError('Failed to create location')
      return null
    }
  }

  const updateLocation = async (locationId: number, formData: LocationFormData): Promise<boolean> => {
    if (!session?.user?.email) return false

    try {
      const response = await authenticatedApiCall(`/api/locations/${locationId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          single_shelf_location: formData.single_shelf_location,
          activity_visibility: formData.activity_visibility,
        }),
      })

      if (response.ok) {
        await loadLocations()
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update location')
        return false
      }
    } catch (_error) {
      setError('Failed to update location')
      return false
    }
  }

  const deleteLocation = async (locationId: number, locationName: string) => {
    try {
      const confirmed = await confirmAsync(
        {
          title: 'Delete Location',
          message: `Are you sure you want to delete "${locationName}"? This will permanently delete all shelves and books in this location. This action cannot be undone.`,
          confirmText: 'Delete Location',
          variant: 'error'
        },
        async () => {
          if (!session?.user?.email) throw new Error('Not authenticated')

          const response = await authenticatedApiCall(`/api/locations/${locationId}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            setDeletingLocationId(locationId)

            setTimeout(() => {
              setLocations(locations.filter(loc => loc.id !== locationId))
              setDeletingLocationId(null)
            }, 1200)
          } else {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete location')
          }
        }
      )

      if (!confirmed) {
        return
      }
    } catch (error) {
      console.error('Error deleting location:', error)
      await alert({
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete the location. Please try again.',
        variant: 'error'
      })
    }
  }

  return {
    locations,
    setLocations,
    loading,
    error,
    setError,
    deletingLocationId,
    loadLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  }
}
