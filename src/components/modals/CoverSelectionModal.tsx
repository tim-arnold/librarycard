'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  TextField,
  InputAdornment,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
} from '@mui/material'
import { Close, Image, Search, CheckCircle, AutoAwesome, Book, Public, AccountBalance } from '@mui/icons-material'

interface CoverOption {
  id: string
  isbn?: string
  title: string
  authors: string[]
  publisher?: string
  publishedDate?: string
  covers: {
    thumbnail?: string
    small?: string
    medium?: string
    large?: string
    extraLarge?: string
  }
  pageCount?: number
  description?: string
  averageRating?: number
  ratingsCount?: number
  source?: 'google' | 'openlibrary'
  sourceDisplayName?: string
  classification?: string
  lccn?: string
  language?: string
}

interface CoverSelectionModalProps {
  title: string
  author: string
  currentCover?: string
  onCoverSelect: (cover: CoverOption) => void
  onClose: () => void
  open: boolean
}

export default function CoverSelectionModal({
  title,
  author,
  currentCover,
  onCoverSelect,
  onClose,
  open
}: CoverSelectionModalProps) {
  const [editions, setEditions] = useState<CoverOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [selectedCover, setSelectedCover] = useState<CoverOption | null>(null)
  const [searchQuery, setSearchQuery] = useState(`${title} ${author}`.trim())
  const [enhancedMode, setEnhancedMode] = useState(true) // Default to enhanced mode
  const { data: session } = useSession()

  const fetchEditions = async (queryParam?: string) => {
    const queryToSearch = queryParam || searchQuery
    
    if (!queryToSearch.trim() || !session?.user?.email) return

    setIsLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        q: queryToSearch,
        enhanced: enhancedMode.toString()
      })
      
      const response = await fetch(`${getApiBaseUrl()}/api/books/editions?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch editions')
      }
      
      setEditions(data.editions || [])
      
      if (data.editions.length === 0) {
        setError('No alternative covers found for this book')
      }
    } catch (err) {
      console.error('Error fetching editions:', err)
      setError('Failed to load book editions. Please try again.')
      setEditions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      const initialQuery = `${title} ${author}`.trim()
      setSearchQuery(initialQuery)
      fetchEditions(initialQuery)
    }
  }, [open, title, author])

  const handleCoverSelect = (cover: CoverOption) => {
    setSelectedCover(cover)
  }

  const handleConfirmSelection = () => {
    if (selectedCover) {
      onCoverSelect(selectedCover)
      onClose()
    }
  }

  const handleSearch = () => {
    fetchEditions()
  }

  const handleClose = () => {
    setSelectedCover(null)
    setError('')
    onClose()
  }

  const getCoverUrl = (covers: CoverOption['covers']) => {
    return covers.medium || covers.small || covers.thumbnail || covers.large || covers.extraLarge
  }

  const isCurrentCover = (cover: CoverOption) => {
    const coverUrl = getCoverUrl(cover.covers)
    return coverUrl === currentCover
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'google':
        return <Book fontSize="small" />
      case 'openlibrary':
        return <Public fontSize="small" />
      default:
        return <Book fontSize="small" />
    }
  }

  const getSourceColor = (source?: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (source) {
      case 'google':
        return 'primary'  // Blue
      case 'openlibrary':
        return 'success'  // Green
      default:
        return 'default'
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Image sx={{ color: 'primary.main' }} />
          <Typography variant="h6">
            Choose Book Cover
          </Typography>
        </Box>
        <Button
          onClick={handleClose}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {/* Search Controls */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              Search Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={enhancedMode}
                  onChange={(e) => setEnhancedMode(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AutoAwesome fontSize="small" />
                  <Typography variant="body2">
                    Enhanced (2 sources)
                  </Typography>
                </Box>
              }
            />
          </Box>
          
          {enhancedMode && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Enhanced mode searches across multiple sources:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip
                  icon={<Book />}
                  label="Google Books"
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  icon={<Public />}
                  label="Open Library"
                  size="small"
                  variant="outlined"
                  color="success"
                />
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'end' }}>
            <TextField
              label="Search Query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              placeholder="Enter title, author, or keywords..."
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              startIcon={isLoading ? <CircularProgress size={16} /> : <Search />}
              sx={{ minWidth: 100 }}
            >
              Search
            </Button>
          </Box>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Cover Grid */}
        {!isLoading && editions.length > 0 && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
            gap: 3 
          }}>
            {editions.map((edition) => {
              const coverUrl = getCoverUrl(edition.covers)
              const isSelected = selectedCover?.id === edition.id
              const isCurrent = isCurrentCover(edition)
              
              return (
                <Card 
                  key={edition.id}
                  sx={{ 
                    position: 'relative',
                    border: isSelected ? 3 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleCoverSelect(edition)}
                >
                  {/* Cover Image */}
                  <Box sx={{ 
                    height: 240, 
                    width: '100%', 
                    position: 'relative', 
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {coverUrl ? (
                      <CardMedia
                        component="img"
                        image={coverUrl}
                        alt={`Cover option for ${edition.title}`}
                        sx={{ 
                          height: '100%', 
                          width: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'text.secondary',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Image fontSize="large" />
                        <Typography variant="caption" color="text.secondary">
                          No Cover
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 2
                        }}
                      >
                        <CheckCircle sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                    )}

                    {/* Current Cover Indicator */}
                    {isCurrent && (
                      <Chip
                        label="Current"
                        size="small"
                        color="info"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          fontWeight: 600
                        }}
                      />
                    )}

                    {/* Source Badge */}
                    {enhancedMode && edition.source && (
                      <Tooltip title={edition.sourceDisplayName || edition.source}>
                        <Chip
                          icon={getSourceIcon(edition.source)}
                          label={edition.source === 'google' ? 'GB' : 'OL'}
                          size="small"
                          color={getSourceColor(edition.source)}
                          variant="filled"
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            fontSize: '0.7rem',
                            height: 24,
                            '& .MuiChip-label': {
                              color: 'white',
                              fontWeight: 600
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Card>
              )
            })}
          </Box>
        )}

        {/* No Results */}
        {!isLoading && editions.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Image sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No editions found. Try adjusting your search terms.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmSelection}
          variant="contained"
          disabled={!selectedCover}
          startIcon={<CheckCircle />}
        >
          Use This Cover
        </Button>
      </DialogActions>
    </Dialog>
  )
}