'use client'

import React, { useMemo } from 'react'
import {
  Paper,
  Typography,
  Button,
  Box,
  LinearProgress,
  IconButton
} from '@mui/material'
import {
  NavigateNext,
  NavigateBefore,
  Close,
  Check
} from '@mui/icons-material'
import { useTour } from './TourProvider'
import { TourStep, ElementPosition } from './tourTypes'

interface TourTooltipProps {
  step: TourStep
  targetPosition: ElementPosition | null
}

export default function TourTooltip({ step, targetPosition }: TourTooltipProps) {
  const { 
    currentStepIndex, 
    steps, 
    nextStep, 
    prevStep, 
    skipTour, 
    endTour,
    canGoNext,
    canGoPrev 
  } = useTour()

  // Calculate tooltip position
  const tooltipPosition = useMemo(() => {
    if (!targetPosition) {
      // Center of screen fallback
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const padding = 20
    const tooltipWidth = 320
    const tooltipHeight = 200 // Approximate height

    let top = 0
    let left = 0
    let transform = ''

    switch (step.placement) {
      case 'top':
        top = targetPosition.top - tooltipHeight - padding
        left = targetPosition.left + (targetPosition.width / 2)
        transform = 'translateX(-50%)'
        break
      case 'bottom':
        top = targetPosition.top + targetPosition.height + padding
        left = targetPosition.left + (targetPosition.width / 2)
        transform = 'translateX(-50%)'
        break
      case 'left':
        top = targetPosition.top + (targetPosition.height / 2)
        left = targetPosition.left - tooltipWidth - padding
        transform = 'translateY(-50%)'
        break
      case 'right':
        top = targetPosition.top + (targetPosition.height / 2)
        left = targetPosition.left + targetPosition.width + padding
        transform = 'translateY(-50%)'
        break
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < padding) left = padding
    if (left + tooltipWidth > viewportWidth - padding) left = viewportWidth - tooltipWidth - padding
    if (top < padding) top = padding
    if (top + tooltipHeight > viewportHeight - padding) top = viewportHeight - tooltipHeight - padding

    return {
      position: 'absolute' as const,
      top: `${top}px`,
      left: `${left}px`,
      transform
    }
  }, [targetPosition, step.placement])

  const progress = ((currentStepIndex + 1) / steps.length) * 100
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <Paper
      elevation={8}
      sx={{
        ...tooltipPosition,
        width: 320,
        maxWidth: 'calc(100vw - 40px)',
        p: 3,
        pointerEvents: 'auto',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Header with close button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6" component="h3" sx={{ pr: 1 }}>
          {step.title}
        </Typography>
        <IconButton
          size="small"
          onClick={skipTour}
          sx={{ mt: -0.5, mr: -0.5 }}
          aria-label="Close tour"
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Progress indicator */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Step {currentStepIndex + 1} of {steps.length}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 4, borderRadius: 2 }}
        />
      </Box>

      {/* Content */}
      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.5 }}>
        {step.content}
      </Typography>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        {/* Left side - Previous button or skip */}
        <Box>
          {canGoPrev ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<NavigateBefore />}
              onClick={prevStep}
            >
              Previous
            </Button>
          ) : (
            <Button
              variant="text"
              size="small"
              onClick={skipTour}
              color="inherit"
            >
              Skip Tour
            </Button>
          )}
        </Box>

        {/* Right side - Next/Finish button */}
        <Box>
          {isLastStep ? (
            <Button
              variant="contained"
              size="small"
              endIcon={<Check />}
              onClick={endTour}
              color="primary"
            >
              Finish
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              endIcon={<NavigateNext />}
              onClick={nextStep}
              color="primary"
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  )
}