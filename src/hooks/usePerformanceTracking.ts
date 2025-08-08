'use client'

import { useEffect, useState } from 'react'
import { initPerformanceTracking, getPerformanceTracker, WebVitalsData } from '@/lib/performance'

interface UsePerformanceTrackingOptions {
  enabled?: boolean
  reportToConsole?: boolean
  reportToAnalytics?: boolean
}

export const usePerformanceTracking = (options: UsePerformanceTrackingOptions = {}) => {
  const {
    enabled = true,
    reportToConsole = true,
    reportToAnalytics = false
  } = options

  const [performanceData, setPerformanceData] = useState<Partial<WebVitalsData>>({})
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const reportCallback = (data: WebVitalsData) => {
      setPerformanceData(data)

      if (reportToConsole) {
        console.group('📊 Core Web Vitals Report')
        console.log('LCP (Largest Contentful Paint):', data.lcp ? `${data.lcp.toFixed(2)}ms` : 'Not measured')
        console.log('FID (First Input Delay):', data.fid ? `${data.fid.toFixed(2)}ms` : 'Not measured')
        console.log('CLS (Cumulative Layout Shift):', data.cls ? data.cls.toFixed(4) : 'Not measured')
        console.log('FCP (First Contentful Paint):', data.fcp ? `${data.fcp.toFixed(2)}ms` : 'Not measured')
        console.log('TTFB (Time to First Byte):', data.ttfb ? `${data.ttfb.toFixed(2)}ms` : 'Not measured')
        console.log('URL:', data.url)
        console.log('Connection Type:', data.connectionType)
        console.groupEnd()
      }

      if (reportToAnalytics) {
        // Send to analytics service (could be Google Analytics, custom API, etc.)
        sendToAnalytics(data)
      }
    }

    const tracker = initPerformanceTracking(reportCallback)
    setIsTracking(!!tracker)

    return () => {
      // Cleanup if needed
    }
  }, [enabled, reportToConsole, reportToAnalytics])

  const getPerformanceSummary = () => {
    const tracker = getPerformanceTracker()
    return tracker?.getPerformanceSummary() || { overall: 'unknown', metrics: [] }
  }

  const getCurrentMetrics = () => {
    const tracker = getPerformanceTracker()
    return tracker?.getMetrics() || {}
  }

  return {
    performanceData,
    isTracking,
    getPerformanceSummary,
    getCurrentMetrics
  }
}

// Analytics integration (placeholder - can be customized for different services)
const sendToAnalytics = async (data: WebVitalsData) => {
  try {
    // Example: Send to Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'web_vitals', {
        custom_map: {
          metric_name: 'name',
          metric_value: 'value',
          metric_rating: 'rating'
        }
      })

      // Send individual metrics
      if (data.lcp) {
        // @ts-ignore
        window.gtag('event', 'LCP', {
          value: data.lcp,
          metric_value: data.lcp
        })
      }

      if (data.fid) {
        // @ts-ignore
        window.gtag('event', 'FID', {
          value: data.fid,
          metric_value: data.fid
        })
      }

      if (data.cls) {
        // @ts-ignore
        window.gtag('event', 'CLS', {
          value: data.cls,
          metric_value: data.cls
        })
      }
    }

    // Example: Send to custom analytics API
    // await fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // })

  } catch (error) {
    console.warn('Failed to send performance data to analytics:', error)
  }
}