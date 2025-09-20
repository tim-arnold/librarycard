import { Env } from '../types';
import { checkUserExists } from '../auth-utils';
import {
  createOrUpdateUser,
  registerUser,
  verifyCredentials,
  verifyEmail,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
  complete2FALogin
} from '../auth-core';
import { WebAuthnService } from '../auth/webauthn';
import { generateJWT } from '../auth/jwt';
import { type AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { sendContactEmail } from '../email';
import { getUserFromRequest } from '../auth';
import { invalidateUserCache } from '../auth/cached';
import { TwoFactorAuth } from '../auth/two-factor';
import { requireCSRFToken, getCSRFTokenEndpoint, shouldProtectWithCSRF } from '../csrf';
import { getWorkerFrontendUrl, detectWorkerEnvironment } from '../utils/domainConfig';

/**
 * Auth Router - Handles all authentication-related endpoints
 * STRICT REPLICATION: Exact copy-paste from workers/index.original.ts
 */
export class AuthRouter {
  
  static async handleAuthEndpoints(
    request: Request, 
    env: Env, 
    corsHeaders: Record<string, string>,
    rateLimiter: any,
    clientId: string,
    userId: string | null
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    // EXACT COPY FROM ORIGINAL - Public auth endpoints (no authentication required)
    if (path === '/api/users' && request.method === 'POST') {
      return await createOrUpdateUser(request, env, corsHeaders);
    }

    if (path === '/api/auth/register' && request.method === 'POST') {
      // Rate limit registration attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-register');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        // Add CORS headers to rate limit response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await registerUser(request, env, corsHeaders);
    }

    if (path === '/api/auth/verify' && request.method === 'POST') {
      // Rate limit login attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-login');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        // Add CORS headers to rate limit response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await verifyCredentials(request, env, corsHeaders);
    }

    if (path === '/api/auth/verify-email' && request.method === 'GET') {
      return await verifyEmail(request, env, corsHeaders);
    }

    if (path === '/api/users/check' && request.method === 'GET') {
      return await checkUserExists(request, env, corsHeaders);
    }

    // Password reset endpoints (public)
    if (path === '/api/auth/forgot-password' && request.method === 'POST') {
      // Rate limit forgot password attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-forgot-password');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        // Add CORS headers to rate limit response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await forgotPassword(request, env, corsHeaders);
    }

    if (path === '/api/auth/verify-reset-token' && request.method === 'GET') {
      return await verifyResetToken(request, env, corsHeaders);
    }

    if (path === '/api/auth/reset-password' && request.method === 'POST') {
      // Rate limit password reset attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-reset-password');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        // Add CORS headers to rate limit response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await resetPassword(request, env, corsHeaders);
    }

    // Contact form endpoint (public)
    if (path === '/api/contact' && request.method === 'POST') {
      return await sendContactEmail(request, env, corsHeaders);
    }

    // 2FA login completion endpoint (public - for completing login)
    if (path === '/api/auth/2fa/complete-login' && request.method === 'POST') {
      // Rate limit 2FA completion attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-2fa-verify');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await complete2FALogin(request, env, corsHeaders);
    }

    // WebAuthn endpoints (public for authentication, some require auth for registration)
    
    // WebAuthn authentication start (public - for login)
    if (path === '/api/auth/webauthn/authenticate/begin' && request.method === 'POST') {
      try {
        const url = new URL(request.url);
        const rpName = 'LibraryCard';
        // Set rpID based on environment - use frontend hostname for WebAuthn
        const frontendUrl = getWorkerFrontendUrl(env);
        const rpID = detectWorkerEnvironment(env) === 'local' ? 'localhost' : new URL(frontendUrl).hostname;
        const origin = frontendUrl;
        
        const webAuthnService = new WebAuthnService(env.DB, rpName, rpID, origin);
        
        const body = await request.json() as { email?: string };
        const options = await webAuthnService.generateAuthenticationOptions(undefined, body.email);
        
        return new Response(JSON.stringify(options), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('WebAuthn authentication begin error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate authentication options' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // WebAuthn authentication complete (public - for login)  
    if (path === '/api/auth/webauthn/authenticate/finish' && request.method === 'POST') {
      try {
        const url = new URL(request.url);
        const rpName = 'LibraryCard';
        // Set rpID based on environment - use frontend hostname for WebAuthn
        const frontendUrl = getWorkerFrontendUrl(env);
        const rpID = detectWorkerEnvironment(env) === 'local' ? 'localhost' : new URL(frontendUrl).hostname;
        const origin = frontendUrl;
        
        const webAuthnService = new WebAuthnService(env.DB, rpName, rpID, origin);
        
        const response = await request.json() as AuthenticationResponseJSON;
        const verification = await webAuthnService.verifyAuthenticationResponse(response);
        
        if (verification.success && verification.userId) {
          // Get user information for JWT payload
          const userStmt = env.DB.prepare('SELECT email, user_role FROM users WHERE id = ?');
          const user = await userStmt.bind(verification.userId).first() as { email: string; user_role: string } | null;
          
          if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Generate JWT token for successful authentication
          const token = await generateJWT({ 
            userId: verification.userId, 
            email: user.email, 
            role: user.user_role 
          }, env);
          
          return new Response(JSON.stringify({ 
            success: true, 
            token,
            userId: verification.userId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ success: false, error: 'Authentication failed' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error: any) {
        console.error('WebAuthn authentication finish error:', error);
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Route not handled by auth router
    return null;
  }

  // EXACT COPY FROM ORIGINAL - Protected auth endpoints (require userId)
  static async handleProtectedAuthEndpoints(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>,
    rateLimiter: any,
    clientId: string,
    userId: string
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CSRF token endpoint (for frontend to obtain tokens)
    if (path === '/api/csrf-token' && request.method === 'GET') {
      return await getCSRFTokenEndpoint(env, userId, corsHeaders);
    }

    // CSRF protection for state-changing operations
    if (shouldProtectWithCSRF(path, request.method)) {
      const csrfCheck = await requireCSRFToken(request, env, userId, corsHeaders);
      if (csrfCheck) {
        return csrfCheck; // CSRF check failed
      }
    }

    // 2FA/Two-Factor Authentication endpoints
    const twoFactorAuth = new TwoFactorAuth(env);

    if (path === '/api/auth/2fa/status' && request.method === 'GET') {
      return await twoFactorAuth.getStatus(userId, corsHeaders);
    }

    if (path === '/api/auth/2fa/setup' && request.method === 'GET') {
      return await twoFactorAuth.initializeSetup(userId, corsHeaders);
    }

    if (path === '/api/auth/2fa/setup' && request.method === 'POST') {
      // No rate limiting for 2FA setup since user is already authenticated
      return await twoFactorAuth.completeSetup(request, userId, corsHeaders);
    }

    if (path === '/api/auth/2fa/verify' && request.method === 'POST') {
      // Rate limit 2FA verification attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-2fa-verify');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await twoFactorAuth.verifyTOTP(request, userId, corsHeaders);
    }

    if (path === '/api/auth/2fa/verify-backup' && request.method === 'POST') {
      // Rate limit backup code verification attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-2fa-verify');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await twoFactorAuth.verifyBackupCode(request, userId, corsHeaders);
    }

    if (path === '/api/auth/2fa/disable' && request.method === 'POST') {
      // Rate limit 2FA disable attempts
      const rateLimitResult = await rateLimiter.checkRateLimit(clientId, 'auth-2fa-disable');
      if (!rateLimitResult.allowed) {
        const response = rateLimiter.createRateLimitResponse(rateLimitResult.resetTime!);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      return await twoFactorAuth.disable2FA(request, userId, corsHeaders);
    }

    if (path === '/api/auth/2fa/backup-codes' && request.method === 'POST') {
      return await twoFactorAuth.regenerateBackupCodes(userId, corsHeaders);
    }

    // WebAuthn/Passkey endpoints (protected - require authentication)
    
    // WebAuthn registration start (protected)
    if (path === '/api/auth/webauthn/register/begin' && request.method === 'POST') {
      try {
        const url = new URL(request.url);
        const rpName = 'LibraryCard';
        // Set rpID based on environment - use frontend hostname for WebAuthn
        const frontendUrl = getWorkerFrontendUrl(env);
        const rpID = detectWorkerEnvironment(env) === 'local' ? 'localhost' : new URL(frontendUrl).hostname;
        const origin = frontendUrl;
        
        const webAuthnService = new WebAuthnService(env.DB, rpName, rpID, origin);
        
        // Get user details for registration
        const userStmt = env.DB.prepare('SELECT email, first_name, last_name FROM users WHERE id = ?');
        const user = await userStmt.bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const displayName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.email;
        
        const options = await webAuthnService.generateRegistrationOptions(
          userId, 
          user.email, 
          displayName
        );
        
        return new Response(JSON.stringify(options), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('WebAuthn registration begin error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate registration options' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // WebAuthn registration complete (protected)
    if (path === '/api/auth/webauthn/register/finish' && request.method === 'POST') {
      try {
        const url = new URL(request.url);
        const rpName = 'LibraryCard';
        // Set rpID based on environment - use frontend hostname for WebAuthn
        const frontendUrl = getWorkerFrontendUrl(env);
        const rpID = detectWorkerEnvironment(env) === 'local' ? 'localhost' : new URL(frontendUrl).hostname;
        const origin = frontendUrl;
        
        const webAuthnService = new WebAuthnService(env.DB, rpName, rpID, origin);
        
        const body = await request.json() as { response: any; deviceName?: string };
        const verification = await webAuthnService.verifyRegistrationResponse(
          userId, 
          body.response,
          body.deviceName
        );
        
        if (verification.success) {
          return new Response(JSON.stringify({ 
            success: true, 
            credentialId: verification.credentialId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ success: false, error: 'Registration failed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error: any) {
        console.error('WebAuthn registration finish error:', error);
        return new Response(JSON.stringify({ error: 'Registration failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get user's WebAuthn credentials (protected)
    if (path === '/api/auth/webauthn/credentials' && request.method === 'GET') {
      try {
        const url = new URL(request.url);
        const rpName = 'LibraryCard';
        // Set rpID based on environment - use frontend hostname for WebAuthn
        const frontendUrl = getWorkerFrontendUrl(env);
        const rpID = detectWorkerEnvironment(env) === 'local' ? 'localhost' : new URL(frontendUrl).hostname;
        const origin = frontendUrl;
        
        const webAuthnService = new WebAuthnService(env.DB, rpName, rpID, origin);
        const credentials = await webAuthnService.getUserCredentials(userId);
        
        // Return safe credential data (exclude sensitive information)
        const safeCredentials = credentials.map(cred => ({
          id: cred.id,
          device_name: cred.device_name,
          device_type: cred.device_type,
          created_at: cred.created_at,
          last_used_at: cred.last_used_at
        }));
        
        return new Response(JSON.stringify(safeCredentials), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('WebAuthn get credentials error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get credentials' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Delete WebAuthn credential (protected)
    if (path.match(/^\/api\/auth\/webauthn\/credentials\/(.+)$/) && request.method === 'DELETE') {
      try {
        const rawId = path.split('/')[5];
        const credentialDbId = parseInt(rawId);
        
        console.log(`🔍 WebAuthn Debug: DELETE request for credential ID ${credentialDbId} (raw: ${rawId})`);
        
        if (isNaN(credentialDbId)) {
          return new Response(JSON.stringify({ error: 'Invalid credential ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const url = new URL(request.url);
        const rpName = 'LibraryCard';
        // Set rpID based on environment - use frontend hostname for WebAuthn
        const frontendUrl = getWorkerFrontendUrl(env);
        const rpID = detectWorkerEnvironment(env) === 'local' ? 'localhost' : new URL(frontendUrl).hostname;
        const origin = frontendUrl;
        
        const webAuthnService = new WebAuthnService(env.DB, rpName, rpID, origin);
        const success = await webAuthnService.deleteCredentialById(userId, credentialDbId);
        
        if (success) {
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ error: 'Credential not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error: any) {
        console.error('WebAuthn delete credential error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete credential' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Change password endpoint (authenticated users only)
    if (path === '/api/auth/change-password' && request.method === 'POST') {
      return await changePassword(request, userId, env, corsHeaders);
    }
    
    // Logout endpoint (authenticated users only) - clears user cache
    if (path === '/api/auth/logout' && request.method === 'POST') {
      try {
        await invalidateUserCache(userId, env);
        return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Logout cache invalidation error:', error);
        return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Route not handled by auth router
    return null;
  }
}