import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material'
import { MoreVert, LibraryBooks, LocationOn } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import type { AdminUser } from '../shared/types'
import { formatDate, getRoleChip, getProviderChip, formatLocationDisplay } from '../shared/utils'

interface UserTableProps {
  users: AdminUser[]
  onMenuClick: (event: React.MouseEvent<HTMLElement>, user: AdminUser) => void
}

export default function UserTable({ users, onMenuClick }: UserTableProps) {
  const { data: session } = useSession()

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Role & Status</TableCell>
            <TableCell>Provider</TableCell>
            <TableCell align="right">Activity</TableCell>
            <TableCell align="right">Joined</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name'
            const isCurrentUser = user.email === session?.user?.email

            return (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {getRoleChip(user.user_role, user.email_verified)}
                    {!user.is_active && (
                      <Chip label="Disabled" color="error" size="small" variant="outlined" />
                    )}
                    {isCurrentUser && (
                      <Chip label="You" color="secondary" size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  {getProviderChip(user.auth_provider)}
                </TableCell>

                <TableCell align="right">
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">
                      <LibraryBooks sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 'inherit' }} /> {user.books_added} books
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <LocationOn sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 'inherit' }} /> {formatLocationDisplay(user)}
                    </Typography>
                    {user.last_book_added && (
                      <Typography variant="caption" color="text.secondary">
                        Last: {formatDate(user.last_book_added)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                <TableCell align="right">
                  <Typography variant="body2">
                    {formatDate(user.created_at)}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <IconButton
                    onClick={(e) => onMenuClick(e, user)}
                    size="small"
                    disabled={isCurrentUser && user.user_role === 'admin'}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
