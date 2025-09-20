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
  Card,
  CardMedia,
  Chip,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material'
import { Close, Image, Search, AutoAwesome, Book, Public, CameraAlt } from '@mui/icons-material'
import BookCoverCapture from '../library/BookCoverCapture'

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
  onAnimationStart?: () => void // New prop for immediate animation feedback
}

export default function CoverSelectionModal({
  title,
  author,
  currentCover,
  onCoverSelect,
  onClose,
  open,
  onAnimationStart
}: CoverSelectionModalProps) {
  const [editions, setEditions] = useState<CoverOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState(`${title} ${author}`.trim())
  const [enhancedMode, setEnhancedMode] = useState(true) // Default to enhanced mode
  const [currentTab, setCurrentTab] = useState(0) // 0 = Search, 1 = Camera
  const { data: session } = useSession()

  const fetchEditions = async (queryParam?: string) => {
    const queryToSearch = queryParam || searchQuery
    
    if (!queryToSearch.trim() || !session?.user?.email) return

    setIsLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        title: title,
        author: author,
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
    // Trigger immediate animation feedback
    if (onAnimationStart) {
      onAnimationStart()
    }
    
    // Pass cover selection to parent
    onCoverSelect(cover)
    onClose()
  }

  const handleSearch = () => {
    fetchEditions()
  }

  const handleClose = () => {
    setError('')
    setCurrentTab(0) // Reset to search tab
    onClose()
  }

  const handleCameraCapture = async (imageDataUrl: string) => {
    try {
      // Upload the captured image to our backend storage
      const response = await fetch(`${getApiBaseUrl()}/api/books/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          image: imageDataUrl,
          metadata: {
            width: 0, // Will be filled by backend processing
            height: 0,
            size: 0,
            format: imageDataUrl.startsWith('data:image/webp') ? 'webp' : 'jpeg'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await response.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Image upload failed');
      }

      // Create a cover option from the uploaded image
      const cameraCover: CoverOption = {
        id: `camera-${Date.now()}`,
        title: title,
        authors: [author],
        covers: {
          thumbnail: uploadResult.imageUrl,
          small: uploadResult.imageUrl,
          medium: uploadResult.imageUrl,
          large: uploadResult.imageUrl,
          extraLarge: uploadResult.imageUrl
        },
        source: 'camera' as any
      }

      handleCoverSelect(cameraCover)
    } catch (error) {
      console.error('Error uploading camera capture:', error);
      setError('Failed to upload captured image. Please try again.');
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
    setError('')
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
        sx: { maxHeight: '85vh', height: currentTab === 1 ? '600px' : 'auto' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Image sx={{ color: 'primary.main' }} alt="" />
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
        {/* Tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab
            icon={<Search />}
            label="Search Online"
            iconPosition="start"
          />
          <Tab
            icon={<CameraAlt />}
            label="Camera Capture"
            iconPosition="start"
          />
        </Tabs>

        {/* Search Tab Content */}
        {currentTab === 0 && (
          <>
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
                columns: {
                  xs: 2,    // 2 columns on phones
                  sm: 3,    // 3 columns on tablets
                  md: 4,    // 4 columns on small laptops
                  lg: 5,    // 5 columns on desktops
                  xl: 6     // 6 columns on large screens
                },
                columnGap: 3,
                '& > *': {
                  breakInside: 'avoid',
                  marginBottom: 3,
                  display: 'block'
                }
              }}>
                {editions.map((edition) => {
                  const coverUrl = getCoverUrl(edition.covers)
                  const isSelected = false
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
                    width: '100%', 
                    position: 'relative'
                  }}>
                    {coverUrl ? (
                      <CardMedia
                        component="img"
                        image={coverUrl}
                        alt={`Cover option for ${edition.title}`}
                        sx={{ 
                          width: '100%',
                          height: 'auto',
                          display: 'block'
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
                          gap: 1,
                          minHeight: 200,
                          width: '100%',
                          bgcolor: 'grey.100'
                        }}
                      >
                        <Image fontSize="large" alt="" />
                        <Typography variant="caption" color="text.secondary">
                          No Cover
                        </Typography>
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
                <Image sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} alt="" />
                <Typography variant="body1" color="text.secondary">
                  No editions found. Try adjusting your search terms.
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Camera Tab Content */}
        {currentTab === 1 && (
          <Box sx={{ height: 350 }}>
            <BookCoverCapture
              title={title}
              author={author}
              onCoverCapture={handleCameraCapture}
              onCancel={() => setCurrentTab(0)}
            />
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
      </DialogActions>
    </Dialog>
  )
}