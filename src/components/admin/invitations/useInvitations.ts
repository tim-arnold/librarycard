import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { authenticatedApiCall } from '@/lib/api'
import { getApiBaseUrl } from '@/lib/apiConfig'
import type { LocationInvitation, Location } from '../shared/types'

interface UseInvitationsProps {
  confirmAsync: (options: any, asyncAction: () => Promise<void>) => Promise<boolean>
  alert: (options: any) => Promise<void>
}

export function useInvitations({ confirmAsync, alert }: UseInvitationsProps) {
  const { data: session } = useSession()
  const [invitations, setInvitations] = useState<LocationInvitation[]>([])
  const [availableLocations, setAvailableLocations] = useState<Location[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)

  const loadInvitations = async () => {
    if (!session?.user?.email) return

    try {
      setInvitationsLoading(true)

      const locationsResponse = await fetch(`${getApiBaseUrl()}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })

      if (!locationsResponse.ok) {
        throw new Error('Failed to load locations')
      }

      const locations = await locationsResponse.json()

      const allInvitations: LocationInvitation[] = []

      for (const location of locations) {
        try {
          const invitationsResponse = await fetch(`${getApiBaseUrl()}/api/locations/${location.id}/invitations`, {
            headers: {
              'Authorization': `Bearer ${session.user.email}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-cache'
          })

          if (invitationsResponse.ok) {
            const locationInvitations = await invitationsResponse.json()
            const enrichedInvitations = locationInvitations.map((inv: any) => ({
              ...inv,
              location_name: location.name
            }))
            allInvitations.push(...enrichedInvitations)
          }
        } catch (error) {
          console.error(`Error loading invitations for location ${location.name}:`, error)
        }
      }

      setInvitations(allInvitations)
    } catch (error) {
      console.error('Error loading invitations:', error)
      throw error
    } finally {
      setInvitationsLoading(false)
    }
  }

  const loadAvailableLocations = async () => {
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
        setAvailableLocations(data)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const sendSingleInvitation = async (
    inviteEmail: string,
    selectedLocationId: number | null,
    inviteCustomMessage: string
  ) => {
    if (!inviteEmail.trim() || !selectedLocationId) return false
    if (!session?.user?.email) return false

    try {
      const response = await authenticatedApiCall(`/api/locations/${selectedLocationId}/invite`, {
        method: 'POST',
        body: JSON.stringify({
          invited_email: inviteEmail.trim(),
          custom_message: inviteCustomMessage.trim() || undefined,
        }),
      })

      if (response.ok) {
        await alert({
          title: 'Invitation Sent',
          message: `Invitation successfully sent to ${inviteEmail}`,
          variant: 'success'
        })
        await loadInvitations()
        return true
      } else {
        const errorData = await response.json()
        await alert({
          title: 'Invitation Failed',
          message: errorData.error || 'Failed to send invitation',
          variant: 'error'
        })
        return false
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      await alert({
        title: 'Invitation Failed',
        message: 'Failed to send invitation. Please try again.',
        variant: 'error'
      })
      return false
    }
  }

  const sendBulkInvitations = async (
    bulkEmails: string,
    selectedLocationId: number | null
  ): Promise<{email: string, success: boolean, error?: string}[]> => {
    if (!bulkEmails.trim() || !selectedLocationId) return []
    if (!session?.user?.email) return []

    const emailList = bulkEmails
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emailList.length === 0) {
      await alert({
        title: 'No Emails',
        message: 'Please enter at least one email address.',
        variant: 'warning'
      })
      return []
    }

    const results: {email: string, success: boolean, error?: string}[] = []

    for (const email of emailList) {
      try {
        const response = await authenticatedApiCall(`/api/locations/${selectedLocationId}/invite`, {
          method: 'POST',
          body: JSON.stringify({
            invited_email: email,
          }),
        })

        if (response.ok) {
          results.push({ email, success: true })
        } else {
          const errorData = await response.json()
          results.push({ email, success: false, error: errorData.error || 'Failed to send' })
        }
      } catch (_error) {
        results.push({ email, success: false, error: 'Network error' })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount

    if (failCount === 0) {
      await alert({
        title: 'All Invitations Sent',
        message: `Successfully sent ${successCount} invitation(s)!`,
        variant: 'success'
      })
      await loadInvitations()
    } else {
      await alert({
        title: 'Bulk Invitation Results',
        message: `${successCount} succeeded, ${failCount} failed. See details below.`,
        variant: successCount > 0 ? 'warning' : 'error'
      })
      if (successCount > 0) {
        await loadInvitations()
      }
    }

    return results
  }

  const revokeInvitation = async (invitationId: number, invitedEmail: string) => {
    await confirmAsync(
      {
        title: 'Revoke Invitation',
        message: `Are you sure you want to revoke the invitation for ${invitedEmail}? This action cannot be undone.`,
        confirmText: 'Revoke Invitation',
        variant: 'warning'
      },
      async () => {
        if (!session?.user?.email) throw new Error('Not authenticated')

        const response = await authenticatedApiCall(`/api/invitations/${invitationId}/revoke`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await alert({
            title: 'Invitation Revoked',
            message: `Invitation for ${invitedEmail} has been successfully revoked.`,
            variant: 'success'
          })
          await loadInvitations()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to revoke invitation')
        }
      }
    )
  }

  return {
    invitations,
    availableLocations,
    invitationsLoading,
    loadInvitations,
    loadAvailableLocations,
    sendSingleInvitation,
    sendBulkInvitations,
    revokeInvitation,
  }
}
