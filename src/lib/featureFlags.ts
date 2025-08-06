// Feature flags for LibraryCard
// These can be controlled via environment variables or database settings

interface FeatureFlags {
  // Performance optimizations
  useReactQuery: boolean
  useVirtualScrolling: boolean
  useCodeSplitting: boolean
  
  // UI enhancements
  useAdvancedFilters: boolean
  useInfiniteScroll: boolean
  
  // Development features
  showPerformanceMetrics: boolean
  enableDevtools: boolean
}

// Default feature flag values
const defaultFlags: FeatureFlags = {
  useReactQuery: false, // Start disabled, enable once tested
  useVirtualScrolling: false,
  useCodeSplitting: false,
  useAdvancedFilters: true,
  useInfiniteScroll: false,
  showPerformanceMetrics: process.env.NODE_ENV === 'development',
  enableDevtools: process.env.NODE_ENV === 'development',
}

// Environment-based overrides
const envFlags: Partial<FeatureFlags> = {
  // Enable React Query in development for testing
  useReactQuery: process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY === 'true',
  
  // Enable virtual scrolling for large libraries
  useVirtualScrolling: process.env.NEXT_PUBLIC_ENABLE_VIRTUAL_SCROLL === 'true',
  
  // Code splitting can be enabled in production
  useCodeSplitting: process.env.NEXT_PUBLIC_ENABLE_CODE_SPLITTING === 'true',
  
  // Performance metrics
  showPerformanceMetrics: process.env.NEXT_PUBLIC_SHOW_PERFORMANCE === 'true',
}

// Merge default and environment flags
export const featureFlags: FeatureFlags = {
  ...defaultFlags,
  ...envFlags,
}

// Helper functions for feature detection
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags[feature]
}

// Performance monitoring helper
export const withPerformanceTracking = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  if (!featureFlags.showPerformanceMetrics) {
    return fn
  }
  
  return ((...args: any[]) => {
    const startTime = performance.now()
    const result = fn(...args)
    
    // Handle both sync and async functions
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now()
        console.log(`⚡ ${name}: ${(endTime - startTime).toFixed(2)}ms`)
      })
    } else {
      const endTime = performance.now()
      console.log(`⚡ ${name}: ${(endTime - startTime).toFixed(2)}ms`)
      return result
    }
  }) as T
}

// Development helpers
export const devLog = (...args: any[]) => {
  if (featureFlags.enableDevtools) {
    console.log('🔧 [Dev]', ...args)
  }
}

export const performanceLog = (name: string, duration: number) => {
  if (featureFlags.showPerformanceMetrics) {
    const color = duration < 50 ? 'green' : duration < 200 ? 'orange' : 'red'
    console.log(`%c⚡ ${name}: ${duration.toFixed(2)}ms`, `color: ${color}`)
  }
}