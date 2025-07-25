'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'
import {
  Box,
  Typography,
  Chip,
  Autocomplete,
  TextField,
  Button,
  CircularProgress,
  FormControl,
} from '@mui/material'
import {
  Add,
  Check,
  Close,
} from '@mui/icons-material'
import type { CuratedGenre, EnhancedBook } from '@/lib/types'

interface GenreSelectorProps {
  book: EnhancedBook
  selectedGenres: CuratedGenre[]
  onGenresChange: (genres: CuratedGenre[]) => void
  onError: (message: string) => void
}

export default function GenreSelector({
  book,
  selectedGenres,
  onGenresChange,
  onError
}: GenreSelectorProps) {
  const { data: session } = useSession()
  const [availableGenres, setAvailableGenres] = useState<CuratedGenre[]>([])
  const [suggestedGenres, setSuggestedGenres] = useState<CuratedGenre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autocompleteValue, setAutocompleteValue] = useState<CuratedGenre | null>(null)

  // Load available genres from database
  useEffect(() => {
    if (!session?.user?.email) return
    
    console.log('GenreSelector mounted with book:', book.title, 'enhancedGenres:', book.enhancedGenres)
    const loadGenres = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${getApiBaseUrl()}/api/genres`, {
          headers: {
            'Authorization': `Bearer ${session.user.email}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error('Failed to load genres')
        }
        
        const genres = await response.json()
        console.log('Loaded genres:', genres.length, genres.slice(0, 3))
        setAvailableGenres(genres)
        
        // Get suggested genres based on book's current enhanced genres
        if (book.enhancedGenres && book.enhancedGenres.length > 0) {
          const suggested = genres.filter((genre: CuratedGenre) => 
            book.enhancedGenres!.some(bookGenre => 
              bookGenre.toLowerCase().includes(genre.name.toLowerCase()) ||
              genre.name.toLowerCase().includes(bookGenre.toLowerCase())
            )
          )
          setSuggestedGenres(suggested)
        }
      } catch (error) {
        console.error('Error loading genres:', error)
        onError('Failed to load genre options')
      } finally {
        setIsLoading(false)
      }
    }

    loadGenres()
  }, [session, book.enhancedGenres, onError])

  const handleAcceptSuggestion = (genre: CuratedGenre) => {
    if (!selectedGenres.find(g => g.id === genre.id)) {
      onGenresChange([...selectedGenres, genre])
    }
    // Remove from suggestions after accepting
    setSuggestedGenres(prev => prev.filter(g => g.id !== genre.id))
  }

  const handleRejectSuggestion = (genre: CuratedGenre) => {
    setSuggestedGenres(prev => prev.filter(g => g.id !== genre.id))
  }

  const handleAddFromAutocomplete = () => {
    if (autocompleteValue && !selectedGenres.find(g => g.id === autocompleteValue.id)) {
      onGenresChange([...selectedGenres, autocompleteValue])
      setAutocompleteValue(null)
    }
  }

  const handleRemoveSelected = (genreToRemove: CuratedGenre) => {
    onGenresChange(selectedGenres.filter(g => g.id !== genreToRemove.id))
  }

  const remainingSuggestions = suggestedGenres.filter(suggested => 
    !selectedGenres.find(selected => selected.id === suggested.id)
  )

  const availableForAutocomplete = availableGenres.filter(genre =>
    !selectedGenres.find(selected => selected.id === genre.id)
  )
  
  console.log('Available for autocomplete:', availableForAutocomplete.length)

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading genres...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      
      {/* Auto-Suggested Genres */}
      {remainingSuggestions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {remainingSuggestions.map(genre => (
              <Box key={genre.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  label={genre.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    borderStyle: 'dashed',
                    '&:hover': { backgroundColor: 'primary.50' }
                  }}
                />
                <Button
                  size="small"
                  onClick={() => handleAcceptSuggestion(genre)}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  <Check fontSize="small" color="success" />
                </Button>
                <Button
                  size="small"
                  onClick={() => handleRejectSuggestion(genre)}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  <Close fontSize="small" color="error" />
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Selected Genres */}
      {selectedGenres.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Selected genres:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedGenres.map(genre => (
              <Chip
                key={genre.id}
                label={genre.name}
                size="small"
                color="primary"
                onDelete={() => handleRemoveSelected(genre)}
                sx={{ fontWeight: 'medium' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Add Custom Genre */}
      <Box sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
          <FormControl fullWidth size="small">
            <Autocomplete
              value={autocompleteValue}
              onChange={(_, newValue) => setAutocompleteValue(newValue)}
              options={availableForAutocomplete}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add Genres"
                  variant="outlined"
                  size="small"
                  placeholder="Type to search..."
                />
              )}
              sx={{ flexGrow: 1, minWidth: 200 }}
              ListboxProps={{
                style: { maxHeight: 200 }
              }}
            />
          </FormControl>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={handleAddFromAutocomplete}
            disabled={!autocompleteValue}
            sx={{ 
              whiteSpace: 'nowrap',
              height: '40px', // Match the height of small TextField
              minWidth: { xs: '120px', sm: 'auto' }, // Ensure minimum width on mobile
              px: { xs: 2, sm: 1.5 } // More padding on mobile for better text fit
            }}
          >
            Add Genre
          </Button>
        </Box>
      </Box>

    </Box>
  )
}