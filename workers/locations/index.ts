import { Env, Location, Shelf, DEFAULT_SHELVES } from '../types';

import { isUserAdmin, isUserSuperAdmin, canManageLocation } from '../auth';
import { hasUserPermission } from '../permissions';

// Permission checking function
export async function checkLocationPermission(
  userId: string, 
  locationId: number, 
  env: Env, 
  requireAdmin: boolean = false
): Promise<boolean> {
  // Check if user can manage this location (super admin can manage all, regular admin can manage their assigned locations)
  if (await canManageLocation(userId, locationId, env)) {
    return true;
  }
  
  // If admin access is required and user can't manage location, deny
  if (requireAdmin) {
    return false;
  }
  
  // Check if user has access to this location (owner or member)
  const accessStmt = env.DB.prepare(`
    SELECT 1 FROM locations l
    LEFT JOIN location_members lm ON l.id = lm.location_id
    WHERE l.id = ? AND (l.owner_id = ? OR lm.user_id = ?)
  `);
  
  const accessResult = await accessStmt.bind(locationId, userId, userId).first();
  return !!accessResult;
}

// Location functions
export async function getUserLocations(userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin first
  const isSuperAdmin = await isUserSuperAdmin(userId, env);
  
  let stmt;
  if (isSuperAdmin) {
    // Super admins can see all locations with counts and owner info
    stmt = env.DB.prepare(`
      SELECT 
        l.*,
        COALESCE(shelf_counts.shelf_count, 0) as shelf_count,
        COALESCE(book_counts.book_count, 0) as book_count,
        u.first_name || ' ' || u.last_name as owner_name
      FROM locations l
      LEFT JOIN users u ON l.owner_id = u.id
      LEFT JOIN (
        SELECT location_id, COUNT(*) as shelf_count 
        FROM shelves 
        GROUP BY location_id
      ) shelf_counts ON l.id = shelf_counts.location_id
      LEFT JOIN (
        SELECT s.location_id, COUNT(b.id) as book_count
        FROM shelves s
        LEFT JOIN books b ON s.id = b.shelf_id
        GROUP BY s.location_id
      ) book_counts ON l.id = book_counts.location_id
      ORDER BY l.created_at DESC
    `);
  } else {
    // Regular users see only locations they own or are members of with counts
    stmt = env.DB.prepare(`
      SELECT DISTINCT 
        l.*,
        COALESCE(shelf_counts.shelf_count, 0) as shelf_count,
        COALESCE(book_counts.book_count, 0) as book_count,
        u.first_name || ' ' || u.last_name as owner_name
      FROM locations l
      LEFT JOIN users u ON l.owner_id = u.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      LEFT JOIN (
        SELECT location_id, COUNT(*) as shelf_count 
        FROM shelves 
        GROUP BY location_id
      ) shelf_counts ON l.id = shelf_counts.location_id
      LEFT JOIN (
        SELECT s.location_id, COUNT(b.id) as book_count
        FROM shelves s
        LEFT JOIN books b ON s.id = b.shelf_id
        GROUP BY s.location_id
      ) book_counts ON l.id = book_counts.location_id
      WHERE l.owner_id = ? OR lm.user_id = ?
      ORDER BY l.created_at DESC
    `);
  }

  const result = isSuperAdmin ? await stmt.all() : await stmt.bind(userId, userId).all();
  
  return new Response(JSON.stringify(result.results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function createLocation(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const location: Location = await request.json();
  
  // Check if user is super admin (only super admins can create locations)
  if (!(await isUserSuperAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required to create locations' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Create location
  const locationStmt = env.DB.prepare(`
    INSERT INTO locations (name, description, owner_id, single_shelf_location, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  const locationResult = await locationStmt.bind(
    location.name,
    location.description || null,
    userId,
    location.single_shelf_location || false
  ).run();

  const locationId = locationResult.meta.last_row_id;

  // Create default shelves (only if not single shelf mode)
  if (!location.single_shelf_location) {
    for (const shelfName of DEFAULT_SHELVES) {
      const shelfStmt = env.DB.prepare(`
        INSERT INTO shelves (name, location_id, created_at)
        VALUES (?, ?, datetime('now'))
      `);
      await shelfStmt.bind(shelfName, locationId).run();
    }
  } else {
    // Create single default shelf for single shelf mode
    const shelfStmt = env.DB.prepare(`
      INSERT INTO shelves (name, location_id, created_at)
      VALUES (?, ?, datetime('now'))
    `);
    await shelfStmt.bind('General', locationId).run();
  }

  return new Response(JSON.stringify({ 
    id: locationId, 
    ...location, 
    owner_id: userId 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function updateLocation(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>, id: number) {
  const location: Partial<Location> = await request.json();
  
  // Check if user is super admin or has specific location settings management capability
  const isSuperAdmin = await isUserSuperAdmin(userId, env);
  
  if (!isSuperAdmin) {
    const hasLocationSettingsCapability = await env.DB.prepare(`
      SELECT 1 FROM location_admin_capabilities 
      WHERE location_id = ? AND user_id = ? AND capability = 'can_manage_location_settings'
    `).bind(id, userId).first();

    if (!hasLocationSettingsCapability) {
      return new Response(JSON.stringify({ error: 'Location settings management permission required to update locations' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const stmt = env.DB.prepare(`
    UPDATE locations 
    SET name = ?, description = ?, single_shelf_location = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  await stmt.bind(
    location.name,
    location.description || null,
    location.single_shelf_location || false,
    id
  ).run();

  // Get the updated location from the database to preserve original owner_id
  const updatedLocationFromDB = await env.DB.prepare(`
    SELECT * FROM locations WHERE id = ?
  `).bind(id).first();

  if (!updatedLocationFromDB) {
    return new Response(JSON.stringify({ error: 'Location not found after update' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(updatedLocationFromDB), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function deleteLocation(userId: string, env: Env, corsHeaders: Record<string, string>, id: number) {
  // Check if user can delete this location:
  // 1. Super admins can delete any location
  // 2. Regular admins can only delete locations they created themselves
  const isSuperAdmin = await isUserSuperAdmin(userId, env);
  
  if (!isSuperAdmin) {
    // Check if user is the owner of this location
    const ownerStmt = env.DB.prepare('SELECT owner_id FROM locations WHERE id = ?');
    const ownerResult = await ownerStmt.bind(id).first() as any;
    
    if (!ownerResult || ownerResult.owner_id !== userId) {
      return new Response(JSON.stringify({ error: 'You can only delete locations you created yourself' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Delete associated data in correct order to avoid foreign key constraint violations
  // 1. Delete books first (they reference shelves)
  await env.DB.prepare('DELETE FROM books WHERE shelf_id IN (SELECT id FROM shelves WHERE location_id = ?)').bind(id).run();
  
  // 2. Delete shelves (they reference locations)
  await env.DB.prepare('DELETE FROM shelves WHERE location_id = ?').bind(id).run();
  
  // 3. Delete location-specific permission and capability data
  await env.DB.prepare('DELETE FROM location_user_permissions WHERE location_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM location_admin_capabilities WHERE location_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM location_default_permissions WHERE location_id = ?').bind(id).run();
  
  // 4. Delete location membership and invitation data
  await env.DB.prepare('DELETE FROM location_members WHERE location_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM location_invitations WHERE location_id = ?').bind(id).run();
  
  // 5. Finally delete the location itself
  await env.DB.prepare('DELETE FROM locations WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function leaveLocation(locationId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Check if user has access to this location
    const accessStmt = env.DB.prepare(`
      SELECT 1 FROM location_members WHERE location_id = ? AND user_id = ?
    `);
    const accessResult = await accessStmt.bind(locationId, userId).first();
    
    if (!accessResult) {
      return new Response(JSON.stringify({ error: 'You are not a member of this location' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this is the user's last location
    const locationCountStmt = env.DB.prepare(`
      SELECT COUNT(*) as count FROM location_members WHERE user_id = ?
    `);
    const countResult = await locationCountStmt.bind(userId).first();
    const locationCount = (countResult as any)?.count || 0;

    if (locationCount <= 1) {
      return new Response(JSON.stringify({ error: 'You cannot leave your last location. You need access to at least one library.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete user's books from this location
    const deleteBooksStmt = env.DB.prepare(`
      DELETE FROM books 
      WHERE added_by = ? AND shelf_id IN (
        SELECT id FROM shelves WHERE location_id = ?
      )
    `);
    await deleteBooksStmt.bind(userId, locationId).run();

    // Remove user from location membership
    const removeMemberStmt = env.DB.prepare(`
      DELETE FROM location_members WHERE location_id = ? AND user_id = ?
    `);
    await removeMemberStmt.bind(locationId, userId).run();

    return new Response(JSON.stringify({ 
      message: 'Successfully left the location. Your books from this location have been removed.',
      location_id: locationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error leaving location:', error);
    return new Response(JSON.stringify({ error: 'Failed to leave location' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Shelf functions
export async function getLocationShelves(locationId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Super admins can access all locations
  if (!(await isUserSuperAdmin(userId, env))) {
    // Check if user has access to this location
    const accessStmt = env.DB.prepare(`
      SELECT 1 FROM locations l
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE l.id = ? AND (l.owner_id = ? OR lm.user_id = ?)
    `);

    const accessResult = await accessStmt.bind(locationId, userId, userId).first();
    
    if (!accessResult) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const stmt = env.DB.prepare(`
    SELECT 
      s.*,
      COALESCE(book_counts.book_count, 0) as book_count
    FROM shelves s
    LEFT JOIN (
      SELECT shelf_id, COUNT(*) as book_count 
      FROM books 
      GROUP BY shelf_id
    ) book_counts ON s.id = book_counts.shelf_id
    WHERE s.location_id = ? 
    ORDER BY s.name
  `);

  const result = await stmt.bind(locationId).all();
  
  return new Response(JSON.stringify(result.results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function createShelf(request: Request, locationId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const shelf: Shelf = await request.json();
  
  // Check if user has permission to create shelves in this location
  const hasPermission = await hasUserPermission(userId, locationId, 'can_create_shelves', env);
  if (!hasPermission) {
    return new Response(JSON.stringify({ error: 'You do not have permission to create shelves in this location' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stmt = env.DB.prepare(`
    INSERT INTO shelves (name, location_id, created_at)
    VALUES (?, ?, datetime('now'))
  `);

  const result = await stmt.bind(shelf.name, locationId).run();

  return new Response(JSON.stringify({ 
    id: result.meta.last_row_id, 
    ...shelf, 
    location_id: locationId 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function updateShelf(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>, id: number) {
  const shelf: Partial<Shelf> = await request.json();
  
  // Get the location ID from the shelf
  const shelfLocationStmt = env.DB.prepare(`
    SELECT location_id FROM shelves WHERE id = ?
  `);
  const shelfResult = await shelfLocationStmt.bind(id).first();
  
  if (!shelfResult) {
    return new Response(JSON.stringify({ error: 'Shelf not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if user can manage this location
  if (!(await canManageLocation(userId, (shelfResult as any).location_id, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required to update shelves' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stmt = env.DB.prepare(`
    UPDATE shelves 
    SET name = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  await stmt.bind(shelf.name, id).run();

  // Return the updated shelf (we already have location_id from earlier query)
  const updatedShelf = {
    id,
    name: shelf.name,
    location_id: (shelfResult as any)?.location_id,
    updated_at: new Date().toISOString()
  };

  return new Response(JSON.stringify(updatedShelf), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function deleteShelf(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>, id: number) {
  // Get shelf and location info
  const accessStmt = env.DB.prepare(`
    SELECT s.id, s.location_id FROM shelves s WHERE s.id = ?
  `);

  const accessResult = await accessStmt.bind(id).first();
  
  if (!accessResult) {
    return new Response(JSON.stringify({ error: 'Shelf not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if user can manage this location
  if (!(await canManageLocation(userId, (accessResult as any).location_id, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required to delete shelves' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if there are books on this shelf
  const booksStmt = env.DB.prepare(`
    SELECT COUNT(*) as book_count FROM books WHERE shelf_id = ?
  `);
  const booksResult = await booksStmt.bind(id).first();
  const bookCount = (booksResult as any)?.book_count || 0;

  // Check how many shelves are in this location
  const shelfCountStmt = env.DB.prepare(`
    SELECT COUNT(*) as shelf_count FROM shelves WHERE location_id = ?
  `);
  const shelfCountResult = await shelfCountStmt.bind((accessResult as any).location_id).first();
  const totalShelves = (shelfCountResult as any)?.shelf_count || 0;

  // Get the request body to see if user provided a target shelf or wants to create one
  const body = await request.json() as { 
    targetShelfId?: number; 
    createNewShelf?: string; 
    confirmDeleteBooks?: boolean 
  };
  const { targetShelfId, createNewShelf, confirmDeleteBooks } = body;

  if (bookCount > 0) {

    // If this is the last shelf in the location
    if (totalShelves === 1) {
      if (createNewShelf) {
        // Create a new shelf to move books to
        const newShelfStmt = env.DB.prepare(`
          INSERT INTO shelves (name, location_id, created_at)
          VALUES (?, ?, datetime('now'))
        `);
        const newShelfResult = await newShelfStmt.bind(createNewShelf, (accessResult as any).location_id).run();
        const newShelfId = newShelfResult.meta.last_row_id;

        // Move books to the new shelf
        const moveStmt = env.DB.prepare(`
          UPDATE books SET shelf_id = ? WHERE shelf_id = ?
        `);
        await moveStmt.bind(newShelfId, id).run();
      } else if (confirmDeleteBooks) {
        // User confirmed they want to delete all books with the last shelf
        // Books will be deleted when we delete the shelf (no action needed here)
      } else {
        // Warn user about deleting the last shelf
        return new Response(JSON.stringify({ 
          error: 'This is the last shelf in the location. Deleting it will also delete all books in the location.',
          bookCount,
          isLastShelf: true,
          warningMessage: `Deleting this shelf will permanently delete ${bookCount} book(s) from the location. You can either create a new shelf to move the books to, or confirm deletion of all books.`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // There are other shelves in the location
      if (!targetShelfId) {
        // Get available shelves in the same location for the user to choose from
        const shelvesStmt = env.DB.prepare(`
          SELECT id, name FROM shelves 
          WHERE location_id = ? AND id != ?
          ORDER BY name
        `);
        const shelvesResult = await shelvesStmt.bind((accessResult as any).location_id, id).all();
        
        return new Response(JSON.stringify({ 
          error: 'Shelf contains books. Please select a target shelf to move them to.',
          bookCount,
          availableShelves: shelvesResult.results,
          isLastShelf: false
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Move books to target shelf
      const moveStmt = env.DB.prepare(`
        UPDATE books SET shelf_id = ? WHERE shelf_id = ?
      `);
      await moveStmt.bind(targetShelfId, id).run();
    }
  }

  // Delete the shelf (and books if it's the last shelf and user confirmed)
  if (totalShelves === 1 && bookCount > 0 && confirmDeleteBooks) {
    // Delete books first when deleting the last shelf
    await env.DB.prepare('DELETE FROM books WHERE shelf_id = ?').bind(id).run();
  }
  
  const deleteStmt = env.DB.prepare('DELETE FROM shelves WHERE id = ?');
  await deleteStmt.bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Default permissions functions
export async function setLocationDefaultPermission(request: Request, locationId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const { permission, permission_type }: { permission: string; permission_type: 'user' | 'admin' } = await request.json();
  
  // Check if user is super admin (only super admins can create locations and set their default permissions)
  if (!(await isUserSuperAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required to set default permissions' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate permission type and values
  const validUserPermissions = ['can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres'];
  const validAdminCapabilities = ['can_control_user_capabilities', 'can_invite_users', 'can_manage_shelves', 'can_manage_location_settings'];
  
  if (permission_type === 'user' && !validUserPermissions.includes(permission)) {
    return new Response(JSON.stringify({ error: 'Invalid user permission' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (permission_type === 'admin' && !validAdminCapabilities.includes(permission)) {
    return new Response(JSON.stringify({ error: 'Invalid admin capability' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Insert or ignore if already exists
    const stmt = env.DB.prepare(`
      INSERT OR IGNORE INTO location_default_permissions (location_id, permission, permission_type)
      VALUES (?, ?, ?)
    `);
    
    await stmt.bind(locationId, permission, permission_type).run();
    
    return new Response(JSON.stringify({ 
      message: 'Default permission set successfully',
      locationId,
      permission,
      permission_type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting default permission:', error);
    return new Response(JSON.stringify({ error: 'Failed to set default permission' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getLocationDefaultPermissions(locationId: number, env: Env): Promise<{ userPermissions: string[], adminCapabilities: string[] }> {
  const stmt = env.DB.prepare(`
    SELECT permission, permission_type FROM location_default_permissions WHERE location_id = ?
  `);
  
  const result = await stmt.bind(locationId).all();
  
  const userPermissions: string[] = [];
  const adminCapabilities: string[] = [];
  
  result.results.forEach((row: any) => {
    if (row.permission_type === 'user') {
      userPermissions.push(row.permission);
    } else if (row.permission_type === 'admin') {
      adminCapabilities.push(row.permission);
    }
  });
  
  return { userPermissions, adminCapabilities };
}

export async function getLocationDefaultPermissionsAPI(locationId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin or has can_manage_location_settings capability
  const isSuperAdmin = await isUserSuperAdmin(userId, env);
  
  if (!isSuperAdmin) {
    const hasLocationSettingsCapability = await env.DB.prepare(`
      SELECT 1 FROM location_admin_capabilities 
      WHERE location_id = ? AND user_id = ? AND capability = 'can_manage_location_settings'
    `).bind(locationId, userId).first();

    if (!hasLocationSettingsCapability) {
      return new Response(JSON.stringify({ error: 'Permission required to view default permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const defaultPermissions = await getLocationDefaultPermissions(locationId, env);
    
    return new Response(JSON.stringify(defaultPermissions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting default permissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to get default permissions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function updateLocationDefaultPermissions(request: Request, locationId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const requestBody = await request.json() as any;
  console.log('🔍 Default permissions request body:', requestBody);
  
  const userPermissions = Array.isArray(requestBody?.userPermissions) ? requestBody.userPermissions : [];
  const adminCapabilities = Array.isArray(requestBody?.adminCapabilities) ? requestBody.adminCapabilities : [];
  
  console.log('🔍 Processed arrays:', { userPermissions, adminCapabilities });

  // Check if user is super admin or has can_manage_location_settings capability
  const isSuperAdmin = await isUserSuperAdmin(userId, env);
  
  if (!isSuperAdmin) {
    const hasLocationSettingsCapability = await env.DB.prepare(`
      SELECT 1 FROM location_admin_capabilities 
      WHERE location_id = ? AND user_id = ? AND capability = 'can_manage_location_settings'
    `).bind(locationId, userId).first();

    if (!hasLocationSettingsCapability) {
      return new Response(JSON.stringify({ error: 'Permission required to modify default permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Validate permissions
  const validUserPermissions = ['can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres'];
  const validAdminCapabilities = ['can_control_user_capabilities', 'can_invite_users', 'can_manage_shelves', 'can_manage_location_settings'];
  
  for (const permission of userPermissions) {
    if (!validUserPermissions.includes(permission)) {
      return new Response(JSON.stringify({ error: `Invalid user permission: ${permission}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  for (const capability of adminCapabilities) {
    if (!validAdminCapabilities.includes(capability)) {
      return new Response(JSON.stringify({ error: `Invalid admin capability: ${capability}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // Remove all existing default permissions for this location
    await env.DB.prepare(`
      DELETE FROM location_default_permissions WHERE location_id = ?
    `).bind(locationId).run();

    // Add new user permissions
    for (const permission of userPermissions) {
      await env.DB.prepare(`
        INSERT INTO location_default_permissions (location_id, permission, permission_type)
        VALUES (?, ?, 'user')
      `).bind(locationId, permission).run();
    }

    // Add new admin capabilities
    for (const capability of adminCapabilities) {
      await env.DB.prepare(`
        INSERT INTO location_default_permissions (location_id, permission, permission_type)
        VALUES (?, ?, 'admin')
      `).bind(locationId, capability).run();
    }

    return new Response(JSON.stringify({ 
      message: 'Default permissions updated successfully',
      userPermissions,
      adminCapabilities
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating default permissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to update default permissions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function applyDefaultPermissionsToUser(locationId: number, targetUserId: string, granterUserId: string, env: Env): Promise<void> {
  console.log(`🔍 Applying default permissions for user ${targetUserId} in location ${locationId}`);
  
  // Get default permissions for this location
  const defaultPermissions = await getLocationDefaultPermissions(locationId, env);
  console.log(`🔍 Found default permissions:`, defaultPermissions);
  
  // Apply default user permissions
  for (const permission of defaultPermissions.userPermissions) {
    try {
      console.log(`🔍 Granting user permission: ${permission}`);
      await env.DB.prepare(`
        INSERT OR IGNORE INTO location_user_permissions (location_id, user_id, permission, granted_by)
        VALUES (?, ?, ?, ?)
      `).bind(locationId, targetUserId, permission, granterUserId).run();
    } catch (error) {
      console.warn(`Failed to grant default permission "${permission}" to user ${targetUserId}:`, error);
    }
  }

  // Check if the target user is an admin, and if so, apply default admin capabilities
  const userStmt = env.DB.prepare(`SELECT user_role FROM users WHERE id = ?`);
  const user = await userStmt.bind(targetUserId).first();
  console.log(`🔍 User role for ${targetUserId}:`, (user as any)?.user_role);
  
  if (user && (user as any).user_role === 'admin') {
    // Apply default admin capabilities
    for (const capability of defaultPermissions.adminCapabilities) {
      try {
        console.log(`🔍 Granting admin capability: ${capability}`);
        await env.DB.prepare(`
          INSERT OR IGNORE INTO location_admin_capabilities (location_id, user_id, capability, granted_by)
          VALUES (?, ?, ?, ?)
        `).bind(locationId, targetUserId, capability, granterUserId).run();
      } catch (error) {
        console.warn(`Failed to grant default admin capability "${capability}" to user ${targetUserId}:`, error);
      }
    }
  }
}