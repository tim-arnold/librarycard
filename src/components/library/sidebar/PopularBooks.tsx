'use client'

import React from 'react'
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Chip,
  Rating,
  LinearProgress,
} from '@mui/material'
import { People, Whatshot } from '@mui/icons-material'
import type { ActivityItem } from '@/lib/types'

interface PopularBooksProps {
  items: ActivityItem[]
  onBookClick?: (bookId: string) => void
  onAuthorClick?: (authorName: string) => void
  onFilterApply?: (filterType: string, value: string) => void
  showUserInfo?: boolean
}

export default function PopularBooks({
  items,
  onBookClick,
  onAuthorClick,
  onFilterApply,
  showUserInfo = false,
}: PopularBooksProps) {
  if (items.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No popular books yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Books with multiple ratings will appear here
        </Typography>
      </Box>
    )
  }

  const maxPopularity = Math.max(...items.map(item => item.data.popularity_score || 0))

  const getPopularityLevel = (score: number) => {
    const percentage = (score / maxPopularity) * 100
    if (percentage >= 80) return { level: 'Hot', color: 'error', icon: '🔥' }
    if (percentage >= 60) return { level: 'Trending', color: 'warning', icon: '⭐' }
    if (percentage >= 40) return { level: 'Popular', color: 'success', icon: '👍' }
    return { level: 'Rising', color: 'info', icon: '📈' }
  }

  return (
    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
      {items.map((item, index) => {
        const { book, popularity_score, rating_count, average_rating, recent_activity_count } = item.data
        const popularityInfo = getPopularityLevel(popularity_score || 0)
        const progressValue = ((popularity_score || 0) / maxPopularity) * 100
        
        return (
          <Card
            key={item.id}
            variant="outlined"
            sx={{
              mb: 1.5,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              border: index === 0 ? 2 : 1,
              borderColor: index === 0 ? 'primary.main' : 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                boxShadow: 2,
              },
            }}
            onClick={() => onBookClick?.(book.id)}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              {/* Rank Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: index === 0 ? 'primary.main' : 'action.selected',
                    color: index === 0 ? 'white' : 'text.primary',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  #{index + 1}
                </Typography>
                
                <Chip
                  label={popularityInfo.level}
                  size="small"
                  color={popularityInfo.color as any}
                  sx={{
                    fontSize: '0.6rem',
                    height: 18,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              </Box>

              {/* Book Info */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1, pr: 8 }}>
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
                </Box>
              </Box>

              {/* Rating and Stats */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Rating
                    value={average_rating || 0}
                    readOnly
                    size="small"
                    precision={0.1}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {average_rating?.toFixed(1) || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <People sx={{ fontSize: 12 }} />
                    <Typography variant="caption" color="text.secondary">
                      {rating_count} rating{rating_count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  
                  {(recent_activity_count || 0) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Whatshot sx={{ fontSize: 12 }} />
                      <Typography variant="caption" color="text.secondary">
                        {recent_activity_count} recent
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Popularity Progress */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Popularity Score
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {popularity_score?.toFixed(1)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    color={popularityInfo.color as any}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
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