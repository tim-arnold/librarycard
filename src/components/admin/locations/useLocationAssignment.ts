import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { authenticatedApiCall } from '@/lib/api'
import { getApiBaseUrl } from '@/lib/apiConfig'
import type { Location } from '../shared/types'
import { useModal } from '@/hooks/useModal'

export function useLocationAssignment() {
  const { data: session } = useSession()
  const { alert } = useModal()
  const [userAssignedLocations, setUserAssignedLocations] = useState<Location[]>([])
  const [availableLocationsForAssignment, setAvailableLocationsForAssignment] = useState<Location[]>([])
  const [userGlobalPermissions, setUserGlobalPermissions] = useState<string[]>([])

  const loadUserAssignedLocations = async (userId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/locations`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserAssignedLocations(data.assigned_locations || [])
        setAvailableLocationsForAssignment(data.available_locations || [])
      } else {
        console.error('Failed to load user locations')
      }
    } catch (error) {
      console.error('Error loading user locations:', error)
    }
  }

  const loadUserGlobalPermissions = async (userId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/permissions/global?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserGlobalPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Failed to load user global permissions:', error)
      setUserGlobalPermissions([])
    }
  }

  const toggleGlobalPermission = async (userId: string, permission: string, currentlyHas: boolean) => {
    try {
      const response = await authenticatedApiCall('/api/permissions/global', {
        method: currentlyHas ? 'DELETE' : 'POST',
        body: JSON.stringify({
          targetUserId: userId,
          permission,
          ...(currentlyHas ? {} : { notes: 'Granted via Admin Dashboard' })
        })
      })

      if (response.ok) {
        await loadUserGlobalPermissions(userId)
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update global permission')
      }
    } catch (error) {
      console.error('Failed to toggle global permission:', error)
      return false
    }
  }

  const assignLocationToUser = async (userId: string, locationId: number, onSuccess?: (locationNames: string | null, locationsCount: number) => void) => {
    try {
      const response = await authenticatedApiCall(`/api/admin/users/${userId}/locations/${locationId}`, {
        method: 'POST',
      })

      if (response.ok) {
        const locResponse = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/locations`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        })

        if (locResponse.ok) {
          const locData = await locResponse.json()
          setUserAssignedLocations(locData.assigned_locations || [])
          setAvailableLocationsForAssignment(locData.available_locations || [])

          const locationNames = (locData.assigned_locations || []).map((loc: any) => loc.name).join(',')
          onSuccess?.(locationNames || null, (locData.assigned_locations || []).length)
        }

        await alert({
          title: 'Location Assigned',
          message: 'Location has been successfully assigned to the user.',
          variant: 'success'
        })
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign location')
      }
    } catch (error) {
      console.error('Error assigning location:', error)
      await alert({
        title: 'Assignment Failed',
        message: error instanceof Error ? error.message : 'Failed to assign location. Please try again.',
        variant: 'error'
      })
      return false
    }
  }

  const unassignLocationFromUser = async (userId: string, locationId: number, onSuccess?: (locationNames: string | null, locationsCount: number) => void) => {
    try {
      const response = await authenticatedApiCall(`/api/admin/users/${userId}/locations/${locationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const locResponse = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/locations`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        })

        if (locResponse.ok) {
          const locData = await locResponse.json()
          setUserAssignedLocations(locData.assigned_locations || [])
          setAvailableLocationsForAssignment(locData.available_locations || [])

          const locationNames = (locData.assigned_locations || []).map((loc: any) => loc.name).join(',')
          onSuccess?.(locationNames || null, (locData.assigned_locations || []).length)
        }

        await alert({
          title: 'Location Unassigned',
          message: 'Location has been successfully unassigned from the user.',
          variant: 'success'
        })
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unassign location')
      }
    } catch (error) {
      console.error('Error unassigning location:', error)
      await alert({
        title: 'Unassignment Failed',
        message: error instanceof Error ? error.message : 'Failed to unassign location. Please try again.',
        variant: 'error'
      })
      return false
    }
  }

  return {
    userAssignedLocations,
    availableLocationsForAssignment,
    userGlobalPermissions,
    loadUserAssignedLocations,
    loadUserGlobalPermissions,
    toggleGlobalPermission,
    assignLocationToUser,
    unassignLocationFromUser,
  }
}
