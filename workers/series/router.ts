import { Env } from '../types';
import {
  getUserSeries,
  createSeries,
  updateSeries,
  deleteSeries,
  addBooksToSeries,
  removeBookFromSeries,
  getSeriesBooks
} from '../series';

/**
 * Series Router - Handles all series-related endpoints
 * STRICT REPLICATION: Exact copy-paste from workers/index.original.ts
 */
export class SeriesRouter {
  
  static async handleSeriesEndpoints(
    request: Request, 
    env: Env, 
    corsHeaders: Record<string, string>,
    userId: string
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    // EXACT COPY FROM ORIGINAL - Series endpoints
    if (path === '/api/series' && request.method === 'GET') {
      return await getUserSeries(userId, env, corsHeaders);
    }

    if (path === '/api/series' && request.method === 'POST') {
      return await createSeries(request, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/series\/[^\/]+$/) && request.method === 'PUT') {
      const seriesId = path.split('/')[3];
      return await updateSeries(request, seriesId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/series\/[^\/]+$/) && request.method === 'DELETE') {
      const seriesId = path.split('/')[3];
      return await deleteSeries(seriesId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/series\/[^\/]+\/books$/) && request.method === 'POST') {
      const seriesId = path.split('/')[3];
      return await addBooksToSeries(request, seriesId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/series\/[^\/]+\/books\/[^\/]+$/) && request.method === 'DELETE') {
      const seriesId = path.split('/')[3];
      const bookId = path.split('/')[5];
      return await removeBookFromSeries(seriesId, bookId, userId, env, corsHeaders);
    }

    if (path.match(/^\/api\/series\/[^\/]+\/books$/) && request.method === 'GET') {
      const seriesId = path.split('/')[3];
      // Pass the URL for pagination parameters
      const modifiedCorsHeaders = { ...corsHeaders, 'request-url': request.url };
      return await getSeriesBooks(seriesId, userId, env, modifiedCorsHeaders);
    }

    // Route not handled by series router
    return null;
  }
}