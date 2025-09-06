import { Env } from '../types';
import {
  getUserProfile,
  updateUserProfile,
  getDashboardData,
  getUserRejectedReviews
} from '../profile';

/**
 * Profile Router - Handles all user profile and dashboard endpoints
 * STRICT REPLICATION: Exact copy-paste from workers/index.original.ts
 */
export class ProfileRouter {
  
  static async handleProfileEndpoints(
    request: Request, 
    env: Env, 
    corsHeaders: Record<string, string>,
    userId: string
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    // EXACT COPY FROM ORIGINAL - Profile endpoints
    if (path === '/api/profile' && request.method === 'GET') {
      return await getUserProfile(userId, env, corsHeaders);
    }

    if (path === '/api/profile' && request.method === 'PUT') {
      return await updateUserProfile(request, userId, env, corsHeaders);
    }

    if (path === '/api/user/rejected-reviews' && request.method === 'GET') {
      return await getUserRejectedReviews(userId, env, corsHeaders);
    }

    // Batched dashboard endpoint - combines all initial page load data
    if (path === '/api/dashboard' && request.method === 'GET') {
      const fields = url.searchParams.get('fields');
      return await getDashboardData(userId, env, corsHeaders, fields || undefined);
    }

    // Route not handled by profile router
    return null;
  }
}