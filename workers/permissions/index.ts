import { Env } from '../types';

// Permission checking utilities
export async function isUserSuperAdmin(userId: string, env: Env): Promise<boolean> {
  try {
    const user = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?').bind(userId).first() as any;
    return user?.user_role === 'super_admin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

export async function canUserManageLocationPermissions(userId: string, locationId: number, env: Env): Promise<boolean> {
  try {
    // Super admins can manage all permissions
    if (await isUserSuperAdmin(userId, env)) {
      return true;
    }

    // Check if user has the capability to control user permissions in this location
    const capability = await env.DB.prepare(`
      SELECT 1 FROM location_admin_capabilities 
      WHERE location_id = ? AND user_id = ? AND capability = 'can_control_user_capabilities'
    `).bind(locationId, userId).first();

    return !!capability;
  } catch (error) {
    console.error('Error checking permission management capability:', error);
    return false;
  }
}

export async function canUserManageAdminCapabilities(userId: string, env: Env): Promise<boolean> {
  // Only super admins can manage admin capabilities
  return await isUserSuperAdmin(userId, env);
}

// Get location admin capabilities
export async function getLocationAdminCapabilities(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('location_id');

    if (!locationId) {
      return new Response(JSON.stringify({ error: 'location_id parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only super admins can view admin capabilities
    if (!await canUserManageAdminCapabilities(userId, env)) {
      return new Response(JSON.stringify({ error: 'Super admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First, get all location admins (owners + admin members)
    const locationAdmins = await env.DB.prepare(`
      SELECT DISTINCT
        u.id as user_id,
        u.first_name || ' ' || COALESCE(u.last_name, '') as userName,
        u.email as userEmail,
        CASE 
          WHEN l.owner_id = u.id THEN 'Owner'
          ELSE 'Member'
        END as access_type
      FROM users u
      LEFT JOIN locations l ON l.owner_id = u.id AND l.id = ?
      LEFT JOIN location_members lm ON lm.user_id = u.id AND lm.location_id = ?
      WHERE (l.owner_id = u.id OR lm.user_id = u.id)
        AND u.user_role IN ('admin', 'super_admin')
      ORDER BY u.first_name
    `).bind(locationId, locationId).all();

    // Then get their specific capabilities
    const capabilities = await env.DB.prepare(`
      SELECT 
        lac.user_id,
        lac.capability,
        lac.granted_by,
        lac.granted_at
      FROM location_admin_capabilities lac
      WHERE lac.location_id = ?
    `).bind(locationId).all();

    // Group capabilities by user
    const userCapabilities: any = {};
    
    // Initialize all location admins
    for (const admin of locationAdmins.results) {
      const userId = (admin as any).user_id;
      userCapabilities[userId] = {
        userId,
        userName: (admin as any).userName,
        userEmail: (admin as any).userEmail,
        accessType: (admin as any).access_type,
        capabilities: [],
        grantedBy: null,
        grantedAt: null
      };
    }
    
    // Add their capabilities
    for (const cap of capabilities.results) {
      const userId = (cap as any).user_id;
      if (userCapabilities[userId]) {
        userCapabilities[userId].capabilities.push((cap as any).capability);
        if (!userCapabilities[userId].grantedBy) {
          userCapabilities[userId].grantedBy = (cap as any).granted_by;
          userCapabilities[userId].grantedAt = (cap as any).granted_at;
        }
      }
    }

    return new Response(JSON.stringify({ 
      capabilities: Object.values(userCapabilities) 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting location admin capabilities:', error);
    return new Response(JSON.stringify({ error: 'Failed to get admin capabilities' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Grant admin capability
export async function grantAdminCapability(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const { locationId, targetUserId, capability } = await request.json();

    if (!locationId || !targetUserId || !capability) {
      return new Response(JSON.stringify({ error: 'locationId, targetUserId, and capability required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only super admins can grant admin capabilities
    if (!await canUserManageAdminCapabilities(userId, env)) {
      return new Response(JSON.stringify({ error: 'Super admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate capability type
    const validCapabilities = ['can_control_user_capabilities', 'can_invite_users', 'can_manage_shelves', 'can_manage_location_settings'];
    if (!validCapabilities.includes(capability)) {
      return new Response(JSON.stringify({ error: 'Invalid capability type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify target user is a location admin for this location
    const isLocationAdmin = await env.DB.prepare(`
      SELECT 1 FROM location_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.location_id = ? AND lm.user_id = ? 
      AND (u.user_role = 'admin' OR u.user_role = 'super_admin')
    `).bind(locationId, targetUserId).first();

    if (!isLocationAdmin) {
      return new Response(JSON.stringify({ error: 'Target user must be a location admin' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert or ignore if already exists
    await env.DB.prepare(`
      INSERT OR IGNORE INTO location_admin_capabilities 
      (location_id, user_id, capability, granted_by, granted_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(locationId, targetUserId, capability, userId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error granting admin capability:', error);
    return new Response(JSON.stringify({ error: 'Failed to grant admin capability' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Revoke admin capability
export async function revokeAdminCapability(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const { locationId, targetUserId, capability } = await request.json();

    if (!locationId || !targetUserId || !capability) {
      return new Response(JSON.stringify({ error: 'locationId, targetUserId, and capability required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only super admins can revoke admin capabilities
    if (!await canUserManageAdminCapabilities(userId, env)) {
      return new Response(JSON.stringify({ error: 'Super admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare(`
      DELETE FROM location_admin_capabilities 
      WHERE location_id = ? AND user_id = ? AND capability = ?
    `).bind(locationId, targetUserId, capability).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error revoking admin capability:', error);
    return new Response(JSON.stringify({ error: 'Failed to revoke admin capability' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get user permissions for a location
export async function getLocationUserPermissions(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('location_id');

    if (!locationId) {
      return new Response(JSON.stringify({ error: 'location_id parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user can manage permissions for this location
    if (!await canUserManageLocationPermissions(userId, parseInt(locationId), env)) {
      return new Response(JSON.stringify({ error: 'Permission management access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First, get all location members (excluding admins since they inherit all permissions)
    const locationMembers = await env.DB.prepare(`
      SELECT DISTINCT
        u.id as user_id,
        u.first_name || ' ' || COALESCE(u.last_name, '') as userName,
        u.email as userEmail
      FROM users u
      LEFT JOIN location_members lm ON lm.user_id = u.id AND lm.location_id = ?
      LEFT JOIN locations l ON l.owner_id = u.id AND l.id = ?
      WHERE (lm.user_id = u.id OR l.owner_id = u.id)
        AND u.user_role = 'user'
      ORDER BY u.first_name
    `).bind(locationId, locationId).all();

    // Then get their specific permissions
    const permissions = await env.DB.prepare(`
      SELECT 
        lup.user_id,
        lup.permission,
        lup.granted_by,
        lup.granted_at
      FROM location_user_permissions lup
      WHERE lup.location_id = ?
    `).bind(locationId).all();

    // Group permissions by user
    const userPermissions: any = {};
    
    // Initialize all location members
    for (const member of locationMembers.results) {
      const userId = (member as any).user_id;
      userPermissions[userId] = {
        userId,
        userName: (member as any).userName,
        userEmail: (member as any).userEmail,
        permissions: [],
        grantedBy: null,
        grantedAt: null
      };
    }
    
    // Add their permissions
    for (const perm of permissions.results) {
      const userId = (perm as any).user_id;
      if (userPermissions[userId]) {
        userPermissions[userId].permissions.push((perm as any).permission);
        if (!userPermissions[userId].grantedBy) {
          userPermissions[userId].grantedBy = (perm as any).granted_by;
          userPermissions[userId].grantedAt = (perm as any).granted_at;
        }
      }
    }

    return new Response(JSON.stringify({ 
      permissions: Object.values(userPermissions) 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting location user permissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to get user permissions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Grant user permission
export async function grantUserPermission(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const { locationId, targetUserId, permission } = await request.json();

    if (!locationId || !targetUserId || !permission) {
      return new Response(JSON.stringify({ error: 'locationId, targetUserId, and permission required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user can manage permissions for this location
    if (!await canUserManageLocationPermissions(userId, locationId, env)) {
      return new Response(JSON.stringify({ error: 'Permission management access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate permission type
    const validPermissions = ['can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres'];
    if (!validPermissions.includes(permission)) {
      return new Response(JSON.stringify({ error: 'Invalid permission type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify target user is a member of this location (either in location_members or is the owner)
    const isLocationMember = await env.DB.prepare(`
      SELECT 1 FROM (
        SELECT user_id FROM location_members WHERE location_id = ? AND user_id = ?
        UNION
        SELECT owner_id as user_id FROM locations WHERE id = ? AND owner_id = ?
      )
    `).bind(locationId, targetUserId, locationId, targetUserId).first();

    if (!isLocationMember) {
      return new Response(JSON.stringify({ error: 'Target user must be a location member' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert or ignore if already exists
    await env.DB.prepare(`
      INSERT OR IGNORE INTO location_user_permissions 
      (location_id, user_id, permission, granted_by, granted_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(locationId, targetUserId, permission, userId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error granting user permission:', error);
    return new Response(JSON.stringify({ error: 'Failed to grant user permission' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Revoke user permission
export async function revokeUserPermission(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const { locationId, targetUserId, permission } = await request.json();

    if (!locationId || !targetUserId || !permission) {
      return new Response(JSON.stringify({ error: 'locationId, targetUserId, and permission required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user can manage permissions for this location
    if (!await canUserManageLocationPermissions(userId, locationId, env)) {
      return new Response(JSON.stringify({ error: 'Permission management access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare(`
      DELETE FROM location_user_permissions 
      WHERE location_id = ? AND user_id = ? AND permission = ?
    `).bind(locationId, targetUserId, permission).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error revoking user permission:', error);
    return new Response(JSON.stringify({ error: 'Failed to revoke user permission' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Helper function to check if user has specific permission in a location
export async function hasUserPermission(userId: string, locationId: number, permission: string, env: Env): Promise<boolean> {
  try {
    // Super admins have all permissions
    if (await isUserSuperAdmin(userId, env)) {
      return true;
    }

    // Check if user is location admin (inherits all user permissions)
    const isLocationAdmin = await env.DB.prepare(`
      SELECT 1 FROM location_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.location_id = ? AND lm.user_id = ? 
      AND (u.user_role = 'admin' OR u.user_role = 'super_admin')
    `).bind(locationId, userId).first();

    if (isLocationAdmin) {
      return true;
    }

    // Check specific user permission
    const userPermission = await env.DB.prepare(`
      SELECT 1 FROM location_user_permissions 
      WHERE location_id = ? AND user_id = ? AND permission = ?
    `).bind(locationId, userId, permission).first();

    return !!userPermission;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

// Helper function to get location ID from shelf ID
export async function getLocationIdFromShelfId(shelfId: number, env: Env): Promise<number | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT s.location_id FROM shelves s WHERE s.id = ?
    `).bind(shelfId).first() as any;
    return result?.location_id || null;
  } catch (error) {
    console.error('Error getting location from shelf:', error);
    return null;
  }
}

// Helper function to get location ID from book ID
export async function getLocationIdFromBookId(bookId: number, env: Env): Promise<number | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT s.location_id FROM books b
      JOIN shelves s ON b.shelf_id = s.id
      WHERE b.id = ?
    `).bind(bookId).first() as any;
    return result?.location_id || null;
  } catch (error) {
    console.error('Error getting location from book:', error);
    return null;
  }
}

// Check if user has specific permission
// Check if user can manage permissions for a specific location
export async function checkLocationPermissionManagement(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('location_id');

    if (!locationId) {
      return new Response(JSON.stringify({ error: 'location_id parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const canManage = await canUserManageLocationPermissions(userId, parseInt(locationId), env);
    
    return new Response(JSON.stringify({ 
      canManagePermissions: canManage,
      locationId: parseInt(locationId)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking permission management capability:', error);
    return new Response(JSON.stringify({ error: 'Failed to check permissions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function checkUserPermission(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('locationId');
    const permission = url.searchParams.get('permission');

    if (!locationId || !permission) {
      return new Response(JSON.stringify({ error: 'locationId and permission parameters required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let hasPermission = false;
    let reason = '';

    // Super admins have all permissions
    if (await isUserSuperAdmin(userId, env)) {
      hasPermission = true;
      reason = 'super_admin';
    } else {
      // Check if user is location admin (inherits all user permissions)
      const isLocationAdmin = await env.DB.prepare(`
        SELECT 1 FROM location_members lm
        JOIN users u ON lm.user_id = u.id
        WHERE lm.location_id = ? AND lm.user_id = ? 
        AND (u.user_role = 'admin' OR u.user_role = 'super_admin')
      `).bind(locationId, userId).first();

      if (isLocationAdmin) {
        hasPermission = true;
        reason = 'admin_inherited';
      } else {
        // Check specific user permission
        const userPermission = await env.DB.prepare(`
          SELECT 1 FROM location_user_permissions 
          WHERE location_id = ? AND user_id = ? AND permission = ?
        `).bind(locationId, userId, permission).first();

        if (userPermission) {
          hasPermission = true;
          reason = 'user_granted';
        }
      }
    }

    return new Response(JSON.stringify({ 
      hasPermission,
      reason 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking user permission:', error);
    return new Response(JSON.stringify({ error: 'Failed to check permission' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get all user permissions for a specific location
export async function getUserPermissions(request: Request, userId: string, env: Env, corsHeaders: any) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('locationId');


    if (!locationId) {
      return new Response(JSON.stringify({ error: 'locationId parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const permissions: string[] = [];

    // Super admins have all permissions
    if (await isUserSuperAdmin(userId, env)) {
      permissions.push('can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres');
    } else {
      // Check if user is location admin (inherits all user permissions)
      const isLocationAdmin = await env.DB.prepare(`
        SELECT 1 FROM (
          SELECT user_id FROM location_members WHERE location_id = ? AND user_id = ?
          UNION
          SELECT owner_id as user_id FROM locations WHERE id = ? AND owner_id = ?
        ) lm
        JOIN users u ON lm.user_id = u.id
        WHERE u.user_role IN ('admin', 'super_admin')
      `).bind(locationId, userId, locationId, userId).first();

      if (isLocationAdmin) {
        permissions.push('can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres');
      } else {
        // Get specific user permissions
        const userPermissions = await env.DB.prepare(`
          SELECT permission FROM location_user_permissions 
          WHERE location_id = ? AND user_id = ?
        `).bind(locationId, userId).all();

        for (const perm of userPermissions.results) {
          permissions.push((perm as any).permission);
        }
      }
    }

    return new Response(JSON.stringify({ 
      permissions
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting user permissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to get permissions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}