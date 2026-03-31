'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTour } from './TourProvider'
import TourTooltip from './TourTooltip'
import { ElementPosition } from './tourTypes'

interface ExtendedElementPosition extends ElementPosition {
  firstBookHeight?: number
}

export default function TourOverlay() {
  const { isActive, currentStepIndex, steps, skipTour } = useTour()
  const [targetPosition, setTargetPosition] = useState<ExtendedElementPosition | null>(null)
  const [portalContainer] = useState<Element | null>(() =>
    typeof window !== 'undefined' ? document.body : null
  )

  // Calculate target element position
  const updateTargetPosition = useCallback(() => {
    if (!isActive || currentStepIndex >= steps.length) return

    const currentStep = steps[currentStepIndex]
    // Try multiple selectors (comma-separated) until we find one
    const selectors = currentStep.targetSelector.split(',').map(s => s.trim())
    let targetElement = null
    for (const selector of selectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) break
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      // For book-grid, get the first book's height for proper highlighting
      let firstBookHeight = 300 // fallback
      if (currentStep.id === 'book-grid') {
        const firstBook = targetElement.querySelector('[data-tour="book-item"]')
        if (firstBook) {
          const bookRect = firstBook.getBoundingClientRect()
          firstBookHeight = bookRect.height
        }
      }

      setTargetPosition({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
        firstBookHeight // Store the first book's actual height
      })

      // Scroll element into view if needed (but not for welcome step, book-grid, or book-interaction)
      if (currentStep && currentStep.id !== 'welcome' && currentStep.id !== 'book-grid' && currentStep.id !== 'book-interaction') {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        })
      } else if (currentStep && currentStep.id === 'book-grid') {
        // For book-grid step, don't scroll at all - use current position
      } else if (currentStep && currentStep.id === 'book-interaction') {
        // For book-interaction step, don't scroll - step 4 will have positioned things perfectly
        // This avoids additional scrolling that would misalign the highlight
      } else {
        // For welcome step, scroll to top of page
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    } else {
      console.warn(`Tour target element not found: ${currentStep.targetSelector}`)
      setTargetPosition(null)
    }
  }, [isActive, currentStepIndex, steps])

  // Update position when step changes
  useEffect(() => {
    updateTargetPosition()
  }, [updateTargetPosition])

  // Update position on window resize and scroll
  useEffect(() => {
    if (!isActive) return

    const handleResize = () => updateTargetPosition()
    const handleScroll = () => updateTargetPosition()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isActive, updateTargetPosition])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        skipTour()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isActive, skipTour])

  if (!isActive || !portalContainer) {
    return null
  }

  const currentStep = steps[currentStepIndex]
  if (!currentStep) {
    return null
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {/* Overlay with spotlight effect */}
      <div
        onClick={skipTour}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: Math.max(document.documentElement.scrollHeight, window.innerHeight),
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          cursor: 'pointer',
          ...(targetPosition && {
            clipPath: currentStep.id === 'book-grid' 
              ? (() => {
                  const rightEdge = window.innerWidth - 40;
                  const topEdge = targetPosition.top; // Use recalculated position
                  const bottomEdge = topEdge + Math.max((targetPosition.firstBookHeight || 280) + 80, 380);
                  return `polygon(
                    0% 0%, 
                    0% 100%, 
                    40px 100%, 
                    40px ${topEdge}px, 
                    ${rightEdge}px ${topEdge}px, 
                    ${rightEdge}px ${bottomEdge}px, 
                    40px ${bottomEdge}px, 
                    40px 100%, 
                    100% 100%, 
                    100% 0%
                  )`;
                })() 
              : `polygon(
                  0% 0%, 
                  0% 100%, 
                  ${targetPosition.left}px 100%, 
                  ${targetPosition.left}px ${targetPosition.top}px, 
                  ${targetPosition.left + targetPosition.width}px ${targetPosition.top}px, 
                  ${targetPosition.left + targetPosition.width}px ${targetPosition.top + targetPosition.height}px, 
                  ${targetPosition.left}px ${targetPosition.top + targetPosition.height}px, 
                  ${targetPosition.left}px 100%, 
                  100% 100%, 
                  100% 0%
                )`
          })
        }}
      />

      {/* Highlighted area (prevents clicks if interaction disabled) */}
      {targetPosition && (
        <div
          style={{
            position: 'absolute',
            top: currentStep.id === 'book-grid' 
              ? targetPosition.top  // Use recalculated position after scroll
              : targetPosition.top - 4,
            left: currentStep.id === 'book-grid'
              ? 40  // Fixed left position for book grid area
              : targetPosition.left - 4,
            width: currentStep.id === 'book-grid'
              ? window.innerWidth - 80  // Full width minus padding
              : targetPosition.width + 8,
            height: currentStep.id === 'book-grid' 
              ? Math.max((targetPosition.firstBookHeight || 280) + 80, 380)  // Increased height for better row coverage
              : Math.min(targetPosition.height + 8, window.innerHeight * 0.8),
            border: '2px solid #1976d2',
            borderRadius: '8px',
            pointerEvents: currentStep.allowClicksOnTarget ? 'none' : 'auto',
            backgroundColor: currentStep.allowClicksOnTarget ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease-in-out',
            cursor: currentStep.allowClicksOnTarget ? 'pointer' : 'default'
          }}
        />
      )}

      {/* Tour tooltip */}
      <TourTooltip 
        step={currentStep}
        targetPosition={targetPosition}
      />
    </div>,
    portalContainer
  )
}