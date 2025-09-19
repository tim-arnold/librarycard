'use client'

import React from 'react'
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Chip,
  Badge,
} from '@mui/material'
import { PersonAdd, NewReleases } from '@mui/icons-material'
import type { ActivityItem } from '@/lib/types'

interface NewlyAddedProps {
  items: ActivityItem[]
  onBookClick?: (bookId: string) => void
  onAuthorClick?: (authorName: string) => void
  onFilterApply?: (filterType: string, value: string) => void
  showUserInfo?: boolean
}

export default function NewlyAdded({
  items,
  onBookClick,
  onAuthorClick,
  onFilterApply,
  showUserInfo = false,
}: NewlyAddedProps) {
  if (items.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Nothing new in the last 14 days
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Build the community and add some books yourself!
        </Typography>
      </Box>
    )
  }

  const getNewBadgeColor = (daysAgo: number) => {
    if (daysAgo <= 1) return 'success'
    if (daysAgo <= 3) return 'warning'
    return 'info'
  }

  const getNewBadgeText = (daysAgo: number) => {
    if (daysAgo === 0) return 'Today'
    if (daysAgo === 1) return '1 day'
    return `${daysAgo} days`
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {items.map((item) => {
        const { book, user, days_ago } = item.data
        
        return (
          <Card
            key={item.id}
            variant="outlined"
            sx={{
              mb: 1.5,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                boxShadow: 2,
              },
            }}
            onClick={() => onBookClick?.(book.id)}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              {/* NEW Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                }}
              >
                <Chip
                  label="NEW"
                  size="small"
                  color={getNewBadgeColor(days_ago || 0)}
                  sx={{
                    fontSize: '0.6rem',
                    height: 18,
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 1 },
                  }}
                  icon={<NewReleases sx={{ fontSize: '0.8rem' }} />}
                />
              </Box>

              {/* Book Info */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1, pr: 6 }}>
                <Avatar
                  src={book.thumbnail}
                  variant="rounded"
                  sx={{ width: 40, height: 60, flexShrink: 0 }}
                >
                  📖
                </Avatar>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {book.title}
                  </Typography>
                  
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (book.authors && book.authors.length > 0) {
                        onAuthorClick?.(book.authors[0])
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      display: 'block',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {book.authors?.slice(0, 2).join(', ')}
                  </Typography>

                  {/* Publication Year */}
                  {book.publishedDate && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(book.publishedDate).getFullYear()}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Description Preview */}
              {book.description && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 1,
                    color: 'text.secondary',
                  }}
                >
                  {book.description}
                </Typography>
              )}

              {/* Added by and Time */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: showUserInfo ? 'space-between' : 'flex-end',
                  mb: 1,
                }}
              >
                {showUserInfo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonAdd sx={{ fontSize: 14 }} />
                    <Typography variant="caption" color="text.secondary">
                      Added by {user?.display_name || 'Library Member'}
                    </Typography>
                  </Box>
                )}
                
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {getNewBadgeText(days_ago || 0)}
                </Typography>
              </Box>

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                  {book.categories.slice(0, 2).map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.6rem', 
                        height: 18,
                        '& .MuiChip-label': { px: 1 },
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onFilterApply?.('category', category)
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Shelf Location */}
              {book.shelf_name && (
                <Box>
                  <Chip
                    label={`📍 ${book.shelf_name}`}
                    size="small"
                    variant="filled"
                    color="default"
                    sx={{ 
                      fontSize: '0.6rem', 
                      height: 20,
                      bgcolor: 'action.selected',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onFilterApply?.('shelf', book.shelf_name!)
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}