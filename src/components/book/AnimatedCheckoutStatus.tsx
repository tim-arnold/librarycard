import React, { useEffect, useState } from 'react'
import { Box, Typography, Fade, Collapse, Chip } from '@mui/material'
import { MenuBook } from '@mui/icons-material'
import { Book } from '@/lib/types'

interface AnimatedCheckoutStatusProps {
  book: Book
  currentUserId?: string | null
  sx?: any
  variant?: 'compact' | 'standard' | 'chip'
}

export default function AnimatedCheckoutStatus({ 
  book, 
  currentUserId, 
  sx = {},
  variant = 'standard'
}: AnimatedCheckoutStatusProps) {
  const [isVisible, setIsVisible] = useState(book.status === 'checked_out')
  const [showContent, setShowContent] = useState(book.status === 'checked_out')

  useEffect(() => {
    if (book.status !== 'checked_out' && isVisible) {
      // Wait for modal backdrop to clear before starting fade out animation
      const delayTimeout = setTimeout(() => {
        setIsVisible(false)
        // Hide content after animation completes
        const animationTimeout = setTimeout(() => {
          setShowContent(false)
        }, 300) // Match transition duration
        return () => clearTimeout(animationTimeout)
      }, 750) // Wait 0.75 seconds for modal to clear
      return () => clearTimeout(delayTimeout)
    } else if (book.status === 'checked_out' && !isVisible) {
      // Wait for modal backdrop to clear before showing and fading in
      const delayTimeout = setTimeout(() => {
        setShowContent(true)
        setIsVisible(true)
      }, 750) // Wait 0.75 seconds for modal to clear
      return () => clearTimeout(delayTimeout)
    }
  }, [book.status, isVisible])

  if (!showContent) {
    return null
  }

  const getCheckoutMessage = () => {
    if (!book.checked_out_date) return 'Checked out'
    
    const checkoutDate = new Date(book.checked_out_date)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - checkoutDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (book.checked_out_by === currentUserId) {
      return `You checked this book out ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return `Checked out since ${checkoutDate.toLocaleDateString()} (${diffDays} day${diffDays !== 1 ? 's' : ''})`
    }
  }

  const isCompact = variant === 'compact'
  const isChip = variant === 'chip'

  if (isChip) {
    return (
      <Fade in={isVisible} timeout={300}>
        <Chip 
          label={book.checked_out_by === currentUserId ? 'Checked out by you' : 'Checked out'}
          size="small"
          color="warning"
          sx={{ 
            fontSize: '0.7rem', 
            height: 20,
            transform: isVisible ? 'scale(1)' : 'scale(0.8)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.3s ease-in-out',
            ...sx
          }}
        />
      </Fade>
    )
  }

  return (
    <Collapse in={isVisible} timeout={300}>
      <Fade in={isVisible} timeout={300}>
        <Box sx={{ 
          mt: isCompact ? 1.5 : 2, 
          p: isCompact ? { xs: 1, sm: 1.5 } : 1, 
          borderRadius: 1,
          border: 1,
          borderColor: 'warning.main',
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.3s ease-in-out',
          ...sx
        }}>
          <Typography 
            variant="body2" 
            color="text.primary"
            sx={{ 
              fontWeight: 500, 
              fontSize: isCompact ? { xs: '0.8rem', sm: '0.875rem' } : 'inherit'
            }}
          >
            <MenuBook sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'inherit' }} />
            {getCheckoutMessage()}
          </Typography>
        </Box>
      </Fade>
    </Collapse>
  )
}