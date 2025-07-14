'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
} from '@mui/material'
import { Close, Image, Search, CheckCircle } from '@mui/icons-material'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'

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
  const [searchTitle, setSearchTitle] = useState(title)
  const [searchAuthor, setSearchAuthor] = useState(author)
  const { data: session } = useSession()

  const fetchEditions = async (searchTitleParam?: string, searchAuthorParam?: string) => {
    const titleToSearch = searchTitleParam || searchTitle
    const authorToSearch = searchAuthorParam || searchAuthor
    
    if (!titleToSearch || !authorToSearch || !session?.user?.email) return

    setIsLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        title: titleToSearch,
        author: authorToSearch
      })
      
      const response = await fetch(`${API_BASE}/api/books/editions?${params}`, {
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
      setSearchTitle(title)
      setSearchAuthor(author)
      fetchEditions(title, author)
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
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Refine Search
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'end' }}>
            <TextField
              label="Title"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              disabled={isLoading}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Author"
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              disabled={isLoading}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={isLoading || !searchTitle || !searchAuthor}
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

        {/* Editions Grid */}
        {!isLoading && editions.length > 0 && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: 2 
          }}>
            {editions.map((edition) => {
              const coverUrl = getCoverUrl(edition.covers)
              const isSelected = selectedCover?.id === edition.id
              const isCurrent = isCurrentCover(edition)
              
              return (
                <Card 
                  key={edition.id}
                  sx={{ 
                    height: '100%',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    position: 'relative'
                  }}
                >
                    <CardActionArea 
                      onClick={() => handleCoverSelect(edition)}
                      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      {/* Cover Image */}
                      <Box sx={{ height: 200, width: '100%', position: 'relative', bgcolor: 'grey.100' }}>
                        {coverUrl ? (
                          <CardMedia
                            component="img"
                            image={coverUrl}
                            alt={edition.title}
                            sx={{ 
                              height: '100%', 
                              objectFit: 'cover',
                              width: '100%'
                            }}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'text.secondary'
                            }}
                          >
                            <Image fontSize="large" />
                          </Box>
                        )}
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'primary.main',
                              borderRadius: '50%',
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
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
                              top: 8,
                              left: 8,
                            }}
                          />
                        )}
                      </Box>

                      {/* Edition Info */}
                      <CardContent sx={{ flex: 1, p: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
                          {edition.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          {edition.authors.join(', ')}
                        </Typography>
                        {edition.publisher && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            {edition.publisher}
                          </Typography>
                        )}
                        {edition.publishedDate && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {edition.publishedDate}
                          </Typography>
                        )}
                        {edition.isbn && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            ISBN: {edition.isbn}
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
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