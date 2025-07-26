'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Save,
  Cancel,
  Info,
  Warning,
  MenuBook,
} from '@mui/icons-material'
import type { EnhancedBook } from '@/lib/types'
import CoverSelectionModal from '../modals/CoverSelectionModal'

interface BookPreviewProps {
  book: EnhancedBook
  customTags: string
  onCustomTagsChange: (tags: string) => void
  onSave: () => void
  onCancel: () => void
  onMoreDetails: () => void
  onAuthorClick: (authorName: string) => void
  onSeriesClick: (seriesName: string) => void
  onGenreClick: (genreName: string) => void
  onCoverChange?: (coverUrl: string, coverData: any) => void
  isDuplicate?: boolean
  isLoading?: boolean
  isSaveDisabled?: boolean
  saveButtonText?: string
  showActionButtons?: boolean
  canSelectCover?: boolean
}

export default function BookPreview({
  book,
  customTags,
  onCustomTagsChange,
  onSave,
  onCancel,
  onMoreDetails,
  onAuthorClick,
  onSeriesClick,
  onGenreClick,
  onCoverChange,
  isDuplicate = false,
  isLoading = false,
  isSaveDisabled = false,
  saveButtonText = 'Add to Library',
  showActionButtons = true,
  canSelectCover = false
}: BookPreviewProps) {
  const [tagsError, setTagsError] = useState<string>('')
  const [showCoverSelection, setShowCoverSelection] = useState(false)
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onCustomTagsChange(value)
    
    // Basic validation
    if (value.length > 500) {
      setTagsError('Tags too long (max 500 characters)')
    } else {
      setTagsError('')
    }
  }

  const handleSave = () => {
    if (tagsError) return
    onSave()
  }

  const handleCoverSelect = (coverOption: any) => {
    if (onCoverChange) {
      const coverUrl = coverOption.covers.medium || coverOption.covers.small || coverOption.covers.thumbnail
      onCoverChange(coverUrl, coverOption)
    }
  }

  return (
    <Box data-testid="book-preview">
      <Typography variant="h5" gutterBottom color="success.main">
        Book Selected!
      </Typography>
      
      {/* Duplicate warning */}
      {isDuplicate && (
        <Alert 
          severity="warning" 
          variant="outlined"
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <Warning sx={{ mr: 1, verticalAlign: 'middle' }} /> <strong>Duplicate Detected:</strong> This book appears to already be in your library. 
            You can still add it if you have multiple copies or different editions.
          </Typography>
        </Alert>
      )}
      
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexDirection: 'row', alignItems: 'flex-start' }}>
            <Box sx={{ position: 'relative' }}>
              {book.thumbnail ? (
                <CardMedia
                  component="img"
                  src={book.thumbnail}
                  alt={book.title}
                  sx={{ 
                    width: { xs: 100, sm: 120 }, 
                    height: 'auto', 
                    objectFit: 'contain',
                    cursor: canSelectCover ? 'pointer' : 'default',
                    borderRadius: 1,
                    '&:hover': canSelectCover ? {
                      opacity: 0.8,
                      transform: 'scale(1.02)'
                    } : {}
                  }}
                  onClick={() => canSelectCover && setShowCoverSelection(true)}
                />
              ) : (
                <Box 
                  sx={{ 
                    width: { xs: 100, sm: 120 }, 
                    height: 150, 
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: canSelectCover ? 'pointer' : 'default',
                    '&:hover': canSelectCover ? {
                      bgcolor: 'grey.300'
                    } : {}
                  }}
                  onClick={() => canSelectCover && setShowCoverSelection(true)}
                >
                  <MenuBook sx={{ fontSize: '2rem', color: 'text.secondary' }} />
                </Box>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {book.title}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {book.authors.map((author, index) => (
                  <span key={index}>
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: 'primary.main', 
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': { textDecoration: 'none' }
                      }}
                      onClick={() => onAuthorClick(author)}
                    >
                      {author}
                    </Typography>
                    {index < book.authors.length - 1 && ', '}
                  </span>
                ))}
                {book.publishedDate && (
                  <Typography component="span" color="text.secondary">
                    , {new Date(book.publishedDate).getFullYear()}
                  </Typography>
                )}
              </Typography>
              
              {book.series && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Typography 
                    component="span" 
                    sx={{ 
                      color: 'primary.main', 
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      '&:hover': { textDecoration: 'none' }
                    }}
                    onClick={() => onSeriesClick(book.series!)}
                  >
                    {book.series}
                  </Typography>
                  {book.seriesNumber && ` (#${book.seriesNumber})`}
                </Typography>
              )}
              
              {/* Enhanced genres with fallback to categories */}
              {(book.enhancedGenres || book.categories) && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  {(book.enhancedGenres || book.categories || []).slice(0, 4).map((genre, index) => (
                    <Chip 
                      key={index} 
                      label={genre} 
                      size="small" 
                      color={book.enhancedGenres ? 'primary' : 'default'}
                      onClick={() => onGenreClick(genre)}
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: book.enhancedGenres ? 'primary.100' : 'grey.100'
                        }
                      }} 
                    />
                  ))}
                  {book.enhancedGenres && book.enhancedGenres.length > 4 && (
                    <Chip 
                      label={`+${book.enhancedGenres.length - 4} more`} 
                      size="small" 
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }} 
                    />
                  )}
                </Box>
              )}
              
              {book.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {book.description.substring(0, isSmallScreen ? 100 : 200)}
                  {book.description.length > (isSmallScreen ? 100 : 200) && '...'}
                </Typography>
              )}
              
              {/* More Details button - only show if there's additional information */}
              {(book.extendedDescription || book.subjects || book.pageCount || book.averageRating) && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Info />}
                    onClick={onMoreDetails}
                    sx={{ textTransform: 'none' }}
                    disabled={isLoading}
                  >
                    More Details
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tags input */}
      <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <TextField
          fullWidth
          size="small"
          label="Tags (comma-separated)"
          value={customTags}
          onChange={handleTagsChange}
          placeholder="e.g. fiction, mystery, favorite"
          helperText={tagsError || "Add custom tags to organize your books"}
          error={!!tagsError}
          disabled={isLoading}
        />
      </Box>

      {/* Action buttons */}
      {showActionButtons && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={isSaveDisabled || isLoading || !!tagsError}
          >
            {isLoading ? 'Saving...' : saveButtonText}
          </Button>
          <Button 
            variant="outlined"
            startIcon={<Cancel />}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </Box>
      )}

      {/* Cover Selection Modal */}
      <CoverSelectionModal
        title={book.title}
        author={book.authors.join(', ')}
        currentCover={book.thumbnail}
        onCoverSelect={handleCoverSelect}
        onClose={() => setShowCoverSelection(false)}
        open={showCoverSelection}
      />
    </Box>
  )
}