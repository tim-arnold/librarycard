import { Env } from '../types';
import { isUserAdmin, isUserSuperAdmin } from '../auth';
import { getCachedIsUserAdmin, getCachedIsUserSuperAdmin, getCachedUserPermissions } from '../auth/cached';
import { invalidateAllAdminAnalytics } from '../admin/cached';
import { applyDefaultPermissionsToUser } from '../locations';

// Extended admin functions extracted from main worker

export async function getAdminAnalytics(userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is at least admin (with caching)
  if (!(await getCachedIsUserAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const isSuperAdmin = await getCachedIsUserSuperAdmin(userId, env);

  try {
    let totalBooks, totalUsers, totalLocations, pendingRequests;
    
    if (isSuperAdmin) {
      // Super admin gets global statistics
      totalBooks = await env.DB.prepare('SELECT COUNT(*) as count FROM books').first();
      totalUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
      totalLocations = await env.DB.prepare('SELECT COUNT(*) as count FROM locations').first();
      pendingRequests = await env.DB.prepare('SELECT COUNT(*) as count FROM book_removal_requests WHERE status = "pending"').first();
    } else {
      // Regular admin gets location-scoped statistics
      totalBooks = await env.DB.prepare(`
        SELECT COUNT(DISTINCT b.id) as count 
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.owner_id = ? OR lm.user_id = ?
      `).bind(userId, userId).first();
      
      totalUsers = await env.DB.prepare(`
        SELECT COUNT(DISTINCT user_id) as count FROM (
          -- Users who are members of locations owned by this admin
          SELECT lm.user_id 
          FROM location_members lm
          INNER JOIN locations l ON lm.location_id = l.id
          WHERE l.owner_id = ?
          
          UNION
          
          -- Users who are members of locations this admin is assigned to
          SELECT lm.user_id 
          FROM location_members lm
          WHERE lm.location_id IN (
            SELECT location_id FROM location_members WHERE user_id = ?
          )
          
          UNION
          
          -- Users who own locations this admin is assigned to
          SELECT l.owner_id as user_id
          FROM locations l
          INNER JOIN location_members lm ON l.id = lm.location_id
          WHERE lm.user_id = ?
          
          UNION
          
          -- Include the admin themselves
          SELECT ? as user_id
        )
      `).bind(userId, userId, userId, userId).first();
      
      totalLocations = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM locations l
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.owner_id = ? OR lm.user_id = ?
      `).bind(userId, userId).first();
      
      pendingRequests = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM book_removal_requests brr
        LEFT JOIN books b ON brr.book_id = b.id
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE brr.status = "pending" AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(userId, userId).first();
    }

    // Books per location
    let booksPerLocation;
    if (isSuperAdmin) {
      booksPerLocation = await env.DB.prepare(`
        SELECT l.name, COUNT(b.id) as book_count
        FROM locations l
        LEFT JOIN shelves s ON l.id = s.location_id
        LEFT JOIN books b ON s.id = b.shelf_id
        GROUP BY l.id, l.name
        ORDER BY book_count DESC
      `).all();
    } else {
      booksPerLocation = await env.DB.prepare(`
        SELECT l.name, COUNT(b.id) as book_count
        FROM locations l
        LEFT JOIN shelves s ON l.id = s.location_id
        LEFT JOIN books b ON s.id = b.shelf_id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.owner_id = ? OR lm.user_id = ?
        GROUP BY l.id, l.name
        ORDER BY book_count DESC
      `).bind(userId, userId).all();
    }

    // Recent activity (last 30 days)
    let recentBooks;
    if (isSuperAdmin) {
      recentBooks = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM books 
        WHERE created_at >= datetime('now', '-30 days')
      `).first();
    } else {
      recentBooks = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE b.created_at >= datetime('now', '-30 days') 
        AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(userId, userId).first();
    }

    // Most active users (by books added)
    let activeUsers;
    if (isSuperAdmin) {
      activeUsers = await env.DB.prepare(`
        SELECT u.first_name, u.last_name, u.email, COUNT(b.id) as books_added
        FROM users u
        LEFT JOIN books b ON u.id = b.added_by
        GROUP BY u.id
        HAVING books_added > 0
        ORDER BY books_added DESC
        LIMIT 10
      `).all();
    } else {
      activeUsers = await env.DB.prepare(`
        SELECT u.first_name, u.last_name, u.email, COUNT(b.id) as books_added
        FROM users u
        LEFT JOIN books b ON u.id = b.added_by
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.owner_id = ? OR lm.user_id = ?
        GROUP BY u.id
        HAVING books_added > 0
        ORDER BY books_added DESC
        LIMIT 10
      `).bind(userId, userId).all();
    }

    // Genre distribution
    let genreStats;
    if (isSuperAdmin) {
      genreStats = await env.DB.prepare(`
        SELECT b.categories, b.enhanced_genres
        FROM books b
        WHERE b.categories IS NOT NULL OR b.enhanced_genres IS NOT NULL
      `).all();
    } else {
      genreStats = await env.DB.prepare(`
        SELECT b.categories, b.enhanced_genres
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE (b.categories IS NOT NULL OR b.enhanced_genres IS NOT NULL)
        AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(userId, userId).all();
    }

    // Process genre statistics
    const genreCounts: Record<string, number> = {};
    genreStats.results.forEach((book: any) => {
      const categories = book.categories ? JSON.parse(book.categories) : [];
      const enhancedGenres = book.enhanced_genres ? JSON.parse(book.enhanced_genres) : [];
      [...categories, ...enhancedGenres].forEach((genre: string) => {
        if (genre && genre.trim()) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });
    });

    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // Books without shelves
    let unorganizedBooks;
    if (isSuperAdmin) {
      unorganizedBooks = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM books 
        WHERE shelf_id IS NULL
      `).first();
    } else {
      unorganizedBooks = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE b.shelf_id IS NULL 
        AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(userId, userId).first();
    }

    // Recent checkout activity
    let recentCheckouts;
    if (isSuperAdmin) {
      recentCheckouts = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM books 
        WHERE checked_out_date >= datetime('now', '-30 days')
      `).first();
    } else {
      recentCheckouts = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE b.checked_out_date >= datetime('now', '-30 days')
        AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(userId, userId).first();
    }

    // Collection Growth Chart data (last 30 days by day)
    let collectionGrowth;
    if (isSuperAdmin) {
      collectionGrowth = await env.DB.prepare(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as books_added
        FROM books 
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).all();
    } else {
      collectionGrowth = await env.DB.prepare(`
        SELECT 
          DATE(b.created_at) as date,
          COUNT(*) as books_added
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE b.created_at >= datetime('now', '-30 days')
        AND (l.owner_id = ? OR lm.user_id = ?)
        GROUP BY DATE(b.created_at)
        ORDER BY date ASC
      `).bind(userId, userId).all();
    }

    // Data Quality Dashboard metrics
    let dataQuality;
    if (isSuperAdmin) {
      dataQuality = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_books,
          SUM(CASE WHEN title IS NULL OR title = '' THEN 1 ELSE 0 END) as missing_title,
          SUM(CASE WHEN authors IS NULL OR authors = '' THEN 1 ELSE 0 END) as missing_authors,
          SUM(CASE WHEN thumbnail IS NULL OR thumbnail = '' THEN 1 ELSE 0 END) as missing_cover,
          SUM(CASE WHEN (categories IS NULL OR categories = '[]') AND (enhanced_genres IS NULL OR enhanced_genres = '[]' OR enhanced_genres = 'null') AND NOT EXISTS (SELECT 1 FROM book_genres bg WHERE bg.book_id = books.id) THEN 1 ELSE 0 END) as missing_genre,
          SUM(CASE WHEN shelf_id IS NULL THEN 1 ELSE 0 END) as missing_location,
          SUM(CASE WHEN isbn IS NULL OR isbn = '' THEN 1 ELSE 0 END) as missing_isbn,
          SUM(CASE WHEN published_date IS NULL OR published_date = '' THEN 1 ELSE 0 END) as missing_publish_date
        FROM books
      `).first();
    } else {
      dataQuality = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_books,
          SUM(CASE WHEN b.title IS NULL OR b.title = '' THEN 1 ELSE 0 END) as missing_title,
          SUM(CASE WHEN b.authors IS NULL OR b.authors = '' THEN 1 ELSE 0 END) as missing_authors,
          SUM(CASE WHEN b.thumbnail IS NULL OR b.thumbnail = '' THEN 1 ELSE 0 END) as missing_cover,
          SUM(CASE WHEN (b.categories IS NULL OR b.categories = '[]') AND (b.enhanced_genres IS NULL OR b.enhanced_genres = '[]' OR b.enhanced_genres = 'null') AND NOT EXISTS (SELECT 1 FROM book_genres bg WHERE bg.book_id = b.id) THEN 1 ELSE 0 END) as missing_genre,
          SUM(CASE WHEN b.shelf_id IS NULL THEN 1 ELSE 0 END) as missing_location,
          SUM(CASE WHEN b.isbn IS NULL OR b.isbn = '' THEN 1 ELSE 0 END) as missing_isbn,
          SUM(CASE WHEN b.published_date IS NULL OR b.published_date = '' THEN 1 ELSE 0 END) as missing_publish_date
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.owner_id = ? OR lm.user_id = ?
      `).bind(userId, userId).first();
    }

    // Disable duplicate detection for now - no actual duplicates exist
    const duplicates = { results: [] };

    return new Response(JSON.stringify({
      overview: {
        totalBooks: (totalBooks as any)?.count || 0,
        totalUsers: (totalUsers as any)?.count || 0,
        totalLocations: (totalLocations as any)?.count || 0,
        pendingRequests: (pendingRequests as any)?.count || 0,
        unorganizedBooks: (unorganizedBooks as any)?.count || 0,
        recentBooks: (recentBooks as any)?.count || 0,
        recentCheckouts: (recentCheckouts as any)?.count || 0,
      },
      booksPerLocation: booksPerLocation.results,
      activeUsers: activeUsers.results,
      topGenres,
      collectionGrowth: collectionGrowth.results,
      dataQuality: dataQuality,
      duplicates: duplicates.results,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating admin analytics:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate analytics' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getAdminUsers(userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is at least admin
  if (!(await getCachedIsUserAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const isSuperAdmin = await getCachedIsUserSuperAdmin(userId, env);

  try {
    let users;
    
    if (isSuperAdmin) {
      // Super admins can see all users globally, except other super admins
      users = await env.DB.prepare(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.auth_provider, 
               u.email_verified, u.user_role, u.created_at,
               COUNT(DISTINCT b.id) as books_added,
               COUNT(DISTINCT COALESCE(lm.location_id, l.id)) as locations_joined,
               MAX(b.created_at) as last_book_added,
               GROUP_CONCAT(DISTINCT loc.name) as location_names
        FROM users u
        LEFT JOIN books b ON u.id = b.added_by
        LEFT JOIN location_members lm ON u.id = lm.user_id
        LEFT JOIN locations l ON u.id = l.owner_id
        LEFT JOIN locations loc ON (loc.id = lm.location_id OR loc.id = l.id)
        WHERE u.user_role != 'super_admin' OR u.id = ?
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `).bind(userId).all();
    } else {
      // Regular admins can only see users from their assigned locations
      users = await env.DB.prepare(`
        SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.auth_provider, 
               u.email_verified, u.user_role, u.created_at,
               COUNT(DISTINCT b.id) as books_added,
               COUNT(DISTINCT COALESCE(lm_user.location_id, l_user.id)) as locations_joined,
               MAX(b.created_at) as last_book_added,
               GROUP_CONCAT(DISTINCT loc_user.name) as location_names
        FROM users u
        LEFT JOIN books b ON u.id = b.added_by
        LEFT JOIN location_members lm_user ON u.id = lm_user.user_id
        LEFT JOIN locations l_user ON u.id = l_user.owner_id
        LEFT JOIN locations loc_user ON (loc_user.id = lm_user.location_id OR loc_user.id = l_user.id)
        WHERE u.id IN (
          SELECT DISTINCT user_id FROM (
            -- Users who are members of locations owned by this admin
            SELECT lm.user_id 
            FROM location_members lm
            INNER JOIN locations l ON lm.location_id = l.id
            WHERE l.owner_id = ?
            
            UNION
            
            -- Users who are members of locations this admin is assigned to
            SELECT lm.user_id 
            FROM location_members lm
            WHERE lm.location_id IN (
              SELECT location_id FROM location_members WHERE user_id = ?
            )
            
            UNION
            
            -- Users who own locations this admin is assigned to
            SELECT l.owner_id as user_id
            FROM locations l
            INNER JOIN location_members lm ON l.id = lm.location_id
            WHERE lm.user_id = ?
            
            UNION
            
            -- Include the admin themselves
            SELECT ? as user_id
          )
        )
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `).bind(userId, userId, userId, userId).all();
    }

    return new Response(JSON.stringify(users.results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function updateUserRole(request: Request, targetUserId: string, adminUserId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin (role management is super admin only)
  if (!(await getCachedIsUserSuperAdmin(adminUserId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { role }: { role: 'super_admin' | 'admin' | 'user' } = await request.json();

    if (!['super_admin', 'admin', 'user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role. Must be "super_admin", "admin" or "user"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if target user exists
    const targetUser = await env.DB.prepare(`
      SELECT id, email, user_role FROM users WHERE id = ?
    `).bind(targetUserId).first();

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent admin from demoting themselves
    if (targetUserId === adminUserId && role === 'user') {
      return new Response(JSON.stringify({ error: 'Cannot demote yourself from admin' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user role
    await env.DB.prepare(`
      UPDATE users 
      SET user_role = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(role, targetUserId).run();

    // Invalidate admin analytics cache on role change
    await invalidateAllAdminAnalytics(env);

    return new Response(JSON.stringify({ 
      message: `User role updated to ${role}`,
      userId: targetUserId,
      newRole: role
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user role' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getAvailableAdmins(userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is admin
  if (!(await getCachedIsUserAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get all admin users (for ownership transfer) - exclude super admins
    const admins = await env.DB.prepare(`
      SELECT id, email, first_name, last_name
      FROM users 
      WHERE user_role = 'admin'
      ORDER BY first_name, last_name, email
    `).all();

    return new Response(JSON.stringify(admins.results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching available admins:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch admin users' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getUserLocationAssignments(targetUserId: string, adminUserId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is at least admin
  if (!(await getCachedIsUserAdmin(adminUserId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const isSuperAdmin = await getCachedIsUserSuperAdmin(adminUserId, env);

  try {
    // Check if target user exists
    const targetUser = await env.DB.prepare(`
      SELECT id, email, user_role FROM users WHERE id = ?
    `).bind(targetUserId).first();

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((targetUser as any).user_role === 'super_admin') {
      // Super admins have global access and don't need explicit location assignments
      return new Response(JSON.stringify({
        assigned_locations: [],
        available_locations: [],
        message: 'Super admins have global access to all locations and do not need explicit assignments'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let assignedLocations, availableLocations;

    if (isSuperAdmin) {
      // Super admin can see all locations the target user is assigned to
      assignedLocations = await env.DB.prepare(`
        SELECT l.id, l.name, l.description
        FROM locations l
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.owner_id = ? OR lm.user_id = ?
        ORDER BY l.name
      `).bind(targetUserId, targetUserId).all();

      // Get all locations that could be assigned (not currently assigned)
      availableLocations = await env.DB.prepare(`
        SELECT l.id, l.name, l.description
        FROM locations l
        WHERE l.id NOT IN (
          SELECT DISTINCT l2.id
          FROM locations l2
          LEFT JOIN location_members lm2 ON l2.id = lm2.location_id
          WHERE l2.owner_id = ? OR lm2.user_id = ?
        )
        ORDER BY l.name
      `).bind(targetUserId, targetUserId).all();
    } else {
      // Regular admin can only see/manage locations they are assigned to
      const adminManagedLocations = await env.DB.prepare(`
        SELECT l.id, l.name, l.description
        FROM locations l
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.owner_id = ? OR lm.user_id = ?
        ORDER BY l.name
      `).bind(adminUserId, adminUserId).all();

      const adminLocationIds = (adminManagedLocations.results as any[]).map(loc => loc.id);

      if (adminLocationIds.length === 0) {
        return new Response(JSON.stringify({
          assigned_locations: [],
          available_locations: [],
          message: 'You are not assigned to any locations and cannot manage user assignments'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get target user's locations that the admin can manage
      assignedLocations = await env.DB.prepare(`
        SELECT l.id, l.name, l.description
        FROM locations l
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE (l.owner_id = ? OR lm.user_id = ?) 
        AND l.id IN (${adminLocationIds.map(() => '?').join(',')})
        ORDER BY l.name
      `).bind(targetUserId, targetUserId, ...adminLocationIds).all();

      // Get admin's managed locations that target user is NOT assigned to
      availableLocations = await env.DB.prepare(`
        SELECT l.id, l.name, l.description
        FROM locations l
        WHERE l.id IN (${adminLocationIds.map(() => '?').join(',')})
        AND l.id NOT IN (
          SELECT DISTINCT l2.id
          FROM locations l2
          LEFT JOIN location_members lm2 ON l2.id = lm2.location_id
          WHERE l2.owner_id = ? OR lm2.user_id = ?
        )
        ORDER BY l.name
      `).bind(...adminLocationIds, targetUserId, targetUserId).all();
    }

    return new Response(JSON.stringify({
      assigned_locations: assignedLocations.results,
      available_locations: availableLocations.results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching user location assignments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch location assignments' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function assignLocationToUser(targetUserId: string, locationId: string, adminUserId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is at least admin
  if (!(await getCachedIsUserAdmin(adminUserId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const isSuperAdmin = await getCachedIsUserSuperAdmin(adminUserId, env);

  try {
    // Check if target user exists
    const targetUser = await env.DB.prepare(`
      SELECT id, email, user_role FROM users WHERE id = ?
    `).bind(targetUserId).first();

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if location exists
    const location = await env.DB.prepare(`
      SELECT id, name FROM locations WHERE id = ?
    `).bind(locationId).first();

    if (!location) {
      return new Response(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For regular admins, check if they can manage this location
    if (!isSuperAdmin) {
      const canManageLocation = await env.DB.prepare(`
        SELECT 1 FROM locations l
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.id = ? AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(locationId, adminUserId, adminUserId).first();

      if (!canManageLocation) {
        return new Response(JSON.stringify({ error: 'You can only assign users to locations you manage' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check if user already has access to this location
    const existingAccess = await env.DB.prepare(`
      SELECT 1 FROM locations l
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE l.id = ? AND (l.owner_id = ? OR lm.user_id = ?)
    `).bind(locationId, targetUserId, targetUserId).first();

    if (existingAccess) {
      return new Response(JSON.stringify({ error: 'User already has access to this location' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add user as a member of the location
    await env.DB.prepare(`
      INSERT INTO location_members (location_id, user_id, joined_at)
      VALUES (?, ?, datetime('now'))
    `).bind(locationId, targetUserId).run();

    // Apply default permissions to the new user
    try {
      await applyDefaultPermissionsToUser(parseInt(locationId), targetUserId, adminUserId, env);
    } catch (error) {
      console.warn('Failed to apply default permissions to user:', error);
      // Don't fail the assignment if permission application fails
    }

    return new Response(JSON.stringify({ 
      message: `User successfully assigned to location "${(location as any).name}"`,
      locationId,
      userId: targetUserId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error assigning location to user:', error);
    return new Response(JSON.stringify({ error: 'Failed to assign location to user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function unassignLocationFromUser(targetUserId: string, locationId: string, adminUserId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is at least admin
  if (!(await getCachedIsUserAdmin(adminUserId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const isSuperAdmin = await getCachedIsUserSuperAdmin(adminUserId, env);

  try {
    // Check if target user exists
    const targetUser = await env.DB.prepare(`
      SELECT id, email, user_role FROM users WHERE id = ?
    `).bind(targetUserId).first();

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if location exists
    const location = await env.DB.prepare(`
      SELECT id, name FROM locations WHERE id = ?
    `).bind(locationId).first();

    if (!location) {
      return new Response(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For regular admins, check if they can manage this location
    if (!isSuperAdmin) {
      const canManageLocation = await env.DB.prepare(`
        SELECT 1 FROM locations l
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.id = ? AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(locationId, adminUserId, adminUserId).first();

      if (!canManageLocation) {
        return new Response(JSON.stringify({ error: 'You can only unassign users from locations you manage' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check if there are other admins assigned to this location
    // Note: Super admins are excluded since they have global access and don't need explicit assignments
    const otherAdmins = await env.DB.prepare(`
      SELECT COUNT(*) as admin_count FROM (
        -- Count location owner if they are a regular admin (not super_admin)
        SELECT 1 FROM locations l
        INNER JOIN users u ON l.owner_id = u.id
        WHERE l.id = ? AND u.user_role = 'admin' AND u.id != ?
        
        UNION ALL
        
        -- Count other regular admin members of this location (not super_admin)
        SELECT 1 FROM location_members lm
        INNER JOIN users u ON lm.user_id = u.id
        WHERE lm.location_id = ? AND u.user_role = 'admin' AND u.id != ?
      )
    `).bind(locationId, targetUserId, locationId, targetUserId).first();

    if ((otherAdmins as any)?.admin_count === 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot remove the last admin from this location. Please assign another admin to this location first.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is the owner of this location
    const isOwner = await env.DB.prepare(`
      SELECT 1 FROM locations WHERE id = ? AND owner_id = ?
    `).bind(locationId, targetUserId).first();

    if (isOwner) {
      // If user is owner, transfer ownership to another admin
      const newOwner = await env.DB.prepare(`
        SELECT u.id FROM users u
        INNER JOIN location_members lm ON u.id = lm.user_id
        WHERE lm.location_id = ? AND u.user_role IN ('admin', 'super_admin') AND u.id != ?
        ORDER BY u.created_at ASC
        LIMIT 1
      `).bind(locationId, targetUserId).first();

      if (!newOwner) {
        // No other admin members found, check if there's another admin who owns this location
        return new Response(JSON.stringify({ 
          error: 'Cannot remove location owner without another admin assigned to this location. Please assign another admin first.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Transfer ownership to the new admin
      await env.DB.prepare(`
        UPDATE locations 
        SET owner_id = ?
        WHERE id = ?
      `).bind((newOwner as any).id, locationId).run();

      return new Response(JSON.stringify({ 
        message: `User successfully removed from location "${(location as any).name}" and ownership transferred to another admin`,
        locationId,
        userId: targetUserId,
        ownershipTransferred: true,
        newOwnerId: (newOwner as any).id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Remove user as a member of the location
      const result = await env.DB.prepare(`
        DELETE FROM location_members 
        WHERE location_id = ? AND user_id = ?
      `).bind(locationId, targetUserId).run();

      if (result.changes === 0) {
        return new Response(JSON.stringify({ error: 'User was not assigned to this location' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: `User successfully unassigned from location "${(location as any).name}"`,
      locationId,
      userId: targetUserId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error unassigning location from user:', error);
    return new Response(JSON.stringify({ error: 'Failed to unassign location from user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}