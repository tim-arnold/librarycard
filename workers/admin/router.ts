import { Env } from '../types';
import {
  getSignupRequests,
  approveSignupRequest,
  denySignupRequest,
  cleanupUser,
  debugListUsers,
  toggleUserActiveStatus
} from '../admin';
import {
  getCachedAdminAnalytics,
  getCachedAdminUsers,
  invalidateAllAdminAnalytics,
  warmAdminCache,
  getAdminCacheMetrics
} from '../admin/cached';
import {
  getAdminAnalytics,
  getAdminUsers,
  updateUserRole,
  getAvailableAdmins,
  getUserLocationAssignments,
  assignLocationToUser,
  unassignLocationFromUser
} from '../admin-extended';
import {
  getPendingReviews,
  moderateReview
} from '../books';
import { GenreService } from '../genres';
import { sendContactEmail } from '../email';
import {
  getLocationAdminCapabilities,
  grantAdminCapability,
  revokeAdminCapability,
  getLocationUserPermissions,
  grantUserPermission,
  revokeUserPermission,
  checkUserPermission,
  checkLocationPermissionManagement,
  getUserPermissions,
  getUserGlobalPermissions,
  grantGlobalPermission,
  revokeGlobalPermission
} from '../permissions';
import {
  getUserNotificationPreferences,
  updateNotificationPreference,
  getNotificationSettings,
  resetNotificationPreferences
} from '../notification-preferences';
import {
  getInAppNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  createTestNotification
} from '../in-app-notifications';
import {
  getPendingSeries,
  approveRejectSeries
} from '../series';
import { getCachedIsUserAdmin } from '../auth/cached';
import { getSessionAnalytics, logSessionAnalytics } from '../analytics/openLibraryAnalytics';
import {
  CacheManager,
  CacheInvalidator
} from '../cache/kv';

/**
 * Admin Router - Handles all admin-related endpoints
 * STRICT REPLICATION: Exact copy-paste from workers/index.original.ts
 */
export class AdminRouter {
  
