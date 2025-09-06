import { Env } from '../types';
import {
  getUserLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationShelves,
  createShelf,
  updateShelf,
  deleteShelf,
  setLocationDefaultPermission,
  getLocationDefaultPermissionsAPI,
  updateLocationDefaultPermissions,
  leaveLocation
} from '../locations';
import {
  createLocationInvitation,
  acceptLocationInvitation,
  getLocationInvitations,
  revokeLocationInvitation
} from '../invitations';

/**
 * Locations Router - Handles all location and shelf-related endpoints
 * STRICT REPLICATION: Exact copy-paste from workers/index.original.ts
 */
export class LocationsRouter {
  
  static async handleLocationsEndpoints(
    request: Request, 
    env: Env, 
    corsHeaders: Record<string, string>,
    userId: string
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    // EXACT COPY FROM ORIGINAL - Location endpoints
    if (path === '/api/locations' && request.method === 'GET') {
      return await getUserLocations(userId, env, corsHeaders);
    }

    if (path === '/api/locations' && request.method === 'POST') {
      return await createLocation(request, userId, env, corsHeaders);
    }

    // Location default permissions endpoints (must come before general location routes)
    if (path.match(/^\/api\/locations\/\d+\/default-permissions$/) && request.method === 'POST') {
      const locationId = parseInt(path.split('/')[3]);
      return await setLocationDefaultPermission(request, locationId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/locations\/\d+\/default-permissions$/) && request.method === 'GET') {
      const locationId = parseInt(path.split('/')[3]);
      return await getLocationDefaultPermissionsAPI(locationId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/locations\/\d+\/default-permissions$/) && request.method === 'PUT') {
      const locationId = parseInt(path.split('/')[3]);
      return await updateLocationDefaultPermissions(request, locationId, userId, env, corsHeaders);
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

    // Route not handled by locations router
    return null;
  }
}