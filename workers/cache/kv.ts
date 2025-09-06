import { Env } from '../types';

// Cloudflare Workers KV types
type KVNamespace = any;
type KVNamespacePutOptions = any;

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
      const deletePromises = keys.keys.map((key: any) => this.kv!.delete(key.name));
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
 * Cache TTL constants (in seconds) - Reduced for consistency and corruption prevention
 */
export const CacheTTL = {
  USER_PERMISSIONS: 15 * 60,     // 15 minutes (reduced from 30 for faster permission changes)
  USER_ROLE: 15 * 60,           // 15 minutes (reduced from 30)
  USER_IS_ADMIN: 15 * 60,       // 15 minutes (reduced from 30)
  ACTIVE_GENRES: 30 * 60,       // 30 minutes (reduced from 60 for faster genre changes)
  USER_BOOKS: 5 * 60,           // 5 minutes (reduced from 10 for faster book updates)
  USER_LOCATIONS: 15 * 60,      // 15 minutes (reduced from 30 for location changes)
  ADMIN_ANALYTICS: 30 * 60,     // 30 minutes (reduced from 60 for fresher analytics)
  GOOGLE_BOOKS: 24 * 60 * 60,   // 24 hours (kept same - external API)
  BOOK_RATINGS: 10 * 60,        // 10 minutes (reduced from 30 for rating updates)
  BOOK_METADATA: 30 * 60,       // 30 minutes (reduced from 2 hours for faster metadata changes)
} as const;

/**
 * Cache invalidation helpers with surgical precision and corruption prevention
 */
export class CacheInvalidator {
  private cache: CacheManager;
  private pendingInvalidations: Set<string> = new Set();

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  /**
   * Prevent duplicate invalidations during concurrent operations
   */
  private async executeOnce<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.pendingInvalidations.has(key)) {
      // Wait briefly and try again to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 10));
      if (this.pendingInvalidations.has(key)) {
        return Promise.resolve() as T; // Skip duplicate invalidation
      }
    }

    this.pendingInvalidations.add(key);
    try {
      return await operation();
    } finally {
      this.pendingInvalidations.delete(key);
    }
  }

  /**
   * Surgically invalidate user-related cache entries without cascade corruption
   */
  async invalidateUser(userId: string): Promise<void> {
    return this.executeOnce(`user:${userId}`, async () => {
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

      // Delete specific keys instead of broad prefix sweep
      await Promise.all(userKeys.map(key => this.cache.del(key)));
      
      // Only clear location-specific book caches for THIS user
      await this.cache.delPrefix(`library:${userId}:location:`);
    });
  }

  /**
   * Surgically invalidate book-related cache entries without nuking all libraries
   */
  async invalidateBook(bookId: string, affectedUserIds?: string[]): Promise<void> {
    return this.executeOnce(`book:${bookId}`, async () => {
      const bookKeys = [
        CacheKeys.bookRatings(bookId),
        CacheKeys.bookMetadata(bookId),
      ];

      await Promise.all(bookKeys.map(key => this.cache.del(key)));
      
      if (affectedUserIds && affectedUserIds.length > 0) {
        // Only invalidate libraries for specific affected users
        const libraryKeys = affectedUserIds.flatMap(userId => [
          CacheKeys.userBooks(userId),
          CacheKeys.userBooksCount(userId)
        ]);
        await Promise.all(libraryKeys.map(key => this.cache.del(key)));
        
        // Clear location-specific caches for affected users
        await Promise.all(
          affectedUserIds.map(userId => 
            this.cache.delPrefix(`library:${userId}:location:`)
          )
        );
      } else {
        // Fallback to broad invalidation only when user list unknown
        console.warn(`Book ${bookId} invalidation: No user list provided, using broad sweep`);
        await this.cache.delPrefix('library:');
      }
    });
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
   * Surgically invalidate location-related cache without cascade corruption
   */
  async invalidateLocation(locationId: number, affectedUserIds?: string[]): Promise<void> {
    return this.executeOnce(`location:${locationId}`, async () => {
      const locationKeys = [
        CacheKeys.locationMembers(locationId),
      ];

      await Promise.all(locationKeys.map(key => this.cache.del(key)));
      
      if (affectedUserIds && affectedUserIds.length > 0) {
        // Only invalidate caches for users who had access to this location
        const userKeys = affectedUserIds.flatMap(userId => [
          CacheKeys.userLocations(userId),
          CacheKeys.userLocationAccess(userId),
          CacheKeys.userPermissions(userId), // Permissions may depend on location access
          CacheKeys.userBooks(userId), // Books visibility may change
          CacheKeys.userBooksCount(userId)
        ]);
        
        await Promise.all(userKeys.map(key => this.cache.del(key)));
        
        // Clear location-specific book caches
        await Promise.all(
          affectedUserIds.map(userId => 
            this.cache.delPrefix(`library:${userId}:location:${locationId}`)
          )
        );
      } else {
        // Fallback: broader invalidation when user list unknown
        console.warn(`Location ${locationId} invalidation: No user list provided, using broader sweep`);
        await this.cache.delPrefix('locations:');
        await this.cache.delPrefix('user:'); // User permissions may have changed
      }
    });
  }

  /**
   * Invalidate admin analytics with precision
   */
  async invalidateAdminAnalytics(adminId?: string): Promise<void> {
    const key = adminId || 'all-analytics';
    return this.executeOnce(`analytics:${key}`, async () => {
      if (adminId) {
        await this.cache.del(CacheKeys.adminAnalytics(adminId));
        await this.cache.del(CacheKeys.adminUsers(adminId));
        await this.cache.del(CacheKeys.adminStats(adminId));
      } else {
        // Invalidate all admin analytics
        await this.cache.delPrefix('analytics:');
      }
    });
  }

  /**
   * Get list of users affected by a location change for surgical cache invalidation
   */
  async getLocationAffectedUsers(locationId: number, env: any): Promise<string[]> {
    try {
      const result = await env.DB.prepare(`
        SELECT DISTINCT u.id
        FROM users u
        LEFT JOIN location_members lm ON u.id = lm.user_id
        LEFT JOIN locations l ON l.id = lm.location_id OR l.owner_id = u.id
        WHERE l.id = ? OR u.user_role = 'super_admin'
      `).bind(locationId).all();
      
      return (result.results as any[]).map(row => row.id);
    } catch (error) {
      console.warn(`Failed to get affected users for location ${locationId}:`, error);
      return []; // Return empty array to trigger fallback broad invalidation
    }
  }

  /**
   * Get list of users who can see a book for surgical cache invalidation
   */
  async getBookAffectedUsers(bookId: string, env: any): Promise<string[]> {
    try {
      const result = await env.DB.prepare(`
        SELECT DISTINCT u.id
        FROM users u
        LEFT JOIN location_members lm ON u.id = lm.user_id
        LEFT JOIN locations l ON l.id = lm.location_id OR l.owner_id = u.id
        LEFT JOIN shelves s ON s.location_id = l.id
        LEFT JOIN books b ON b.shelf_id = s.id
        WHERE b.id = ? OR u.user_role = 'super_admin'
      `).bind(bookId).all();
      
      return (result.results as any[]).map(row => row.id);
    } catch (error) {
      console.warn(`Failed to get affected users for book ${bookId}:`, error);
      return []; // Return empty array to trigger fallback broad invalidation
    }
  }

  /**
   * Clear all pending invalidations (for emergency reset)
   */
  clearPendingInvalidations(): void {
    this.pendingInvalidations.clear();
  }
}