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
          }
        }
      }}
      sx={{
        zIndex: 950, // Below toolbar (1000) but above backdrop (900)
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          minHeight: 120,
          maxHeight: 'calc(100vh - 80px)',
          bottom: 64,
          height: 'auto',
          zIndex: 950, // Same as drawer, below toolbar
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography variant="h6" component="h2">
            Search Books
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ ml: 1 }}
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
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  edge="end"
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {searchTerm && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Searching for "{searchTerm}"
          </Typography>
        )}
      </Box>
    </Drawer>
  )
}