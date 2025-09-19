'use client'

import { useMemo } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Button,
  Chip,
  Stack,
  TextField,
} from '@mui/material'
import {
  Close,
  FilterList,
  Clear,
  Sort,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material'
import type { SortField, SortDirection } from '../library/BookFilters'
import { isAdmin } from '@/lib/permissions'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface MobileFilterDrawerProps {
  open: boolean
  onClose: () => void

  // Filter state
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

  // Data
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

export default function MobileFilterDrawer({
  open,
  onClose,
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
}: MobileFilterDrawerProps) {
  const { isMobile } = useMobileBreakpoints()

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

  // Calculate genre counts
  const genreBookCounts = useMemo(() => {
    const filteredForGenreCounts = books.filter(book => {
      if (locationFilter) {
        const shelf = shelves.find(s => s.name === book.shelf_name)
        if (shelf) {
          const location = allLocations.find(loc => loc.id === shelf.location_id)
          if (location?.name !== locationFilter) {
            return false
          }
        }
      }

      if (shelfFilter && book.shelf_name !== shelfFilter) {
        return false
      }

      return true
    })

    const counts: Record<string, number> = {}

    allCategories.forEach(genre => {
      counts[genre] = filteredForGenreCounts.filter(book => {
        if (book.assignedGenres) {
          const curatedLower = genre.toLowerCase()
          const hasMatch = book.assignedGenres.some(assignedGenre => assignedGenre.name.toLowerCase() === curatedLower)
          if (hasMatch) {
            return true
          }
        }

        if (book.enhancedGenres) {
          const curatedLower = genre.toLowerCase()
          const hasMatch = book.enhancedGenres.some(enhancedGenre => enhancedGenre.toLowerCase() === curatedLower)
          if (hasMatch) {
            return true
          }
        }

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

  // Count active filters
  const activeFiltersCount = [
    searchTerm,
    locationFilter,
    shelfFilter,
    checkoutFilter,
    categoryFilter.length > 0 ? 'genre' : '',
  ].filter(Boolean).length

  // Clear all filters
  const handleClearAll = () => {
    setSearchTerm('')
    setLocationFilter('')
    setShelfFilter('')
    setCheckoutFilter('')
    setCategoryFilter([])
  }


  // Only show on mobile devices
  if (!isMobile) return null

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        // Restore backdrop for proper click-outside behavior
        BackdropProps: {
          sx: {
            zIndex: 900, // Below toolbar (1000) but above content
          }
        }
      }}
      sx={{
        zIndex: 950, // Below toolbar (1000) but above backdrop (900)
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: 'calc(100vh - 80px)',
          minHeight: '50vh',
          bottom: 64,
          height: 'auto',
          zIndex: 950, // Same as drawer, below toolbar
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6">
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeFiltersCount > 0 && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={handleClearAll}
                sx={{ minHeight: 44 }}
              >
                Clear All
              </Button>
            )}
            <IconButton
              onClick={onClose}
              sx={{ minHeight: 44, minWidth: 44 }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Active Filters:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {searchTerm && (
                <Chip
                  label={`Search: "${searchTerm}"`}
                  onDelete={() => setSearchTerm('')}
                  size="small"
                />
              )}
              {locationFilter && (
                <Chip
                  label={`Location: ${locationFilter}`}
                  onDelete={() => setLocationFilter('')}
                  size="small"
                />
              )}
              {shelfFilter && (
                <Chip
                  label={`Shelf: ${shelfFilter}`}
                  onDelete={() => setShelfFilter('')}
                  size="small"
                />
              )}
              {checkoutFilter && (
                <Chip
                  label={`Status: ${checkoutFilter}`}
                  onDelete={() => setCheckoutFilter('')}
                  size="small"
                />
              )}
              {categoryFilter.map(genre => (
                <Chip
                  key={genre}
                  label={`Genre: ${genre}`}
                  onDelete={() => setCategoryFilter(categoryFilter.filter(g => g !== genre))}
                  size="small"
                />
              ))}
            </Stack>
            <Divider sx={{ mt: 2, mb: 3 }} />
          </Box>
        )}

        {/* Filter Controls */}
        <Stack spacing={3}>
          {/* Search Input */}
          <FormControl fullWidth>
            <TextField
              label="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              sx={{ minHeight: 56 }}
              InputProps={{
                sx: { minHeight: 56 }
              }}
            />
          </FormControl>

          {/* Location Filter */}
          {isAdmin(userRole) && allLocations.length > 1 && (
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
                sx={{ minHeight: 56 }}
              >
                <MenuItem value="">All locations</MenuItem>
                {allLocations.map(location => (
                  <MenuItem key={location.id} value={location.name}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* User Location Switcher */}
          {!isAdmin(userRole) && userLocations && userLocations.length > 1 && onLocationSwitch && (
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={currentLocation?.id || ''}
                label="Location"
                onChange={(e) => onLocationSwitch(Number(e.target.value))}
                sx={{ minHeight: 56 }}
              >
                {userLocations.map(location => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Shelf Filter */}
          {shelves.length > 1 && (
            <FormControl fullWidth>
              <InputLabel>Shelf</InputLabel>
              <Select
                value={shelfFilter}
                label="Shelf"
                onChange={(e) => setShelfFilter(e.target.value)}
                sx={{ minHeight: 56 }}
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
          )}

          {/* Status Filter */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={checkoutFilter}
              label="Status"
              onChange={(e) => setCheckoutFilter(e.target.value)}
              sx={{ minHeight: 56 }}
            >
              <MenuItem value="">All books</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="checked_out">Checked out</MenuItem>
            </Select>
          </FormControl>

          {/* Genre Filter */}
          <FormControl fullWidth>
            <InputLabel>Genre</InputLabel>
            <Select
              multiple
              value={categoryFilter}
              label="Genre"
              onChange={(e) => {
                const value = e.target.value
                setCategoryFilter(typeof value === 'string' ? value.split(',') : value)
              }}
              renderValue={(selected) =>
                selected.length === 0 ? 'All genres' : `${selected.length} selected`
              }
              sx={{ minHeight: 56 }}
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

          {/* Sort Controls */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sort /> Sort Options
            </Typography>

            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortField}
                  label="Sort by"
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  sx={{ minHeight: 56 }}
                >
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="author">Author</MenuItem>
                  <MenuItem value="publishedDate">Publication Date</MenuItem>
                  <MenuItem value="dateAdded">Date Added</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                fullWidth
                startIcon={sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                sx={{
                  minHeight: 56,
                  justifyContent: 'flex-start',
                  textTransform: 'none'
                }}
              >
                {sortDirection === 'asc' ? 'A-Z (Ascending)' : 'Z-A (Descending)'}
              </Button>
            </Stack>
          </Box>
        </Stack>

        {/* Apply Button */}
        <Box sx={{ mt: 4, pb: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={onClose}
            sx={{
              minHeight: 56,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}