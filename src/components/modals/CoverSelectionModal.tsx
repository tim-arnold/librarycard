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
  Tooltip,
} from '@mui/material'
import { Close, Image, Search, Book, Public, CameraAlt } from '@mui/icons-material'
import BookCoverCapture from '../library/BookCoverCapture'
import AppealModal from './AppealModal'

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
  const enhancedMode = true // Always use enhanced mode for better results
  const [currentTab, setCurrentTab] = useState(0) // 0 = Search, 1 = Camera
  const [appealModalOpen, setAppealModalOpen] = useState(false)
  const [appealData, setAppealData] = useState<{
    imageDataUrl: string
    rejectionReason: string
    aiClassificationResults?: any
  } | null>(null)
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadResult = await response.json();

      if (!uploadResult.success) {
        // LCWEB-190: Handle image verification errors with appeal option
        const errorMessage = uploadResult.error || 'Image upload failed';

        // Check if this is a verification error and provide appeal option
        if (errorMessage.includes('does not appear to be a book cover') ||
            errorMessage.includes('inappropriate content') ||
            errorMessage.includes('appears to contain people or faces')) {

          // Store appeal data for potential appeal submission
          setAppealData({
            imageDataUrl,
            rejectionReason: errorMessage,
            aiClassificationResults: uploadResult.verification
          });

          throw new Error(errorMessage);
        }

        throw new Error(errorMessage);
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
      setError(error instanceof Error ? error.message : 'Failed to upload captured image. Please try again.');
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
        sx: {
          maxHeight: '90vh',
          height: currentTab === 1 ? 'auto' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Image sx={{ color: 'primary.main' }} titleAccess="" aria-hidden="true" {...({ alt: "" } as any)} />
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

      <DialogContent sx={{
        pb: 1,
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Custom Navigation - styled like mobile bottom nav */}
        <Box sx={{
          display: 'flex',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2,
          backgroundColor: 'background.paper',
          borderRadius: '8px 8px 0 0'
        }}>
          <Button
            onClick={() => setCurrentTab(0)}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              py: 2,
              px: 1,
              minHeight: 64,
              borderRadius: 0,
              color: currentTab === 0 ? 'primary.main' : 'text.secondary',
              backgroundColor: currentTab === 0 ? 'primary.50' : 'transparent',
              '&:hover': {
                backgroundColor: currentTab === 0 ? 'primary.50' : 'action.hover',
              }
            }}
          >
            <Search />
            <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
              Search Online
            </Typography>
          </Button>
          <Button
            onClick={() => setCurrentTab(1)}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              py: 2,
              px: 1,
              minHeight: 64,
              borderRadius: 0,
              color: currentTab === 1 ? 'primary.main' : 'text.secondary',
              backgroundColor: currentTab === 1 ? 'primary.50' : 'transparent',
              '&:hover': {
                backgroundColor: currentTab === 1 ? 'primary.50' : 'action.hover',
              }
            }}
          >
            <CameraAlt />
            <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
              Camera Capture
            </Typography>
          </Button>
        </Box>

        {/* Search Tab Content */}
        {currentTab === 0 && (
          <>
            {/* Search Controls */}
            <Box sx={{
              mb: 2,
              display: 'flex',
              gap: { xs: 1, sm: 2 },
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'end' }
            }}>
              <TextField
                label="Search Query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                placeholder="Enter title, author, or keywords..."
                size="small"
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                startIcon={isLoading ? <CircularProgress size={16} /> : <Search />}
                sx={{
                  minWidth: { xs: 'auto', sm: 100 },
                  py: { xs: 1, sm: 'auto' }
                }}
              >
                Search
              </Button>
            </Box>

            {/* Sources Info - Compact */}
            <Box sx={{
              mb: 2,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Typography variant="caption" color="text.secondary">
                Searching:
              </Typography>
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
                        <Image fontSize="large" titleAccess="" aria-hidden="true" {...({ alt: "" } as any)} />
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
                <Image sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} titleAccess="" aria-hidden="true" {...({ alt: "" } as any)} />
                <Typography variant="body1" color="text.secondary">
                  No editions found. Try adjusting your search terms.
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Camera Tab Content */}
        {currentTab === 1 && (
          <>
            {/* Error Display for Camera Tab */}
            {error && (
              <Alert
                severity="warning"
                sx={{ mb: 2 }}
                action={
                  // LCWEB-190: Show appeal button for AI verification errors
                  appealData && (
                    error.includes('does not appear to be a book cover') ||
                    error.includes('inappropriate content') ||
                    error.includes('appears to contain people or faces')
                  ) ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => setAppealModalOpen(true)}
                      sx={{ ml: 1 }}
                    >
                      Report Issue
                    </Button>
                  ) : null
                }
              >
                {error}
                {/* LCWEB-190: Additional appeal info for verification errors */}
                {appealData && (
                  error.includes('does not appear to be a book cover') ||
                  error.includes('inappropriate content') ||
                  error.includes('appears to contain people or faces')
                ) && (
                  <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem' }}>
                    If you believe this is a legitimate book cover, you can report this issue to help us improve our AI verification system.
                  </Typography>
                )}
              </Alert>
            )}

            <Box sx={{
              flex: 1,
              minHeight: 300,
              maxHeight: 'calc(100vh - 280px)', // Account for header, tabs, error, and buttons
              overflow: 'hidden'
            }}>
              <BookCoverCapture
                title={title}
                author={author}
                onCoverCapture={handleCameraCapture}
                onCancel={() => setCurrentTab(0)}
              />
            </Box>
          </>
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

      {/* LCWEB-190: Appeal Modal for AI Verification Issues */}
      {appealData && (
        <AppealModal
          open={appealModalOpen}
          onClose={() => setAppealModalOpen(false)}
          bookTitle={title}
          bookAuthor={author}
          rejectedImageDataUrl={appealData.imageDataUrl}
          rejectionReason={appealData.rejectionReason}
          aiClassificationResults={appealData.aiClassificationResults}
          onAppealSubmitted={() => {
            setAppealModalOpen(false)
            setAppealData(null)
            setError('') // Clear the error once appeal is submitted
          }}
        />
      )}
    </Dialog>
  )
}