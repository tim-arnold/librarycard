'use client'

import { Box, Button, Tooltip } from '@mui/material'
import {
  CheckCircle,
  Undo,
} from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { isAdmin } from '@/lib/permissions'
import SecondaryActionsMenu from './SecondaryActionsMenu'

export interface BookActionsProps {
  book: EnhancedBook
  userRole: string | null
  userPermissions: string[]
  userGlobalPermissions: string[]
  userLocations: Array<{ id: number; name: string }>
  shelves: Array<{ id: number; name: string; location_id: number; created_at: string }>
  pendingRemovalRequests: Record<string, number>
  currentUserId: string | null
  viewMode: 'card' | 'list'
  onCheckout: (bookId: string, bookTitle: string) => Promise<void>
  onCheckin: (bookId: string, bookTitle: string) => Promise<void>
  onDelete: (bookId: string, bookTitle: string) => Promise<void>
  onRelocate: (book: EnhancedBook) => void
  onRequestRemoval: (bookId: string, bookTitle: string) => Promise<void>
  onCancelRemovalRequest: (bookId: string, bookTitle: string) => Promise<void>
  onMoreDetailsClick: (book: EnhancedBook) => void
}

export default function BookActions({
  book,
  userRole,
  userPermissions,
  userGlobalPermissions,
  userLocations,
  shelves,
  pendingRemovalRequests,
  currentUserId,
  viewMode,
  onCheckout,
  onCheckin,
  onDelete,
  onRelocate,
  onRequestRemoval,
  onCancelRemovalRequest,
  onMoreDetailsClick,
}: BookActionsProps) {
  const isCheckedOut = book.status === 'checked_out'
  const isCheckedOutByCurrentUser = book.checked_out_by === currentUserId
  const hasPendingRemovalRequest = Boolean(pendingRemovalRequests[book.id])
  const hasMultipleShelves = shelves.length > 1
  
  // Permission checks - admins have all permissions, regular users need specific grants
  const canDelete = isAdmin(userRole) || userPermissions.includes('can_delete_books')
  const canMove = isAdmin(userRole) || userPermissions.includes('can_move_books')
  const canCreateShelves = isAdmin(userRole) || userPermissions.includes('can_create_shelves')
  const allowCheckoutOverride = isAdmin(userRole) || userPermissions.includes('allow_checkout_override')
  
  // Determine checkout/checkin actions based on book status and permissions
  const canCheckout = !isCheckedOut
  const canReturn = isCheckedOut && (isCheckedOutByCurrentUser || allowCheckoutOverride)
  
  // Show relocate button if user has permissions, but disable it if book is checked out
  const hasMultipleLocations = userLocations.length > 1
  const hasCrossLocationPermission = userGlobalPermissions.includes('can_move_books_between_locations')
  const canCrossLocationMove = hasCrossLocationPermission && hasMultipleLocations
  
  // Show relocate button if user has any relocate permissions
  const showRelocate = (
    // Can move within location (needs multiple shelves or ability to create shelves)
    (canMove && (hasMultipleShelves || canCreateShelves)) ||
    // Can move between locations (doesn't need multiple shelves in current location)
    canCrossLocationMove
  )
  
  // Enable relocate only if book is not checked out
  const canRelocate = !isCheckedOut && showRelocate

  if (viewMode === 'list') {
    // List view - single three-dot menu containing all actions
    return (
      <SecondaryActionsMenu
        book={book}
        viewMode="list"
        currentUserId={currentUserId}
        canDelete={canDelete}
        allowCheckoutOverride={allowCheckoutOverride}
        isCheckedOut={isCheckedOut}
        isCheckedOutByCurrentUser={isCheckedOutByCurrentUser}
        hasPendingRemovalRequest={hasPendingRemovalRequest}
        onCheckout={canCheckout ? onCheckout : undefined}
        onCheckin={canReturn ? onCheckin : undefined}
        onRequestRemoval={onRequestRemoval}
        onCancelRemovalRequest={onCancelRemovalRequest}
        onMoreDetailsClick={onMoreDetailsClick}
      />
    )
  }

  // Card view - primary button + three-dot menu for secondary actions
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
      {/* Primary checkout/checkin button */}
      {canCheckout ? (
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<CheckCircle />}
          onClick={() => onCheckout(book.id, book.title)}
          title="Check out book"
        >
          Check Out
        </Button>
      ) : canReturn ? (
        <Button
          size="small"
          variant="contained"
          color="secondary"
          startIcon={<Undo />}
          onClick={() => onCheckin(book.id, book.title)}
          title={isCheckedOutByCurrentUser ? "Return your book" : "Check in book"}
        >
          {isCheckedOutByCurrentUser ? "Return" : "Check In"}
        </Button>
      ) : null}
      
      {/* Three-dot menu for secondary actions */}
      <SecondaryActionsMenu
        book={book}
        viewMode="card"
        currentUserId={currentUserId}
        canDelete={canDelete}
        allowCheckoutOverride={allowCheckoutOverride}
        isCheckedOut={isCheckedOut}
        isCheckedOutByCurrentUser={isCheckedOutByCurrentUser}
        hasPendingRemovalRequest={hasPendingRemovalRequest}
        onRequestRemoval={onRequestRemoval}
        onCancelRemovalRequest={onCancelRemovalRequest}
        onMoreDetailsClick={onMoreDetailsClick}
      />
    </Box>
  )
}