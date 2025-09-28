import { Env } from '../types';
import { sendSignupApprovalEmail } from '../email';
import { isUserAdmin, isUserSuperAdmin } from '../auth';

// Utility functions
function generateUUID(): string {
  return crypto.randomUUID();
}

// Admin-only signup approval functions
export async function getSignupRequests(userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin (signup management is super admin only)
  if (!(await isUserSuperAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const requests = await env.DB.prepare(`
      SELECT 
        id, email, first_name, last_name, status, requested_at, 
        reviewed_by, reviewed_at, review_comment
      FROM signup_approval_requests 
      ORDER BY requested_at DESC
    `).all();

    return new Response(JSON.stringify(requests.results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching signup requests:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch signup requests' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function approveSignupRequest(request: Request, requestId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin (signup management is super admin only)
  if (!(await isUserSuperAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { 
      comment, 
      onboarding: onboardingParam 
    }: { 
      comment?: string;
      onboarding?: {
        type: 'existing_location' | 'new_location';
        location_id?: number;
      };
    } = await request.json().catch(() => ({ comment: undefined, onboarding: undefined }));

    // Get the signup request
    const signupRequest = await env.DB.prepare(`
      SELECT * FROM signup_approval_requests WHERE id = ? AND status = 'pending'
    `).bind(requestId).first();

    if (!signupRequest) {
      return new Response(JSON.stringify({ error: 'Signup request not found or already processed' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = signupRequest as any;

    // Generate verification token
    const verificationToken = generateUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create the user account
    const newUserId = generateUUID();
    await env.DB.prepare(`
      INSERT INTO users (id, email, first_name, last_name, password_hash, auth_provider, email_verified, 
                        email_verification_token, email_verification_expires, user_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newUserId,
      requestData.email,
      requestData.first_name,
      requestData.last_name,
      requestData.password_hash,
      requestData.auth_provider,
      false,
      verificationToken,
      verificationExpires.toISOString(),
      'user'
    ).run();

    // Enhanced User Onboarding (LCWEB-169) - Handle location assignment
    let onboardingResult: {
      type: string;
      location_id: number | null;
      location_name: string | null;
      permissions_granted: string[];
      capabilities_granted: string[];
    } = {
      type: 'none',
      location_id: null,
      location_name: null,
      permissions_granted: [],
      capabilities_granted: []
    };

    // Default to personal library creation if no onboarding specified (backward compatibility)
    const onboarding = onboardingParam || { type: 'new_location' };

    // Determine user role based on onboarding type
    const userRole = onboarding.type === 'new_location' ? 'admin' : 'user';

    // Update user role for location owners
    if (userRole === 'admin') {
      await env.DB.prepare(`
        UPDATE users SET user_role = ? WHERE id = ?
      `).bind(userRole, newUserId).run();
    }

    if (onboarding) {
      const { assignUserToLocation, createPersonalLocation } = await import('../locations');
      
      if (onboarding.type === 'existing_location' && onboarding.location_id) {
        // Path 1: Assign to existing location
        const memberPermissions = ['can_add_books', 'can_create_shelves'];
        
        try {
          await assignUserToLocation(
            newUserId, 
            onboarding.location_id, 
            'member', 
            memberPermissions, 
            userId, 
            env
          );

          // Get location name for response
          const locationResult = await env.DB.prepare(`
            SELECT name FROM locations WHERE id = ?
          `).bind(onboarding.location_id).first() as any;

          onboardingResult = {
            type: 'existing_location',
            location_id: onboarding.location_id,
            location_name: locationResult?.name || 'Unknown Location',
            permissions_granted: memberPermissions,
            capabilities_granted: []
          };
        } catch (error) {
          console.error('Failed to assign user to existing location:', error);
        }
      } else if (onboarding.type === 'new_location') {
        // Path 2: Create new personal location
        const ownerPermissions = ['can_add_books', 'can_create_shelves', 'can_delete_books', 'can_move_books'];
        const adminCapabilities = ['can_control_user_capabilities', 'can_invite_users', 'can_manage_shelves', 'can_manage_location_settings'];
        
        try {
          const userName = `${requestData.first_name}${requestData.last_name ? ' ' + requestData.last_name : ''}`;
          const result = await createPersonalLocation(
            newUserId,
            userName,
            ownerPermissions,
            adminCapabilities,
            env
          );

          onboardingResult = {
            type: 'new_location',
            location_id: result.locationId,
            location_name: result.locationName,
            permissions_granted: ownerPermissions,
            capabilities_granted: adminCapabilities
          };
        } catch (error) {
          console.error('Failed to create personal location for user:', error);
        }
      }
    }

    // Update the signup request
    await env.DB.prepare(`
      UPDATE signup_approval_requests 
      SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, 
          review_comment = ?, created_user_id = ?
      WHERE id = ?
    `).bind(userId, comment || null, newUserId, requestId).run();

    // Send approval email with verification token
    await sendSignupApprovalEmail(
      env, 
      requestData.email, 
      requestData.first_name, 
      verificationToken, 
      true, 
      comment
    );

    // Invalidate admin analytics cache since pending signup count changed
    const { invalidateAllAdminAnalytics } = await import('./cached');
    await invalidateAllAdminAnalytics(env);

    return new Response(JSON.stringify({ 
      message: 'Signup request approved successfully',
      user_id: newUserId,
      email: requestData.email,
      onboarding: onboardingResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error approving signup request:', error);
    return new Response(JSON.stringify({ error: 'Failed to approve signup request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function denySignupRequest(request: Request, requestId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin (signup management is super admin only)
  if (!(await isUserSuperAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { comment }: { comment?: string } = await request.json().catch(() => ({ comment: undefined }));

    // Get the signup request
    const signupRequest = await env.DB.prepare(`
      SELECT * FROM signup_approval_requests WHERE id = ? AND status = 'pending'
    `).bind(requestId).first();

    if (!signupRequest) {
      return new Response(JSON.stringify({ error: 'Signup request not found or already processed' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = signupRequest as any;

    // Update the signup request
    await env.DB.prepare(`
      UPDATE signup_approval_requests 
      SET status = 'denied', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_comment = ?
      WHERE id = ?
    `).bind(userId, comment || null, requestId).run();

    // Send denial email
    await sendSignupApprovalEmail(
      env, 
      requestData.email, 
      requestData.first_name, 
      null, 
      false, 
      comment
    );

    // Invalidate admin analytics cache since pending signup count changed
    const { invalidateAllAdminAnalytics } = await import('./cached');
    await invalidateAllAdminAnalytics(env);

    return new Response(JSON.stringify({ 
      message: 'Signup request denied',
      email: requestData.email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error denying signup request:', error);
    return new Response(JSON.stringify({ error: 'Failed to deny signup request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Admin-only user cleanup function
export async function cleanupUser(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin (user deletion is super admin only)
  if (!(await isUserSuperAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { email_to_delete, new_location_owners, locations_to_delete }: {
    email_to_delete: string;
    new_location_owners?: Record<string, string>;
    locations_to_delete?: number[];
  } = await request.json();

  if (!email_to_delete) {
    return new Response(JSON.stringify({ error: 'email_to_delete required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Find the user to delete
    const userToDelete = await env.DB.prepare(`
      SELECT id, email FROM users WHERE email = ?
    `).bind(email_to_delete).first();

    if (!userToDelete) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIdToDelete = userToDelete.id as string;

    // 1. Find locations owned by this user
    const ownedLocations = await env.DB.prepare(`
      SELECT id, name FROM locations WHERE owner_id = ?
    `).bind(userIdToDelete).all();

    // Check if user owns locations and we need new owners or deletion instructions
    if (ownedLocations.results.length > 0 && !new_location_owners && !locations_to_delete) {
      // Return locations that need new owners
      return new Response(JSON.stringify({
        error: 'Location ownership transfer required',
        owned_locations: ownedLocations.results,
        requires_ownership_transfer: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Transfer location ownership if new owners provided
    if (ownedLocations.results.length > 0 && new_location_owners) {
      for (const location of ownedLocations.results) {
        const locationData = location as any;
        const locationId = locationData.id;
        const newOwnerId = new_location_owners[locationId.toString()];

        // Skip locations marked for deletion
        if (locations_to_delete && locations_to_delete.includes(locationId)) {
          continue;
        }

        if (!newOwnerId) {
          return new Response(JSON.stringify({
            error: `New owner required for location: ${locationData.name}`
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify new owner is an admin
        const newOwner = await env.DB.prepare(`
          SELECT user_role FROM users WHERE id = ?
        `).bind(newOwnerId).first();

        if (!newOwner || ((newOwner as any).user_role !== 'admin' && (newOwner as any).user_role !== 'super_admin')) {
          return new Response(JSON.stringify({ 
            error: `New owner must be an admin or super admin user` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Transfer location ownership
        await env.DB.prepare(`
          UPDATE locations SET owner_id = ? WHERE id = ?
        `).bind(newOwnerId, locationId).run();

        // Update location membership to make new owner an owner
        await env.DB.prepare(`
          INSERT OR REPLACE INTO location_members (location_id, user_id, role, invited_by, joined_at)
          VALUES (?, ?, 'owner', ?, CURRENT_TIMESTAMP)
        `).bind(locationId, newOwnerId, userId).run();
      }
    }

    // 3. Delete locations marked for deletion
    if (locations_to_delete && locations_to_delete.length > 0) {
      for (const locationId of locations_to_delete) {
        // Use the same deletion logic as the location deletion endpoint with batch transaction
        await env.DB.batch([
          env.DB.prepare('PRAGMA foreign_keys = OFF'),

          // Delete book images first (they reference books and users)
          env.DB.prepare(`
            DELETE FROM book_images
            WHERE book_id IN (
              SELECT b.id
              FROM books b
              JOIN shelves s ON b.shelf_id = s.id
              WHERE s.location_id = ?
            )
          `).bind(locationId),

          // Delete books (they reference shelves)
          env.DB.prepare('DELETE FROM books WHERE shelf_id IN (SELECT id FROM shelves WHERE location_id = ?)').bind(locationId),

          // Delete shelves (they reference locations)
          env.DB.prepare('DELETE FROM shelves WHERE location_id = ?').bind(locationId),

          // Delete location-specific permission and capability data
          env.DB.prepare('DELETE FROM location_user_permissions WHERE location_id = ?').bind(locationId),
          env.DB.prepare('DELETE FROM location_admin_capabilities WHERE location_id = ?').bind(locationId),
          env.DB.prepare('DELETE FROM location_default_permissions WHERE location_id = ?').bind(locationId),

          // Delete location membership and invitation data
          env.DB.prepare('DELETE FROM location_members WHERE location_id = ?').bind(locationId),
          env.DB.prepare('DELETE FROM location_invitations WHERE location_id = ?').bind(locationId),

          // Finally delete the location itself
          env.DB.prepare('DELETE FROM locations WHERE id = ?').bind(locationId),

          env.DB.prepare('PRAGMA foreign_keys = ON')
        ]);
      }
    }

    // 4. Keep books but remove user reference (books become property of location/shelf)
    await env.DB.prepare(`
      UPDATE books SET added_by = NULL WHERE added_by = ?
    `).bind(userIdToDelete).run();

    // 4. Handle book removal requests - remove user references
    await env.DB.prepare(`
      UPDATE book_removal_requests SET requester_id = NULL WHERE requester_id = ?
    `).bind(userIdToDelete).run();

    await env.DB.prepare(`
      UPDATE book_removal_requests SET reviewed_by = NULL WHERE reviewed_by = ?
    `).bind(userIdToDelete).run();

    // 5. Shelves are kept as they belong to locations (no action needed)

    // 6. Remove user from location memberships
    await env.DB.prepare(`
      DELETE FROM location_members WHERE user_id = ?
    `).bind(userIdToDelete).run();

    // 7. Delete invitations sent by this user
    await env.DB.prepare(`
      DELETE FROM location_invitations WHERE invited_by = ?
    `).bind(userIdToDelete).run();

    // 8. Delete invitations sent to this user
    await env.DB.prepare(`
      DELETE FROM location_invitations WHERE invited_email = ?
    `).bind(email_to_delete).run();

    // 9. Finally, delete the user
    await env.DB.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(userIdToDelete).run();

    const transferredCount = ownedLocations.results.filter((loc: any) =>
      !locations_to_delete || !locations_to_delete.includes(loc.id)
    ).length;
    const deletedCount = locations_to_delete ? locations_to_delete.length : 0;

    let message = `User ${email_to_delete} deleted successfully.`;
    if (transferredCount > 0) {
      message += ` ${transferredCount} location(s) transferred to new owners.`;
    }
    if (deletedCount > 0) {
      message += ` ${deletedCount} location(s) deleted permanently.`;
    }
    if (transferredCount > 0) {
      message += ' Books and shelves preserved in transferred locations.';
    }

    return new Response(JSON.stringify({
      message,
      deleted_user_id: userIdToDelete,
      transferred_locations_count: transferredCount,
      deleted_locations_count: deletedCount,
      books_preserved: transferredCount > 0,
      shelves_preserved: transferredCount > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error during user cleanup:', error);
    return new Response(JSON.stringify({ error: 'Failed to cleanup user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Admin-only debug function to list all users
export async function debugListUsers(userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin (global user listing is super admin only)
  if (!(await isUserSuperAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Super admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get all users
    const users = await env.DB.prepare(`
      SELECT id, email, first_name, last_name, auth_provider, email_verified, user_role, created_at
      FROM users 
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify(users.results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error listing users:', error);
    return new Response(JSON.stringify({ error: 'Failed to list users' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}