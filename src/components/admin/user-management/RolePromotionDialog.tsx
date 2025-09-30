import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material'
import type { AdminUser } from '../shared/types'

interface RolePromotionDialogProps {
  open: boolean
  onClose: () => void
  user: AdminUser | null
  onConfirm: () => void
}

export default function RolePromotionDialog({
  open,
  onClose,
  user,
  onConfirm,
}: RolePromotionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>🚀 Promote to Super Admin</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Are you sure you want to promote <strong>{user?.first_name || user?.email}</strong> to Super Admin?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Super Admins have full system privileges including:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2">Global access to all locations and books</Typography>
          <Typography component="li" variant="body2">User role management and promotion</Typography>
          <Typography component="li" variant="body2">Location assignment to regular admins</Typography>
          <Typography component="li" variant="body2">System-wide analytics and administration</Typography>
        </Box>
        <Alert severity="warning" sx={{ mt: 2 }}>
          This action grants the highest level of administrative privileges. Only promote trusted users.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
        >
          Promote to Super Admin
        </Button>
      </DialogActions>
    </Dialog>
  )
}
