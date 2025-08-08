'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Speed,
  TrendingUp,
  Visibility,
  TouchApp,
  Refresh
} from '@mui/icons-material'
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking'
import { getPerformanceMarks, THRESHOLDS } from '@/lib/performance'

const PerformanceDashboard: React.FC = () => {
  const { performanceData, isTracking, getPerformanceSummary, getCurrentMetrics } = usePerformanceTracking({
    enabled: true,
    reportToConsole: false,
    reportToAnalytics: false
  })

  const [summary, setSummary] = useState<any>(null)
  const [performanceMarks, setPerformanceMarks] = useState<any>(null)

  useEffect(() => {
    const updateSummary = () => {
      const currentSummary = getPerformanceSummary()
      setSummary(currentSummary)
      
      const marks = getPerformanceMarks()
      setPerformanceMarks(marks)
    }

    updateSummary()
    
    // Update every 5 seconds
    const interval = setInterval(updateSummary, 5000)
    return () => clearInterval(interval)
  }, [getPerformanceSummary])

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'success'
      case 'needs-improvement': return 'warning'
      case 'poor': return 'error'
      default: return 'default'
    }
  }

  const getRatingIcon = (metricName: string) => {
    switch (metricName) {
      case 'LCP': return <Visibility />
      case 'FID': return <TouchApp />
      case 'CLS': return <Speed />
      default: return <TrendingUp />
    }
  }

  if (!isTracking) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>Initializing performance monitoring...</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Performance Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Refresh Metrics
        </Button>
      </Box>

      {/* Overall Performance Status */}
      {summary && (
        <Alert
          severity={
            summary.overall === 'good' ? 'success' :
            summary.overall === 'needs-improvement' ? 'warning' : 
            summary.overall === 'poor' ? 'error' : 'info'
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">
            Overall Performance: {summary.overall.replace('-', ' ').toUpperCase()}
          </Typography>
          <Typography variant="body2">
            {summary.overall === 'good' && 'All Core Web Vitals are in the good range. Great job!'}
            {summary.overall === 'needs-improvement' && 'Some metrics need improvement. Consider optimizing loading times and reducing layout shifts.'}
            {summary.overall === 'poor' && 'Several metrics are below recommended thresholds. Performance optimization is recommended.'}
            {summary.overall === 'unknown' && 'Performance data is still being collected. Please wait a moment.'}
          </Typography>
        </Alert>
      )}

      {/* Core Web Vitals Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {summary?.metrics.map((metric: any) => (
          <Box key={metric.name} sx={{ flex: '1 1 300px', minWidth: 300 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getRatingIcon(metric.name)}
                    <Typography variant="h6">{metric.name}</Typography>
                  </Box>
                  <Chip 
                    label={metric.rating.replace('-', ' ')} 
                    color={getRatingColor(metric.rating) as any}
                    size="small"
                  />
                </Box>
                
                <Typography variant="h4" component="div" gutterBottom>
                  {metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}
                  {metric.name === 'CLS' ? '' : 'ms'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {metric.description}
                </Typography>

                {/* Threshold indicators */}
                <Box mt={2}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Thresholds:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip 
                      label={`Good: ≤${THRESHOLDS[metric.name as keyof typeof THRESHOLDS]?.good || 'N/A'}`}
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Needs work: ≤${THRESHOLDS[metric.name as keyof typeof THRESHOLDS]?.needsImprovement || 'N/A'}`}
                      size="small" 
                      color="warning" 
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Performance Timeline */}
      {performanceMarks?.navigation && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Navigation Timing
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Time (ms)</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>DNS Lookup</TableCell>
                    <TableCell align="right">
                      {(performanceMarks.navigation.domainLookupEnd - performanceMarks.navigation.domainLookupStart).toFixed(0)}
                    </TableCell>
                    <TableCell>Time to resolve domain name</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TCP Connection</TableCell>
                    <TableCell align="right">
                      {(performanceMarks.navigation.connectEnd - performanceMarks.navigation.connectStart).toFixed(0)}
                    </TableCell>
                    <TableCell>Time to establish TCP connection</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Request</TableCell>
                    <TableCell align="right">
                      {(performanceMarks.navigation.responseStart - performanceMarks.navigation.requestStart).toFixed(0)}
                    </TableCell>
                    <TableCell>Time to first byte</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Response</TableCell>
                    <TableCell align="right">
                      {(performanceMarks.navigation.responseEnd - performanceMarks.navigation.responseStart).toFixed(0)}
                    </TableCell>
                    <TableCell>Time to download response</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>DOM Processing</TableCell>
                    <TableCell align="right">
                      {(performanceMarks.navigation.domComplete - performanceMarks.navigation.domLoading).toFixed(0)}
                    </TableCell>
                    <TableCell>Time to process DOM</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Optimization Tips
          </Typography>
          <Box component="ul" sx={{ mt: 1 }}>
            <Typography component="li" variant="body2" gutterBottom>
              <strong>LCP (Largest Contentful Paint):</strong> Optimize images, reduce server response times, preload critical resources
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              <strong>FID (First Input Delay):</strong> Minimize main thread work, reduce JavaScript execution time, use code splitting
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              <strong>CLS (Cumulative Layout Shift):</strong> Use size attributes on images, avoid dynamically injected content above viewport
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              <strong>General:</strong> Enable compression, use CDN, minimize CSS/JS, implement caching strategies
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PerformanceDashboard