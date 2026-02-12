import { Env } from '../types';
import { verifyJWT } from './jwt';

interface UserIdRow {
  id: string;
}

interface UserRoleRow {
  user_role?: string;
}

interface LocationAccessRow {
  [key: string]: any;
}

// Enhanced authentication helper with JWT support
export async function getUserFromRequest(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // First try to verify as JWT
  const jwtPayload = await verifyJWT(token, env);
  if (jwtPayload) {
    // Check if user is still active in database
    try {
      const user = await env.DB.prepare(`
        SELECT id FROM users WHERE id = ? AND (is_active IS NULL OR is_active = TRUE)
      `).bind(jwtPayload.userId).first();

      return user ? (user as UserIdRow).id : null;
    } catch (error) {
      return null;
    }
  }

  // Fallback: If token looks like an email, look up the user ID (backward compatibility)
  if (token.includes('@')) {
    try {
      const user = await env.DB.prepare(`
        SELECT id FROM users WHERE email = ? AND (is_active IS NULL OR is_active = TRUE)
      `).bind(token).first();

      return user ? (user as UserIdRow).id : null;
    } catch (error) {
      return null;
    }
  }

  // Token is not a valid JWT and not an email - reject it
  return null;
}

// Permission helper functions
export async function getUserRole(userId: string, env: Env): Promise<string> {
  const user = await env.DB.prepare(`
    SELECT user_role FROM users WHERE id = ?
  `).bind(userId).first();
  
  return (user as UserRoleRow | null)?.user_role || 'user';
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
    `).bind(locationId, userId, locationId, userId).first() as LocationAccessRow | null;
    
    return !!locationAccess;
  }
  
  return false;
}