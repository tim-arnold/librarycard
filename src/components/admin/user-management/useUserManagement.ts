import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { authenticatedApiCall } from '@/lib/api'
import { getApiBaseUrl } from '@/lib/apiConfig'
import type { AdminUser } from '../shared/types'

interface UseUserManagementProps {
  confirmAsync: (options: any, asyncAction: () => Promise<void>) => Promise<boolean>
  alert: (options: any) => Promise<void>
}

export function useUserManagement({ confirmAsync, alert }: UseUserManagementProps) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  const loadUsers = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      const response = await fetch(`${getApiBaseUrl()}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUserRole = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentUserRole(data.user_role || 'user')
      }
    } catch (error) {
      console.error('Failed to fetch current user role:', error)
      setCurrentUserRole('user')
    }
  }

  const toggleUserActiveStatus = async (user: AdminUser) => {
    const newStatus = !user.is_active
    const action = newStatus ? 'enable' : 'disable'
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email

    await confirmAsync(
      {
        title: `${action === 'enable' ? 'Enable' : 'Disable'} User Account`,
        message: `Are you sure you want to ${action} ${userName}'s account? ${
          action === 'disable'
            ? 'They will not be able to log in until re-enabled.'
            : 'They will be able to log in again.'
        }`,
        confirmText: `${action === 'enable' ? 'Enable' : 'Disable'} Account`,
        variant: action === 'disable' ? 'warning' : 'info'
      },
      async () => {
        const response = await authenticatedApiCall(`/api/admin/users/${user.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ is_active: newStatus })
        })

        if (response.ok) {
          await loadUsers()
          await alert({
            title: 'Status Updated',
            message: `${userName}'s account has been ${action}d.`,
            variant: 'success'
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update user status')
        }
      }
    )
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user', userName: string) => {
    await confirmAsync(
      {
        title: `Change User Role`,
        message: `Are you sure you want to change ${userName}'s role to ${newRole}? ${
          newRole === 'admin'
            ? 'This will give them full administrative privileges.'
            : 'This will remove their administrative privileges.'
        }`,
        confirmText: `Change to ${newRole}`,
        variant: newRole === 'admin' ? 'warning' : 'info'
      },
      async () => {
        const response = await authenticatedApiCall(`/api/admin/users/${userId}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role: newRole })
        })

        if (response.ok) {
          await loadUsers()
          await alert({
            title: 'Role Updated',
            message: `${userName}'s role has been successfully changed to ${newRole}.`,
            variant: 'success'
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update user role')
        }
      }
    )
  }

  const promoteToSuperAdmin = async (user: AdminUser) => {
    try {
      const response = await authenticatedApiCall(`/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'super_admin' })
      })

      if (response.ok) {
        await loadUsers()
        await alert({
          title: 'Promotion Successful',
          message: `${user.first_name || user.email} has been promoted to Super Admin.`,
          variant: 'success'
        })
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to promote user')
      }
    } catch (error) {
      console.error('Error promoting user:', error)
      await alert({
        title: 'Promotion Failed',
        message: error instanceof Error ? error.message : 'Failed to promote user. Please try again.',
        variant: 'error'
      })
      return false
    }
  }

  const deleteUser = async (user: AdminUser) => {
    try {
      const response = await authenticatedApiCall('/api/admin/cleanup-user', {
        method: 'POST',
        body: JSON.stringify({ email_to_delete: user.email })
      })

      if (response.ok) {
        const result = await response.json()
        setUsers(users.filter(u => u.email !== user.email))
        await alert({
          title: 'User Deleted',
          message: result.message,
          variant: 'success'
        })
        return { success: true }
      } else {
        const errorData = await response.json()

        if (errorData.requires_ownership_transfer) {
          return {
            success: false,
            requiresOwnershipTransfer: true,
            ownedLocations: errorData.owned_locations
          }
        } else {
          throw new Error(errorData.error || 'Failed to delete user')
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      await alert({
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete user. Please try again.',
        variant: 'error'
      })
      return { success: false }
    }
  }

  const updateUserLocations = (userId: string, locationNames: string | null, locationsCount: number) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? {
              ...user,
              locations_joined: locationsCount,
              location_names: locationNames
            }
          : user
      )
    )
  }

  return {
    users,
    loading,
    error,
    currentUserRole,
    loadUsers,
    loadCurrentUserRole,
    toggleUserActiveStatus,
    updateUserRole,
    promoteToSuperAdmin,
    deleteUser,
    updateUserLocations,
    setUsers,
  }
}
