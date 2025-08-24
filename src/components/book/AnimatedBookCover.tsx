'use client'

import { useState, useEffect } from 'react'
import { Box, Fade, Zoom, Grow } from '@mui/material'
import { Image, MenuBook } from '@mui/icons-material'

interface AnimatedBookCoverProps {
  src?: string
  alt: string
  width: number | string
  height: number | string
  borderRadius?: number
  objectFit?: 'cover' | 'contain'
  cursor?: string
  onClick?: () => void
  bookId: string
  isAnimating?: boolean
  onAnimationComplete?: () => void
  sx?: any
}

export default function AnimatedBookCover({
  src,
  alt,
  width,
  height,
  borderRadius = 1,
  objectFit = 'cover',
  cursor = 'default',
  onClick,
  bookId,
  isAnimating = false,
  onAnimationComplete,
  sx = {}
}: AnimatedBookCoverProps) {
  const [showOldCover, setShowOldCover] = useState(true)
  const [showNewCover, setShowNewCover] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)
  const [previousSrc, setPreviousSrc] = useState(src)

  useEffect(() => {
    if (isAnimating) {
      // Start animation immediately when isAnimating becomes true
      // Don't wait for src to change - give immediate feedback
      setShowSparkles(true)
      
      // Phase 1: Start fading out old cover immediately
      setTimeout(() => {
        setShowOldCover(false)
      }, 100)
      
      // Phase 2: Wait a bit, then show new cover if available, or keep waiting
      setTimeout(() => {
        if (src !== previousSrc) {
          // New cover is ready, show it
          setShowNewCover(true)
          setPreviousSrc(src)
        } else {
          // New cover not ready yet, keep waiting and check again
          const checkForNewCover = () => {
            if (src !== previousSrc) {
              setShowNewCover(true)
              setPreviousSrc(src)
            } else {
              // Still waiting, check again in a bit
              setTimeout(checkForNewCover, 100)
            }
          }
          checkForNewCover()
        }
      }, 300)
      
      // Phase 3: Hide sparkles and complete (extend time to allow for loading)
      setTimeout(() => {
        setShowSparkles(false)
        if (onAnimationComplete) {
          onAnimationComplete()
        }
      }, 1200) // Extended from 800ms to 1200ms to allow for network delays
    } else if (!isAnimating) {
      // Reset states when not animating
      setShowOldCover(true)
      setShowNewCover(false)
      setShowSparkles(false)
      setPreviousSrc(src)
    }
  }, [src, isAnimating, previousSrc, onAnimationComplete])

  const baseStyle = {
    width,
    height,
    borderRadius,
    cursor,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transformStyle: 'preserve-3d',
    '&:hover': {
      transform: 'translateY(-4px) rotateY(-8deg) rotateX(2deg) scale(1.05)',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2), 0 6px 15px rgba(0, 0, 0, 0.1)',
      filter: 'brightness(1.1) contrast(1.05)',
    },
    '&:active': {
      transform: 'translateY(-2px) rotateY(-4deg) rotateX(1deg) scale(1.02)',
    },
    ...sx
  }

  if (!isAnimating) {
    // Normal state - just show the image
    return (
      <Box sx={baseStyle} onClick={onClick}>
        {src ? (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              component="img"
              src={src}
              alt={alt}
              sx={{
                width: '100%',
                height: '100%',
                objectFit,
                display: 'block',
                position: 'relative',
                zIndex: 1,
              }}
            />
            {/* Subtle 3D depth effect overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.05) 100%)',
                pointerEvents: 'none',
                zIndex: 2,
                opacity: 0,
                transition: 'opacity 0.3s ease',
                '.MuiBox-root:hover &': {
                  opacity: 1,
                },
              }}
            />
          </Box>
        ) : (
          <Box sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'grey.300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            <MenuBook />
          </Box>
        )}
      </Box>
    )
  }

  // Animation state
  return (
    <Box sx={baseStyle} onClick={onClick}>
      {/* Old Cover - fades out */}
      <Fade in={showOldCover} timeout={300}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {previousSrc ? (
            <Box
              component="img"
              src={previousSrc}
              alt={alt}
              sx={{
                width: '100%',
                height: '100%',
                objectFit,
                display: 'block'
              }}
            />
          ) : (
            <Box sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>
              <MenuBook />
            </Box>
          )}
        </Box>
      </Fade>

      {/* New Cover - zooms in */}
      <Zoom in={showNewCover} timeout={{ enter: 400, exit: 200 }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {src ? (
            <Box
              component="img"
              src={src}
              alt={alt}
              sx={{
                width: '100%',
                height: '100%',
                objectFit,
                display: 'block'
              }}
            />
          ) : (
            <Box sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>
              <MenuBook />
            </Box>
          )}
        </Box>
      </Zoom>

      {/* Sparkles Effect */}
      <Fade in={showSparkles} timeout={{ enter: 200, exit: 400 }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '8px',
            height: '8px',
            background: 'gold',
            borderRadius: '50%',
            animation: 'sparkle 0.8s ease-in-out infinite alternate'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: '6px',
            height: '6px',
            background: 'gold',
            borderRadius: '50%',
            animation: 'sparkle 0.8s ease-in-out infinite alternate 0.3s'
          },
          '@keyframes sparkle': {
            '0%': { opacity: 0, transform: 'scale(0)' },
            '100%': { opacity: 1, transform: 'scale(1)' }
          }
        }}>
          <Grow in={showSparkles} timeout={300}>
            <Box sx={{
              position: 'absolute',
              top: '30%',
              right: '30%',
              animation: 'float 0.8s ease-in-out infinite alternate'
            }}>
              ✨
            </Box>
          </Grow>
        </Box>
      </Fade>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-10px) rotate(10deg); }
        }
      `}</style>
    </Box>
  )
}