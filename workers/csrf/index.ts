// CSRF Protection for State-Changing Operations
// Provides additional security layer against cross-site request forgery attacks

import { Env } from '../types';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Generate a cryptographically secure CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Store CSRF token in KV with expiry
export async function storeCSRFToken(env: Env, userId: string, token: string): Promise<void> {
  const key = `csrf_token:${userId}`;
  const data = {
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY
  };
  
  // Store with TTL
  await env.CACHE.put(key, JSON.stringify(data), {
    expirationTtl: Math.ceil(CSRF_TOKEN_EXPIRY / 1000)
  });
}

// Validate CSRF token
export async function validateCSRFToken(env: Env, userId: string, providedToken: string): Promise<boolean> {
  if (!providedToken || !userId) {
    return false;
  }

  const key = `csrf_token:${userId}`;
  
  try {
    const dataStr = await env.CACHE.get(key);
    if (!dataStr) {
      return false;
    }

    const data = JSON.parse(dataStr);
    const now = Date.now();

    // Check if token has expired
    if (now > data.expiresAt) {
      // Clean up expired token
      await env.CACHE.delete(key);
      return false;
    }

    // Compare tokens using constant-time comparison to prevent timing attacks
    return constantTimeEqual(data.token, providedToken);
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// Generate and store a new CSRF token for a user
export async function issueCSRFToken(env: Env, userId: string): Promise<string> {
  const token = generateCSRFToken();
  await storeCSRFToken(env, userId, token);
  return token;
}

// Middleware to check CSRF token for state-changing operations
export async function requireCSRFToken(
  request: Request, 
  env: Env, 
  userId: string,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  // Only check CSRF for state-changing methods
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return null; // No CSRF check needed for safe methods
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get('X-CSRF-Token') || request.headers.get('X-Requested-With');
  
  // For AJAX requests with X-Requested-With: XMLHttpRequest, we can be more lenient
  // This header is difficult for attackers to forge cross-origin
  const isXMLHttpRequest = request.headers.get('X-Requested-With') === 'XMLHttpRequest';
  
  if (isXMLHttpRequest) {
    // XMLHttpRequest header provides some CSRF protection
    return null;
  }

  // Validate CSRF token
  if (!csrfToken || !(await validateCSRFToken(env, userId, csrfToken))) {
    return new Response(JSON.stringify({
      error: 'CSRF token missing or invalid',
      code: 'CSRF_TOKEN_REQUIRED'
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return null; // CSRF check passed
}

// Get CSRF token endpoint (for frontend to obtain tokens)
export async function getCSRFTokenEndpoint(
  env: Env, 
  userId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const token = await issueCSRFToken(env, userId);
    
    return new Response(JSON.stringify({
      csrfToken: token,
      expiresIn: CSRF_TOKEN_EXPIRY
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate CSRF token'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Check if endpoint should be protected with CSRF
export function shouldProtectWithCSRF(path: string, method: string): boolean {
  // Skip CSRF for authentication endpoints (they have other protections)
  if (path.startsWith('/api/auth/')) {
    return false;
  }

  // Skip CSRF for invitation endpoints (part of auth flow)
  if (path.startsWith('/api/invitations/')) {
    return false;
  }

  // Skip CSRF for safe methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    return false;
  }

  // Protect all other state-changing operations
  return true;
}