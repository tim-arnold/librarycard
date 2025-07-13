/**
 * Dedicated Permissions Worker
 * Handles all permission management endpoints for location-specific capabilities
 */

import { Env } from './types';
import { getUserFromRequest } from './auth';
import {
  getLocationAdminCapabilities,
  grantAdminCapability,
  revokeAdminCapability,
  getLocationUserPermissions,
  grantUserPermission,
  revokeUserPermission,
  checkUserPermission
} from './permissions';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Authentication check
      const userResult = await getUserFromRequest(request, env);
      if (!userResult.success || !userResult.user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = userResult.user.id;

      // Permission Management Endpoints

      // Location Admin Capabilities Management (Super Admin Only)
      if (path === '/api/admin/location-admin-capabilities') {
        switch (request.method) {
          case 'GET':
            return await getLocationAdminCapabilities(request, userId, env, corsHeaders);
          case 'POST':
            return await grantAdminCapability(request, userId, env, corsHeaders);
          case 'DELETE':
            return await revokeAdminCapability(request, userId, env, corsHeaders);
          default:
            return new Response('Method not allowed', { 
              status: 405, 
              headers: corsHeaders 
            });
        }
      }

      // Location User Permissions Management (Admin+ with capability)
      if (path === '/api/admin/location-user-permissions') {
        switch (request.method) {
          case 'GET':
            return await getLocationUserPermissions(request, userId, env, corsHeaders);
          case 'POST':
            return await grantUserPermission(request, userId, env, corsHeaders);
          case 'DELETE':
            return await revokeUserPermission(request, userId, env, corsHeaders);
          default:
            return new Response('Method not allowed', { 
              status: 405, 
              headers: corsHeaders 
            });
        }
      }

      // Permission Checking (Any authenticated user)
      if (path === '/api/permissions/check' && request.method === 'GET') {
        return await checkUserPermission(request, userId, env, corsHeaders);
      }

      return new Response('Permission endpoint not found', { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Permissions Worker Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  },
};