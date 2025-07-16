import { Env } from '../types';
import { CacheManager, CacheKeys, CacheTTL } from '../cache/kv';
import { getAdminAnalytics, getAdminUsers } from '../admin-extended';

/**
 * Cached admin functions with automatic fallback to database
 * Phase 3 KV caching implementation
 */

/**
 * Get admin analytics dashboard data with caching
 */
export async function getCachedAdminAnalytics(userId: string, env: Env, corsHeaders: Record<string, string>) {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.adminAnalytics(userId);
  
  // Try to get from cache first
  const cachedAnalytics = await cache.get<any>(cacheKey);
  if (cachedAnalytics) {
    return new Response(JSON.stringify(cachedAnalytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Fallback to database
  const response = await getAdminAnalytics(userId, env, corsHeaders);
  
  // Cache the result if successful
  if (response.ok) {
    const analytics = await response.json();
    await cache.set(cacheKey, analytics, CacheTTL.ADMIN_ANALYTICS);
    
    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return response;
}

/**
 * Get admin users data with caching
 */
export async function getCachedAdminUsers(userId: string, env: Env, corsHeaders: Record<string, string>) {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.adminUsers(userId);
  
  // Try to get from cache first
  const cachedUsers = await cache.get<any>(cacheKey);
  if (cachedUsers) {
    return new Response(JSON.stringify(cachedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Fallback to database
  const response = await getAdminUsers(userId, env, corsHeaders);
  
  // Cache the result if successful
  if (response.ok) {
    const users = await response.json();
    await cache.set(cacheKey, users, CacheTTL.ADMIN_ANALYTICS);
    
    return new Response(JSON.stringify(users), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return response;
}

/**
 * Get cached admin dashboard stats (lightweight version)
 */
export async function getCachedAdminStats(userId: string, env: Env): Promise<any | null> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.adminStats(userId);
  
  // Try to get from cache first
  const cachedStats = await cache.get<any>(cacheKey);
  if (cachedStats) {
    return cachedStats;
  }
  
  // This would be a lightweight version of analytics for quick stats
  // For now, return null to indicate no cached stats available
  return null;
}

/**
 * Invalidate admin analytics cache when data changes
 */
export async function invalidateAdminAnalytics(userId: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear admin-specific cache
  await cache.del(CacheKeys.adminAnalytics(userId));
  await cache.del(CacheKeys.adminUsers(userId));
  await cache.del(CacheKeys.adminStats(userId));
}

/**
 * Invalidate all admin analytics caches (for system-wide changes)
 */
export async function invalidateAllAdminAnalytics(env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear all admin analytics caches
  await cache.delPrefix('analytics:');
}

/**
 * Proactive cache warming for admin dashboards
 */
export async function warmAdminCache(userId: string, env: Env): Promise<void> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  try {
    // Warm analytics cache in background
    const analyticsPromise = getCachedAdminAnalytics(userId, env, corsHeaders);
    
    // Warm users cache in background
    const usersPromise = getCachedAdminUsers(userId, env, corsHeaders);
    
    // Wait for both to complete
    await Promise.allSettled([analyticsPromise, usersPromise]);
    
    console.log(`Admin cache warmed for user ${userId}`);
  } catch (error) {
    console.error(`Error warming admin cache for user ${userId}:`, error);
  }
}

/**
 * Get cache performance metrics for admin endpoints
 */
export async function getAdminCacheMetrics(userId: string, env: Env): Promise<any> {
  const cache = new CacheManager(env);
  
  const metrics = {
    analytics: {
      cached: await cache.get(CacheKeys.adminAnalytics(userId)) !== null,
      key: CacheKeys.adminAnalytics(userId)
    },
    users: {
      cached: await cache.get(CacheKeys.adminUsers(userId)) !== null,
      key: CacheKeys.adminUsers(userId)
    },
    stats: {
      cached: await cache.get(CacheKeys.adminStats(userId)) !== null,
      key: CacheKeys.adminStats(userId)
    }
  };
  
  return metrics;
}