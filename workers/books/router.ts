import { Env } from '../types';
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
      if (env.ENVIRONMENT === 'local') {
        if (env.ENVIRONMENT === 'local') {
          console.log('🔍 Books Debug: Fetching books for user', userId);
        }
      }
      
      try {
        const result = await getCachedUserBooks(userId, env, corsHeaders);
        
        if (env.ENVIRONMENT === 'local') {
          if (env.ENVIRONMENT === 'local') {
            console.log('🔍 Books Debug: Result status', result.status);
            if (!result.ok) {
              const errorText = await result.text();
              console.log('🔍 Books Debug: Error response', errorText);
            }
          }
        }
        
        return result;
      } catch (error) {
        if (env.ENVIRONMENT === 'local') {
          if (env.ENVIRONMENT === 'local') {
            console.error('🔍 Books Debug: Exception caught', error);
          }
        }
        throw error;
      }
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
      console.log('🔍 Enhanced book editions request received');
      const title = url.searchParams.get('title');
      const author = url.searchParams.get('author');
      const query = url.searchParams.get('q'); // Fallback for general search
      const enhanced = url.searchParams.get('enhanced') === 'true';
      
      console.log('📝 Request params:', { title, author, query, enhanced });
      
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
        
        console.log('🚀 Calling getEnhancedBookEditions with:', { searchTitle, searchAuthor });
        console.log('ℹ️  Enhanced search always filters for books with cover art');
        
        // Use enhanced multi-source approach (always filters for covers)
        const editions = await getEnhancedBookEditions(searchTitle, searchAuthor, env);
        
        console.log('✅ Enhanced search complete, returning', editions.length, 'editions');
        
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

    // Route not handled by books router
    return null;
  }
}