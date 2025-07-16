import { Env } from '../types';
import { CacheManager, CacheKeys, CacheTTL } from '../cache/kv';
import { getUserRole, isUserAdmin, isUserSuperAdmin, canManageLocation } from './index';

/**
 * Cached authentication functions with automatic fallback to database
 */

/**
 * Get user role with caching
 */
export async function getCachedUserRole(userId: string, env: Env): Promise<string> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userRole(userId);
  
  // Try to get from cache first
  const cachedRole = await cache.get<string>(cacheKey);
  if (cachedRole) {
    return cachedRole;
  }
  
  // Fallback to database
  const role = await getUserRole(userId, env);
  
  // Cache the result
  await cache.set(cacheKey, role, CacheTTL.USER_ROLE);
  
  return role;
}

/**
 * Check if user is admin with caching
 */
export async function getCachedIsUserAdmin(userId: string, env: Env): Promise<boolean> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userIsAdmin(userId);
  
  // Try to get from cache first
  const cachedResult = await cache.get<boolean>(cacheKey);
  if (cachedResult !== null) {
    return cachedResult;
  }
  
  // Fallback to database
  const isAdmin = await isUserAdmin(userId, env);
  
  // Cache the result
  await cache.set(cacheKey, isAdmin, CacheTTL.USER_IS_ADMIN);
  
  return isAdmin;
}

/**
 * Check if user is super admin with caching
 */
export async function getCachedIsUserSuperAdmin(userId: string, env: Env): Promise<boolean> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userIsSuperAdmin(userId);
  
  // Try to get from cache first
  const cachedResult = await cache.get<boolean>(cacheKey);
  if (cachedResult !== null) {
    return cachedResult;
  }
  
  // Fallback to database
  const isSuperAdmin = await isUserSuperAdmin(userId, env);
  
  // Cache the result
  await cache.set(cacheKey, isSuperAdmin, CacheTTL.USER_IS_ADMIN);
  
  return isSuperAdmin;
}

/**
 * Get user permissions summary with caching
 */
export async function getCachedUserPermissions(userId: string, env: Env): Promise<{
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  locationIds: number[];
}> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userPermissions(userId);
  
  // Try to get from cache first
  const cachedPermissions = await cache.get<{
    role: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    locationIds: number[];
  }>(cacheKey);
  
  if (cachedPermissions) {
    return cachedPermissions;
  }
  
  // Fallback to database - get all permission data in one go
  const role = await getCachedUserRole(userId, env);
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  
  // Get user's accessible location IDs
  let locationIds: number[] = [];
  if (isSuperAdmin) {
    // Super admins have access to all locations
    const allLocations = await env.DB.prepare(`
      SELECT id FROM locations ORDER BY id
    `).all();
    locationIds = (allLocations.results as any[]).map(loc => loc.id);
  } else {
    // Regular users and admins - get their specific location access
    const userLocations = await env.DB.prepare(`
      SELECT DISTINCT l.id 
      FROM locations l
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE l.owner_id = ? OR lm.user_id = ?
      ORDER BY l.id
    `).bind(userId, userId).all();
    locationIds = (userLocations.results as any[]).map(loc => loc.id);
  }
  
  const permissions = {
    role,
    isAdmin,
    isSuperAdmin,
    locationIds
  };
  
  // Cache the result
  await cache.set(cacheKey, permissions, CacheTTL.USER_PERMISSIONS);
  
  return permissions;
}

/**
 * Check if user can manage location with caching
 */
export async function getCachedCanManageLocation(userId: string, locationId: number, env: Env): Promise<boolean> {
  // Get cached permissions which include location access
  const permissions = await getCachedUserPermissions(userId, env);
  
  // Super admins can manage all locations
  if (permissions.isSuperAdmin) {
    return true;
  }
  
  // Admins can manage locations they have access to
  if (permissions.isAdmin && permissions.locationIds.includes(locationId)) {
    return true;
  }
  
  return false;
}

/**
 * Get user's accessible locations with caching
 */
export async function getCachedUserLocations(userId: string, env: Env): Promise<Array<{
  id: number;
  name: string;
  description?: string;
  isOwner: boolean;
}>> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userLocationAccess(userId);
  
  // Try to get from cache first
  const cachedLocations = await cache.get<Array<{
    id: number;
    name: string;
    description?: string;
    isOwner: boolean;
  }>>(cacheKey);
  
  if (cachedLocations) {
    return cachedLocations;
  }
  
  // Get permissions to check if super admin
  const permissions = await getCachedUserPermissions(userId, env);
  
  let locations: Array<{
    id: number;
    name: string;
    description?: string;
    isOwner: boolean;
  }> = [];
  
  if (permissions.isSuperAdmin) {
    // Super admins can access all locations
    const allLocations = await env.DB.prepare(`
      SELECT id, name, description, 
             CASE WHEN owner_id = ? THEN 1 ELSE 0 END as isOwner
      FROM locations 
      ORDER BY name
    `).bind(userId).all();
    locations = (allLocations.results as any[]).map(loc => ({
      id: loc.id,
      name: loc.name,
      description: loc.description,
      isOwner: !!loc.isOwner
    }));
  } else {
    // Regular users - get their specific location access
    const userLocations = await env.DB.prepare(`
      SELECT DISTINCT l.id, l.name, l.description,
             CASE WHEN l.owner_id = ? THEN 1 ELSE 0 END as isOwner
      FROM locations l
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE l.owner_id = ? OR lm.user_id = ?
      ORDER BY l.name
    `).bind(userId, userId, userId).all();
    locations = (userLocations.results as any[]).map(loc => ({
      id: loc.id,
      name: loc.name,
      description: loc.description,
      isOwner: !!loc.isOwner
    }));
  }
  
  // Cache the result
  await cache.set(cacheKey, locations, CacheTTL.USER_LOCATIONS);
  
  return locations;
}

/**
 * Invalidate user cache when permissions change
 */
export async function invalidateUserCache(userId: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear all user-related cache entries
  const userKeys = [
    CacheKeys.userRole(userId),
    CacheKeys.userIsAdmin(userId),
    CacheKeys.userIsSuperAdmin(userId),
    CacheKeys.userPermissions(userId),
    CacheKeys.userLocationAccess(userId),
  ];
  
  await Promise.all(userKeys.map(key => cache.del(key)));
}

/**
 * Invalidate location-related cache when location membership changes
 */
export async function invalidateLocationCache(locationId: number, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear location-specific cache
  await cache.del(CacheKeys.locationMembers(locationId));
  
  // Clear all user permission and location caches (since membership changed)
  await cache.delPrefix('user:');
  await cache.delPrefix('locations:');
}