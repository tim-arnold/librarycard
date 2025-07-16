import {
  Env,
  User,
} from './types';
import {
  getUserLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  leaveLocation,
  getLocationShelves,
  createShelf,
  updateShelf,
  deleteShelf
} from './locations';
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
} from './books';
import {
  getCachedUserBooks,
  invalidateBookCache,
  invalidateUserBookCache
} from './books/cached';
import {
  getCachedBookEditions
} from './books/google-cached';
import {
  sendInvitationEmail,
  sendVerificationEmail,
  notifyAdminsOfSignupRequest,
  sendContactEmail
} from './email';
import {
  getSignupRequests,
  approveSignupRequest,
  denySignupRequest,
  cleanupUser,
  debugListUsers
} from './admin';
import {
  checkUserExists
} from './auth-utils';
import {
  createOrUpdateUser,
  registerUser,
  verifyCredentials,
  verifyEmail,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword
} from './auth-core';
import {
  createLocationInvitation,
  acceptLocationInvitation,
  getLocationInvitations,
  getInvitationDetails,
  revokeLocationInvitation
} from './invitations';
import {
  getAdminAnalytics,
  getAdminUsers,
  updateUserRole,
  getAvailableAdmins,
  getUserLocationAssignments,
  assignLocationToUser,
  unassignLocationFromUser
} from './admin-extended';
import {
  getUserProfile,
  updateUserProfile
} from './profile';
import {
  getUserFromRequest
} from './auth';
import { GenreService } from './genres';
import {
  getLocationAdminCapabilities,
  grantAdminCapability,
  revokeAdminCapability,
  getLocationUserPermissions,
  grantUserPermission,
  revokeUserPermission,
  checkUserPermission,
  checkLocationPermissionManagement,
  getUserPermissions
} from './permissions';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);  
    const path = url.pathname;
    
    console.log('🚀 Worker request:', request.method, path);
    console.log('🔍 Full URL:', request.url);
    console.log('📝 Headers:', Object.fromEntries(request.headers.entries()));


    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Public auth endpoints (no authentication required)
      if (path === '/api/users' && request.method === 'POST') {
        return await createOrUpdateUser(request, env, corsHeaders);
      }

      if (path === '/api/auth/register' && request.method === 'POST') {
        return await registerUser(request, env, corsHeaders);
      }

      if (path === '/api/auth/verify' && request.method === 'POST') {
        return await verifyCredentials(request, env, corsHeaders);
      }

      if (path === '/api/auth/verify-email' && request.method === 'GET') {
        return await verifyEmail(request, env, corsHeaders);
      }

      if (path === '/api/invitations/details' && request.method === 'GET') {
        return await getInvitationDetails(request, env, corsHeaders);
      }

      if (path === '/api/users/check' && request.method === 'GET') {
        return await checkUserExists(request, env, corsHeaders);
      }

      // Password reset endpoints (public)
      if (path === '/api/auth/forgot-password' && request.method === 'POST') {
        return await forgotPassword(request, env, corsHeaders);
      }

      if (path === '/api/auth/verify-reset-token' && request.method === 'GET') {
        return await verifyResetToken(request, env, corsHeaders);
      }

      if (path === '/api/auth/reset-password' && request.method === 'POST') {
        return await resetPassword(request, env, corsHeaders);
      }

      // Contact form endpoint (public)
      if (path === '/api/contact' && request.method === 'POST') {
        return await sendContactEmail(request, env, corsHeaders);
      }

      // Public genre endpoints (read-only access)
      if (path === '/genres' && request.method === 'GET') {
        console.log('Worker: handling /genres request');
        const genreService = new GenreService(env.DB);
        try {
          const genres = await genreService.getAllActiveGenres();
          console.log('Worker: returning', genres.length, 'genres');
          return new Response(JSON.stringify(genres), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error fetching genres:', error);
          return new Response(JSON.stringify({ error: 'Failed to fetch genres' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Get user from session/token for protected endpoints
      const userId = await getUserFromRequest(request, env);
      
      // All other endpoints require authentication
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Location endpoints
      if (path === '/api/locations' && request.method === 'GET') {
        return await getUserLocations(userId, env, corsHeaders);
      }

      if (path === '/api/locations' && request.method === 'POST') {
        return await createLocation(request, userId, env, corsHeaders);
      }

      if (path.startsWith('/api/locations/') && path !== '/api/locations' && request.method === 'PUT') {
        const id = parseInt(path.split('/')[3]);
        return await updateLocation(request, userId, env, corsHeaders, id);
      }

      if (path === '/api/locations' && request.method === 'PUT') {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(JSON.stringify({ error: 'Location ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await updateLocation(request, userId, env, corsHeaders, parseInt(id));
      }

      if (path.startsWith('/api/locations/') && path !== '/api/locations' && request.method === 'DELETE') {
        const id = parseInt(path.split('/')[3]);
        return await deleteLocation(userId, env, corsHeaders, id);
      }

      if (path === '/api/locations' && request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(JSON.stringify({ error: 'Location ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await deleteLocation(userId, env, corsHeaders, parseInt(id));
      }

      if (path.match(/^\/api\/locations\/\d+\/shelves$/) && request.method === 'GET') {
        const locationId = parseInt(path.split('/')[3]);
        return await getLocationShelves(locationId, userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/locations\/\d+\/shelves$/) && request.method === 'POST') {
        const locationId = parseInt(path.split('/')[3]);
        return await createShelf(request, locationId, userId, env, corsHeaders);
      }

      if (path.startsWith('/api/shelves/') && request.method === 'PUT') {
        const id = parseInt(path.split('/')[3]);
        return await updateShelf(request, userId, env, corsHeaders, id);
      }

      if (path.startsWith('/api/shelves/') && request.method === 'DELETE') {
        const id = parseInt(path.split('/')[3]);
        return await deleteShelf(request, userId, env, corsHeaders, id);
      }

      // Signup approval endpoints (admin only)
      if (path === '/api/signup-requests' && request.method === 'GET') {
        return await getSignupRequests(userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/signup-requests\/\d+\/approve$/) && request.method === 'POST') {
        const requestId = parseInt(path.split('/')[3]);
        return await approveSignupRequest(request, requestId, userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/signup-requests\/\d+\/deny$/) && request.method === 'POST') {
        const requestId = parseInt(path.split('/')[3]);
        return await denySignupRequest(request, requestId, userId, env, corsHeaders);
      }

      // Book endpoints
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

      // Book editions endpoint for cover selection
      if (path === '/api/books/editions' && request.method === 'GET') {
        const title = url.searchParams.get('title');
        const author = url.searchParams.get('author');
        
        if (!title || !author) {
          return new Response(JSON.stringify({ error: 'Title and author parameters are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const editions = await getCachedBookEditions(title, author, env);
        return new Response(JSON.stringify({ editions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Book checkout endpoints (must come before general /api/books/* routes)
      if (path.match(/^\/api\/books\/\d+\/checkout$/) && request.method === 'POST') {
        const bookId = parseInt(path.split('/')[3]);
        return await checkoutBook(request, bookId, userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/books\/\d+\/checkin$/) && request.method === 'POST') {
        const bookId = parseInt(path.split('/')[3]);
        return await checkinBook(bookId, userId, env, corsHeaders);
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

      // Invitation endpoints
      if (path.match(/^\/api\/locations\/\d+\/invite$/) && request.method === 'POST') {
        const locationId = parseInt(path.split('/')[3]);
        return await createLocationInvitation(request, locationId, userId, env, corsHeaders);
      }

      if (path === '/api/invitations/accept' && request.method === 'POST') {
        return await acceptLocationInvitation(request, userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/locations\/\d+\/invitations$/) && request.method === 'GET') {
        const locationId = parseInt(path.split('/')[3]);
        return await getLocationInvitations(locationId, userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/invitations\/\d+\/revoke$/) && request.method === 'DELETE') {
        const invitationId = parseInt(path.split('/')[3]);
        return await revokeLocationInvitation(invitationId, userId, env, corsHeaders);
      }

      // Leave location endpoint
      if (path.match(/^\/api\/locations\/\d+\/leave$/) && request.method === 'POST') {
        const locationId = parseInt(path.split('/')[3]);
        return await leaveLocation(locationId, userId, env, corsHeaders);
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

      // Profile endpoints
      if (path === '/api/profile' && request.method === 'GET') {
        return await getUserProfile(userId, env, corsHeaders);
      }

      if (path === '/api/profile' && request.method === 'PUT') {
        return await updateUserProfile(request, userId, env, corsHeaders);
      }

      // Change password endpoint (authenticated users only)
      if (path === '/api/auth/change-password' && request.method === 'POST') {
        return await changePassword(request, env, corsHeaders);
      }

      // Book-Genre Management endpoints
      if (path.match(/^\/books\/\d+\/genres$/) && request.method === 'GET') {
        const bookId = parseInt(path.split('/')[2]);
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

      if (path.match(/^\/books\/\d+\/genres$/) && request.method === 'POST') {
        const bookId = parseInt(path.split('/')[2]);
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

      if (path.match(/^\/books\/\d+\/genres$/) && request.method === 'PUT') {
        const bookId = parseInt(path.split('/')[2]);
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

          // Check if user has access to this book
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

      if (path.match(/^\/books\/\d+\/genres\/\d+$/) && request.method === 'DELETE') {
        const bookId = parseInt(path.split('/')[2]);
        const genreId = parseInt(path.split('/')[4]);
        const genreService = new GenreService(env.DB);
        try {
          // Check if user has access to this book
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

          const success = await genreService.removeGenreFromBook(bookId, genreId);
          if (!success) {
            return new Response(JSON.stringify({ error: 'Genre assignment not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
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

      // Admin Genre Management endpoints
      if (path === '/admin/genres' && request.method === 'POST') {
        const genreService = new GenreService(env.DB);
        try {
          // Check if user is super admin
          const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
          if (!user || user.user_role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Super admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const body = await request.json() as any;
          const newGenre = await genreService.createGenre(body, userId);
          return new Response(JSON.stringify(newGenre), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('Error creating genre:', error);
          const status = error.message.includes('UNIQUE constraint') ? 409 : 500;
          return new Response(JSON.stringify({ error: error.message || 'Failed to create genre' }), {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Admin-only cleanup endpoint
      if (path === '/api/admin/cleanup-user' && request.method === 'POST') {
        return await cleanupUser(request, userId, env, corsHeaders);
      }

      // Admin-only debug endpoint to list all users
      if (path === '/api/admin/debug-users' && request.method === 'GET') {
        return await debugListUsers(userId, env, corsHeaders);
      }

      // Admin-only analytics endpoint
      if (path === '/api/admin/analytics' && request.method === 'GET') {
        return await getAdminAnalytics(userId, env, corsHeaders);
      }

      // Admin-only enhanced users endpoint
      if (path === '/api/admin/users' && request.method === 'GET') {
        return await getAdminUsers(userId, env, corsHeaders);
      }

      // Admin-only user role management endpoint
      if (path.match(/^\/api\/admin\/users\/[^\/]+\/role$/) && request.method === 'PUT') {
        const targetUserId = path.split('/')[4];
        return await updateUserRole(request, targetUserId, userId, env, corsHeaders);
      }

      // Admin-only endpoint to get available admin users for ownership transfer
      if (path === '/api/admin/available-admins' && request.method === 'GET') {
        return await getAvailableAdmins(userId, env, corsHeaders);
      }

      // Super admin-only endpoints for location assignment
      if (path.match(/^\/api\/admin\/users\/[^\/]+\/locations$/) && request.method === 'GET') {
        const targetUserId = path.split('/')[4];
        return await getUserLocationAssignments(targetUserId, userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/admin\/users\/[^\/]+\/locations\/[^\/]+$/) && request.method === 'POST') {
        const targetUserId = path.split('/')[4];
        const locationId = path.split('/')[6];
        return await assignLocationToUser(targetUserId, locationId, userId, env, corsHeaders);
      }

      if (path.match(/^\/api\/admin\/users\/[^\/]+\/locations\/[^\/]+$/) && request.method === 'DELETE') {
        const targetUserId = path.split('/')[4];
        const locationId = path.split('/')[6];
        return await unassignLocationFromUser(targetUserId, locationId, userId, env, corsHeaders);
      }

      // Handle permission management endpoints directly (already authenticated)
      if (path === '/api/admin/location-admin-capabilities') {
        switch (request.method) {
          case 'GET':
            return await getLocationAdminCapabilities(request, userId, env, corsHeaders);
          case 'POST':
            return await grantAdminCapability(request, userId, env, corsHeaders);
          case 'DELETE':
            return await revokeAdminCapability(request, userId, env, corsHeaders);
        }
      }

      if (path === '/api/admin/location-user-permissions') {
        switch (request.method) {
          case 'GET':
            return await getLocationUserPermissions(request, userId, env, corsHeaders);
          case 'POST':
            return await grantUserPermission(request, userId, env, corsHeaders);
          case 'DELETE':
            return await revokeUserPermission(request, userId, env, corsHeaders);
        }
      }

      if (path === '/api/permissions/check' && request.method === 'GET') {
        return await checkUserPermission(request, userId, env, corsHeaders);
      }

      if (path === '/api/permissions/can-manage' && request.method === 'GET') {
        return await checkLocationPermissionManagement(request, userId, env, corsHeaders);
      }

      if (path === '/api/permissions/user' && request.method === 'GET') {
        return await getUserPermissions(request, userId, env, corsHeaders);
      }

      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });
    } catch (error) {
      console.error('API Error:', error);
      return new Response(`Error: ${error}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },
};


