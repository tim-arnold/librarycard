import { Env } from '../types';
import { formatUserDisplayName } from '../privacy';
import { isUserAdmin, isUserSuperAdmin } from '../auth';
import {
  getUserBooks,
  createBook,
  updateBook,
  deleteBook,
  checkoutBook,
  checkinBook,
  getCheckoutHistory,
  getBookCheckoutHistory,
  createBookRemovalRequest,
  getBookRemovalRequests,
  approveBookRemovalRequest,
  denyBookRemovalRequest,
  deleteBookRemovalRequest,
  rateBook,
  getBookRating,
  emailOverdueUser,
  getBookEditions
} from '../books';
import {
  getCachedUserBooks,
  invalidateBookCache,
  invalidateUserBookCache
} from '../books/cached';
import {
  getCachedBookEditions
} from '../books/google-cached';
import {
  getEnhancedBookEditions
} from '../books/loc-cached';
import {
  uploadBookCoverImage,
  deleteBookCoverImage,
  getBookCoverImages
} from '../books/images';
import { GenreService } from '../genres';
import { invalidateAllAdminAnalytics } from '../admin/cached';

/**
 * Books Router - Handles all book-related endpoints
 * STRICT REPLICATION: Exact copy-paste from workers/index.original.ts lines 801-1177
 */
export class BooksRouter {
  
