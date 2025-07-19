'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material'
import {
  ExpandMore,
  Security,
  People,
  AdminPanelSettings,
  Lock,
  LockOpen,
} from '@mui/icons-material'
import { authenticatedFetch } from '../../lib/auth-utils'

interface CanManagePermissionsResponse {
  canManagePermissions: boolean
}

interface LocationUserPermissionsResponse {
  permissions: LocationMember[]
}

interface LocationAdminCapabilitiesResponse {
  capabilities: LocationAdmin[]
}

interface LocationMember {
  userId: string
  userName: string
  userEmail: string
  permissions: string[]
  grantedBy: string
  grantedAt: string
}

interface LocationAdmin {
  userId: string
  userName: string
  userEmail: string
  accessType?: string
  capabilities: string[]
  grantedBy: string | null
  grantedAt: string | null
}

interface LocationPermissionManagerProps {
  locationId: number
  locationName: string
  userRole: string
  singleShelfLocation?: boolean
}

const USER_PERMISSIONS = [
  { key: 'can_add_books', label: 'Add Books', description: 'Add new books to the location' },
  { key: 'can_delete_books', label: 'Delete Books', description: 'Remove books from the location' },
  { key: 'can_move_books', label: 'Move Books', description: 'Move books between shelves' },
  { key: 'can_create_shelves', label: 'Create Shelves', description: 'Create new shelves in the location' },
  { key: 'can_edit_genres', label: 'Edit Genres', description: 'Manage genre assignments' },
]

const ADMIN_CAPABILITIES = [
  { key: 'can_control_user_capabilities', label: 'Control User Permissions', description: 'Grant/revoke user permissions' },
  { key: 'can_invite_users', label: 'Invite Users', description: 'Send location invitations' },
  { key: 'can_manage_shelves', label: 'Manage Shelves', description: 'Advanced shelf operations' },
  { key: 'can_manage_location_settings', label: 'Manage Location', description: 'Edit location details' },
]

