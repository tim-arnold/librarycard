'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { TourContextType, TourState, TOUR_STORAGE_KEY } from './tourTypes'
import { TOUR_STEPS } from './tourSteps'

const TourContext = createContext<TourContextType | null>(null)

export { TourContext }

export const useTour = () => {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

interface TourProviderProps {
  children: React.ReactNode
}

export default function TourProvider({ children }: TourProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Check if tour should auto-start for new users
  useEffect(() => {
    const checkShouldAutoStart = () => {
      if (typeof window === 'undefined') return

      try {
        const tourState = localStorage.getItem(TOUR_STORAGE_KEY)
        if (!tourState) {
          // New user - check if they should see the tour
          // Wait a brief moment for the UI to render
          setTimeout(() => {
            const mainContent = document.querySelector('[data-tour="main-content"]')
            if (mainContent) {
              startTour()
            }
          }, 1000)
        }
      } catch (error) {
        console.warn('Failed to check tour state:', error)
      }
    }

    checkShouldAutoStart()
  }, [])

  const startTour = useCallback(() => {
    setCurrentStepIndex(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      endTour()
    }
  }, [currentStepIndex])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  const skipTour = useCallback(() => {
    // Mark tour as completed (skipped)
    try {
      const tourState: TourState = {
        completed: true,
        lastCompletedStep: currentStepIndex,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(tourState))
    } catch (error) {
      console.warn('Failed to save tour state:', error)
    }
    
    setIsActive(false)
    setCurrentStepIndex(0)
  }, [currentStepIndex])

  const endTour = useCallback(() => {
    // Mark tour as completed
    try {
      const tourState: TourState = {
        completed: true,
        lastCompletedStep: TOUR_STEPS.length - 1,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(tourState))
    } catch (error) {
      console.warn('Failed to save tour state:', error)
    }

    setIsActive(false)
    setCurrentStepIndex(0)
  }, [])

  const canGoNext = currentStepIndex < TOUR_STEPS.length - 1
  const canGoPrev = currentStepIndex > 0

  const contextValue: TourContextType = {
    isActive,
    currentStepIndex,
    steps: TOUR_STEPS,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    endTour,
    canGoNext,
    canGoPrev
  }

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  )
}