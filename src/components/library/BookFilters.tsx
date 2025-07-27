'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Checkbox,
  ListItemText,
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
  books: Array<{ 
    shelf_name?: string; 
    categories?: string[]; 
    subjects?: string[];
    enhancedGenres?: string[];
    assignedGenres?: Array<{name: string}>;
    [key: string]: any 
  }>
  allLocations: Array<{ id: number; name: string }>
  userLocations?: Array<{ id: number; name: string }>
  currentLocation?: { id: number; name: string } | null
  onLocationSwitch?: (locationId: number) => void
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
  books,
  allLocations,
  userLocations,
  currentLocation,
  onLocationSwitch,
  allCategories,
}: BookFiltersProps) {
  const [genreSelectOpen, setGenreSelectOpen] = useState(false)
  
  // Memoize filtered shelves to prevent re-rendering
  const filteredShelves = useMemo(() => {
    return locationFilter 
      ? shelves.filter(shelf => {
          const location = allLocations.find(loc => loc.id === shelf.location_id)
          return location?.name === locationFilter
        })
      : shelves
  }, [shelves, allLocations, locationFilter])

  // Calculate book counts per shelf
  const shelfBookCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    books.forEach(book => {
      if (book.shelf_name) {
        counts[book.shelf_name] = (counts[book.shelf_name] || 0) + 1
      }
    })
    return counts
  }, [books])

  // Calculate genre counts based on currently filtered books (excluding genre filter itself)
  const genreBookCounts = useMemo(() => {
    // Filter books by location and shelf, but not by genre or search terms
    const filteredForGenreCounts = books.filter(book => {
      // Apply location filter
      if (locationFilter) {
        const shelf = shelves.find(s => s.name === book.shelf_name)
        if (shelf) {
          const location = allLocations.find(loc => loc.id === shelf.location_id)
          if (location?.name !== locationFilter) {
            return false
          }
        }
      }
      
      // Apply shelf filter
      if (shelfFilter && book.shelf_name !== shelfFilter) {
        return false
      }
      
      return true
    })

    // Count how many books match each genre from allCategories
    const counts: Record<string, number> = {}
    
    allCategories.forEach(genre => {
      counts[genre] = filteredForGenreCounts.filter(book => {
        // Check assigned genres first (these are user-selected and highest priority)
        if (book.assignedGenres) {
          const curatedLower = genre.toLowerCase()
          const hasMatch = book.assignedGenres.some(assignedGenre => assignedGenre.name.toLowerCase() === curatedLower)
          if (hasMatch) {
            return true
          }
        }
        
        // Check enhanced genres (these are already curated) - use case-insensitive matching
        if (book.enhancedGenres) {
          const curatedLower = genre.toLowerCase()
          const hasMatch = book.enhancedGenres.some(enhancedGenre => enhancedGenre.toLowerCase() === curatedLower)
          if (hasMatch) {
            return true
          }
        }
        
        // For raw categories and subjects, use simple matching
        const rawGenres = [...(book.categories || []), ...(book.subjects || [])]
        return rawGenres.some(rawGenre => {
          const rawLower = rawGenre.toLowerCase()
          const curatedLower = genre.toLowerCase()
          return rawLower.includes(curatedLower) || curatedLower.includes(rawLower)
        })
      }).length
    })
    
    return counts
  }, [books, locationFilter, shelfFilter, shelves, allLocations, allCategories])
  
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
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }} key="location-filter">
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

      {!isAdmin(userRole) && userLocations && userLocations.length > 1 && onLocationSwitch && (
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }} key="user-location-switcher">
          <FormControl fullWidth size="small">
            <InputLabel>Location</InputLabel>
            <Select
              value={currentLocation?.id || ''}
              label="Location"
              onChange={(e) => onLocationSwitch(Number(e.target.value))}
            >
              {userLocations.map(location => (
                <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {shelves.length > 1 && (
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }} key="shelf-filter">
          <FormControl fullWidth size="small">
            <InputLabel>Shelf</InputLabel>
            <Select
              value={shelfFilter}
              label="Shelf"
              onChange={(e) => setShelfFilter(e.target.value)}
            >
              <MenuItem value="">All shelves</MenuItem>
              {filteredShelves.map(shelf => {
                const bookCount = shelfBookCounts[shelf.name] || 0
                return (
                  <MenuItem key={shelf.id} value={shelf.name}>
                    {shelf.name} ({bookCount})
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }} key="status-filter">
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

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }} key="genre-filter">
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
            }}
            renderValue={(selected) => 
              selected.length === 0 ? 'All genres' : `${selected.length} selected`
            }
          >
            {allCategories.map(genre => {
              const genreCount = genreBookCounts[genre] || 0
              return (
                <MenuItem key={genre} value={genre}>
                  <Checkbox checked={categoryFilter.includes(genre)} />
                  <ListItemText primary={`${genre} (${genreCount})`} />
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }} key="sort-filter">
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