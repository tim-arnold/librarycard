'use client'

import { useState } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material'
import { Search, Sort, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { isAdmin } from '@/lib/permissions'

export type SortField = 'title' | 'author' | 'publishedDate' | 'dateAdded'
export type SortDirection = 'asc' | 'desc'

interface BookFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  shelfFilter: string
  setShelfFilter: (shelf: string) => void
  categoryFilter: string[]
  setCategoryFilter: (categories: string[]) => void
  locationFilter: string
  setLocationFilter: (location: string) => void
  checkoutFilter: string
  setCheckoutFilter: (status: string) => void
  sortField: SortField
  setSortField: (field: SortField) => void
  sortDirection: SortDirection
  setSortDirection: (direction: SortDirection) => void
  userRole: string
  shelves: Array<{ id: number; name: string; location_id: number }>
  allLocations: Array<{ id: number; name: string }>
  allCategories: string[]
}

export default function BookFilters({
  searchTerm,
  setSearchTerm,
  shelfFilter,
  setShelfFilter,
  categoryFilter,
  setCategoryFilter,
  locationFilter,
  setLocationFilter,
  checkoutFilter,
  setCheckoutFilter,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  userRole,
  shelves,
  allLocations,
  allCategories,
}: BookFiltersProps) {
  const [genreSelectOpen, setGenreSelectOpen] = useState(false)
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }
          }}
        />
      </Box>
      
      {isAdmin(userRole) && allLocations.length > 1 && (
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Location</InputLabel>
            <Select
              value={locationFilter}
              label="Location"
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              {allLocations.map(location => (
                <MenuItem key={location.id} value={location.name}>{location.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {isAdmin(userRole) && shelves.length > 1 && (
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Shelf</InputLabel>
            <Select
              value={shelfFilter}
              label="Shelf"
              onChange={(e) => setShelfFilter(e.target.value)}
            >
              <MenuItem value="">All shelves</MenuItem>
              {(() => {
                const filteredShelves = locationFilter 
                  ? shelves.filter(shelf => {
                      const location = allLocations.find(loc => loc.id === shelf.location_id)
                      return location?.name === locationFilter
                    })
                  : shelves
                
                return filteredShelves.map(shelf => (
                  <MenuItem key={shelf.id} value={shelf.name}>{shelf.name}</MenuItem>
                ))
              })()}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={checkoutFilter}
            label="Status"
            onChange={(e) => setCheckoutFilter(e.target.value)}
          >
            <MenuItem value="">All books</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="checked_out">Checked out</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Genre</InputLabel>
          <Select
            multiple
            value={categoryFilter}
            label="Genre"
            open={genreSelectOpen}
            onOpen={() => setGenreSelectOpen(true)}
            onClose={() => setGenreSelectOpen(false)}
            onChange={(e) => {
              const value = e.target.value
              setCategoryFilter(typeof value === 'string' ? value.split(',') : value)
              // Close the dropdown after selection
              setGenreSelectOpen(false)
            }}
            renderValue={(selected) => 
              selected.length === 0 ? 'All genres' : `${selected.length} selected`
            }
          >
            {allCategories.map(genre => (
              <MenuItem key={genre} value={genre}>{genre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortField}
            label="Sort by"
            onChange={(e) => setSortField(e.target.value as SortField)}
            startAdornment={<Sort sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="author">Author</MenuItem>
            <MenuItem value="publishedDate">Publication Date</MenuItem>
            <MenuItem value="dateAdded">Date Added</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          size="small"
          title={sortDirection === 'asc' ? 'Currently A-Z (ascending) - click to reverse' : 'Currently Z-A (descending) - click to reverse'}
          sx={{ 
            border: 1, 
            borderColor: 'divider',
            height: '40px',
            width: '40px',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'primary.lighter'
            }
          }}
        >
          {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
        </IconButton>
      </Box>
    </Box>
  )
}