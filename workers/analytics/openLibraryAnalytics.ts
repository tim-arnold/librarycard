/**
 * OpenLibrary API Usage Analytics for Workers
 * Simplified version for Cloudflare Workers environment
 */

interface ApiMetric {
  timestamp: number;
  endpoint: string;
  purpose: string;
  wasOptimized: boolean;
  optimizationReason?: string;
  responseTime?: number;
  success: boolean;
  errorType?: string;
}

// Simple in-memory storage for current session
let sessionMetrics: ApiMetric[] = [];

/**
 * Track an actual API call to OpenLibrary
 */
export function trackApiCall(
  endpoint: string,
  purpose: 'cover-selection' | 'metadata-enhancement' | 'fallback',
  responseTime: number,
  success: boolean,
  errorType?: string
) {
  const metric: ApiMetric = {
    timestamp: Date.now(),
    endpoint,
    purpose,
    wasOptimized: false,
    responseTime,
    success,
    errorType
  };
  
  sessionMetrics.push(metric);
  
  // Keep only last 100 metrics to prevent memory issues
  if (sessionMetrics.length > 100) {
    sessionMetrics = sessionMetrics.slice(-100);
  }
  
  // Log key metrics in development
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log(`📊 OpenLibrary API Call: ${endpoint} (${purpose}) - ${success ? 'SUCCESS' : 'FAILED'} in ${responseTime}ms`);
  }
}

/**
 * Track an optimized skip (when we decided NOT to call OpenLibrary)
 */
export function trackOptimizedSkip(
  purpose: 'cover-selection' | 'metadata-enhancement',
  reason: string
) {
  const metric: ApiMetric = {
    timestamp: Date.now(),
    endpoint: 'skipped',
    purpose,
    wasOptimized: true,
    optimizationReason: reason,
    success: true
  };
  
  sessionMetrics.push(metric);
  
  // Keep only last 100 metrics to prevent memory issues
  if (sessionMetrics.length > 100) {
    sessionMetrics = sessionMetrics.slice(-100);
  }
  
  // Log optimization in development
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log(`💾 OpenLibrary Skip: ${purpose} - ${reason}`);
  }
}

/**
 * Get current session analytics
 */
export function getSessionAnalytics(): {
  totalOperations: number;
  actualCalls: number;
  optimizedSkips: number;
  savingsPercentage: number;
  averageResponseTime: number;
  errorRate: number;
  purposeBreakdown: Record<string, { calls: number; skips: number }>;
} {
  const actualCalls = sessionMetrics.filter(m => !m.wasOptimized);
  const optimizedSkips = sessionMetrics.filter(m => m.wasOptimized);
  
  const successfulCalls = actualCalls.filter(m => m.success);
  const avgResponseTime = successfulCalls.length > 0 
    ? successfulCalls.reduce((sum, m) => sum + (m.responseTime || 0), 0) / successfulCalls.length
    : 0;
  
  const errorRate = actualCalls.length > 0 
    ? actualCalls.filter(m => !m.success).length / actualCalls.length
    : 0;
  
  const savingsPercentage = sessionMetrics.length > 0
    ? (optimizedSkips.length / sessionMetrics.length) * 100
    : 0;

  // Purpose breakdown
  const purposeBreakdown: Record<string, { calls: number; skips: number }> = {};
  sessionMetrics.forEach(m => {
    if (!purposeBreakdown[m.purpose]) {
      purposeBreakdown[m.purpose] = { calls: 0, skips: 0 };
    }
    if (m.wasOptimized) {
      purposeBreakdown[m.purpose].skips++;
    } else {
      purposeBreakdown[m.purpose].calls++;
    }
  });

  return {
    totalOperations: sessionMetrics.length,
    actualCalls: actualCalls.length,
    optimizedSkips: optimizedSkips.length,
    savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    averageResponseTime: Math.round(avgResponseTime),
    errorRate: Math.round(errorRate * 10000) / 100,
    purposeBreakdown
  };
}

/**
 * Log current analytics to console (development helper)
 */
export function logSessionAnalytics() {
  const stats = getSessionAnalytics();
  console.group('📊 OpenLibrary Analytics Summary');
  console.log(`Total Operations: ${stats.totalOperations}`);
  console.log(`Actual API Calls: ${stats.actualCalls}`);
  console.log(`Optimized Skips: ${stats.optimizedSkips}`);
  console.log(`API Savings: ${stats.savingsPercentage}%`);
  console.log(`Average Response Time: ${stats.averageResponseTime}ms`);
  console.log(`Error Rate: ${stats.errorRate}%`);
  console.log('Purpose Breakdown:', stats.purposeBreakdown);
  console.groupEnd();
}

/**
 * Clear session metrics (useful for testing)
 */
export function clearSessionMetrics() {
  sessionMetrics = [];
}