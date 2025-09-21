'use client'

import { useState } from 'react'
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Tooltip 
} from '@mui/material'
import {
  MoreVert,
  SwapHoriz,
  ReportProblem,
  Cancel,
  CheckCircle,
  Undo,
  Info,
} from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'

interface SecondaryActionsMenuProps {
  book: EnhancedBook
  viewMode: 'card' | 'list'
  currentUserId: string | null
  
  // Permission flags
  canDelete: boolean
  canRelocate: boolean
  showRelocate: boolean
  allowCheckoutOverride: boolean
  
  // State flags
  isCheckedOut: boolean
  isCheckedOutByCurrentUser: boolean
  hasPendingRemovalRequest: boolean
  
  // Actions
  onCheckout?: (bookId: string, bookTitle: string) => Promise<void>
  onCheckin?: (bookId: string, bookTitle: string) => Promise<void>
  onRelocate: (book: EnhancedBook) => void
  onRequestRemoval: (bookId: string, bookTitle: string) => Promise<void>
  onCancelRemovalRequest: (bookId: string, bookTitle: string) => Promise<void>
  onMoreDetailsClick: (book: EnhancedBook) => void
}

export default function SecondaryActionsMenu({
  book,
  viewMode,
  currentUserId,
  canDelete,
  canRelocate,
  showRelocate,
  allowCheckoutOverride,
  isCheckedOut,
  isCheckedOutByCurrentUser,
  hasPendingRemovalRequest,
  onCheckout,
  onCheckin,
  onRelocate,
  onRequestRemoval,
  onCancelRemovalRequest,
  onMoreDetailsClick,
}: SecondaryActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleAction = (action: () => void | Promise<void>) => {
    handleClose()
    action()
  }

  // Determine checkout/checkin actions based on book status and permissions
  const canCheckout = !isCheckedOut && onCheckout
  const canReturn = isCheckedOut && (isCheckedOutByCurrentUser || allowCheckoutOverride) && onCheckin

  // For list view, we include primary actions in the menu
  const includePrimaryActions = viewMode === 'list'

  return (
    <>
      <Tooltip title="More actions" arrow>
        <IconButton
          aria-label="more actions"
          aria-controls={open ? 'actions-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          size="small"
          sx={{ 
            minWidth: 'auto',
            p: { xs: 1, sm: 0.5 },
            ...(viewMode === 'list' && {
              minHeight: { xs: 40, sm: 32 },
              width: { xs: 40, sm: 32 }
            })
          }}
        >
          <MoreVert sx={{ 
            fontSize: viewMode === 'list' ? { xs: '1.25rem', sm: '1rem' } : '1.25rem' 
          }} />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="actions-menu"
        MenuListProps={{
          'aria-labelledby': 'actions-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Primary actions for list view */}
        {includePrimaryActions && (
          <>
            {canCheckout && (
              <MenuItem 
                onClick={() => handleAction(() => onCheckout!(book.id, book.title))}
                sx={{ color: 'primary.main', fontWeight: 500 }}
              >
                <ListItemIcon>
                  <CheckCircle fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText>Check Out</ListItemText>
              </MenuItem>
            )}
            
            {canReturn && (
              <MenuItem 
                onClick={() => handleAction(() => onCheckin!(book.id, book.title))}
                sx={{ color: 'secondary.main', fontWeight: 500 }}
              >
                <ListItemIcon>
                  <Undo fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText>
                  {isCheckedOutByCurrentUser ? "Return" : "Check In"}
                </ListItemText>
              </MenuItem>
            )}
            
            {(canCheckout || canReturn) && (showRelocate || canDelete || !hasPendingRemovalRequest) && (
              <Divider />
            )}
          </>
        )}

        {/* Secondary actions */}
        <MenuItem
          onClick={() => handleAction(() => onMoreDetailsClick(book))}
        >
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText>View/edit details</ListItemText>
        </MenuItem>

        {showRelocate && (
          <MenuItem 
            onClick={() => handleAction(() => onRelocate(book))}
            disabled={!canRelocate}
          >
            <ListItemIcon>
              <SwapHoriz fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Relocate
              {!canRelocate && " (book checked out)"}
            </ListItemText>
          </MenuItem>
        )}

        {/* Notify librarian / removal request actions */}
        {!hasPendingRemovalRequest ? (
          <MenuItem
            onClick={() => handleAction(() => onRequestRemoval(book.id, book.title))}
            sx={{ color: 'warning.main' }}
          >
            <ListItemIcon>
              <ReportProblem fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Notify Librarian</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => handleAction(() => onCancelRemovalRequest(book.id, book.title))}
            sx={{ color: 'info.main' }}
          >
            <ListItemIcon>
              <Cancel fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText>Cancel Request</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  )
}