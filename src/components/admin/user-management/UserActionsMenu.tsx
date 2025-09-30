import { Menu, MenuItem } from '@mui/material'
import { Email, Security, Person, LocationOn, ToggleOn, Delete } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import type { AdminUser } from '../shared/types'
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

interface UserActionsMenuProps {
  anchorEl: null | HTMLElement
  selectedUser: AdminUser | null
  currentUserRole: string
  onClose: () => void
  onPromoteToAdmin: () => void
  onDemoteToUser: () => void
  onPromoteToSuperAdmin: () => void
  onManageLocations: () => void
  onToggleActiveStatus: () => void
  onEmail: () => void
  onDelete: () => void
}

export default function UserActionsMenu({
  anchorEl,
  selectedUser,
  currentUserRole,
  onClose,
  onPromoteToAdmin,
  onDemoteToUser,
  onPromoteToSuperAdmin,
  onManageLocations,
  onToggleActiveStatus,
  onEmail,
  onDelete,
}: UserActionsMenuProps) {
  const { data: session } = useSession()

  if (!selectedUser) return null

  const isViewingSuperAdminAsRegularAdmin = selectedUser.user_role === 'super_admin' && !isSuperAdmin(currentUserRole)
  const isCurrentUser = selectedUser.email === session?.user?.email

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      {isViewingSuperAdminAsRegularAdmin ? (
        <MenuItem onClick={onEmail}>
          <Email sx={{ mr: 1 }} />
          Email
        </MenuItem>
      ) : (
        <>
          {selectedUser.user_role === 'user' && (
            <MenuItem onClick={onPromoteToAdmin}>
              <Security sx={{ mr: 1 }} />
              Promote to Admin
            </MenuItem>
          )}

          {selectedUser.user_role === 'admin' && !isCurrentUser && (
            <MenuItem onClick={onDemoteToUser}>
              <Person sx={{ mr: 1 }} />
              Demote to User
            </MenuItem>
          )}

          {isSuperAdmin(currentUserRole) && selectedUser.user_role === 'admin' && !isCurrentUser && (
            <MenuItem onClick={onPromoteToSuperAdmin}>
              <Security sx={{ mr: 1 }} />
              Promote to Super Admin
            </MenuItem>
          )}

          {isAdmin(currentUserRole) && (
            <MenuItem onClick={onManageLocations}>
              <LocationOn sx={{ mr: 1 }} />
              Manage Locations
            </MenuItem>
          )}

          {isSuperAdmin(currentUserRole) && !isCurrentUser && (
            <MenuItem onClick={onToggleActiveStatus}>
              <ToggleOn sx={{ mr: 1 }} />
              {selectedUser.is_active ? 'Disable Account' : 'Enable Account'}
            </MenuItem>
          )}

          <MenuItem onClick={onEmail}>
            <Email sx={{ mr: 1 }} />
            Email
          </MenuItem>

          {!isCurrentUser && !isViewingSuperAdminAsRegularAdmin && (
            <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
              <Delete sx={{ mr: 1 }} />
              Delete User
            </MenuItem>
          )}
        </>
      )}
    </Menu>
  )
}
