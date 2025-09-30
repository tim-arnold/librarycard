import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'
import type { Location } from '../shared/types'

export function useLocationPermissions() {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [locationPermissions, setLocationPermissions] = useState<Record<number, boolean>>({})
  const [canManageLocationPermissions, setCanManageLocationPermissions] = useState<boolean>(false)

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

  const checkAllLocationPermissions = async (locations: Location[]) => {
    if (!session?.user?.email) return

    const permissions: Record<number, boolean> = {}

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
      const response = await fetch(`${getApiBaseUrl()}/api/permissions/check?locationId=${locationId}&permission=can_manage_location_settings`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
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

  return {
    userRole,
    locationPermissions,
    canManageLocationPermissions,
    loadUserRole,
    checkAllLocationPermissions,
    checkLocationManagePermission,
    canManageLocationSettings,
  }
}
