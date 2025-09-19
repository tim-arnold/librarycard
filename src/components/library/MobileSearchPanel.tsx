'use client'

import { useEffect, useRef } from 'react'
import {
  Drawer,
  Box,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
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

  // Auto-focus search input when panel opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [open])


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
          minHeight: 140,
          maxHeight: 'calc(100vh - 80px)',
          bottom: 64,
          height: 'auto',
          zIndex: 950, // Same as drawer, below toolbar
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
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

        <TextField
          inputRef={searchInputRef}
          fullWidth
          placeholder="Search by title, author, ISBN, or genre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'primary.main' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
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

        {searchTerm && (
          <Box sx={{
            mt: 2,
            p: 2,
            backgroundColor: 'primary.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Typography
              variant="body2"
              color="primary.main"
              sx={{ fontWeight: 500 }}
            >
              Searching for "{searchTerm}"
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}