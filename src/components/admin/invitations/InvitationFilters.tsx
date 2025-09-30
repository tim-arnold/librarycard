import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
} from '@mui/material'
import { ExpandMore, ExpandLess, Clear } from '@mui/icons-material'
import type { Location } from '../shared/types'

interface InvitationFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  locationFilter: string
  onLocationFilterChange: (value: string) => void
  sortBy: string
  onSortByChange: (value: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (value: 'asc' | 'desc') => void
  showFilters: boolean
  onToggleFilters: () => void
  onClearAll: () => void
  availableLocations: Location[]
}

export default function InvitationFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  locationFilter,
  onLocationFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  showFilters,
  onToggleFilters,
  onClearAll,
  availableLocations,
}: InvitationFiltersProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <TextField
            size="small"
            placeholder="Search invitations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            fullWidth
          />
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
          onClick={onToggleFilters}
        >
          Filters & Sort
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Clear />}
          onClick={onClearAll}
          title="Clear all filters and sorting"
        >
          Clear
        </Button>
      </Box>

      <Collapse in={showFilters}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 150, flex: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="expiring">Expiring Soon</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 150, flex: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Location Filter</InputLabel>
                <Select
                  value={locationFilter}
                  onChange={(e) => onLocationFilterChange(e.target.value)}
                  label="Location Filter"
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  {availableLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 150, flex: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="created_at">Date Created</MenuItem>
                  <MenuItem value="expires_at">Expiration Date</MenuItem>
                  <MenuItem value="email">Email Address</MenuItem>
                  <MenuItem value="location">Location</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                  <MenuItem value="invited_by">Sent By</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 150, flex: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
                  label="Sort Order"
                >
                  <MenuItem value="desc">Newest First</MenuItem>
                  <MenuItem value="asc">Oldest First</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}
