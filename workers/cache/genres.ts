import { Env } from '../types';
import { CacheManager, CacheKeys, CacheTTL, CacheInvalidator } from './kv';
import { GenreService } from '../genres';
import type { CuratedGenre, BookGenre } from '../types';

/**
 * Cached genre operations with automatic fallback
 */
export class CachedGenreService {
  private genreService: GenreService;
  private cache: CacheManager;
  private invalidator: CacheInvalidator;

  constructor(env: Env) {
    this.genreService = new GenreService(env.DB);
    this.cache = new CacheManager(env);
    this.invalidator = new CacheInvalidator(this.cache);
  }

  /**
   * Get all active genres with caching
   */
  async getAllActiveGenres(): Promise<CuratedGenre[]> {
    const cacheKey = CacheKeys.activeGenres();
    
    // Try cache first
    const cachedGenres = await this.cache.get<CuratedGenre[]>(cacheKey);
    if (cachedGenres) {
      return cachedGenres;
    }
    
    // Fallback to database
    const genres = await this.genreService.getAllActiveGenres();
    
    // Cache the result
    await this.cache.set(cacheKey, genres, CacheTTL.ACTIVE_GENRES);
    
    return genres;
  }

  /**
   * Get genre by ID with caching
   */
  async getGenreById(id: number): Promise<CuratedGenre | null> {
    // For individual genres, we can check if it exists in our cached list
    const allGenres = await this.getAllActiveGenres();
    return allGenres.find(genre => genre.id === id) || null;
  }

  /**
   * Create genre and invalidate cache
   */
  async createGenre(request: { name: string; description?: string }, createdBy: string): Promise<CuratedGenre> {
    const genre = await this.genreService.createGenre(request, createdBy);
    
    // Invalidate genre caches
    await this.invalidateGenreCaches();
    
    return genre;
  }

  /**
   * Update genre and invalidate cache
   */
  async updateGenre(id: number, request: { name: string; description?: string }): Promise<CuratedGenre | null> {
    const genre = await this.genreService.updateGenre(id, request);
    
    if (genre) {
      // Invalidate genre caches
      await this.invalidateGenreCaches();
    }
    
    return genre;
  }

  /**
   * Deactivate genre and invalidate cache
   */
  async deactivateGenre(id: number): Promise<boolean> {
    const success = await this.genreService.deactivateGenre(id);
    
    if (success) {
      // Invalidate genre caches
      await this.invalidateGenreCaches();
    }
    
    return success;
  }

  /**
   * Get book genres with caching
   */
  async getBookGenres(bookId: number): Promise<BookGenre[]> {
    const cacheKey = CacheKeys.bookMetadata(bookId.toString());
    
    // Try cache first
    const cachedBookData = await this.cache.get<{ genres?: BookGenre[] }>(cacheKey);
    if (cachedBookData?.genres) {
      return cachedBookData.genres;
    }
    
    // Fallback to database
    const genres = await this.genreService.getBookGenres(bookId);
    
    // Cache the result (as part of book metadata)
    const bookData = cachedBookData || {};
    bookData.genres = genres;
    await this.cache.set(cacheKey, bookData, CacheTTL.BOOK_METADATA);
    
    return genres;
  }

  /**
   * Assign genre to book and invalidate relevant caches
   */
  async assignGenreToBook(
    bookId: number, 
    request: { genreId: number; isAutoAssigned?: boolean }, 
    assignedBy: string
  ): Promise<BookGenre | null> {
    const bookGenre = await this.genreService.assignGenreToBook(bookId, request, assignedBy);
    
    if (bookGenre) {
      // Invalidate book metadata cache
      await this.cache.del(CacheKeys.bookMetadata(bookId.toString()));
      
      // Invalidate user book libraries (since book genres changed)
      await this.cache.delPrefix('library:');
    }
    
    return bookGenre;
  }

  /**
   * Remove genre from book and invalidate relevant caches
   */
  async removeGenreFromBook(bookId: number, genreId: number): Promise<boolean> {
    const success = await this.genreService.removeGenreFromBook(bookId, genreId);
    
    if (success) {
      // Invalidate book metadata cache
      await this.cache.del(CacheKeys.bookMetadata(bookId.toString()));
      
      // Invalidate user book libraries (since book genres changed)
      await this.cache.delPrefix('library:');
    }
    
    return success;
  }

  /**
   * Get genre usage stats with caching
   */
  async getGenreUsageStats(): Promise<Array<{genreName: string, bookCount: number}>> {
    const cacheKey = 'genres:usage:stats';
    
    // Try cache first
    const cachedStats = await this.cache.get<Array<{genreName: string, bookCount: number}>>(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }
    
    // Fallback to database
    const stats = await this.genreService.getGenreUsageStats();
    
    // Cache for shorter time since usage changes frequently
    await this.cache.set(cacheKey, stats, CacheTTL.ACTIVE_GENRES / 2); // 30 minutes
    
    return stats;
  }

  /**
   * Search genres with caching
   */
  async searchGenres(query: string): Promise<CuratedGenre[]> {
    // For search, we can use the cached active genres and filter locally
    // This is more efficient than caching every search query
    const allGenres = await this.getAllActiveGenres();
    
    const searchTerm = query.toLowerCase();
    return allGenres.filter(genre => 
      genre.name.toLowerCase().includes(searchTerm) || 
      (genre.description && genre.description.toLowerCase().includes(searchTerm))
    ).slice(0, 20); // Limit to 20 results like the original
  }

  /**
   * Invalidate all genre-related caches
   */
  private async invalidateGenreCaches(): Promise<void> {
    await this.invalidator.invalidateGenres();
    
    // Also invalidate usage stats
    await this.cache.del('genres:usage:stats');
    
    // Invalidate user book libraries since genre availability changed
    await this.cache.delPrefix('library:');
  }

  /**
   * Check if caching is available
   */
  isAvailable(): boolean {
    return this.cache.isAvailable();
  }
}

/**
 * Convenience function to get cached genre service
 */
export function getCachedGenreService(env: Env): CachedGenreService {
  return new CachedGenreService(env);
}