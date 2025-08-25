/**
 * Performance monitoring utilities for Core Web Vitals tracking
 * Implements Web Vitals API for measuring user experience metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  delta: number
  id: string
  entries: any[]
}

interface WebVitalsData {
  lcp?: number  // Largest Contentful Paint
  fid?: number  // First Input Delay
  cls?: number  // Cumulative Layout Shift
  fcp?: number  // First Contentful Paint
  ttfb?: number // Time to First Byte
  url: string
  timestamp: number
  userAgent: string
  connectionType?: string
}

// Thresholds for Core Web Vitals (as per Google recommendations)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  FID: { good: 100, needsImprovement: 300 }, // Legacy metric
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 }
}

class PerformanceTracker {
  private vitalsData: Partial<WebVitalsData> = {}
  private isTracking: boolean = false
  private reportCallback?: (data: WebVitalsData) => void

  constructor(reportCallback?: (data: WebVitalsData) => void) {
    this.reportCallback = reportCallback
    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined') return

    this.vitalsData = {
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    }

    // Import web-vitals dynamically to avoid SSR issues
    this.loadWebVitals()
  }

  private async loadWebVitals() {
    try {
      // Dynamic import to avoid bundling issues
      const { onLCP, onINP, onCLS, onFCP, onTTFB } = await import('web-vitals')
      
      this.isTracking = true

      // Track Largest Contentful Paint
      onLCP((metric: PerformanceMetric) => {
        this.vitalsData.lcp = metric.value
        this.handleMetric('LCP', metric)
      })

      // Track Interaction to Next Paint (replaces FID in modern browsers)
      onINP((metric: PerformanceMetric) => {
        this.vitalsData.fid = metric.value
        this.handleMetric('INP', metric)
      })

      // Track Cumulative Layout Shift
      onCLS((metric: PerformanceMetric) => {
        this.vitalsData.cls = metric.value
        this.handleMetric('CLS', metric)
      })

      // Track First Contentful Paint
      onFCP((metric: PerformanceMetric) => {
        this.vitalsData.fcp = metric.value
        this.handleMetric('FCP', metric)
      })

      // Track Time to First Byte
      onTTFB((metric: PerformanceMetric) => {
        this.vitalsData.ttfb = metric.value
        this.handleMetric('TTFB', metric)
      })

      console.log('✅ Core Web Vitals tracking initialized')
    } catch (error) {
      console.warn('⚠️ Failed to initialize Core Web Vitals tracking:', error)
    }
  }

  private handleMetric(name: string, metric: PerformanceMetric) {
    const rating = this.getRating(name, metric.value)
    
    console.log(`📊 ${name}: ${metric.value.toFixed(2)}${this.getUnit(name)} (${rating})`)

    // Send to analytics if all core metrics are collected
    if (this.vitalsData.lcp && this.vitalsData.fid && this.vitalsData.cls) {
      this.reportMetrics()
    }
  }

  private getRating(metricName: string, value: number): string {
    const thresholds = THRESHOLDS[metricName as keyof typeof THRESHOLDS]
    if (!thresholds) return 'unknown'

    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.needsImprovement) return 'needs-improvement'
    return 'poor'
  }

  private getUnit(metricName: string): string {
    switch (metricName) {
      case 'LCP':
      case 'FCP':
      case 'FID':
      case 'TTFB':
        return 'ms'
      case 'CLS':
        return ''
      default:
        return ''
    }
  }

  private getConnectionType(): string {
    if (typeof navigator === 'undefined') return 'unknown'
    
    // @ts-expect-error - connection is not in TypeScript types yet
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown'
    }
    
    return 'unknown'
  }

  private reportMetrics() {
    if (this.reportCallback && this.vitalsData.lcp && this.vitalsData.cls) {
      this.reportCallback(this.vitalsData as WebVitalsData)
    }

    // Store metrics in localStorage for debugging
    if (typeof window !== 'undefined') {
      const perfData = {
        ...this.vitalsData,
        timestamp: new Date().toISOString()
      }
      
      try {
        localStorage.setItem('libarycard_performance', JSON.stringify(perfData))
      } catch (error) {
        console.warn('Failed to store performance metrics:', error)
      }
    }
  }

  // Get current metrics snapshot
  getMetrics(): Partial<WebVitalsData> {
    return { ...this.vitalsData }
  }

  // Get performance summary for dashboard
  getPerformanceSummary() {
    const metrics = this.vitalsData
    const summary = {
      overall: 'unknown' as 'good' | 'needs-improvement' | 'poor' | 'unknown',
      metrics: [] as Array<{
        name: string
        value: number
        rating: string
        description: string
      }>
    }

    if (metrics.lcp !== undefined) {
      summary.metrics.push({
        name: 'LCP',
        value: metrics.lcp,
        rating: this.getRating('LCP', metrics.lcp),
        description: 'Largest Contentful Paint - Loading performance'
      })
    }

    if (metrics.fid !== undefined) {
      summary.metrics.push({
        name: 'FID',
        value: metrics.fid,
        rating: this.getRating('FID', metrics.fid),
        description: 'First Input Delay - Interactivity'
      })
    }

    if (metrics.cls !== undefined) {
      summary.metrics.push({
        name: 'CLS',
        value: metrics.cls,
        rating: this.getRating('CLS', metrics.cls),
        description: 'Cumulative Layout Shift - Visual stability'
      })
    }

    // Calculate overall rating
    const ratings = summary.metrics.map(m => m.rating)
    if (ratings.every(r => r === 'good')) {
      summary.overall = 'good'
    } else if (ratings.some(r => r === 'poor')) {
      summary.overall = 'poor'
    } else if (ratings.length > 0) {
      summary.overall = 'needs-improvement'
    }

    return summary
  }
}

// Global performance tracker instance
let performanceTracker: PerformanceTracker | null = null

// Initialize performance tracking
export const initPerformanceTracking = (reportCallback?: (data: WebVitalsData) => void) => {
  if (typeof window === 'undefined') return null

  if (!performanceTracker) {
    performanceTracker = new PerformanceTracker(reportCallback)
  }

  return performanceTracker
}

// Get current performance tracker
export const getPerformanceTracker = () => performanceTracker

// Utility to measure custom performance marks
export const measurePerformance = (name: string, startMark?: string) => {
  if (typeof window === 'undefined' || !window.performance) return

  try {
    if (startMark) {
      performance.measure(name, startMark)
    } else {
      performance.mark(name)
    }
  } catch (error) {
    console.warn(`Failed to measure performance for ${name}:`, error)
  }
}

// Get all performance marks and measures
export const getPerformanceMarks = () => {
  if (typeof window === 'undefined' || !window.performance) return []

  try {
    return {
      marks: performance.getEntriesByType('mark'),
      measures: performance.getEntriesByType('measure'),
      navigation: performance.getEntriesByType('navigation')[0]
    }
  } catch (error) {
    console.warn('Failed to get performance marks:', error)
    return []
  }
}

export type { WebVitalsData, PerformanceMetric }
export { THRESHOLDS }