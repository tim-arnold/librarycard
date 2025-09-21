'use client'

import { Box, Typography, Link } from '@mui/material'
import { Book, Public } from '@mui/icons-material'

interface CoverAttributionProps {
  coverUrl?: string
  variant?: 'small' | 'default'
}

/**
 * Detects the source of a book cover URL and provides appropriate attribution
 */
function detectCoverSource(coverUrl: string): 'google' | 'openlibrary' | 'unknown' {
  if (coverUrl.includes('books.google.com') || coverUrl.includes('books.googleusercontent.com')) {
    return 'google'
  }
  if (coverUrl.includes('covers.openlibrary.org')) {
    return 'openlibrary'
  }
  return 'unknown'
}

export default function CoverAttribution({ coverUrl, variant = 'default' }: CoverAttributionProps) {
  // Don't show attribution if no cover URL
  if (!coverUrl) {
    return null
  }

  const source = detectCoverSource(coverUrl)
  
  // Don't show attribution for unknown sources
  if (source === 'unknown') {
    return null
  }

  const isSmall = variant === 'small'
  const fontSize = isSmall ? '0.7rem' : '0.75rem'
  const iconSize = isSmall ? 12 : 14

  if (source === 'google') {
    return (
      <Box sx={{ mt: isSmall ? 0.5 : 1, maxWidth: '120px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Book sx={{ fontSize: iconSize, color: 'text.secondary' }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize, lineHeight: 1.2 }}
          >
            Cover from
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize, lineHeight: 1.2, ml: isSmall ? 1.5 : 1.75 }}
        >
          <Link
            href="https://books.google.com"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Google Books
          </Link>
        </Typography>
      </Box>
    )
  }

  if (source === 'openlibrary') {
    return (
      <Box sx={{ mt: isSmall ? 0.5 : 1, maxWidth: '120px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Public sx={{ fontSize: iconSize, color: 'text.secondary' }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize, lineHeight: 1.2 }}
          >
            Cover from
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize, lineHeight: 1.2, ml: isSmall ? 1.5 : 1.75 }}
        >
          <Link
            href="https://openlibrary.org"
            target="_blank"
            rel="noopener noreferrer"
            color="secondary"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Open Library
          </Link>
        </Typography>
      </Box>
    )
  }

  return null
}