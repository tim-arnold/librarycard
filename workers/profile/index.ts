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

  if (updates.first_name !== undefined) {
    if (typeof updates.first_name !== 'string' || updates.first_name.length > 100) {
      return new Response(JSON.stringify({ error: 'First name must be 100 characters or less' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    updates.first_name = updates.first_name.trim();
  }

  if (updates.last_name !== undefined) {
    if (typeof updates.last_name !== 'string' || updates.last_name.length > 100) {
      return new Response(JSON.stringify({ error: 'Last name must be 100 characters or less' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    updates.last_name = updates.last_name.trim();
  }

  if (updates.email !== undefined) {
    if (typeof updates.email !== 'string' || updates.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    updates.email = updates.email.trim().toLowerCase();
  }

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
    const profileData = await profileResponse.json() as any;
    
    const locationsResponse = await getUserLocations(userId, env, corsHeaders);
    const locations = await locationsResponse.json() as any;
    
    const booksResponse = await getCachedUserBooks(userId, env, corsHeaders);
    const books = await booksResponse.json() as any;
    
    const removalRequestsResponse = await getBookRemovalRequests(userId, env, corsHeaders);
    const removalRequests = await removalRequestsResponse.json() as any;
    
    // Mock request for global permissions (since it expects a Request object)
    const mockRequest = new Request('http://localhost/api/permissions/global', { method: 'GET' });
    const globalPermissionsResponse = await getUserGlobalPermissions(mockRequest, userId, env, corsHeaders);
    const globalPermissions = await globalPermissionsResponse.json() as any;

    // Get location-specific permissions for first location (as done in useBookLibrary)
    let userPermissions = [];
    if (locations && locations.length > 0) {
      const permissionUrl = `http://localhost/api/permissions/user?locationId=${locations[0].id}`;
      const mockPermissionRequest = new Request(permissionUrl, { method: 'GET' });
      const userPermissionsResponse = await getUserPermissions(mockPermissionRequest, userId, env, corsHeaders);
      const userPermissionsData = await userPermissionsResponse.json() as any;
      userPermissions = userPermissionsData.permissions || [];
    }

    // Get shelves for all accessible locations (as done in useBookLibrary)
    const { getLocationShelves } = await import('../locations/index');
    const allShelves = [];
    if (locations && locations.length > 0) {
      for (const location of locations) {
        const shelvesResponse = await getLocationShelves(location.id, userId, env, corsHeaders);
        const shelves = await shelvesResponse.json() as any;
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

export async function getUserRejectedReviews(userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Get rejected reviews for the user with related notification status
    const rejectedReviews = await env.DB.prepare(`
      SELECT 
        br.id,
        b.title as book_title,
        b.authors as book_authors,
        br.review_rejection_reason,
        br.reviewed_at as rejected_at,
        br.review_text,
        n.id as notification_id,
        n.is_read as is_notification_read
      FROM book_ratings br
      JOIN books b ON br.book_id = b.id
      LEFT JOIN in_app_notifications n ON n.recipient_user_id = ? 
        AND n.notification_type = 'book_review_rejected'
        AND JSON_EXTRACT(n.metadata, '$.bookTitle') = b.title
      WHERE br.user_id = ? 
        AND br.review_status = 'rejected'
        AND br.review_rejection_reason IS NOT NULL
      ORDER BY br.reviewed_at DESC
    `).bind(userId, userId).all();

    // Count unread rejected review notifications
    // Only count actual unread notifications - no fallback logic
    const unreadNotificationsCount = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM in_app_notifications n
      WHERE n.recipient_user_id = ? 
        AND n.notification_type = 'book_review_rejected'
        AND n.is_read = FALSE
    `).bind(userId).first() as any;

    // Debug: Let's see what notifications exist
    const allRejectedNotifications = await env.DB.prepare(`
      SELECT id, title, message, is_read, created_at, metadata
      FROM in_app_notifications n
      WHERE n.recipient_user_id = ? 
        AND n.notification_type = 'book_review_rejected'
      ORDER BY created_at DESC
    `).bind(userId).all();

    // Debug logging removed to reduce noise

    let unreadCount = unreadNotificationsCount?.count || 0;

    // ENHANCED BACKFILL FIX: Create missing notifications for rejected reviews without notifications
    if (rejectedReviews.results.length > 0) {
      // Checking for rejected reviews without notifications...
      
      const { createInAppNotification } = await import('../notifications/index');
      let createdCount = 0;
      
      for (const review of rejectedReviews.results as any[]) {
        // Check if this specific review already has a notification
        const existingNotification = allRejectedNotifications.results.find((notif: any) => {
          const metadata = JSON.parse(notif.metadata || '{}');
          return metadata.bookTitle === review.book_title;
        });
        
        if (!existingNotification) {
          try {
            await createInAppNotification(
              env,
              userId,
              'book_review_rejected',
              'Book Review Rejected',
              `Your review for "${review.book_title}" was not approved. ${review.review_rejection_reason || 'No reason provided.'}`,
              `/library?search=${encodeURIComponent(review.book_title)}`,
              'View Book',
              undefined,
              undefined,
              { bookTitle: review.book_title, bookAuthors: review.book_authors, comment: review.review_rejection_reason }
            );
            // Created missing notification for: ${review.book_title}
            createdCount++;
          } catch (error) {
            console.error(`❌ Failed to create notification for ${review.book_title}:`, error);
          }
        } else {
          // Notification already exists for: ${review.book_title}
        }
      }
      
      if (createdCount > 0) {
        // Recount after creating notifications
        const newUnreadCount = await env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM in_app_notifications n
          WHERE n.recipient_user_id = ? 
            AND n.notification_type = 'book_review_rejected'
            AND n.is_read = FALSE
        `).bind(userId).first() as any;
        
        unreadCount = newUnreadCount?.count || 0;
        // New unread count after creating ${createdCount} notifications: ${unreadCount}
      } else {
        // No missing notifications found to create
      }
    }

    return new Response(JSON.stringify({
      rejectedReviews: rejectedReviews.results || [],
      unreadCount: unreadCount || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching rejected reviews:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch rejected reviews' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}