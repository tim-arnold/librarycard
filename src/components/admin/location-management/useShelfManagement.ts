import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { authenticatedApiCall } from '@/lib/api'
import type { Shelf } from '../shared/types'

interface UseShelfManagementProps {
  confirmAsync: (options: any, asyncAction: () => Promise<void>) => Promise<boolean>
  alert: (options: any) => Promise<void>
}

export function useShelfManagement({ confirmAsync, alert }: UseShelfManagementProps) {
  const { data: session } = useSession()
  const [shelves, setShelves] = useState<Shelf[]>([])

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
      }
    } catch (error) {
      console.error('Failed to load shelves:', error)
    }
  }

  const createShelf = async (locationId: number, name: string) => {
    if (!session?.user?.email) return

    try {
      const response = await authenticatedApiCall(`/api/locations/${locationId}/shelves`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
        }),
      })

      if (response.ok) {
        const newShelf = await response.json()
        setShelves([...shelves, newShelf])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create shelf')
      }
    } catch (error) {
      console.error('Failed to create shelf:', error)
      throw error
    }
  }

  const updateShelf = async (locationId: number, shelfId: number, name: string) => {
    if (!session?.user?.email) return

    try {
      const response = await authenticatedApiCall(`/api/shelves/${shelfId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
        }),
      })

      if (response.ok) {
        await loadShelves(locationId)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update shelf')
      }
    } catch (error) {
      console.error('Failed to update shelf:', error)
      throw error
    }
  }

  const deleteShelf = async (shelfId: number, shelfName: string) => {
    try {
      const confirmed = await confirmAsync(
        {
          title: 'Delete Shelf',
          message: `Are you sure you want to delete "${shelfName}"? If this shelf contains books, you'll need to move them first or choose to delete them as well.`,
          confirmText: 'Delete Shelf',
          variant: 'error'
        },
        async () => {
          if (!session?.user?.email) throw new Error('Not authenticated')

          const response = await authenticatedApiCall(`/api/shelves/${shelfId}`, {
            method: 'DELETE',
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
        return
      }
    } catch (error) {
      console.error('Error deleting shelf:', error)
      await alert({
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete the shelf. Please try again.',
        variant: 'error'
      })
    }
  }

  return {
    shelves,
    setShelves,
    loadShelves,
    createShelf,
    updateShelf,
    deleteShelf,
  }
}
