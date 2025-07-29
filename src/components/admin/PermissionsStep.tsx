'use client'

import { memo } from 'react'
import {
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
} from '@mui/material'

interface PermissionsStepProps {
  adminCapabilities: string[]
  userCapabilities: string[]
  onToggleCapability: (capability: string, type: 'admin' | 'user') => void
}

interface Capability {
  id: string
  label: string
  description: string
}

const adminCapabilities: Capability[] = [
  { id: 'can_control_user_capabilities', label: 'Control User Permissions', description: 'Grant/revoke user permissions' },
  { id: 'can_invite_users', label: 'Invite Users', description: 'Send location invitations' },
  { id: 'can_manage_shelves', label: 'Manage Shelves', description: 'Advanced shelf operations' },
  { id: 'can_manage_location_settings', label: 'Manage Location', description: 'Edit location details' },
]

const userPermissions: Capability[] = [
  { id: 'can_add_books', label: 'Add Books', description: 'Add new books to the location' },
  { id: 'can_delete_books', label: 'Delete Books', description: 'Remove books from the location' },
  { id: 'can_move_books', label: 'Move Books', description: 'Move books between shelves' },
  { id: 'can_create_shelves', label: 'Create Shelves', description: 'Create new shelves in the location' },
  { id: 'can_edit_genres', label: 'Edit Genres', description: 'Manage genre assignments' },
]

function PermissionsStep({ 
  adminCapabilities: selectedAdminCapabilities, 
  userCapabilities: selectedUserCapabilities, 
  onToggleCapability 
}: PermissionsStepProps) {
  return (
    <Box sx={{ 
      mt: 2, 
      minHeight: '500px',
      contain: 'layout style paint',
      willChange: 'contents',
      position: 'relative'
    }}>
      <Typography variant="h6" gutterBottom>
        Set default permissions
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        These will be the default capabilities for users in this location
      </Typography>
      
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        Admin Capabilities
      </Typography>
      {adminCapabilities.map((capability) => (
        <FormControlLabel
          key={`admin-${capability.id}`}
          control={
            <Checkbox
              checked={selectedAdminCapabilities.includes(capability.id)}
              onChange={() => onToggleCapability(capability.id, 'admin')}
              disableRipple
              size="small"
              sx={{ paddingTop: 0 }}
            />
          }
          label={
            <Box sx={{ width: '100%', overflow: 'visible' }}>
              <Typography variant="body2" sx={{ wordBreak: 'keep-all', whiteSpace: 'normal' }}>
                {capability.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {capability.description}
              </Typography>
            </Box>
          }
          sx={{ 
            display: 'flex', 
            mb: 1, 
            alignItems: 'flex-start',
            width: '100%',
            marginLeft: 0,
            marginRight: 0,
            '& .MuiFormControlLabel-label': {
              paddingTop: 0
            }
          }}
        />
      ))}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Regular User Capabilities
      </Typography>
      {userPermissions.map((capability) => (
        <FormControlLabel
          key={`user-${capability.id}`}
          control={
            <Checkbox
              checked={selectedUserCapabilities.includes(capability.id)}
              onChange={() => onToggleCapability(capability.id, 'user')}
              disableRipple
              size="small"
              sx={{ paddingTop: 0 }}
            />
          }
          label={
            <Box sx={{ width: '100%', overflow: 'visible' }}>
              <Typography variant="body2" sx={{ wordBreak: 'keep-all', whiteSpace: 'normal' }}>
                {capability.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {capability.description}
              </Typography>
            </Box>
          }
          sx={{ 
            display: 'flex', 
            mb: 1, 
            alignItems: 'flex-start',
            width: '100%',
            marginLeft: 0,
            marginRight: 0,
            '& .MuiFormControlLabel-label': {
              paddingTop: 0
            }
          }}
        />
      ))}
    </Box>
  )
}

export default memo(PermissionsStep)