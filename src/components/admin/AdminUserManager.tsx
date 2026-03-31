'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material'
import { Person, Refresh, Email as EmailIcon } from '@mui/icons-material'
import ConfirmationModal from '../modals/ConfirmationModal'
import AlertModal from '../modals/AlertModal'
import { useModal } from '@/hooks/useModal'
import { useUserManagement } from './user-management/useUserManagement'
import { useLocationAssignment } from './locations/useLocationAssignment'
import UserTable from './user-management/UserTable'
import UserActionsMenu from './user-management/UserActionsMenu'
import OwnershipTransferDialog from './user-management/OwnershipTransferDialog'
import EmailDialog from './user-management/EmailDialog'
import RolePromotionDialog from './user-management/RolePromotionDialog'
import LocationAssignmentDialog from './locations/LocationAssignmentDialog'
import InvitationManager from './invitations/InvitationManager'
import type { AdminUser } from './shared/types'

export default function AdminUserManager() {
  const { data: session } = useSession()
  const { modalState, confirmAsync, alert, closeModal } = useModal()
  const {
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
  } = useUserManagement({ confirmAsync, alert })

  const {
    userAssignedLocations,
    availableLocationsForAssignment,
    userGlobalPermissions,
    loadUserAssignedLocations,
    loadUserGlobalPermissions,
    toggleGlobalPermission,
    assignLocationToUser,
    unassignLocationFromUser,
  } = useLocationAssignment({ alert })

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showInvitations, setShowInvitations] = useState(false)
  const [ownershipTransferDialogOpen, setOwnershipTransferDialogOpen] = useState(false)
  const [ownedLocations, setOwnedLocations] = useState<any[]>([])
  const [userToDelete, setUserToDelete] = useState('')
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState<AdminUser | null>(null)
  const [rolePromotionDialogOpen, setRolePromotionDialogOpen] = useState(false)
  const [userForRoleChange, setUserForRoleChange] = useState<AdminUser | null>(null)
  const [locationAssignmentDialogOpen, setLocationAssignmentDialogOpen] = useState(false)
  const [userForLocationAssignment, setUserForLocationAssignment] = useState<AdminUser | null>(null)

  const invitationsSectionRef = useRef<HTMLDivElement>(null)
  const dataLoadedRef = useRef(false)

  useEffect(() => {
    if (session?.user?.email && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      loadUsers()
      loadCurrentUserRole()
    }
  }, [session?.user?.email])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: AdminUser) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const handleDeleteUser = async (user: AdminUser) => {
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email

    const result = await deleteUser(user)

    if (result.requiresOwnershipTransfer) {
      setOwnedLocations(result.ownedLocations)
      setUserToDelete(user.email)
      setOwnershipTransferDialogOpen(true)
    }
  }

  const handleOwnershipTransferSuccess = () => {
    setUsers(users.filter(u => u.email !== userToDelete))
    setOwnershipTransferDialogOpen(false)
    setUserToDelete('')
    setOwnedLocations([])
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mr: 2 }} />
        <Typography color="text.secondary">
          Loading users...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} /> User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={showInvitations ? "contained" : "outlined"}
            startIcon={<EmailIcon />}
            onClick={() => {
              setShowInvitations(!showInvitations)
              if (!showInvitations) {
                setTimeout(() => {
                  invitationsSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  })
                }, 100)
              }
            }}
            size="small"
          >
            Invitations
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadUsers}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <UserTable users={users} onMenuClick={handleMenuClick} />
        </CardContent>
      </Card>

      <div ref={invitationsSectionRef}>
        <InvitationManager visible={showInvitations} confirmAsync={confirmAsync} alert={alert} />
      </div>

      <UserActionsMenu
        anchorEl={anchorEl}
        selectedUser={selectedUser}
        currentUserRole={currentUserRole}
        onClose={handleMenuClose}
        onPromoteToAdmin={() => {
          if (!selectedUser) return
          handleMenuClose()
          const userName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email
          updateUserRole(selectedUser.id, 'admin', userName)
        }}
        onDemoteToUser={() => {
          if (!selectedUser) return
          handleMenuClose()
          const userName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email
          updateUserRole(selectedUser.id, 'user', userName)
        }}
        onPromoteToSuperAdmin={() => {
          handleMenuClose()
          setUserForRoleChange(selectedUser)
          setRolePromotionDialogOpen(true)
        }}
        onManageLocations={() => {
          if (!selectedUser) return
          handleMenuClose()
          setUserForLocationAssignment(selectedUser)
          loadUserAssignedLocations(selectedUser.id)
          loadUserGlobalPermissions(selectedUser.id)
          setLocationAssignmentDialogOpen(true)
        }}
        onToggleActiveStatus={() => {
          if (!selectedUser) return
          handleMenuClose()
          toggleUserActiveStatus(selectedUser)
        }}
        onEmail={() => {
          handleMenuClose()
          setEmailRecipient(selectedUser)
          setEmailDialogOpen(true)
        }}
        onDelete={() => {
          if (!selectedUser) return
          handleMenuClose()
          handleDeleteUser(selectedUser)
        }}
      />

      <OwnershipTransferDialog
        open={ownershipTransferDialogOpen}
        onClose={() => setOwnershipTransferDialogOpen(false)}
        userToDelete={userToDelete}
        ownedLocations={ownedLocations}
        confirmAsync={confirmAsync}
        alert={alert}
        onSuccess={handleOwnershipTransferSuccess}
      />

      <EmailDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        recipient={emailRecipient}
        alert={alert}
      />

      <RolePromotionDialog
        open={rolePromotionDialogOpen}
        onClose={() => setRolePromotionDialogOpen(false)}
        user={userForRoleChange}
        onConfirm={async () => {
          if (!userForRoleChange) return
          setRolePromotionDialogOpen(false)
          await promoteToSuperAdmin(userForRoleChange)
          setUserForRoleChange(null)
        }}
      />

      <LocationAssignmentDialog
        open={locationAssignmentDialogOpen}
        onClose={() => setLocationAssignmentDialogOpen(false)}
        user={userForLocationAssignment}
        assignedLocations={userAssignedLocations}
        availableLocations={availableLocationsForAssignment}
        globalPermissions={userGlobalPermissions}
        onAssignLocation={(locationId) => {
          if (!userForLocationAssignment) return
          assignLocationToUser(userForLocationAssignment.id, locationId, (locationNames, locationsCount) => {
            updateUserLocations(userForLocationAssignment.id, locationNames, locationsCount)
          })
        }}
        onUnassignLocation={(locationId) => {
          if (!userForLocationAssignment) return
          unassignLocationFromUser(userForLocationAssignment.id, locationId, (locationNames, locationsCount) => {
            updateUserLocations(userForLocationAssignment.id, locationNames, locationsCount)
          })
        }}
        onTogglePermission={(permission, currentlyHas) => {
          if (!userForLocationAssignment) return
          toggleGlobalPermission(userForLocationAssignment.id, permission, currentlyHas)
        }}
      />

      {modalState.type === 'confirm' && (
        <ConfirmationModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={modalState.onConfirm!}
          title={modalState.options.title}
          message={modalState.options.message}
          confirmText={modalState.options.confirmText}
          cancelText={modalState.options.cancelText}
          variant={modalState.options.variant}
          loading={modalState.loading}
        />
      )}

      {modalState.type === 'alert' && (
        <AlertModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.options.title}
          message={modalState.options.message}
          variant={modalState.options.variant}
          buttonText={modalState.options.buttonText}
        />
      )}
    </Box>
  )
}
