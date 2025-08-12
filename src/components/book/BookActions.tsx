'use client'

import { Box, Button, Tooltip } from '@mui/material'
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
  userGlobalPermissions: string[]
  userLocations: Array<{ id: number; name: string }>
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
  userGlobalPermissions,
  userLocations,
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
  
  // Show relocate button if:
  // 1. Book is not checked out
  // 2. User has intra-location move permission (canMove) OR cross-location move permission with multiple locations
  const hasMultipleLocations = userLocations.length > 1
  const hasCrossLocationPermission = userGlobalPermissions.includes('can_move_books_between_locations')
  const canCrossLocationMove = hasCrossLocationPermission && hasMultipleLocations
  
  const canRelocate = !isCheckedOut && (
    // Can move within location (needs multiple shelves or ability to create shelves)
    (canMove && (hasMultipleShelves || canCreateShelves)) ||
    // Can move between locations (doesn't need multiple shelves in current location)
    canCrossLocationMove
  )

  if (viewMode === 'list') {
    // List view - responsive sizing for better mobile usability
    return (
      <Box sx={{ display: 'flex', gap: { xs: 1, sm: 0.5 } }}>
        {/* Always show available action buttons */}
        {canDelete && (
          <Tooltip title="Delete book" arrow>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onDelete(book.id, book.title)}
              aria-label="Delete book from library"
              sx={{ 
                minWidth: 'auto',
                p: { xs: 1, sm: 0.5 },
                minHeight: { xs: 40, sm: 32 },
                width: { xs: 40, sm: 32 }
              }}
            >
              <Delete sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
            </Button>
          </Tooltip>
        )}
        
        {canRelocate && (
          <Tooltip title="Move book to different shelf" arrow>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onRelocate(book)}
              aria-label="Move book to a different shelf or location"
              sx={{ 
                minWidth: 'auto',
                p: { xs: 1, sm: 0.5 },
                minHeight: { xs: 40, sm: 32 },
                width: { xs: 40, sm: 32 }
              }}
            >
              <SwapHoriz sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
            </Button>
          </Tooltip>
        )}
        
        {/* Show checkout/checkin buttons for all users */}
        {!isCheckedOut ? (
          <Tooltip title="Check out book" arrow>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => onCheckout(book.id, book.title)}
              aria-label="Check out book"
              sx={{ 
                minWidth: 'auto',
                p: { xs: 1, sm: 0.5 },
                minHeight: { xs: 40, sm: 32 },
                width: { xs: 40, sm: 32 }
              }}
            >
              <CheckCircle sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
            </Button>
          </Tooltip>
        ) : canReturn ? (
          <Tooltip title="Return book" arrow>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={() => onCheckin(book.id, book.title)}
              aria-label="Return checked out book"
              sx={{ 
                minWidth: 'auto',
                p: { xs: 1, sm: 0.5 },
                minHeight: { xs: 40, sm: 32 },
                width: { xs: 40, sm: 32 }
              }}
            >
              <Undo sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
            </Button>
          </Tooltip>
        ) : null}
        
        {/* Show removal request buttons for users without delete permission */}
        {!canDelete && (
          <>
            {!hasPendingRemovalRequest ? (
              <Tooltip title="Notify librarian about book issue" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => onRequestRemoval(book.id, book.title)}
                  aria-label="Notify librarian about book issue or request removal"
                  sx={{ 
                    minWidth: 'auto',
                    p: { xs: 1, sm: 0.5 },
                    minHeight: { xs: 40, sm: 32 },
                    width: { xs: 40, sm: 32 }
                  }}
                >
                  <ReportProblem sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Cancel removal request" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={() => onCancelRemovalRequest(book.id, book.title)}
                  aria-label="Cancel pending book removal request"
                  sx={{ 
                    minWidth: 'auto',
                    p: { xs: 1, sm: 0.5 },
                    minHeight: { xs: 40, sm: 32 },
                    width: { xs: 40, sm: 32 }
                  }}
                >
                  <Cancel sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </Box>
    )
  }

  if (viewMode === 'compact') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Show checkout/checkin buttons for all users */}
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
                <Tooltip title="Notify librarian about book issue" arrow>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => onRequestRemoval(book.id, book.title)}
                    aria-label="Notify librarian about book issue or request removal"
                  >
                    <ReportProblem />
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="Cancel removal request" arrow>
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    onClick={() => onCancelRemovalRequest(book.id, book.title)}
                    aria-label="Cancel pending book removal request"
                  >
                    <Cancel />
                  </Button>
                </Tooltip>
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
        
        {/* Show checkout/checkin buttons for all users */}
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

      {/* Show request removal buttons for users without delete permission */}
      {!canDelete && (
        <Box sx={{ ml: 1 }}>
          {!hasPendingRemovalRequest ? (
            <Tooltip title="Notify librarian about book issue" arrow>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => onRequestRemoval(book.id, book.title)}
                aria-label="Notify librarian about book issue or request removal"
              >
                <ReportProblem />
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Cancel removal request" arrow>
              <Button
                size="small"
                variant="outlined"
                color="info"
                onClick={() => onCancelRemovalRequest(book.id, book.title)}
                aria-label="Cancel pending book removal request"
              >
                <Cancel />
              </Button>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  )
}