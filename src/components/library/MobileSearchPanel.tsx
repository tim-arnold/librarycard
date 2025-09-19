'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Drawer,
  Box,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  Button,
  Chip,
  Slide,
} from '@mui/material'
import {
  Close,
  Clear,
  Search,
} from '@mui/icons-material'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'

interface MobileSearchPanelProps {
  open: boolean
  onClose: () => void
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export default function MobileSearchPanel({
  open,
  onClose,
  searchTerm,
  setSearchTerm,
}: MobileSearchPanelProps) {
  const { isMobile } = useMobileBreakpoints()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Local search term for the panel that gets cleared after search
  const [localSearchTerm, setLocalSearchTerm] = useState('')

  // Auto-focus search input when panel opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Handle search button click
  const handleSearch = () => {
    if (localSearchTerm.trim()) {
      setSearchTerm(localSearchTerm.trim())
      setLocalSearchTerm('') // Clear the local field
      onClose() // Close the panel
    }
  }

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }


  // Only show on mobile devices
  if (!isMobile) return null

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      variant="temporary"
      SlideProps={{ direction: 'up' }}
      ModalProps={{
        // Restore backdrop for proper click-outside behavior
        BackdropProps: {
          sx: {
            zIndex: 900, // Below toolbar (1000) but above content
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }
        }
      }}
      sx={{
        zIndex: 950, // Below toolbar (1000) but above backdrop (900)
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 'calc(100vh - 64px)', // Full height minus bottom nav
          bottom: 64,
          zIndex: 950, // Same as drawer, below toolbar
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Handle bar for visual cue */}
        <Box sx={{
          width: 40,
          height: 4,
          backgroundColor: 'divider',
          borderRadius: 2,
          mx: 'auto',
          mb: 2
        }} />

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3
        }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Search Books
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              ml: 1,
              backgroundColor: 'action.hover',
              '&:hover': {
                backgroundColor: 'action.selected',
              }
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Spacer to push content down */}
        <Box sx={{ flex: 1 }} />

        {/* Current search display */}
        {searchTerm && (
          <Box sx={{
            mb: 3,
            p: 2,
            backgroundColor: 'primary.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Typography
              variant="body2"
              color="primary.main"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              Current search:
            </Typography>
            <Chip
              label={`"${searchTerm}"`}
              onDelete={() => setSearchTerm('')}
              color="primary"
              variant="outlined"
              sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                '& .MuiChip-deleteIcon': {
                  color: 'primary.main'
                }
              }}
            />
          </Box>
        )}

        {/* Search input and button grouped together */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            inputRef={searchInputRef}
            fullWidth
            placeholder="Search by title, author, ISBN, or genre..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
              endAdornment: localSearchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setLocalSearchTerm('')}
                    edge="end"
                    sx={{
                      backgroundColor: 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      }
                    }}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'background.default',
                '&:hover': {
                  backgroundColor: 'background.paper',
                },
                '&.Mui-focused': {
                  backgroundColor: 'background.paper',
                }
              },
            }}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSearch}
            disabled={!localSearchTerm.trim()}
            startIcon={<Search />}
            sx={{
              minHeight: 56,
              fontSize: '1.1rem',
              textTransform: 'none',
            }}
          >
            Search Books
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}