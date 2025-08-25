/**
 * OpenLibrary API Usage Analytics
 * Tracks API calls, optimization effectiveness, and usage patterns
 */

interface ApiCallMetrics {
  timestamp: number;
  endpoint: string;
  purpose: string; // 'cover-selection', 'metadata-enhancement', 'fallback'
  wasOptimized: boolean; // true if call was skipped due to optimization
  optimizationReason?: string; // reason for skipping
  responseTime?: number;
  success: boolean;
  errorType?: string;
}

interface DailyStats {
  date: string;
  totalCalls: number;
  optimizedSkips: number;
  coverSelectionCalls: number;
  metadataEnhancementCalls: number;
  fallbackCalls: number;
  averageResponseTime: number;
  errorRate: number;
  savingsPercentage: number;
}

class OpenLibraryAnalytics {
  private metrics: ApiCallMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 calls in memory
  
  /**
   * Track an actual API call to OpenLibrary
   */
  trackApiCall(
    endpoint: string,
    purpose: string,
    responseTime: number,
    success: boolean,
    errorType?: string
  ) {
    this.addMetric({
      timestamp: Date.now(),
      endpoint,
      purpose,
      wasOptimized: false,
      responseTime,
      success,
      errorType
    });
  }

  /**
   * Track an optimized skip (when we decided NOT to call OpenLibrary)
   */
  trackOptimizedSkip(purpose: string, reason: string) {
    this.addMetric({
      timestamp: Date.now(),
      endpoint: 'skipped',
      purpose,
      wasOptimized: true,
      optimizationReason: reason,
      success: true
    });
  }

  /**
   * Get analytics for the current session
   */
  getSessionStats(): {
    totalOperations: number;
    actualCalls: number;
    optimizedSkips: number;
    savingsPercentage: number;
    averageResponseTime: number;
    errorRate: number;
    purposeBreakdown: Record<string, { calls: number; skips: number }>;
  } {
    const sessionStart = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    const recentMetrics = this.metrics.filter(m => m.timestamp > sessionStart);
    
    const actualCalls = recentMetrics.filter(m => !m.wasOptimized);
    const optimizedSkips = recentMetrics.filter(m => m.wasOptimized);
    
    const successfulCalls = actualCalls.filter(m => m.success);
    const avgResponseTime = successfulCalls.length > 0 
      ? successfulCalls.reduce((sum, m) => sum + (m.responseTime || 0), 0) / successfulCalls.length
      : 0;
    
    const errorRate = actualCalls.length > 0 
      ? actualCalls.filter(m => !m.success).length / actualCalls.length
      : 0;
    
    const savingsPercentage = recentMetrics.length > 0
      ? (optimizedSkips.length / recentMetrics.length) * 100
      : 0;

    // Purpose breakdown
    const purposeBreakdown: Record<string, { calls: number; skips: number }> = {};
    recentMetrics.forEach(m => {
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
      totalOperations: recentMetrics.length,
      actualCalls: actualCalls.length,
      optimizedSkips: optimizedSkips.length,
      savingsPercentage: Math.round(savingsPercentage * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
      purposeBreakdown
    };
  }

  /**
   * Get optimization effectiveness report
   */
  getOptimizationReport(): {
    recommendation: string;
    metrics: {
      coverSelectionOptimization: number;
      metadataOptimization: number;
      overallSavings: number;
    };
    insights: string[];
  } {
    const stats = this.getSessionStats();
    const insights: string[] = [];
    
    // Analyze cover selection optimization
    const coverStats = stats.purposeBreakdown['cover-selection'] || { calls: 0, skips: 0 };
    const coverOptimization = coverStats.calls + coverStats.skips > 0
      ? (coverStats.skips / (coverStats.calls + coverStats.skips)) * 100
      : 0;
    
    // Analyze metadata enhancement optimization  
    const metadataStats = stats.purposeBreakdown['metadata-enhancement'] || { calls: 0, skips: 0 };
    const metadataOptimization = metadataStats.calls + metadataStats.skips > 0
      ? (metadataStats.skips / (metadataStats.calls + metadataStats.skips)) * 100
      : 0;

    // Generate insights
    if (stats.savingsPercentage > 70) {
      insights.push('Excellent optimization: >70% of potential API calls avoided');
    } else if (stats.savingsPercentage > 50) {
      insights.push('Good optimization: >50% of potential API calls avoided');
    } else if (stats.savingsPercentage > 25) {
      insights.push('Moderate optimization: >25% of potential API calls avoided');
    } else {
      insights.push('Low optimization: <25% of potential API calls avoided');
    }

    if (stats.errorRate > 5) {
      insights.push(`High error rate detected: ${stats.errorRate}% - consider fallback improvements`);
    }

    if (stats.averageResponseTime > 2000) {
      insights.push(`Slow response times: ${stats.averageResponseTime}ms average - consider timeout optimization`);
    }

    let recommendation = 'Current optimization is working well';
    if (stats.savingsPercentage < 30) {
      recommendation = 'Consider implementing more aggressive optimization strategies';
    } else if (stats.errorRate > 10) {
      recommendation = 'Focus on improving error handling and fallback mechanisms';
    }

    return {
      recommendation,
      metrics: {
        coverSelectionOptimization: Math.round(coverOptimization * 100) / 100,
        metadataOptimization: Math.round(metadataOptimization * 100) / 100,
        overallSavings: stats.savingsPercentage
      },
      insights
    };
  }

  /**
   * Export analytics data for external analysis
   */
  exportMetrics(): ApiCallMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear old metrics to prevent memory buildup
   */
  private addMetric(metric: ApiCallMetrics) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Development helper: Log current stats to console
   */
  logStats() {
    if (process.env.NODE_ENV === 'development') {
      const stats = this.getSessionStats();
      const report = this.getOptimizationReport();
      
      console.group('📊 OpenLibrary API Analytics');
      console.log('Session Stats:', stats);
      console.log('Optimization Report:', report);
      console.groupEnd();
    }
  }
}

// Singleton instance
export const openLibraryAnalytics = new OpenLibraryAnalytics();

// Helper functions for easy integration
export const trackOpenLibraryCall = (
  endpoint: string,
  purpose: 'cover-selection' | 'metadata-enhancement' | 'fallback',
  responseTime: number,
  success: boolean,
  errorType?: string
) => {
  openLibraryAnalytics.trackApiCall(endpoint, purpose, responseTime, success, errorType);
};

export const trackOptimizedSkip = (
  purpose: 'cover-selection' | 'metadata-enhancement',
  reason: string
) => {
  openLibraryAnalytics.trackOptimizedSkip(purpose, reason);
};

export const getOptimizationStats = () => {
  return openLibraryAnalytics.getSessionStats();
};

export const getOptimizationReport = () => {
  return openLibraryAnalytics.getOptimizationReport();
};