  static async handleAdminEndpoints(
    request: Request, 
    env: Env, 
    corsHeaders: Record<string, string>,
    userId: string
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    // EXACT COPY FROM ORIGINAL - Signup approval endpoints (admin only)
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

    // Review moderation endpoints (GitHub Issue #256)
    if (path === '/api/admin/reviews/pending' && request.method === 'GET') {
      return await getPendingReviews(userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/admin\/reviews\/\d+\/moderate$/) && request.method === 'POST') {
      const reviewId = parseInt(path.split('/')[4]);
      return await moderateReview(request, reviewId, userId, env, corsHeaders);
    }

    // Admin Genre Management endpoints
    if (path === '/api/admin/genres' && request.method === 'GET') {
      const genreService = new GenreService(env.DB);
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const genres = await genreService.getAllGenres();
        return new Response(JSON.stringify(genres), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error fetching all genres for admin:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch genres' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path === '/api/admin/genres' && request.method === 'POST') {
      const genreService = new GenreService(env.DB);
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
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

    if (path.match(/^\/api\/admin\/genres\/\d+$/) && request.method === 'PUT') {
      const genreService = new GenreService(env.DB);
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const genreId = parseInt(path.split('/')[4]);
        const body = await request.json() as any;
        const updatedGenre = await genreService.updateGenre(genreId, body);
        
        if (!updatedGenre) {
          return new Response(JSON.stringify({ error: 'Genre not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(updatedGenre), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error updating genre:', error);
        const status = error.message.includes('UNIQUE constraint') ? 409 : 500;
        return new Response(JSON.stringify({ error: error.message || 'Failed to update genre' }), {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path === '/api/admin/genre-request' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { genreName, description, reason, requesterName, requesterEmail } = body;

        if (!genreName || !reason || !requesterEmail) {
          return new Response(JSON.stringify({ error: 'Genre name, reason, and email are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get requester's user info
        const userStmt = env.DB.prepare('SELECT first_name, last_name FROM users WHERE id = ?');
        const user = await userStmt.bind(userId).first() as any;
        const displayName = requesterName || (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : requesterEmail);

        // Save genre request to database
        const insertStmt = env.DB.prepare(`
          INSERT INTO genre_requests (genre_name, description, reason, requested_by, requester_name, requester_email)
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING id
        `);
        
        const result = await insertStmt.bind(
          genreName,
          description || null,
          reason,
          userId,
          displayName,
          requesterEmail
        ).first() as any;

        if (!result) {
          throw new Error('Failed to save genre request');
        }

        // Send email to super admins
        await sendContactEmail({
          name: displayName,
          email: requesterEmail,
          subject: `Genre Request: ${genreName}`,
          message: `A genre request has been submitted:

Genre Name: ${genreName}${description ? `
Description: ${description}` : ''}
Requested by: ${displayName} (${requesterEmail})
Reason: ${reason}

To review this request, log in as a super administrator and go to Admin Dashboard > Notifications > Genre Requests.`
        } as any, env, corsHeaders);

        return new Response(JSON.stringify({ 
          message: 'Genre request sent successfully',
          requestId: result.id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error sending genre request:', error);
        return new Response(JSON.stringify({ error: 'Failed to send genre request' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Genre requests management endpoints (super admin only)
    if (path === '/api/admin/genre-requests' && request.method === 'GET') {
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const stmt = env.DB.prepare(`
          SELECT id, genre_name, description, reason, requested_by, requester_name, requester_email,
                 status, created_at, reviewed_by, reviewed_at, notes
          FROM genre_requests
          ORDER BY 
            CASE status WHEN 'pending' THEN 1 ELSE 2 END,
            created_at DESC
        `);
        
        const result = await stmt.all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error fetching genre requests:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch genre requests' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path.match(/^\/api\/admin\/genre-requests\/\d+\/approve$/) && request.method === 'POST') {
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const requestId = parseInt(path.split('/')[4]);
        const body = await request.json() as any;
        const { notes, createGenre } = body;

        // Get the genre request
        const requestStmt = env.DB.prepare('SELECT * FROM genre_requests WHERE id = ? AND status = ?');
        const genreRequest = await requestStmt.bind(requestId, 'pending').first() as any;
        
        if (!genreRequest) {
          return new Response(JSON.stringify({ error: 'Genre request not found or already processed' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // If createGenre is true, create the genre
        let genreId = null;
        if (createGenre) {
          const genreService = new GenreService(env.DB);
          const newGenre = await genreService.createGenre({
            name: genreRequest.genre_name,
            description: genreRequest.description
          }, userId);
          genreId = newGenre.id;
        }

        // Update request status
        const updateStmt = env.DB.prepare(`
          UPDATE genre_requests 
          SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, notes = ?
          WHERE id = ?
        `);
        
        await updateStmt.bind(userId, notes || null, requestId).run();

        return new Response(JSON.stringify({ 
          message: 'Genre request approved successfully',
          genreId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error approving genre request:', error);
        return new Response(JSON.stringify({ error: 'Failed to approve genre request' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path.match(/^\/api\/admin\/genre-requests\/\d+\/reject$/) && request.method === 'POST') {
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const requestId = parseInt(path.split('/')[4]);
        const body = await request.json() as any;
        const { notes } = body;

        // Update request status
        const updateStmt = env.DB.prepare(`
          UPDATE genre_requests 
          SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, notes = ?
          WHERE id = ? AND status = 'pending'
        `);
        
        const result = await updateStmt.bind(userId, notes || null, requestId).run();
        
        if (!result.changes) {
          return new Response(JSON.stringify({ error: 'Genre request not found or already processed' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ message: 'Genre request rejected successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error rejecting genre request:', error);
        return new Response(JSON.stringify({ error: 'Failed to reject genre request' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get genre deletion info (book count) for confirmation
    if (path.match(/^\/api\/admin\/genres\/\d+\/delete-info$/) && request.method === 'GET') {
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const genreId = parseInt(path.split('/')[4]);
        
        // Check how many books have this genre
        const bookCountStmt = env.DB.prepare(`
          SELECT COUNT(*) as count 
          FROM book_genres 
          WHERE genre_id = ?
        `);
        const bookCount = await bookCountStmt.bind(genreId).first() as any;
        const affectedBooks = bookCount?.count || 0;

        // Get some example book titles
        const examplesStmt = env.DB.prepare(`
          SELECT b.title, b.authors
          FROM books b
          JOIN book_genres bg ON b.id = bg.book_id
          WHERE bg.genre_id = ?
          LIMIT 5
        `);
        const examples = await examplesStmt.bind(genreId).all();

        return new Response(JSON.stringify({ 
          affectedBooks,
          examples: examples.results || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error getting genre delete info:', error);
        return new Response(JSON.stringify({ error: 'Failed to get genre info' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path.match(/^\/api\/admin\/genres\/\d+$/) && request.method === 'DELETE') {
      const genreService = new GenreService(env.DB);
      try {
        // Check if user is super admin
        const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
        if (!user || user.user_role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const genreId = parseInt(path.split('/')[4]);
        
        // Check how many books have this genre
        const bookCountStmt = env.DB.prepare(`
          SELECT COUNT(*) as count 
          FROM book_genres 
          WHERE genre_id = ?
        `);
        const bookCount = await bookCountStmt.bind(genreId).first() as any;
        const affectedBooks = bookCount?.count || 0;

        // Check if genre exists (don't filter by is_active since we want to delete it)
        const genreExistsStmt = env.DB.prepare('SELECT id FROM curated_genres WHERE id = ?');
        const genreExists = await genreExistsStmt.bind(genreId).first();
        if (!genreExists) {
          return new Response(JSON.stringify({ error: 'Genre not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Delete all book-genre assignments for this genre
        const deleteAssignmentsStmt = env.DB.prepare('DELETE FROM book_genres WHERE genre_id = ?');
        await deleteAssignmentsStmt.bind(genreId).run();

        // Delete the genre
        const deleteGenreStmt = env.DB.prepare('DELETE FROM curated_genres WHERE id = ?');
        const result = await deleteGenreStmt.bind(genreId).run();

        const changes = result.meta?.changes || result.changes || 0;
        if (!changes) {
          return new Response(JSON.stringify({ error: 'Failed to delete genre' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Invalidate caches since genre deletion affects both genres and books
        try {
          const cache = new CacheManager(env);
          const invalidator = new CacheInvalidator(cache);
          
          // Invalidate genre caches
          await invalidator.invalidateGenres();
          
          // Invalidate all user book caches since books will no longer show this genre
          await cache.delPrefix('library:');
        } catch (cacheError) {
          console.warn('Cache invalidation failed after genre deletion:', cacheError);
          // Don't fail the operation if cache invalidation fails
        }

        return new Response(JSON.stringify({ 
          message: 'Genre deleted successfully',
          affectedBooks 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error deleting genre:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete genre' }), {
          status: 500,
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
      return await getCachedAdminAnalytics(userId, env, corsHeaders);
    }

    // Admin-only enhanced users endpoint
    if (path === '/api/admin/users' && request.method === 'GET') {
      return await getCachedAdminUsers(userId, env, corsHeaders);
    }

    // Admin-only user role management endpoint
    if (path.match(/^\/api\/admin\/users\/[^\/]+\/role$/) && request.method === 'PUT') {
      const targetUserId = path.split('/')[4];
      return await updateUserRole(request, targetUserId, userId, env, corsHeaders);
    }

    // Admin-only user enable/disable endpoint
    if (path.match(/^\/api\/admin\/users\/[^\/]+\/status$/) && request.method === 'PUT') {
      const targetUserId = path.split('/')[4];
      return await toggleUserActiveStatus(request, targetUserId, userId, env, corsHeaders);
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
      const response = await assignLocationToUser(targetUserId, locationId, userId, env, corsHeaders);
      
      // Invalidate admin cache after location assignment
      if (response.ok) {
        await invalidateAllAdminAnalytics(env);
      }
      
      return response;
    }

    if (path.match(/^\/api\/admin\/users\/[^\/]+\/locations\/[^\/]+$/) && request.method === 'DELETE') {
      const targetUserId = path.split('/')[4];
      const locationId = path.split('/')[6];
      const response = await unassignLocationFromUser(targetUserId, locationId, userId, env, corsHeaders);
      
      // Invalidate admin cache after location unassignment
      if (response.ok) {
        await invalidateAllAdminAnalytics(env);
      }
      
      return response;
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

    // Global permissions endpoints
    if (path === '/api/permissions/global' && request.method === 'GET') {
      return await getUserGlobalPermissions(request, userId, env, corsHeaders);
    }

    if (path === '/api/permissions/global') {
      switch (request.method) {
        case 'POST':
          return await grantGlobalPermission(request, userId, env, corsHeaders);
        case 'DELETE':
          return await revokeGlobalPermission(request, userId, env, corsHeaders);
      }
    }

    // Notification preference endpoints
    if (path === '/api/notifications/preferences' && request.method === 'GET') {
      return await getUserNotificationPreferences(request, userId, env, corsHeaders);
    }
    if (path === '/api/notifications/preferences' && request.method === 'PUT') {
      return await updateNotificationPreference(request, userId, env, corsHeaders);
    }
    if (path === '/api/notifications/settings' && request.method === 'GET') {
      return await getNotificationSettings(request, userId, env, corsHeaders);
    }
    if (path === '/api/notifications/preferences/reset' && request.method === 'POST') {
      return await resetNotificationPreferences(request, userId, env, corsHeaders);
    }

    // In-app notification endpoints
    if (path === '/api/notifications/in-app' && request.method === 'GET') {
      return await getInAppNotifications(request, userId, env, corsHeaders);
    }
    if (path === '/api/notifications/unread-count' && request.method === 'GET') {
      return await getUnreadCount(request, userId, env, corsHeaders);
    }
    if (path === '/api/notifications/mark-read' && request.method === 'POST') {
      return await markNotificationRead(request, userId, env, corsHeaders);
    }
    if (path === '/api/notifications/mark-all-read' && request.method === 'POST') {
      return await markAllNotificationsRead(request, userId, env, corsHeaders);
    }
    if (path === '/api/notifications/test' && request.method === 'POST') {
      return await createTestNotification(request, userId, env, corsHeaders);
    }

    // Admin cache management endpoints
    if (path === '/api/admin/cache/warm' && request.method === 'POST') {
      if (!(await getCachedIsUserAdmin(userId, env))) {
        return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      try {
        await warmAdminCache(userId, env);
        return new Response(JSON.stringify({ message: 'Cache warmed successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to warm cache' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path === '/api/admin/cache/metrics' && request.method === 'GET') {
      if (!(await getCachedIsUserAdmin(userId, env))) {
        return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      try {
        const metrics = await getAdminCacheMetrics(userId, env);
        return new Response(JSON.stringify(metrics), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get cache metrics' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Admin series approval endpoints
    if (path === '/api/admin/series/pending' && request.method === 'GET') {
      return await getPendingSeries(userId, env, corsHeaders);
    }
    if (path.match(/^\/api\/admin\/series\/[^\/]+\/approve$/) && request.method === 'POST') {
      const seriesId = path.split('/')[4];
      const body = await request.json() as any;
      return await approveRejectSeries(seriesId, userId, body, env, corsHeaders);
    }

    // OpenLibrary Analytics endpoint (development only)
    if (path === '/api/admin/openlibrary-analytics' && request.method === 'GET') {
      // Check admin permission
      const user = await env.DB.prepare(`
        SELECT user_role FROM users WHERE id = ?
      `).bind(userId).first() as any;
      
      if (!user || user.user_role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const analytics = getSessionAnalytics();
        // Also log to worker console for debugging
        logSessionAnalytics();
        
        return new Response(JSON.stringify({
          ...analytics,
          recommendation: analytics.savingsPercentage > 70 
            ? 'Excellent optimization performance'
            : analytics.savingsPercentage > 50
            ? 'Good optimization performance' 
            : 'Consider reviewing optimization strategies'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get OpenLibrary analytics' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Route not handled by admin router
    return null;
  }
}