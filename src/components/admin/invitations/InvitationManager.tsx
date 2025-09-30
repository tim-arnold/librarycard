import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import { PersonAdd } from '@mui/icons-material'
import { useInvitations } from './useInvitations'
import InvitationFilters from './InvitationFilters'
import InvitationList from './InvitationList'
import InvitationDialog from './InvitationDialog'
import { getInvitationAnalytics, filterAndSortInvitations } from './utils'

interface InvitationManagerProps {
  visible: boolean
  confirmAsync: (options: any, asyncAction: () => Promise<void>) => Promise<boolean>
  alert: (options: any) => Promise<void>
  onLoad?: () => void
}

export default function InvitationManager({ visible, confirmAsync, alert, onLoad }: InvitationManagerProps) {
  const {
    invitations,
    availableLocations,
    invitationsLoading,
    loadInvitations,
    loadAvailableLocations,
    sendSingleInvitation,
    sendBulkInvitations,
    revokeInvitation,
  } = useInvitations({ confirmAsync, alert })

  const [invitationSearchTerm, setInvitationSearchTerm] = useState('')
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<string>('all')
  const [invitationLocationFilter, setInvitationLocationFilter] = useState<string>('all')
  const [invitationSortBy, setInvitationSortBy] = useState<string>('created_at')
  const [invitationSortOrder, setInvitationSortOrder] = useState<'asc' | 'desc'>('desc')
  const [invitationsPage, setInvitationsPage] = useState(1)
  const [showInvitationFilters, setShowInvitationFilters] = useState(false)
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false)
  const invitationsPerPage = 10

  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible) {
      loadInvitations()
      loadAvailableLocations()
      onLoad?.()
    }
  }, [visible])

  useEffect(() => {
    setInvitationsPage(1)
  }, [invitationSearchTerm, invitationStatusFilter, invitationLocationFilter, invitationSortBy, invitationSortOrder])

  const clearAllFilters = () => {
    setInvitationSearchTerm('')
    setInvitationStatusFilter('all')
    setInvitationLocationFilter('all')
    setInvitationSortBy('created_at')
    setInvitationSortOrder('desc')
    setInvitationsPage(1)
  }

  const filteredInvitations = filterAndSortInvitations(
    invitations,
    invitationSearchTerm,
    invitationStatusFilter,
    invitationLocationFilter,
    invitationSortBy,
    invitationSortOrder
  )

  const analytics = getInvitationAnalytics(invitations)

  if (!visible) return null

  return (
    <Card ref={sectionRef} sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            📧 Invitation Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setInvitationDialogOpen(true)}
            size="small"
          >
            Send Invitation
          </Button>
        </Box>

        {invitations.length > 0 && (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`Total: ${analytics.total} | Filtered: ${filteredInvitations.length}`} variant="outlined" />
              <Chip label={`Accepted: ${analytics.accepted}`} color="success" variant="outlined" />
              <Chip label={`Pending: ${analytics.pending}`} color="info" variant="outlined" />
              {analytics.expired > 0 && (
                <Chip label={`Expired: ${analytics.expired}`} color="error" variant="outlined" />
              )}
            </Box>
            <InvitationFilters
              searchTerm={invitationSearchTerm}
              onSearchChange={setInvitationSearchTerm}
              statusFilter={invitationStatusFilter}
              onStatusFilterChange={setInvitationStatusFilter}
              locationFilter={invitationLocationFilter}
              onLocationFilterChange={setInvitationLocationFilter}
              sortBy={invitationSortBy}
              onSortByChange={setInvitationSortBy}
              sortOrder={invitationSortOrder}
              onSortOrderChange={setInvitationSortOrder}
              showFilters={showInvitationFilters}
              onToggleFilters={() => setShowInvitationFilters(!showInvitationFilters)}
              onClearAll={clearAllFilters}
              availableLocations={availableLocations}
            />
          </>
        )}

        {invitationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
            <Typography sx={{ ml: 2 }} color="text.secondary">
              Loading invitations...
            </Typography>
          </Box>
        ) : invitations.length === 0 ? (
          <Alert severity="info">
            No pending invitations found. Send invitations to add new users to locations.
          </Alert>
        ) : filteredInvitations.length === 0 ? (
          <Alert severity="info">
            No invitations match your filters. {invitations.length > 0 ? 'Try adjusting your search criteria.' : ''}
          </Alert>
        ) : (
          <InvitationList
            invitations={filteredInvitations}
            page={invitationsPage}
            onPageChange={setInvitationsPage}
            itemsPerPage={invitationsPerPage}
            onRevoke={revokeInvitation}
          />
        )}
      </CardContent>

      <InvitationDialog
        open={invitationDialogOpen}
        onClose={() => setInvitationDialogOpen(false)}
        availableLocations={availableLocations}
        onSendSingle={sendSingleInvitation}
        onSendBulk={sendBulkInvitations}
      />
    </Card>
  )
}
