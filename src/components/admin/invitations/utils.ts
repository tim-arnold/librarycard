import type { LocationInvitation } from '../shared/types'

export const getInvitationStatus = (invitation: LocationInvitation) => {
  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)

  if (invitation.used_at) {
    return { status: 'accepted', color: 'success' as const, label: 'Accepted' }
  } else if (expiresAt < now) {
    return { status: 'expired', color: 'error' as const, label: 'Expired' }
  } else {
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 1) {
      return { status: 'expiring', color: 'warning' as const, label: 'Expires Soon' }
    }
    return { status: 'pending', color: 'info' as const, label: 'Pending' }
  }
}

export const getInvitationAnalytics = (invitations: LocationInvitation[]) => {
  const total = invitations.length
  const accepted = invitations.filter(inv => inv.used_at).length
  const pending = invitations.filter(inv => !inv.used_at && new Date(inv.expires_at) > new Date()).length
  const expired = invitations.filter(inv => !inv.used_at && new Date(inv.expires_at) <= new Date()).length

  return { total, accepted, pending, expired }
}

export const filterAndSortInvitations = (
  invitations: LocationInvitation[],
  searchTerm: string,
  statusFilter: string,
  locationFilter: string,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
) => {
  let filtered = invitations.filter(invitation => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = (
        invitation.invited_email.toLowerCase().includes(searchLower) ||
        invitation.location_name?.toLowerCase().includes(searchLower) ||
        invitation.invited_by_name?.toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }

    if (statusFilter !== 'all') {
      const status = getInvitationStatus(invitation).status
      if (status !== statusFilter) return false
    }

    if (locationFilter !== 'all') {
      if (invitation.location_id.toString() !== locationFilter) return false
    }

    return true
  })

  filtered.sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortBy) {
      case 'email':
        aValue = a.invited_email.toLowerCase()
        bValue = b.invited_email.toLowerCase()
        break
      case 'location':
        aValue = (a.location_name || '').toLowerCase()
        bValue = (b.location_name || '').toLowerCase()
        break
      case 'status':
        aValue = getInvitationStatus(a).status
        bValue = getInvitationStatus(b).status
        break
      case 'expires_at':
        aValue = new Date(a.expires_at).getTime()
        bValue = new Date(b.expires_at).getTime()
        break
      case 'invited_by':
        aValue = (a.invited_by_name || '').toLowerCase()
        bValue = (b.invited_by_name || '').toLowerCase()
        break
      case 'created_at':
      default:
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  return filtered
}
