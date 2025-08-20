import { Env } from '../types';
import { CacheManager, CacheKeys, CacheTTL } from '../cache/kv';
import { getUserBooks } from './index';
import { getCachedUserPermissions } from '../auth/cached';

/**
 * Cached book functions with automatic fallback to database
 */

/**
 * Get user books with caching
 */
export async function getCachedUserBooks(userId: string, env: Env, corsHeaders: Record<string, string>) {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userBooks(userId);
  
  if (env.ENVIRONMENT === 'local') {
    console.log('🔍 CachedBooks Debug: Cache key', cacheKey);
  }
  
  // Try to get from cache first
  const cachedBooks = await cache.get<any[]>(cacheKey);
  if (cachedBooks) {
    if (env.ENVIRONMENT === 'local') {
      console.log('🔍 CachedBooks Debug: Found cached books', cachedBooks.length);
    }
    return new Response(JSON.stringify(cachedBooks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (env.ENVIRONMENT === 'local') {
    console.log('🔍 CachedBooks Debug: No cache, falling back to database');
  }
  
  // Fallback to database
  try {
    const response = await getUserBooks(userId, env, corsHeaders);
    
    if (env.ENVIRONMENT === 'local') {
      console.log('🔍 CachedBooks Debug: Database response status', response.status);
    }
    
    // Cache the result if successful
    if (response.ok) {
      const books = await response.json();
      
      if (env.ENVIRONMENT === 'local') {
        console.log('🔍 CachedBooks Debug: Got books from database', books.length);
      }
      
      await cache.set(cacheKey, books, CacheTTL.USER_BOOKS);
      
      return new Response(JSON.stringify(books), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return response;
  } catch (error) {
    if (env.ENVIRONMENT === 'local') {
      console.error('🔍 CachedBooks Debug: Database error', error);
    }
    throw error;
  }
}

/**
 * Get user books count with caching
 */
export async function getCachedUserBooksCount(userId: string, env: Env): Promise<number> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userBooksCount(userId);
  
  // Try to get from cache first
  const cachedCount = await cache.get<number>(cacheKey);
  if (cachedCount !== null) {
    return cachedCount;
  }
  
  // Get user permissions to determine query scope
  const permissions = await getCachedUserPermissions(userId, env);
  
  let stmt;
  let result;
  
  if (permissions.isSuperAdmin) {
    // Super admins can see all books
    stmt = env.DB.prepare(`
      SELECT COUNT(*) as count FROM books
    `);
    result = await stmt.all();
  } else {
    // Regular users see books based on ownership/membership
    stmt = env.DB.prepare(`
      SELECT COUNT(DISTINCT b.id) as count
      FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE l.owner_id = ? OR lm.user_id = ?
    `);
    result = await stmt.bind(userId, userId).all();
  }
  
  const count = (result.results[0] as any)?.count || 0;
  
  // Cache the result
  await cache.set(cacheKey, count, CacheTTL.USER_BOOKS);
  
  return count;
}

/**
 * Get user books filtered by location with caching
 */
export async function getCachedUserBooksByLocation(userId: string, locationId: number, env: Env, corsHeaders: Record<string, string>) {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.userBooksByLocation(userId, locationId);
  
  // Try to get from cache first
  const cachedBooks = await cache.get<any[]>(cacheKey);
  if (cachedBooks) {
    return new Response(JSON.stringify(cachedBooks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Get user permissions to check access
  const permissions = await getCachedUserPermissions(userId, env);
  
  // Check if user has access to this location
  if (!permissions.isSuperAdmin && !permissions.locationIds.includes(locationId)) {
    return new Response(JSON.stringify({ error: 'Access denied to this location' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Query books for specific location
  const stmt = env.DB.prepare(`
    SELECT DISTINCT b.id, b.isbn, b.title, b.authors, b.description, b.thumbnail, b.published_date,
           b.categories, b.shelf_id, b.tags, b.added_by, b.created_at, b.status,
           b.checked_out_by, b.checked_out_date, b.due_date,
           b.extended_description, b.subjects, b.page_count, b.google_average_rating, b.google_ratings_count, b.rating_updated_at,
           b.publisher_info, b.open_library_key, b.enhanced_genres, b.series, b.series_number,
           s.name as shelf_name, l.name as location_name,
           br.rating as user_rating, br.review_text as user_review, br.review_status as user_review_status, br.review_rejection_reason as user_review_rejection_reason,
           -- Get assigned genres as JSON array
           (SELECT json_group_array(json_object('id', cg.id, 'name', cg.name, 'description', cg.description))
            FROM book_genres bg 
            JOIN curated_genres cg ON bg.genre_id = cg.id 
            WHERE bg.book_id = b.id AND cg.is_active = 1
           ) as assigned_genres,
           -- Calculate library-specific average rating
           (SELECT AVG(CAST(rating AS REAL)) FROM book_ratings 
            WHERE book_id = b.id AND user_id IN (
              SELECT DISTINCT u.id FROM users u
              LEFT JOIN location_members lm2 ON u.id = lm2.user_id
              LEFT JOIN locations l2 ON lm2.location_id = l2.id OR l2.owner_id = u.id
              WHERE l2.id = ?
            )
           ) as library_average_rating,
           -- Calculate library-specific rating count
           (SELECT COUNT(*) FROM book_ratings 
            WHERE book_id = b.id AND user_id IN (
              SELECT DISTINCT u.id FROM users u
              LEFT JOIN location_members lm2 ON u.id = lm2.user_id
              LEFT JOIN locations l2 ON lm2.location_id = l2.id OR l2.owner_id = u.id
              WHERE l2.id = ?
            )
           ) as library_rating_count,
           CASE 
             WHEN b.checked_out_by IS NOT NULL THEN 
               (SELECT first_name FROM users WHERE id = b.checked_out_by)
             ELSE NULL 
           END as checked_out_by_name
    FROM books b
    LEFT JOIN shelves s ON b.shelf_id = s.id
    LEFT JOIN locations l ON s.location_id = l.id
    LEFT JOIN book_ratings br ON b.id = br.book_id AND br.user_id = ?
    WHERE l.id = ?
    ORDER BY b.created_at DESC
  `);
  
  const result = await stmt.bind(locationId, locationId, userId, locationId).all();
  
  const books = result.results.map((book: any) => ({
    ...book,
    authors: book.authors ? JSON.parse(book.authors) : [],
    categories: book.categories ? JSON.parse(book.categories) : [],
    tags: book.tags ? JSON.parse(book.tags) : [],
    subjects: book.subjects ? JSON.parse(book.subjects) : [],
    enhancedGenres: book.enhanced_genres ? JSON.parse(book.enhanced_genres) : [],
    assignedGenres: book.assigned_genres ? JSON.parse(book.assigned_genres).filter((g: any) => g.id !== null) : [],
    publishedDate: book.published_date,
    extendedDescription: book.extended_description,
    pageCount: book.page_count,
    averageRating: book.library_average_rating,
    ratingCount: book.library_rating_count,
    googleAverageRating: book.google_average_rating,
    googleRatingCount: book.google_ratings_count,
    ratingUpdatedAt: book.rating_updated_at,
    userRating: book.user_rating,
    userReview: book.user_review,
    userReviewStatus: book.user_review_status,
    userReviewRejectionReason: book.user_review_rejection_reason,
    publisherInfo: book.publisher_info,
    openLibraryKey: book.open_library_key,
    seriesNumber: book.series_number,
    status: book.status || 'available',
  }));
  
  // Cache the result
  await cache.set(cacheKey, books, CacheTTL.USER_BOOKS);
  
  return new Response(JSON.stringify(books), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Get cached book metadata by ID
 */
export async function getCachedBookMetadata(bookId: string, env: Env): Promise<any | null> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.bookMetadata(bookId);
  
  // Try to get from cache first
  const cachedMetadata = await cache.get<any>(cacheKey);
  if (cachedMetadata) {
    return cachedMetadata;
  }
  
  // Fallback to database
  const stmt = env.DB.prepare(`
    SELECT b.*, 
           -- Get assigned genres as JSON array
           (SELECT json_group_array(json_object('id', cg.id, 'name', cg.name, 'description', cg.description))
            FROM book_genres bg 
            JOIN curated_genres cg ON bg.genre_id = cg.id 
            WHERE bg.book_id = b.id AND cg.is_active = 1
           ) as assigned_genres
    FROM books b
    WHERE b.id = ?
  `);
  
  const result = await stmt.bind(bookId).first();
  
  if (!result) {
    return null;
  }
  
  const book = result as any;
  const metadata = {
    ...book,
    authors: book.authors ? JSON.parse(book.authors) : [],
    categories: book.categories ? JSON.parse(book.categories) : [],
    tags: book.tags ? JSON.parse(book.tags) : [],
    subjects: book.subjects ? JSON.parse(book.subjects) : [],
    enhancedGenres: book.enhanced_genres ? JSON.parse(book.enhanced_genres) : [],
    assignedGenres: book.assigned_genres ? JSON.parse(book.assigned_genres).filter((g: any) => g.id !== null) : [],
    publishedDate: book.published_date,
    extendedDescription: book.extended_description,
    pageCount: book.page_count,
    publisherInfo: book.publisher_info,
    openLibraryKey: book.open_library_key,
    seriesNumber: book.series_number,
  };
  
  // Cache the result
  await cache.set(cacheKey, metadata, CacheTTL.BOOK_METADATA);
  
  return metadata;
}

/**
 * Get cached book ratings for a specific book
 */
export async function getCachedBookRatings(bookId: string, env: Env): Promise<any> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.bookRatings(bookId);
  
  // Try to get from cache first
  const cachedRatings = await cache.get<any>(cacheKey);
  if (cachedRatings) {
    return cachedRatings;
  }
  
  // Fallback to database
  const stmt = env.DB.prepare(`
    SELECT 
      AVG(CAST(rating AS REAL)) as average_rating,
      COUNT(*) as rating_count
    FROM book_ratings
    WHERE book_id = ?
  `);
  
  const result = await stmt.bind(bookId).first();
  
  const ratings = {
    averageRating: (result as any)?.average_rating || null,
    ratingCount: (result as any)?.rating_count || 0,
    bookId
  };
  
  // Cache the result
  await cache.set(cacheKey, ratings, CacheTTL.BOOK_RATINGS);
  
  return ratings;
}

/**
 * Invalidate book-related cache when books are modified
 */
export async function invalidateBookCache(bookId: string, userId: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear book-specific cache
  await cache.del(CacheKeys.bookMetadata(bookId));
  await cache.del(CacheKeys.bookRatings(bookId));
  
  // Clear user book caches (since they contain this book)
  await cache.delPrefix('library:');
  
  // Clear user-specific cache
  await cache.del(CacheKeys.userBooks(userId));
  await cache.del(CacheKeys.userBooksCount(userId));
}

/**
 * Invalidate all book-related cache for a user
 */
export async function invalidateUserBookCache(userId: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear user-specific book caches
  await cache.del(CacheKeys.userBooks(userId));
  await cache.del(CacheKeys.userBooksCount(userId));
  
  // Clear location-specific book caches for this user
  await cache.delPrefix(`library:${userId}:location:`);
}