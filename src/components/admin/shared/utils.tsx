import { Chip } from '@mui/material'
import { Security, CheckCircle, Cancel } from '@mui/icons-material'
import type { AdminUser } from './types'

export const formatDate = (dateString: string) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const getRoleChip = (role: string, verified: boolean) => {
  if (role === 'super_admin') {
    return <Chip icon={<Security />} label="Super Admin" color="error" size="small" />
  }
  if (role === 'admin') {
    return <Chip icon={<Security />} label="Admin" color="primary" size="small" />
  }
  return (
    <Chip
      icon={verified ? <CheckCircle /> : <Cancel />}
      label={verified ? "User" : "Unverified"}
      color={verified ? "success" : "warning"}
      size="small"
    />
  )
}

export const getProviderChip = (provider: string) => {
  const color = provider === 'google' ? 'info' : 'default'
  return <Chip label={provider} color={color} size="small" variant="outlined" />
}

export const formatLocationDisplay = (user: AdminUser) => {
  if (!user.location_names) {
    return `${user.locations_joined} locations`
  }

  const locationNames = user.location_names.split(',').filter(name => name && name.trim())

  if (locationNames.length === 1) {
    return locationNames[0].trim()
  } else if (locationNames.length > 1) {
    return `${locationNames.length} locations`
  } else {
    return `${user.locations_joined} locations`
  }
}

export const formatInvitationDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
