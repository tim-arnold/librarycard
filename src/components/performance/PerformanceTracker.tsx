'use client'

import { useEffect } from 'react'
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking'

interface PerformanceTrackerProps {
  enabled?: boolean
  reportToConsole?: boolean
  reportToAnalytics?: boolean
}

const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({
  enabled = true,
  reportToConsole = process.env.NODE_ENV === 'development',
  reportToAnalytics = process.env.NODE_ENV === 'production'
}) => {
  const { isTracking, performanceData } = usePerformanceTracking({
    enabled,
    reportToConsole,
    reportToAnalytics
  })

  // Add performance marks for key application events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return

    // Mark when the app starts tracking performance
    window.performance.mark('librarycard-performance-start')

    return () => {
      // Mark when tracking ends (cleanup)
      window.performance.mark('librarycard-performance-end')
    }
  }, [])

  // Performance tracking active in development
  useEffect(() => {
    // Performance tracking running in background
  }, [isTracking, performanceData])

  // Component doesn't render anything - it's just for side effects
  return null
}

export default PerformanceTracker