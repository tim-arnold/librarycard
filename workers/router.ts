import { Env } from './types';
import { AuthRouter } from './auth/router';
import { BooksRouter } from './books/router';
import { AdminRouter } from './admin/router';
import { LocationsRouter } from './locations/router';
import { ProfileRouter } from './profile/router';
import { SeriesRouter } from './series/router';
import { getUserFromRequest } from './auth';
import { RateLimiter } from './auth/rate-limiter';
import { withGlobalErrorHandling, ErrorCategory, createSecureErrorResponse } from './errors';
import { getCachedGenreService } from './cache/genres';

/**
 * Main Router - Orchestration layer for all endpoint routers
 * Routes requests to appropriate specialized routers while preserving exact behavior
 */
export class MainRouter {
  
  /**
   * Route a request to the appropriate handler
   */
  static async route(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Declare userId at function scope so it's accessible in catch block
    let userId: string | null = null;
    
    // EXACT COPY FROM ORIGINAL - Secure CORS configuration
    const getAllowedOrigin = (requestOrigin: string | null, frontendUrl: string): string => {
      // If no origin header (server-to-server requests), allow
      if (!requestOrigin) {
        return frontendUrl;
      }
      
      // Check if the request origin matches our frontend URL
      if (requestOrigin === frontendUrl) {
        return requestOrigin;
      }
      
      // For local development, also allow localhost variations
      if (env.ENVIRONMENT === 'local') {
        const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
        if (localOrigins.includes(requestOrigin)) {
          return requestOrigin;
        }
      }
      
      // Default to frontend URL if origin doesn't match
      return frontendUrl;
    };

    const frontendUrl = env.APP_URL;
    const origin = request.headers.get('Origin');
    const allowedOrigin = getAllowedOrigin(origin, frontendUrl);

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only log requests in local development
    if (env.ENVIRONMENT === 'local') {
      console.log('🚀 Worker request:', method, path);
    }

    try {
      // === PUBLIC ENDPOINTS (no authentication required) ===
      
      // Health check endpoint
      if (path === '/health' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Public genres endpoint  
      if (path === '/api/genres' && method === 'GET') {
        const cachedGenreService = getCachedGenreService(env);
        const genres = await cachedGenreService.getAllActiveGenres();
        return new Response(JSON.stringify(genres), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Public invitation details endpoint (no auth required to view invitation info)
      if (path === '/api/invitations/details' && method === 'GET') {
        const { LocationsRouter } = await import('./locations/router');
        const response = await LocationsRouter.handleLocationsEndpoints(
          request, env, corsHeaders, '' // Empty userId for public endpoint
        );
        if (response) {
          return response;
        }
      }

      // Initialize rate limiter for auth endpoints
      const rateLimiter = new RateLimiter(env);
      const clientId = rateLimiter.getClientIdentifier(request);

      // Try public auth endpoints first
      const publicAuthResponse = await AuthRouter.handleAuthEndpoints(
        request, env, corsHeaders, rateLimiter, clientId, null
      );
      if (publicAuthResponse) {
        return publicAuthResponse;
      }

      // === PROTECTED ENDPOINTS (authentication required) ===
      
      // Get authenticated user
      try {
        userId = await getUserFromRequest(request, env);
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Route to appropriate specialized router based on path patterns
      
      // Auth endpoints (protected)
      const protectedAuthResponse = await AuthRouter.handleProtectedAuthEndpoints(
        request, env, corsHeaders, rateLimiter, clientId, userId
      );
      if (protectedAuthResponse) {
        return protectedAuthResponse;
      }

      // Books endpoints
      if (path.startsWith('/api/books') || path.startsWith('/api/book-')) {
        const booksResponse = await BooksRouter.handleBooksEndpoints(
          request, env, corsHeaders, userId
        );
        if (booksResponse) {
          return booksResponse;
        }
      }

      // Admin endpoints  
      if (path.startsWith('/api/admin') || 
          path.startsWith('/api/signup-requests') ||
          path.startsWith('/api/permissions') ||
          path.startsWith('/api/notifications')) {
        const adminResponse = await AdminRouter.handleAdminEndpoints(
          request, env, corsHeaders, userId
        );
        if (adminResponse) {
          return adminResponse;
        }
      }

      // Locations endpoints
      if (path.startsWith('/api/locations') || 
          path.startsWith('/api/shelves') ||
          path.startsWith('/api/invitations')) {
        const locationsResponse = await LocationsRouter.handleLocationsEndpoints(
          request, env, corsHeaders, userId
        );
        if (locationsResponse) {
          return locationsResponse;
        }
      }

      // Profile endpoints
      if (path.startsWith('/api/profile') || 
          path.startsWith('/api/dashboard') ||
          path.startsWith('/api/user/')) {
        const profileResponse = await ProfileRouter.handleProfileEndpoints(
          request, env, corsHeaders, userId
        );
        if (profileResponse) {
          return profileResponse;
        }
      }

      // Series endpoints
      if (path.startsWith('/api/series')) {
        const seriesResponse = await SeriesRouter.handleSeriesEndpoints(
          request, env, corsHeaders, userId
        );
        if (seriesResponse) {
          return seriesResponse;
        }
      }

      // === FALLBACK: No router handled the request ===
      console.warn(`🔍 Unhandled route: ${method} ${path}`);
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // === GLOBAL ERROR HANDLING ===
      console.error('🚨 Router Error:', error);
      
      // Note: userId might be null or undefined if error occurs before authentication
      const userContext = userId || undefined;
      return createSecureErrorResponse(
        env,
        error,
        ErrorCategory.SERVER_ERROR,
        { endpoint: path, userId: userContext }
      );
    }
  }
}