export default function LocationPermissionManager({ locationId, locationName, userRole, singleShelfLocation = false }: LocationPermissionManagerProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<LocationMember[]>([])
  const [admins, setAdmins] = useState<LocationAdmin[]>([])
  const [updatingPermissions, setUpdatingPermissions] = useState<string>('')
  const [canManagePermissions, setCanManagePermissions] = useState<boolean>(false)
  const [bulkUpdating, setBulkUpdating] = useState<string>('')
  const [bulkControlsLocked, setBulkControlsLocked] = useState<boolean>(true)

  const isSuperAdmin = userRole === 'super_admin'

  useEffect(() => {
    if (session && locationId) {
      checkPermissionAccess()
    }
  }, [locationId, session])

  // Removed duplicate useEffect - loadPermissions is now called directly in checkPermissionAccess

  const checkPermissionAccess = async () => {
    try {
      setLoading(true)
      const result = await authenticatedFetch<CanManagePermissionsResponse>(session, `/api/permissions/can-manage?location_id=${locationId}`)
      
      if (result.success) {
        const hasManagePermission = result.data?.canManagePermissions || false
        setCanManagePermissions(hasManagePermission)
      } else {
        setCanManagePermissions(false)
      }
      
      // Always try to load permissions - location admins can view even without manage capability
      await loadPermissions()
    } catch (err) {
      console.error('Error checking permission access:', err)
      setCanManagePermissions(false)
      // Still try to load permissions in case user can view but not manage
      try {
        await loadPermissions()
      } catch (loadErr) {
        console.error('Error loading permissions:', loadErr)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      setLoading(true)
      setError('')

      // Always load user permissions
      const membersResult = await authenticatedFetch<LocationUserPermissionsResponse>(session, `/api/admin/location-user-permissions?location_id=${locationId}`)
      
      if (!membersResult.success) {
        throw new Error(membersResult.error || 'Failed to load user permissions')
      }
      
      setMembers(membersResult.data?.permissions || [])

      // Only load admin capabilities for super admins
      if (isSuperAdmin) {
        const adminsResult = await authenticatedFetch<LocationAdminCapabilitiesResponse>(session, `/api/admin/location-admin-capabilities?location_id=${locationId}`)
        
        if (adminsResult.success) {
          setAdmins(adminsResult.data?.capabilities || [])
        } else {
          console.warn('Failed to load admin capabilities:', adminsResult.error)
          setAdmins([])
        }
      } else {
        setAdmins([])
      }
    } catch (err) {
      console.error('Error loading permissions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserPermission = async (userId: string, permission: string, currentlyHas: boolean) => {
    try {
      setUpdatingPermissions(`${userId}-${permission}`)
      
      const method = currentlyHas ? 'DELETE' : 'POST'
      const result = await authenticatedFetch(session, '/api/admin/location-user-permissions', {
        method,
        body: {
          locationId,
          targetUserId: userId,
          permission,
        }
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update permission')
      }

      // Reload permissions to reflect changes
      await loadPermissions()
    } catch (err) {
      console.error('Error updating permission:', err)
      setError(err instanceof Error ? err.message : 'Failed to update permission')
    } finally {
      setUpdatingPermissions('')
    }
  }

  const bulkTogglePermission = async (permission: string, grantToAll: boolean) => {
    try {
      setBulkUpdating(permission)
      
      // Process all regular users (non-admin members)
      const promises = members.map(member => {
        const currentlyHas = member.permissions.includes(permission)
        
        // Only make API call if the permission state needs to change
        if ((grantToAll && !currentlyHas) || (!grantToAll && currentlyHas)) {
          const method = grantToAll ? 'POST' : 'DELETE'
          return authenticatedFetch(session, '/api/admin/location-user-permissions', {
            method,
            body: {
              locationId,
              targetUserId: member.userId,
              permission,
            }
          })
        }
        return Promise.resolve({ success: true }) // No change needed
      })

      const results = await Promise.all(promises)
      
      // Check if any requests failed
      const failures = results.filter(result => !result.success)
      if (failures.length > 0) {
        throw new Error(`Failed to update ${failures.length} user(s)`)
      }

      // Reload permissions to reflect changes
      await loadPermissions()
    } catch (err) {
      console.error('Error bulk updating permission:', err)
      setError(err instanceof Error ? err.message : 'Failed to bulk update permission')
    } finally {
      setBulkUpdating('')
    }
  }

  const toggleAdminCapability = async (userId: string, capability: string, currentlyHas: boolean) => {
    try {
      setUpdatingPermissions(`${userId}-${capability}`)
      
      const method = currentlyHas ? 'DELETE' : 'POST'
      const result = await authenticatedFetch(session, '/api/admin/location-admin-capabilities', {
        method,
        body: {
          locationId,
          targetUserId: userId,
          capability,
        }
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update capability')
      }

      // Reload permissions to reflect changes
      await loadPermissions()
    } catch (err) {
      console.error('Error updating capability:', err)
      setError(err instanceof Error ? err.message : 'Failed to update capability')
    } finally {
      setUpdatingPermissions('')
    }
  }

  // Don't return early - allow viewing even without manage capability

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
        <Button onClick={loadPermissions} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    )
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security />
        Permission Management - {locationName}
      </Typography>

      {!canManagePermissions && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You can view permissions but cannot modify them. Only super administrators or location admins with &quot;Control User Permissions&quot; capability can make changes.
        </Alert>
      )}

      {/* Location Admin Capabilities - Only for Super Admins */}
      {isSuperAdmin && (
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminPanelSettings />
              <Typography variant="subtitle1" fontWeight="medium">
                Location Admin Capabilities ({admins.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control what administrative functions location admins can perform.
          </Typography>
          
          {admins.length === 0 ? (
            <Alert severity="info">
              No location admins found. Location admins inherit all user permissions automatically.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Admin</TableCell>
                    {ADMIN_CAPABILITIES.map(cap => (
                      <TableCell key={cap.key} align="center">
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" display="block" fontWeight="medium">
                            {cap.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cap.description}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admins.map(admin => (
                    <TableRow key={admin.userId}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {admin.userName}
                            {admin.accessType && (
                              <Chip 
                                label={admin.accessType} 
                                size="small" 
                                variant="outlined" 
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                                color={admin.accessType === 'Owner' ? 'primary' : 'default'}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {admin.userEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      {ADMIN_CAPABILITIES.map(cap => {
                        const hasCapability = admin.capabilities.includes(cap.key)
                        const isUpdating = updatingPermissions === `${admin.userId}-${cap.key}`
                        const isIrrelevantInSingleShelf = singleShelfLocation && cap.key === 'can_manage_shelves'
                        
                        return (
                          <TableCell key={cap.key} align="center">
                            {isUpdating ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Switch
                                checked={isIrrelevantInSingleShelf ? false : hasCapability}
                                onChange={() => toggleAdminCapability(admin.userId, cap.key, hasCapability)}
                                disabled={!canManagePermissions || isIrrelevantInSingleShelf}
                                size="small"
                                color={isIrrelevantInSingleShelf ? "default" : (hasCapability ? "success" : "default")}
                              />
                            )}
                            {isIrrelevantInSingleShelf && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                N/A (Single shelf)
                              </Typography>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
        </Accordion>
      )}

      {/* User Permissions */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People />
            <Typography variant="subtitle1" fontWeight="medium">
              User Permissions ({members.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control what actions regular users can perform in this location. Location admins inherit all these permissions automatically.
          </Typography>

          {members.length === 0 ? (
            <Alert severity="info">
              No regular users found with specific permissions. Users without permissions can view books but cannot modify them.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    {USER_PERMISSIONS.map(perm => (
                      <TableCell key={perm.key} align="center">
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" display="block" fontWeight="medium">
                            {perm.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {perm.description}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Bulk Permission Controls Row */}
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          component="button"
                          onClick={() => setBulkControlsLocked(!bulkControlsLocked)}
                          sx={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color: bulkControlsLocked ? 'text.secondary' : 'primary.main',
                            '&:hover': {
                              color: bulkControlsLocked ? 'text.primary' : 'primary.dark',
                            }
                          }}
                          disabled={!canManagePermissions}
                        >
                          {bulkControlsLocked ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Bulk Controls {bulkControlsLocked ? '(Locked)' : '(Unlocked)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bulkControlsLocked ? 'Click lock to enable' : `Apply to all ${members.length} users`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    {USER_PERMISSIONS.map(perm => {
                      const usersWithPermission = members.filter(m => m.permissions.includes(perm.key)).length
                      const allHavePermission = usersWithPermission === members.length
                      const isUpdating = bulkUpdating === perm.key
                      const isIrrelevantInSingleShelf = singleShelfLocation && (perm.key === 'can_create_shelves' || perm.key === 'can_move_books')
                      
                      return (
                        <TableCell key={perm.key} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            {isUpdating ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Switch
                                checked={isIrrelevantInSingleShelf ? false : allHavePermission}
                                onChange={() => bulkTogglePermission(perm.key, !allHavePermission)}
                                disabled={!canManagePermissions || bulkControlsLocked || isIrrelevantInSingleShelf}
                                size="small"
                                color={isIrrelevantInSingleShelf ? "default" : (allHavePermission ? "success" : "default")}
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {isIrrelevantInSingleShelf ? 'N/A' : `${usersWithPermission}/${members.length}`}
                            </Typography>
                          </Box>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  
                  {/* Individual User Rows */}
                  {members.map(member => (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {member.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.userEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      {USER_PERMISSIONS.map(perm => {
                        const hasPermission = member.permissions.includes(perm.key)
                        const isUpdating = updatingPermissions === `${member.userId}-${perm.key}`
                        const isIrrelevantInSingleShelf = singleShelfLocation && (perm.key === 'can_create_shelves' || perm.key === 'can_move_books')
                        
                        return (
                          <TableCell key={perm.key} align="center">
                            {isUpdating ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Switch
                                checked={isIrrelevantInSingleShelf ? false : hasPermission}
                                onChange={() => toggleUserPermission(member.userId, perm.key, hasPermission)}
                                disabled={!canManagePermissions || isIrrelevantInSingleShelf}
                                size="small"
                                color={isIrrelevantInSingleShelf ? "default" : (hasPermission ? "success" : "default")}
                              />
                            )}
                            {isIrrelevantInSingleShelf && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Permission Hierarchy:</strong> Super admins have all permissions everywhere. 
          Location admins automatically inherit all user-level permissions. 
          Regular users must be explicitly granted each permission.
        </Typography>
      </Alert>
    </Box>
  )
}