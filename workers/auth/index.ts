import { Env } from '../types';
import { verifyJWT } from './jwt';

// Enhanced authentication helper with JWT support
export async function getUserFromRequest(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (env.ENVIRONMENT === 'local') {
      console.log('🔍 Auth: No valid Authorization header found');
    }
    return null;
  }
  
  const token = authHeader.substring(7);
  
  // First try to verify as JWT
  const jwtPayload = await verifyJWT(token, env);
  if (jwtPayload) {
    if (env.ENVIRONMENT === 'local') {
      console.log('🔍 Auth: Valid JWT token for user:', jwtPayload.userId);
    }
    return jwtPayload.userId;
  }
  
  // Fallback: If token looks like an email, look up the user ID (backward compatibility)
  if (token.includes('@')) {
    try {
      const user = await env.DB.prepare(`
        SELECT id FROM users WHERE email = ?
      `).bind(token).first();
      
      if (env.ENVIRONMENT === 'local') {
        console.log('🔍 Auth: Email lookup result (legacy):', { email: token, found: !!user });
      }
      
      return user ? user.id as string : null;
    } catch (error) {
      if (env.ENVIRONMENT === 'local') {
        console.error('🔍 Auth: Database error:', error);
      }
      return null;
    }
  }
  
  // Last fallback: assume it's already a user ID
  if (env.ENVIRONMENT === 'local') {
    console.log('🔍 Auth: Using token as user ID (legacy):', token);
  }
  return token;
}

// Permission helper functions
export async function getUserRole(userId: string, env: Env): Promise<string> {
  const user = await env.DB.prepare(`
    SELECT user_role FROM users WHERE id = ?
  `).bind(userId).first();
  
  return (user as any)?.user_role || 'user';
}

export async function isUserAdmin(userId: string, env: Env): Promise<boolean> {
  const role = await getUserRole(userId, env);
  return role === 'admin' || role === 'super_admin';
}

export async function isUserSuperAdmin(userId: string, env: Env): Promise<boolean> {
  const role = await getUserRole(userId, env);
  return role === 'super_admin';
}

export async function canManageLocation(userId: string, locationId: number, env: Env): Promise<boolean> {
  const role = await getUserRole(userId, env);
  
  // Super admins can manage all locations
  if (role === 'super_admin') {
    return true;
  }
  
  // Regular admins can manage locations they own or are members of
  if (role === 'admin') {
    const locationAccess = await env.DB.prepare(`
      SELECT 1 FROM locations WHERE id = ? AND owner_id = ?
      UNION
      SELECT 1 FROM location_members WHERE location_id = ? AND user_id = ?
    `).bind(locationId, userId, locationId, userId).first();
    
    return !!locationAccess;
  }
  
  return false;
}