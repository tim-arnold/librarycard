import { Env } from '../types';

// Profile functions extracted from main worker

export async function getUserProfile(userId: string, env: Env, corsHeaders: Record<string, string>) {
  const user = await env.DB.prepare(`
    SELECT id, email, first_name, last_name, auth_provider, email_verified, user_role, created_at
    FROM users 
    WHERE id = ?
  `).bind(userId).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify(user), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function updateUserProfile(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    [key: string]: any;
  } = await request.json();
  
  // Get current user info to check auth provider
  const currentUser = await env.DB.prepare(`
    SELECT auth_provider FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Build dynamic update query based on what can be changed
  const allowedFields = ['first_name', 'last_name'];
  if ((currentUser as any).auth_provider === 'email') {
    allowedFields.push('email');
  }
  
  const updateFields: string[] = [];
  const values: any[] = [];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }
  
  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  updateFields.push('updated_at = datetime(\'now\')');
  values.push(userId);
  
  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
  
  await env.DB.prepare(query).bind(...values).run();
  
  return new Response(JSON.stringify({ message: 'Profile updated successfully' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Batched dashboard endpoint - combines existing working API calls
export async function getDashboardData(userId: string, env: Env, corsHeaders: Record<string, string>, fields?: string) {
  try {
    // Import the actual working functions
    const { getUserLocations } = await import('../locations/index');
    const { getCachedUserBooks } = await import('../books/cached');
    const { getBookRemovalRequests } = await import('../books/index');
    const { getUserGlobalPermissions, getUserPermissions } = await import('../permissions/index');

    // Call the existing working API functions that are already being used
    const profileResponse = await getUserProfile(userId, env, corsHeaders);
    const profileData = await profileResponse.json();
    
    const locationsResponse = await getUserLocations(userId, env, corsHeaders);
    const locations = await locationsResponse.json();
    
    const booksResponse = await getCachedUserBooks(userId, env, corsHeaders);
    const books = await booksResponse.json();
    
    const removalRequestsResponse = await getBookRemovalRequests(userId, env, corsHeaders);
    const removalRequests = await removalRequestsResponse.json();
    
    // Mock request for global permissions (since it expects a Request object)
    const mockRequest = new Request('http://localhost/api/permissions/global', { method: 'GET' });
    const globalPermissionsResponse = await getUserGlobalPermissions(mockRequest, userId, env, corsHeaders);
    const globalPermissions = await globalPermissionsResponse.json();

    // Get location-specific permissions for first location (as done in useBookLibrary)
    let userPermissions = [];
    if (locations && locations.length > 0) {
      const permissionUrl = `http://localhost/api/permissions/user?locationId=${locations[0].id}`;
      const mockPermissionRequest = new Request(permissionUrl, { method: 'GET' });
      const userPermissionsResponse = await getUserPermissions(mockPermissionRequest, userId, env, corsHeaders);
      const userPermissionsData = await userPermissionsResponse.json();
      userPermissions = userPermissionsData.permissions || [];
    }

    // Get shelves for all accessible locations (as done in useBookLibrary)
    const { getLocationShelves } = await import('../locations/index');
    const allShelves = [];
    if (locations && locations.length > 0) {
      for (const location of locations) {
        const shelvesResponse = await getLocationShelves(location.id, userId, env, corsHeaders);
        const shelves = await shelvesResponse.json();
        allShelves.push(...shelves);
      }
    }

    // Process removal requests into map format (as done in useBookLibrary)
    const pendingRemovalMap: Record<string, number> = {};
    if (profileData.user_role !== 'admin') {
      removalRequests.forEach((request: any) => {
        if (request.status === 'pending') {
          pendingRemovalMap[request.book_id.toString()] = request.id;
        }
      });
    }

    // Apply field selection if specified
    let optimizedBooks = books;
    if (fields && books && Array.isArray(books)) {
      const requestedFields = fields.split(',').map(f => f.trim());
      optimizedBooks = books.map((book: any) => {
        const filteredBook: any = {};
        for (const field of requestedFields) {
          if (field in book) {
            filteredBook[field] = book[field];
          }
        }
        return filteredBook;
      });
    }

    // Return data in the same format the frontend expects
    return new Response(JSON.stringify({
      profile: profileData,
      locations: locations,
      books: optimizedBooks,
      shelves: allShelves,
      permissions: {
        global: globalPermissions.permissions || [],
        user: userPermissions
      },
      pendingRemovalRequests: pendingRemovalMap,
      csrfToken: crypto.randomUUID() // Generate CSRF token
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch dashboard data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}