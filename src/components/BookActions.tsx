'use client'

import { Box, Button } from '@mui/material'
import {
  Delete,
  ReportProblem,
  Cancel,
  CheckCircle,
  Undo,
  SwapHoriz,
} from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import { isAdmin } from '@/lib/permissions'

export interface BookActionsProps {
  book: EnhancedBook
  userRole: string | null
  userPermissions: string[]
  shelves: Array<{ id: number; name: string; location_id: number; created_at: string }>
  pendingRemovalRequests: Record<string, number>
  viewMode: 'card' | 'compact' | 'list'
  onCheckout: (bookId: string, bookTitle: string) => Promise<void>
  onCheckin: (bookId: string, bookTitle: string) => Promise<void>
  onDelete: (bookId: string, bookTitle: string) => Promise<void>
  onRelocate: (book: EnhancedBook) => void
  onRequestRemoval: (bookId: string, bookTitle: string) => Promise<void>
  onCancelRemovalRequest: (bookId: string, bookTitle: string) => Promise<void>
}

export default function BookActions({
  book,
  userRole,
  userPermissions,
  shelves,
  pendingRemovalRequests,
  viewMode,
  onCheckout,
  onCheckin,
  onDelete,
  onRelocate,
  onRequestRemoval,
  onCancelRemovalRequest,
}: BookActionsProps) {
  const isCheckedOut = book.checked_out_by && book.checked_out_by !== ''
  const hasPendingRemovalRequest = pendingRemovalRequests[book.id]
  const hasMultipleShelves = shelves.length > 1
  
  // Permission checks - admins have all permissions, regular users need specific grants
  const canDelete = isAdmin(userRole) || userPermissions.includes('can_delete_books')
  const canMove = isAdmin(userRole) || userPermissions.includes('can_move_books')
  const canCreateShelves = isAdmin(userRole) || userPermissions.includes('can_create_shelves')
  
  // Allow any user to return any checked out book (trusting community approach)
  const canReturn = isCheckedOut
  
  // Show relocate button if: book is not checked out AND user has move permission AND (multiple shelves exist OR user can create shelves)
  const canRelocate = !isCheckedOut && canMove && (hasMultipleShelves || canCreateShelves)

  if (viewMode === 'list') {
    // Ultra-compact list view - icon-only buttons in horizontal layout
    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {/* Always show available action buttons */}
        {canDelete && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => onDelete(book.id, book.title)}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <Delete fontSize="small" />
          </Button>
        )}
        
        {canRelocate && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onRelocate(book)}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <SwapHoriz fontSize="small" />
          </Button>
        )}
        
        {/* Show checkout/checkin buttons for users without delete permission */}
        {!canDelete && (
          <>
            {!isCheckedOut ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => onCheckout(book.id, book.title)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <CheckCircle fontSize="small" />
              </Button>
            ) : canReturn ? (
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => onCheckin(book.id, book.title)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <Undo fontSize="small" />
              </Button>
            ) : null}
            
            {!hasPendingRemovalRequest ? (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => onRequestRemoval(book.id, book.title)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <ReportProblem fontSize="small" />
              </Button>
            ) : (
              <Button
                size="small"
                variant="outlined"
                color="info"
                onClick={() => onCancelRemovalRequest(book.id, book.title)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <Cancel fontSize="small" />
              </Button>
            )}
          </>
        )}
      </Box>
    )
  }

  if (viewMode === 'compact') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Show checkout/checkin buttons for users without delete permission */}
        {!canDelete && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isCheckedOut ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<CheckCircle />}
                onClick={() => onCheckout(book.id, book.title)}
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
              >
                Return
              </Button>
            ) : null}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Always show available action buttons */}
          {canDelete && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => onDelete(book.id, book.title)}
            >
              Remove
            </Button>
          )}
          
          {canRelocate && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHoriz />}
              onClick={() => onRelocate(book)}
            >
              Relocate
            </Button>
          )}
          
          {/* Show request removal buttons for users without delete permission */}
          {!canDelete && (
            <>
              {!hasPendingRemovalRequest ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => onRequestRemoval(book.id, book.title)}
                >
                  <ReportProblem />
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={() => onCancelRemovalRequest(book.id, book.title)}
                >
                  <Cancel />
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
    )
  }

  // Card view
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Always show available action buttons */}
        {canDelete && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(book.id, book.title)}
          >
            Remove
          </Button>
        )}
        
        {canRelocate && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<SwapHoriz />}
            onClick={() => onRelocate(book)}
          >
            Relocate
          </Button>
        )}
        
        {/* Show checkout/checkin buttons for users without delete permission */}
        {!canDelete && (
          <>
            {!isCheckedOut ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<CheckCircle />}
                onClick={() => onCheckout(book.id, book.title)}
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
              >
                Return
              </Button>
            ) : null}
          </>
        )}
      </Box>

      {/* Show request removal buttons for users without delete permission */}
      {!canDelete && (
        <Box sx={{ ml: 1 }}>
          {!hasPendingRemovalRequest ? (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => onRequestRemoval(book.id, book.title)}
            >
              <ReportProblem />
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="info"
              onClick={() => onCancelRemovalRequest(book.id, book.title)}
            >
              <Cancel />
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}