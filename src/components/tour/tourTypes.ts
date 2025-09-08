export interface TourStep {
  id: string
  title: string
  content: string
  targetSelector: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  allowClicksOnTarget?: boolean
  disableInteraction?: boolean
}

export interface TourState {
  completed: boolean
  lastCompletedStep?: number
  timestamp: string
}

export interface TourContextType {
  isActive: boolean
  currentStepIndex: number
  steps: TourStep[]
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  endTour: () => void
  canGoNext: boolean
  canGoPrev: boolean
}

export interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

export const TOUR_STORAGE_KEY = 'librarycard-tour-state'