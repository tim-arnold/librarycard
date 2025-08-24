'use client'

import { Box, Typography, Chip, Tooltip } from '@mui/material'
import { Star, StarBorder, StarHalf, ErrorOutline } from '@mui/icons-material'

interface StarRatingProps {
  userRating?: number | null       // Current user's rating (1-5)
  averageRating?: number | null    // Location average rating
  ratingCount?: number             // Number of ratings
  size?: 'small' | 'medium' | 'large'
  showCount?: boolean             // Show rating count
  showAverage?: boolean           // Show average rating alongside user rating
  variant?: 'display' | 'chip' | 'mini'  // Different display modes for space efficiency
  onClick?: () => void            // Click handler for rating interaction
  className?: string
  userReview?: string | null      // Current user's review text
  userReviewStatus?: 'pending' | 'approved' | 'rejected' | null  // Current user's review status
  userReviewRejectionReason?: string | null  // Reason for review rejection
}

export default function StarRating({
  userRating,
  averageRating,
  ratingCount = 0,
  size = 'small',
  showCount = false,
  showAverage = false,
  variant = 'display',
  onClick,
  className,
  userReview,
  userReviewStatus,
  userReviewRejectionReason
}: StarRatingProps) {
  // Only show rating if there's an actual rating - no empty stars, OR if there's a rejected review
  const hasAnyRating = (userRating && userRating > 0) || (averageRating && averageRating > 0)
  const hasRejectedReview = userReviewStatus === 'rejected'
  
  // Show rejection indicator even if no rating exists
  if (!hasAnyRating && !hasRejectedReview) {
    return null
  }
  
  // Determine which rating to display based on availability
  const displayRating = userRating ?? averageRating ?? 0
  const hasUserRating = userRating !== null && userRating !== undefined && userRating > 0
  const hasUserReview = userReview && userReview.trim().length > 0
  
  // Generate contextual tooltip text
  const getTooltipText = () => {
    if (!onClick) {
      // If no click handler, show rejection reason for rejected reviews
      if (hasRejectedReview && userReviewRejectionReason) {
        return `Review rejected: ${userReviewRejectionReason}`
      }
      return undefined
    }
    
    if (hasRejectedReview) {
      const baseText = 'Click to update your rejected review'
      if (userReviewRejectionReason) {
        return `${baseText} (Reason: ${userReviewRejectionReason})`
      }
      return baseText
    } else if (hasUserRating && hasUserReview) {
      return 'Click to change your rating or review'
    } else if (hasUserRating && !hasUserReview) {
      return 'Click to change your rating or add a review'
    } else {
      return 'Click to rate and review this book'
    }
  }
  
  const tooltipText = getTooltipText()
  
  // Size configurations for different variants
  const sizeConfig = {
    small: { starSize: 14, fontSize: '0.75rem', chipHeight: 20 },
    medium: { starSize: 18, fontSize: '0.875rem', chipHeight: 24 },
    large: { starSize: 24, fontSize: '1rem', chipHeight: 32 }
  }
  
  const config = sizeConfig[size]

  // Render rejection indicator
  const renderRejectionIndicator = () => {
    if (!hasRejectedReview) return null
    
    return (
      <Tooltip 
        title={userReviewRejectionReason ? `Review rejected: ${userReviewRejectionReason}` : 'Review rejected'}
        arrow
      >
        <ErrorOutline 
          sx={{
            fontSize: config.starSize,
            color: 'error.main',
            cursor: onClick ? 'pointer' : 'default'
          }}
          aria-label="Review rejected"
        />
      </Tooltip>
    )
  }

  // Render individual star icon
  const renderStar = (index: number, rating: number) => {
    const starValue = index + 1
    let StarIcon = StarBorder
    
    if (rating >= starValue) {
      StarIcon = Star
    } else if (rating >= starValue - 0.5) {
      StarIcon = StarHalf
    }
    
    return (
      <StarIcon
        key={index}
        sx={{
          fontSize: config.starSize,
          color: rating >= starValue - 0.4 ? 'warning.main' : 'action.disabled',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: rating >= starValue - 0.4 ? 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3))' : 'none',
          '&:hover': onClick ? {
            transform: 'scale(1.1) rotate(5deg)',
            filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4))',
          } : {},
        }}
        aria-label={`${starValue} out of 5 stars`}
      />
    )
  }

  // Chip variant - ultra compact for list views
  if (variant === 'chip') {
    // Show rejection indicator instead of rating if review is rejected
    if (hasRejectedReview && !displayRating) {
      return (
        <Chip
          icon={<ErrorOutline sx={{ fontSize: `${config.starSize - 2}px !important` }} aria-label="Review rejected" />}
          label="Rejected"
          size={size === 'large' ? 'medium' : size as 'small' | 'medium'}
          color="error"
          variant="outlined"
          sx={{
            height: config.chipHeight,
            fontSize: config.fontSize,
            cursor: onClick ? 'pointer' : 'default',
            '& .MuiChip-icon': {
              color: 'error.main'
            }
          }}
          onClick={onClick}
          className={className}
        />
      )
    }
    
    if (!displayRating) return null
    
    const chipComponent = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Chip
          icon={<Star sx={{ fontSize: `${config.starSize - 2}px !important` }} aria-label={`${displayRating.toFixed(1)} out of 5 stars`} />}
          label={`${displayRating.toFixed(1)}${showCount && ratingCount > 0 ? ` (${ratingCount})` : ''}`}
          size={size === 'large' ? 'medium' : size as 'small' | 'medium'}
          color={hasUserRating ? 'primary' : 'default'}
          variant={hasUserRating ? 'filled' : 'outlined'}
          sx={{
            height: config.chipHeight,
            fontSize: config.fontSize,
            cursor: onClick ? 'pointer' : 'default',
            '& .MuiChip-icon': {
              color: 'warning.main'
            }
          }}
          onClick={onClick}
          className={className}
        />
        {hasRejectedReview && (
          <ErrorOutline 
            sx={{
              fontSize: config.starSize - 2,
              color: 'error.main',
              cursor: onClick ? 'pointer' : 'default'
            }}
            aria-label="Review rejected"
            onClick={onClick}
          />
        )}
      </Box>
    )
    
    if (tooltipText && onClick) {
      return (
        <Tooltip title={tooltipText} arrow>
          {chipComponent}
        </Tooltip>
      )
    }
    
    return chipComponent
  }

  // Mini variant - single star + rating for ultra-compact spaces
  if (variant === 'mini') {
    // Show rejection indicator instead of rating if review is rejected and no rating
    if (hasRejectedReview && !displayRating) {
      const miniRejectionComponent = (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.25,
            cursor: onClick ? 'pointer' : 'default'
          }}
          onClick={onClick}
          className={className}
        >
          <ErrorOutline sx={{ fontSize: config.starSize, color: 'error.main' }} aria-label="Review rejected" />
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: config.fontSize,
              fontWeight: 600,
              color: 'error.main'
            }}
          >
            Rejected
          </Typography>
        </Box>
      )
      
      if (tooltipText && onClick) {
        return (
          <Tooltip title={tooltipText} arrow>
            {miniRejectionComponent}
          </Tooltip>
        )
      }
      
      return miniRejectionComponent
    }
    
    if (!displayRating) return null
    
    const miniComponent = (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.25,
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
        className={className}
      >
        <Star sx={{ fontSize: config.starSize, color: 'warning.main' }} aria-label={`${displayRating.toFixed(1)} out of 5 stars`} />
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: config.fontSize,
            fontWeight: hasUserRating ? 600 : 400,
            color: hasUserRating ? 'primary.main' : 'text.secondary'
          }}
        >
          {displayRating.toFixed(1)}
        </Typography>
        {showCount && ratingCount > 0 && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: config.fontSize }}
          >
            ({ratingCount})
          </Typography>
        )}
        {hasRejectedReview && (
          <ErrorOutline 
            sx={{ 
              fontSize: config.starSize - 2, 
              color: 'error.main',
              cursor: onClick ? 'pointer' : 'default'
            }} 
            aria-label="Review rejected"
          />
        )}
      </Box>
    )
    
    if (tooltipText && onClick) {
      return (
        <Tooltip title={tooltipText} arrow>
          {miniComponent}
        </Tooltip>
      )
    }
    
    return miniComponent
  }

  // Default display variant - shows all 5 stars
  if (!displayRating && !showAverage && !hasRejectedReview) return null

  const displayComponent = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
      className={className}
    >
      {/* Star display */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'scale(1.02)',
        } : {},
      }}>
        {[0, 1, 2, 3, 4].map(index => renderStar(index, displayRating))}
      </Box>
      
      {/* Rating text and count */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {displayRating > 0 && (
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: config.fontSize,
              fontWeight: hasUserRating ? 600 : 400,
              color: hasUserRating ? 'primary.main' : 'text.secondary'
            }}
          >
            {displayRating.toFixed(1)}
          </Typography>
        )}
        
        {/* Show both user and average rating if both exist and showAverage is true */}
        {showAverage && hasUserRating && averageRating && averageRating !== userRating && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: config.fontSize }}
          >
            (avg: {averageRating.toFixed(1)})
          </Typography>
        )}
        
        {/* Rating count */}
        {showCount && ratingCount > 0 && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: config.fontSize }}
          >
            ({ratingCount})
          </Typography>
        )}
        
        {/* Rejection indicator */}
        {hasRejectedReview && (
          <ErrorOutline 
            sx={{ 
              fontSize: config.starSize, 
              color: 'error.main',
              cursor: onClick ? 'pointer' : 'default'
            }} 
            aria-label="Review rejected"
          />
        )}
      </Box>
    </Box>
  )
  
  if (tooltipText && onClick) {
    return (
      <Tooltip title={tooltipText} arrow>
        {displayComponent}
      </Tooltip>
    )
  }
  
  return displayComponent
}