  static async handleBooksEndpoints(
    request: Request, 
    env: Env, 
    corsHeaders: Record<string, string>,
    userId: string
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    // EXACT COPY FROM ORIGINAL - Book endpoints
    if (path === '/api/books' && request.method === 'GET') {
      return await getCachedUserBooks(userId, env, corsHeaders);
    }

    if (path === '/api/books' && request.method === 'POST') {
      const response = await createBook(request, userId, env, corsHeaders);
      
      // Invalidate user book cache after creating a book
      if (response.ok) {
        await invalidateUserBookCache(userId, env);
      }
      
      return response;
    }

    // Enhanced book editions endpoint for cover selection (multi-source)
    if (path === '/api/books/editions' && request.method === 'GET') {
      const title = url.searchParams.get('title');
      const author = url.searchParams.get('author');
      const query = url.searchParams.get('q');
      const enhanced = url.searchParams.get('enhanced') === 'true';
      
      // Require either title+author or general query
      if (!title && !author && !query) {
        return new Response(JSON.stringify({ error: 'Title and author parameters, or general query (q) parameter is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (enhanced) {
        // Use specific title and author if provided, otherwise use general query
        const searchTitle = title || query || '';
        const searchAuthor = author || query || '';
        
        const editions = await getEnhancedBookEditions(searchTitle, searchAuthor, env);
        
        return new Response(JSON.stringify({ editions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Use legacy Google Books only approach
        const editions = await getCachedBookEditions(query || '', '', env);
        return new Response(JSON.stringify({ editions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Book checkout endpoints (must come before general /api/books/* routes)
    if (path.match(/^\/api\/books\/\d+\/checkout$/) && request.method === 'POST') {
      const bookId = parseInt(path.split('/')[3]);
      const response = await checkoutBook(request, bookId, userId, env, corsHeaders);
      
      // Invalidate book cache after checkout
      if (response.ok) {
        await invalidateBookCache(bookId.toString(), userId, env);
      }
      
      return response;
    }

    if (path.match(/^\/api\/books\/\d+\/checkin$/) && request.method === 'POST') {
      const bookId = parseInt(path.split('/')[3]);
      const response = await checkinBook(bookId, userId, env, corsHeaders);
      
      // Invalidate book cache after checkin
      if (response.ok) {
        await invalidateBookCache(bookId.toString(), userId, env);
      }
      
      return response;
    }

    if (path === '/api/books/checkout-history' && request.method === 'GET') {
      return await getCheckoutHistory(userId, env, corsHeaders);
    }

    // Get checkout history for a specific book
    if (path.match(/^\/api\/books\/\d+\/checkout-history$/) && request.method === 'GET') {
      const id = parseInt(path.split('/')[3]);
      return await getBookCheckoutHistory(id, userId, env, corsHeaders);
    }

    // Email overdue user for a specific book
    if (path.match(/^\/api\/books\/\d+\/email-overdue-user$/) && request.method === 'POST') {
      const id = parseInt(path.split('/')[3]);
      return await emailOverdueUser(id, userId, env, corsHeaders);
    }

    // Book-Genre Management endpoints (must come before general book PUT/DELETE routes)
    if (path.match(/^\/api\/books\/\d+\/genres$/) && request.method === 'GET') {
      const bookId = parseInt(path.split('/')[3]);
      const genreService = new GenreService(env.DB);
      try {
        const bookGenres = await genreService.getBookGenres(bookId);
        return new Response(JSON.stringify(bookGenres), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error fetching book genres:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch book genres' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path.match(/^\/api\/books\/\d+\/genres$/) && request.method === 'POST') {
      const bookId = parseInt(path.split('/')[3]);
      const genreService = new GenreService(env.DB);
      try {
        const body = await request.json() as any;
        const bookGenre = await genreService.assignGenreToBook(bookId, body, userId);
        return new Response(JSON.stringify(bookGenre), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error assigning genre to book:', error);
        const status = error.message.includes('already assigned') ? 409 : 500;
        return new Response(JSON.stringify({ error: error.message || 'Failed to assign genre' }), {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path.match(/^\/api\/books\/\d+\/genres$/) && request.method === 'PUT') {
      const bookId = parseInt(path.split('/')[3]);
      const genreService = new GenreService(env.DB);
      try {
        const body = await request.json() as any;
        const { genreIds } = body;
        
        if (!Array.isArray(genreIds)) {
          return new Response(JSON.stringify({ error: 'genreIds must be an array' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user has access to this book (super admins have access to all books)
        const userRole = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        const isSuperAdmin = userRole?.user_role === 'super_admin';
        
        if (!isSuperAdmin) {
          const bookAccessStmt = env.DB.prepare(`
            SELECT b.id FROM books b
            LEFT JOIN shelves s ON b.shelf_id = s.id
            LEFT JOIN locations l ON s.location_id = l.id
            LEFT JOIN location_members lm ON l.id = lm.location_id
            WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
          `);
          
          const bookAccess = await bookAccessStmt.bind(bookId, userId, userId, userId).first();
          if (!bookAccess) {
            return new Response(JSON.stringify({ error: 'Book not found or access denied' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Get current genres for this book
        const currentGenres = await genreService.getBookGenres(bookId);
        const currentGenreIds = currentGenres.map(bg => bg.genreId);
        
        // Remove genres that are no longer in the list
        const genresToRemove = currentGenreIds.filter(id => !genreIds.includes(id));
        for (const genreId of genresToRemove) {
          await genreService.removeGenreFromBook(bookId, genreId);
        }
        
        // Add new genres that aren't already assigned
        const genresToAdd = genreIds.filter((id: number) => !currentGenreIds.includes(id));
        for (const genreId of genresToAdd) {
          try {
            await genreService.assignGenreToBook(bookId, { genreId }, userId);
          } catch (error: any) {
            // Skip if already assigned (shouldn't happen but handle gracefully)
            if (!error.message.includes('already assigned')) {
              throw error;
            }
          }
        }
        
        // Invalidate caches after genre changes
        await invalidateBookCache(bookId.toString(), userId, env);
        await invalidateAllAdminAnalytics(env);
        
        // Return updated book genres
        const updatedBookGenres = await genreService.getBookGenres(bookId);
        return new Response(JSON.stringify(updatedBookGenres), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error updating book genres:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to update book genres' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path.match(/^\/api\/books\/\d+\/genres\/\d+$/) && request.method === 'DELETE') {
      const bookId = parseInt(path.split('/')[3]);
      const genreId = parseInt(path.split('/')[5]);
      const genreService = new GenreService(env.DB);
      try {
        // Check if user has access to this book (super admins have access to all books)
        const userRole = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        const isSuperAdmin = userRole?.user_role === 'super_admin';
        
        if (!isSuperAdmin) {
          const bookAccessStmt = env.DB.prepare(`
            SELECT b.id FROM books b
            LEFT JOIN shelves s ON b.shelf_id = s.id
            LEFT JOIN locations l ON s.location_id = l.id
            LEFT JOIN location_members lm ON l.id = lm.location_id
            WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
          `);
          
          const bookAccess = await bookAccessStmt.bind(bookId, userId, userId, userId).first();
          if (!bookAccess) {
            return new Response(JSON.stringify({ error: 'Book not found or access denied' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const success = await genreService.removeGenreFromBook(bookId, genreId);
        if (!success) {
          return new Response(JSON.stringify({ error: 'Genre assignment not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Invalidate caches after genre removal
        await invalidateBookCache(bookId.toString(), userId, env);
        await invalidateAllAdminAnalytics(env);
        
        return new Response(JSON.stringify({ message: 'Genre removed successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error removing genre from book:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to remove genre' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path.startsWith('/api/books/') && request.method === 'PUT') {
      const id = parseInt(path.split('/')[3]);
      const response = await updateBook(request, userId, env, corsHeaders, id);
      
      // Invalidate book cache after updating
      if (response.ok) {
        await invalidateBookCache(id.toString(), userId, env);
      }
      
      return response;
    }

    if (path.startsWith('/api/books/') && request.method === 'DELETE') {
      const id = parseInt(path.split('/')[3]);
      const response = await deleteBook(userId, env, corsHeaders, id);
      
      // Invalidate book cache after deleting
      if (response.ok) {
        await invalidateBookCache(id.toString(), userId, env);
      }
      
      return response;
    }

    // Book removal request endpoints
    if (path === '/api/book-removal-requests' && request.method === 'POST') {
      return await createBookRemovalRequest(request, userId, env, corsHeaders);
    }

    if (path === '/api/book-removal-requests' && request.method === 'GET') {
      return await getBookRemovalRequests(userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/book-removal-requests\/\d+\/approve$/) && request.method === 'POST') {
      const requestId = parseInt(path.split('/')[3]);
      return await approveBookRemovalRequest(requestId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/book-removal-requests\/\d+\/deny$/) && request.method === 'POST') {
      const requestId = parseInt(path.split('/')[3]);
      return await denyBookRemovalRequest(request, requestId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/book-removal-requests\/\d+$/) && request.method === 'DELETE') {
      const requestId = parseInt(path.split('/')[3]);
      return await deleteBookRemovalRequest(requestId, userId, env, corsHeaders);
    }

    // Book rating endpoints
    if (path.match(/^\/api\/books\/\d+\/rate$/) && request.method === 'POST') {
      const bookId = parseInt(path.split('/')[3]);
      return await rateBook(request, bookId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/books\/\d+\/ratings$/) && request.method === 'GET') {
      const bookId = parseInt(path.split('/')[3]);
      return await getBookRating(bookId, userId, env, corsHeaders);
    }

    // Library activity endpoints for sidebar
    if (path === '/api/library/activity' && request.method === 'GET') {
      return await BooksRouter.getLibraryActivity(userId, env, corsHeaders, url);
    }

    // Debug R2 binding endpoint with actual bucket test
    if (path === '/api/debug/r2' && request.method === 'GET') {
      let bucketTest = null;

      if (env.R2_BUCKET) {
        try {
          // Try to list objects to verify bucket access
          const listResult = await env.R2_BUCKET.list({ limit: 1 });
          bucketTest = {
            success: true,
            canList: true,
            objectCount: listResult.objects.length,
            truncated: listResult.truncated
          };
        } catch (error) {
          bucketTest = {
            success: false,
            canList: false,
            error: error instanceof Error ? error.message : 'Unknown error accessing bucket'
          };
        }
      } else {
        bucketTest = {
          success: false,
          canList: false,
          error: 'R2_BUCKET binding not available'
        };
      }

      return new Response(JSON.stringify({
        r2_available: !!env.R2_BUCKET,
        environment: env.ENVIRONMENT,
        bindings: {
          has_db: !!env.DB,
          has_cache: !!env.CACHE,
          has_r2: !!env.R2_BUCKET
        },
        bucketTest: bucketTest,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Image upload endpoints
    if (path === '/api/books/images/upload' && request.method === 'POST') {
      return await uploadBookCoverImage(request, userId, env, corsHeaders);
    }

    // Get book cover images
    if (path.match(/^\/api\/books\/\d+\/images$/) && request.method === 'GET') {
      const bookId = parseInt(path.split('/')[3]);
      return await getBookCoverImages(userId, env, corsHeaders, bookId);
    }

    // Delete book cover image
    if (path.match(/^\/api\/books\/\d+\/images\/cover$/) && request.method === 'DELETE') {
      const bookId = parseInt(path.split('/')[3]);
      return await deleteBookCoverImage(request, userId, env, corsHeaders, bookId);
    }

    // Route not handled by books router
    return null;
  }

  /**
   * Get library activity data for sidebar
   */
  static async getLibraryActivity(
    userId: string,
    env: Env,
    corsHeaders: Record<string, string>,
    url: URL
  ): Promise<Response> {
    try {
      // Get query parameters for filtering
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const includeReviews = url.searchParams.get('reviews') !== 'false';
      const includeNew = url.searchParams.get('new') !== 'false';
      const includePopular = url.searchParams.get('popular') !== 'false';
      
      // Get user's accessible locations
      const userLocationsStmt = env.DB.prepare(`
        SELECT DISTINCT l.id 
        FROM locations l 
        LEFT JOIN location_members lm ON l.id = lm.location_id 
        WHERE l.owner_id = ? OR lm.user_id = ?
      `);
      const userLocations = await userLocationsStmt.bind(userId, userId).all();
      const locationIds = userLocations.results.map((l: any) => l.id);
      
      if (locationIds.length === 0) {
        return new Response(JSON.stringify({
          recent_reviews: [],
          newly_added: [],
          popular_books: [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: any = {
        recent_reviews: [],
        newly_added: [],
        popular_books: [],
      };

      const viewerIsAdmin = await isUserAdmin(userId, env);
      const viewerIsSuperAdmin = !viewerIsAdmin ? await isUserSuperAdmin(userId, env) : false;
      const canViewReal = viewerIsAdmin || viewerIsSuperAdmin;

      // Get recent reviews (last 30 days)
      if (includeReviews) {
        const recentReviewsStmt = env.DB.prepare(`
          SELECT
            br.id,
            br.rating,
            br.review_text as review,
            br.created_at,
            br.user_id,
            br.reviewer_anonymous,
            u.id as user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.display_name_preference,
            u.custom_username,
            b.id as book_id,
            b.title,
            b.authors,
            b.thumbnail,
            b.description,
            b.published_date,
            b.categories,
            b.tags,
            s.name as shelf_name,
            l.id as location_id,
            l.name as location_name,
            l.activity_visibility
          FROM book_ratings br
          JOIN books b ON br.book_id = b.id
          JOIN users u ON br.user_id = u.id
          JOIN shelves s ON b.shelf_id = s.id
          JOIN locations l ON s.location_id = l.id
          WHERE l.id IN (${locationIds.map(() => '?').join(',')})
            AND br.created_at > datetime('now', '-30 days')
            AND br.review_text IS NOT NULL
            AND br.review_text != ''
            AND (br.review_status = 'approved' OR br.review_status IS NULL)
          ORDER BY br.created_at DESC
          LIMIT ?
        `);
        
        const recentReviews = await recentReviewsStmt.bind(...locationIds, limit).all();

        results.recent_reviews = recentReviews.results.map((review: any) => {
          const user = {
            id: review.user_id,
            email: review.email,
            first_name: review.first_name,
            last_name: review.last_name,
            display_name_preference: review.display_name_preference,
            custom_username: review.custom_username
          };

          const isAnonymous = canViewReal ? false :
            (review.activity_visibility === 'private' ? true :
            review.reviewer_anonymous !== null ? !!review.reviewer_anonymous :
            user.display_name_preference === 'anonymous');

          const displayName = canViewReal
            ? formatUserDisplayName(user as any, 'full_name', false)
            : formatUserDisplayName(user as any, user.display_name_preference, isAnonymous, user.custom_username);

          return {
            id: `review-${review.id}`,
            type: 'recent_review',
            timestamp: review.created_at,
            data: {
              book: {
                id: review.book_id.toString(),
                title: review.title,
                authors: JSON.parse(review.authors || '[]'),
                thumbnail: review.thumbnail,
                description: review.description,
                publishedDate: review.published_date,
                categories: JSON.parse(review.categories || '[]'),
                tags: JSON.parse(review.tags || '[]'),
                shelf_name: review.shelf_name,
                location_name: review.location_name,
              },
              user: {
                id: review.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                display_name: displayName,
                is_anonymous: isAnonymous,
                display_name_preference: user.display_name_preference,
                custom_username: user.custom_username
              },
              rating: review.rating,
              review: review.review,
            },
          };
        });

      }

      // Get newly added books (last 14 days)
      if (includeNew) {
        const newBooksStmt = env.DB.prepare(`
          SELECT
            b.id,
            b.title,
            b.authors,
            b.thumbnail,
            b.description,
            b.published_date,
            b.categories,
            b.tags,
            b.created_at,
            b.added_by,
            b.added_by_anonymous,
            u.id as user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.display_name_preference,
            u.custom_username,
            s.name as shelf_name,
            l.id as location_id,
            l.name as location_name,
            l.activity_visibility,
            julianday('now') - julianday(b.created_at) as days_ago
          FROM books b
          JOIN users u ON b.added_by = u.id
          JOIN shelves s ON b.shelf_id = s.id
          JOIN locations l ON s.location_id = l.id
          WHERE l.id IN (${locationIds.map(() => '?').join(',')})
            AND b.created_at > datetime('now', '-14 days')
          ORDER BY b.created_at DESC
          LIMIT ?
        `);
        
        const newBooks = await newBooksStmt.bind(...locationIds, limit).all();

        results.newly_added = newBooks.results.map((book: any) => {
          const user = {
            id: book.user_id,
            email: book.email,
            first_name: book.first_name,
            last_name: book.last_name,
            display_name_preference: book.display_name_preference,
            custom_username: book.custom_username
          };

          const isAnonymous = canViewReal ? false :
            (book.activity_visibility === 'private' ? true :
            book.added_by_anonymous !== null ? !!book.added_by_anonymous :
            user.display_name_preference === 'anonymous');

          const displayName = canViewReal
            ? formatUserDisplayName(user as any, 'full_name', false)
            : formatUserDisplayName(user as any, user.display_name_preference, isAnonymous, user.custom_username);

          return {
            id: `new-${book.id}`,
            type: 'newly_added',
            timestamp: book.created_at,
            data: {
              book: {
                id: book.id.toString(),
                title: book.title,
                authors: JSON.parse(book.authors || '[]'),
                thumbnail: book.thumbnail,
                description: book.description,
                publishedDate: book.published_date,
                categories: JSON.parse(book.categories || '[]'),
                tags: JSON.parse(book.tags || '[]'),
                shelf_name: book.shelf_name,
                location_name: book.location_name,
              },
              user: {
                id: book.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                display_name: displayName,
                is_anonymous: isAnonymous,
                display_name_preference: user.display_name_preference,
                custom_username: user.custom_username
              },
              action: 'added',
              days_ago: Math.floor(book.days_ago),
            },
          };
        });

      }

      // Get popular books (most rated and highest average ratings)
      if (includePopular) {
        const popularBooksStmt = env.DB.prepare(`
          SELECT 
            b.id,
            b.title,
            b.authors,
            b.thumbnail,
            b.description,
            b.published_date,
            b.categories,
            b.tags,
            s.name as shelf_name,
            l.name as location_name,
            COUNT(br.id) as rating_count,
            AVG(CAST(br.rating AS REAL)) as average_rating,
            COUNT(CASE WHEN br.created_at > datetime('now', '-7 days') THEN 1 END) as recent_activity_count
          FROM books b
          JOIN shelves s ON b.shelf_id = s.id
          JOIN locations l ON s.location_id = l.id
          LEFT JOIN book_ratings br ON br.book_id = b.id
          WHERE l.id IN (${locationIds.map(() => '?').join(',')})
            AND br.id IS NOT NULL
          GROUP BY b.id
          HAVING rating_count >= 2
          ORDER BY (average_rating * LOG(rating_count + 1) + recent_activity_count * 0.5) DESC
          LIMIT ?
        `);
        
        const popularBooks = await popularBooksStmt.bind(...locationIds, limit).all();
        
        results.popular_books = popularBooks.results.map((book: any) => ({
          id: `popular-${book.id}`,
          type: 'popular_book',
          timestamp: new Date().toISOString(),
          data: {
            book: {
              id: book.id.toString(),
              title: book.title,
              authors: JSON.parse(book.authors || '[]'),
              thumbnail: book.thumbnail,
              description: book.description,
              publishedDate: book.published_date,
              categories: JSON.parse(book.categories || '[]'),
              tags: JSON.parse(book.tags || '[]'),
              shelf_name: book.shelf_name,
              location_name: book.location_name,
            },
            popularity_score: parseFloat((book.average_rating * Math.log(book.rating_count + 1) + book.recent_activity_count * 0.5).toFixed(2)),
            rating_count: book.rating_count,
            average_rating: book.average_rating ? parseFloat(book.average_rating.toFixed(1)) : null,
            recent_activity_count: book.recent_activity_count,
          },
        }));
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error getting library activity:', error);
      return new Response(JSON.stringify({ error: 'Failed to get library activity' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
}