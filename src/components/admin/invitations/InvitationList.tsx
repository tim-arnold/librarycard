import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Pagination,
} from '@mui/material'
import { LocationOn, CheckCircle, Cancel } from '@mui/icons-material'
import type { LocationInvitation } from '../shared/types'
import { formatInvitationDate } from '../shared/utils'
import { getInvitationStatus } from './utils'

interface InvitationListProps {
  invitations: LocationInvitation[]
  page: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  onRevoke: (invitationId: number, invitedEmail: string) => void
}

export default function InvitationList({
  invitations,
  page,
  onPageChange,
  itemsPerPage,
  onRevoke,
}: InvitationListProps) {
  const totalPages = Math.ceil(invitations.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedInvitations = invitations.slice(startIndex, startIndex + itemsPerPage)

  const borderColors: Record<string, string> = {
    'pending': '#2196F3',
    'expiring': '#FF9800',
    'accepted': '#4CAF50',
    'expired': '#f44336'
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {paginatedInvitations.map((invitation) => {
          const statusInfo = getInvitationStatus(invitation)
          const canRevoke = statusInfo.status === 'pending' || statusInfo.status === 'expiring'

          return (
            <Paper key={invitation.id} sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 1,
              borderLeft: `4px solid ${borderColors[statusInfo.status] || '#2196F3'}`
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="medium">
                  {invitation.invited_email}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  <LocationOn sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 'inherit' }} /> {invitation.location_name || `Location ${invitation.location_id}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Sent: {formatInvitationDate(invitation.created_at)} by {invitation.invited_by_name || 'Admin'} |
                  Expires: {formatInvitationDate(invitation.expires_at)}
                  {invitation.used_at && (
                    <Box component="span" sx={{ color: 'success.main' }}> | <CheckCircle sx={{ fontSize: 'inherit', verticalAlign: 'middle' }} /> Accepted</Box>
                  )}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={statusInfo.label}
                  color={statusInfo.color}
                  size="small"
                />
                {canRevoke && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => onRevoke(invitation.id, invitation.invited_email)}
                    title="Revoke this invitation"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Revoke
                  </Button>
                )}
              </Box>
            </Paper>
          )
        })}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, invitations.length)} of {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </>
  )
}
