import { Env } from '../types';

/**
 * Cloudflare KV Cache Manager with automatic fallback
 */
export class CacheManager {
  private kv: KVNamespace | null;

  constructor(env: Env) {
    this.kv = env.CACHE || null;
  }

  /**
   * Get value from cache with automatic fallback
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.kv) {
      return null;
    }

    try {
      const value = await this.kv.get(key, 'json');
      return value as T;
    } catch (error) {
      console.warn(`Cache GET failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.kv) {
      return false;
    }

    try {
      const options: KVNamespacePutOptions = {
        metadata: { 
          createdAt: Date.now(),
          ttl: ttlSeconds 
        }
      };

      if (ttlSeconds) {
        options.expirationTtl = ttlSeconds;
      }

      await this.kv.put(key, JSON.stringify(value), options);
      return true;
    } catch (error) {
      console.warn(`Cache SET failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.kv) {
      return false;
    }

    try {
      await this.kv.delete(key);
      return true;
    } catch (error) {
      console.warn(`Cache DEL failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching prefix
   * Note: KV doesn't support pattern matching, so we'll list and delete
   */
  async delPrefix(prefix: string): Promise<boolean> {
    if (!this.kv) {
      return false;
    }

    try {
      // List keys with prefix
      const keys = await this.kv.list({ prefix });
      
      // Delete all matching keys
      const deletePromises = keys.keys.map(key => this.kv!.delete(key.name));
      await Promise.all(deletePromises);
      
      return true;
    } catch (error) {
      console.warn(`Cache DEL prefix failed for prefix ${prefix}:`, error);
      return false;
    }
  }

  /**
   * Get multiple values by keys
   */
  async getMulti<T>(keys: string[]): Promise<Record<string, T | null>> {
    if (!this.kv) {
      return {};
    }

    try {
      const promises = keys.map(async key => {
        const value = await this.get<T>(key);
        return { key, value };
      });

      const results = await Promise.all(promises);
      return results.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, T | null>);
    } catch (error) {
      console.warn(`Cache GETMULTI failed:`, error);
      return {};
    }
  }

  /**
   * Check if caching is available
   */
  isAvailable(): boolean {
    return this.kv !== null;
  }

  /**
   * Get cache statistics (if available)
   */
  async getStats(): Promise<{ available: boolean; namespace?: string }> {
    return {
      available: this.isAvailable(),
      namespace: this.kv ? 'CACHE' : undefined
    };
  }
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // User session and permissions
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userRole: (userId: string) => `user:${userId}:role`,
  userIsAdmin: (userId: string) => `user:${userId}:isAdmin`,
  userIsSuperAdmin: (userId: string) => `user:${userId}:isSuperAdmin`,
  
  // Genre metadata
  activeGenres: () => 'genres:active',
  userGenres: (userId: string) => `genres:user:${userId}`,
  allGenres: () => 'genres:all',
  
  // Book library data
  userBooks: (userId: string) => `library:${userId}:books`,
  userBooksCount: (userId: string) => `library:${userId}:count`,
  userBooksByLocation: (userId: string, locationId: number) => `library:${userId}:location:${locationId}:books`,
  
  // Location hierarchy
  userLocations: (userId: string) => `locations:${userId}:hierarchy`,
  locationMembers: (locationId: number) => `location:${locationId}:members`,
  userLocationAccess: (userId: string) => `user:${userId}:locations`,
  
  // Admin analytics
  adminAnalytics: (adminId: string) => `analytics:${adminId}:dashboard`,
  adminUsers: (adminId: string) => `analytics:${adminId}:users`,
  adminStats: (adminId: string) => `analytics:${adminId}:stats`,
  
  // External API responses
  googleBooksISBN: (isbn: string) => `google:books:isbn:${isbn}`,
  googleBooksSearch: (query: string) => `google:books:search:${btoa(query).substring(0, 32)}`, // Base64 encode and truncate for safe key
  
  // Book ratings and metadata
  bookRatings: (bookId: string) => `book:${bookId}:ratings`,
  bookMetadata: (bookId: string) => `book:${bookId}:metadata`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  USER_PERMISSIONS: 30 * 60,     // 30 minutes
  USER_ROLE: 30 * 60,           // 30 minutes
  USER_IS_ADMIN: 30 * 60,       // 30 minutes
  ACTIVE_GENRES: 60 * 60,       // 1 hour
  USER_BOOKS: 10 * 60,          // 10 minutes
  USER_LOCATIONS: 30 * 60,      // 30 minutes
  ADMIN_ANALYTICS: 60 * 60,     // 1 hour
  GOOGLE_BOOKS: 24 * 60 * 60,   // 24 hours
  BOOK_RATINGS: 30 * 60,        // 30 minutes
  BOOK_METADATA: 2 * 60 * 60,   // 2 hours
} as const;

/**
 * Cache invalidation helpers
 */
export class CacheInvalidator {
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  /**
   * Invalidate all user-related cache entries
   */
  async invalidateUser(userId: string): Promise<void> {
    const userKeys = [
      CacheKeys.userPermissions(userId),
      CacheKeys.userRole(userId),
      CacheKeys.userIsAdmin(userId),
      CacheKeys.userIsSuperAdmin(userId),
      CacheKeys.userBooks(userId),
      CacheKeys.userBooksCount(userId),
      CacheKeys.userLocations(userId),
      CacheKeys.userLocationAccess(userId),
      CacheKeys.userGenres(userId),
    ];

    await Promise.all(userKeys.map(key => this.cache.del(key)));
    
    // Also clear location-specific book caches for this user
    await this.cache.delPrefix(`library:${userId}:location:`);
  }

  /**
   * Invalidate book-related cache entries
   */
  async invalidateBook(bookId: string): Promise<void> {
    const bookKeys = [
      CacheKeys.bookRatings(bookId),
      CacheKeys.bookMetadata(bookId),
    ];

    await Promise.all(bookKeys.map(key => this.cache.del(key)));
    
    // Invalidate all user book libraries (since they contain this book)
    await this.cache.delPrefix('library:');
  }

  /**
   * Invalidate genre-related cache entries
   */
  async invalidateGenres(): Promise<void> {
    const genreKeys = [
      CacheKeys.activeGenres(),
      CacheKeys.allGenres(),
    ];

    await Promise.all(genreKeys.map(key => this.cache.del(key)));
    await this.cache.delPrefix('genres:user:');
  }

  /**
   * Invalidate location-related cache entries
   */
  async invalidateLocation(locationId: number): Promise<void> {
    const locationKeys = [
      CacheKeys.locationMembers(locationId),
    ];

    await Promise.all(locationKeys.map(key => this.cache.del(key)));
    
    // Invalidate user location hierarchies and book caches for this location
    await this.cache.delPrefix('locations:');
    await this.cache.delPrefix(`library:`); // All user libraries might be affected
  }

  /**
   * Invalidate admin analytics
   */
  async invalidateAdminAnalytics(adminId?: string): Promise<void> {
    if (adminId) {
      await this.cache.del(CacheKeys.adminAnalytics(adminId));
      await this.cache.del(CacheKeys.adminUsers(adminId));
      await this.cache.del(CacheKeys.adminStats(adminId));
    } else {
      // Invalidate all admin analytics
      await this.cache.delPrefix('analytics:');
    }
  }
}