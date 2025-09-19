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
  Tooltip,
} from '@mui/material'
import { Person, Star } from '@mui/icons-material'
import type { ActivityItem } from '@/lib/types'

interface RecentReviewsProps {
  items: ActivityItem[]
  onBookClick?: (bookId: string) => void
  onAuthorClick?: (authorName: string) => void
  onFilterApply?: (filterType: string, value: string) => void
  showUserInfo?: boolean
}

export default function RecentReviews({
  items,
  onBookClick,
  onAuthorClick,
  onFilterApply,
  showUserInfo = false,
}: RecentReviewsProps) {
  if (items.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No recent reviews
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Rate some books to see reviews here
        </Typography>
      </Box>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {items.map((item) => {
        const { book, user, rating, review } = item.data
        
        return (
          <Card
            key={item.id}
            variant="outlined"
            sx={{
              mb: 1.5,
              cursor: 'pointer',
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
              {/* Book Info */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
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
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {book.authors?.slice(0, 2).join(', ')}
                  </Typography>
                </Box>
              </Box>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating
                  value={rating}
                  readOnly
                  size="small"
                  precision={0.5}
                />
                <Typography variant="caption" color="text.secondary">
                  {rating}/5
                </Typography>
              </Box>

              {/* Review Text */}
              {review && (
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
                    fontStyle: 'italic',
                  }}
                >
                  "{review}"
                </Typography>
              )}

              {/* User and Time */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: showUserInfo ? 'space-between' : 'flex-end',
                  pt: 0.5,
                }}
              >
                {showUserInfo && review && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Person sx={{ fontSize: 14 }} />
                    <Typography variant="caption" color="text.secondary">
                      {user?.display_name || 'Library Member'}
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(item.timestamp)}
                </Typography>
              </Box>

              {/* Shelf Badge */}
              {book.shelf_name && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={book.shelf_name}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: 20 }}
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