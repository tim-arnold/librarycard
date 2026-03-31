'use client'

import { useEffect, useState } from 'react'
import { Box, Chip, Typography, Paper } from '@mui/material'
import { Speed, Memory, NetworkCheck } from '@mui/icons-material'
import { featureFlags, performanceLog } from '@/lib/featureFlags'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage?: number
  loadTime: number
  queryCount: number
  cacheHitRate: number
}

interface PerformanceMonitorProps {
  componentName: string
  children: React.ReactNode
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
}

export default function PerformanceMonitor({ 
  componentName, 
  children, 
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    loadTime: 0,
    queryCount: 0,
    cacheHitRate: 0,
  })
  
  const [startTime] = useState(() => performance.now())
  
  useEffect(() => {
    // Track component mount time
    const mountTime = performance.now() - startTime
    performanceLog(`${componentName} mount`, mountTime)
    
    // Update metrics
    const newMetrics = {
      ...metrics,
      renderTime: mountTime,
      loadTime: mountTime,
    }
    
    setMetrics(newMetrics)
    onMetricsUpdate?.(newMetrics)
    
    // Memory usage (if available)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024, // MB
      }))
    }
  }, [componentName, startTime, onMetricsUpdate])
  
  // Don't render in production unless explicitly enabled
  if (!featureFlags.showPerformanceMetrics) {
    return <>{children}</>
  }
  
  return (
    <>
      {children}
      
      {/* Performance overlay */}
      <Paper
        sx={{
          position: 'fixed',
          top: 80,
          right: 16,
          p: 2,
          zIndex: 9999,
          opacity: 0.9,
          maxWidth: 300,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontSize: '0.9rem' }}>
          ⚡ {componentName} Performance
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<Speed />}
            label={`${metrics.renderTime.toFixed(1)}ms`}
            size="small"
            color={metrics.renderTime < 100 ? 'success' : metrics.renderTime < 500 ? 'warning' : 'error'}
            variant="outlined"
            sx={{ color: 'inherit' }}
          />
          
          {metrics.memoryUsage && (
            <Chip
              icon={<Memory />}
              label={`${metrics.memoryUsage.toFixed(1)}MB`}
              size="small"
              color={metrics.memoryUsage < 50 ? 'success' : metrics.memoryUsage < 100 ? 'warning' : 'error'}
              variant="outlined"
              sx={{ color: 'inherit' }}
            />
          )}
          
          <Chip
            icon={<NetworkCheck />}
            label={`${metrics.cacheHitRate}% cache`}
            size="small"
            color={metrics.cacheHitRate > 80 ? 'success' : metrics.cacheHitRate > 50 ? 'warning' : 'error'}
            variant="outlined"
            sx={{ color: 'inherit' }}
          />
        </Box>
        
        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
          Queries: {metrics.queryCount} | Features: ReactQuery={featureFlags.useReactQuery ? '✅' : '❌'}
        </Typography>
      </Paper>
    </>
  )
}

// Hook for tracking performance in functional components
export function usePerformanceTracking(name: string) {
  const [startTime] = useState(() => performance.now())
  const [metrics, setMetrics] = useState({ renderCount: 0 })
  
  useEffect(() => {
    const renderTime = performance.now() - startTime
    setMetrics(prev => ({ renderCount: prev.renderCount + 1 }))
    
    if (featureFlags.showPerformanceMetrics) {
      performanceLog(`${name} render #${metrics.renderCount + 1}`, renderTime)
    }
  })
  
  return {
    renderCount: metrics.renderCount,
    trackOperation: (operationName: string, fn: () => any) => {
      if (!featureFlags.showPerformanceMetrics) return fn()
      
      const opStart = performance.now()
      const result = fn()
      const opEnd = performance.now()
      
      performanceLog(`${name}.${operationName}`, opEnd - opStart)
      return result
    }
  }
}