/**
 * AI Book Cover Appeals System
 * LCWEB-190: Handle appeals when AI incorrectly rejects legitimate book covers
 */

import { Env, BookCoverAppeal, AppealSubmissionRequest, AppealResolutionRequest, AIClassificationAllowlist } from '../types';
import { getUserFromRequest } from '../auth';
import { createInAppNotification, getNotificationRecipients } from '../notifications';

/**
 * Get user data from userId for role checking
 */
async function getUserData(userId: string, env: Env): Promise<{ id: string; email: string; user_role: string; first_name?: string; last_name?: string } | null> {
  try {
    const userStmt = env.DB.prepare(`
      SELECT id, email, user_role, first_name, last_name
      FROM users
      WHERE id = ?
    `);
    const user = await userStmt.bind(userId).first() as any;
    return user || null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function handleAppealsRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pathSegments: string[]
): Promise<Response> {
  const method = request.method;
  const endpoint = pathSegments[0] || '';

  // Get user from request
  const userId = await getUserFromRequest(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    switch (method) {
      case 'GET':
        if (endpoint === '') {
          // GET /api/appeals - List user's appeals (regular users) or all appeals (admins)
          return await listAppeals(userId, env, corsHeaders);
        } else if (endpoint === 'admin') {
          // GET /api/appeals/admin - Admin-only appeals management
          return await listAppealsForAdmin(userId, env, corsHeaders);
        } else if (endpoint === 'allowlist') {
          // GET /api/appeals/allowlist - Get current AI allowlist (admin only)
          return await getAIAllowlist(userId, env, corsHeaders);
        }
        break;

      case 'POST':
        if (endpoint === '') {
          // POST /api/appeals - Submit new appeal
          return await submitAppeal(request, userId, env, corsHeaders);
        } else if (endpoint === 'resolve') {
          // POST /api/appeals/resolve - Resolve appeal (admin only)
          return await resolveAppeal(request, userId, env, corsHeaders);
        } else if (endpoint === 'allowlist') {
          // POST /api/appeals/allowlist - Add to allowlist (admin only)
          return await addToAllowlist(request, userId, env, corsHeaders);
        }
        break;

      case 'PUT':
        if (endpoint && endpoint !== 'admin' && endpoint !== 'allowlist') {
          // PUT /api/appeals/:id - Update appeal (admin only)
          const appealId = parseInt(endpoint);
          if (isNaN(appealId)) {
            return new Response(JSON.stringify({ error: 'Invalid appeal ID' }), {
              status: 400,
              headers: corsHeaders,
            });
          }
          return await updateAppeal(request, userId, env, corsHeaders, appealId);
        }
        break;

      case 'DELETE':
        if (endpoint && endpoint !== 'admin' && endpoint !== 'allowlist') {
          // DELETE /api/appeals/:id - Delete appeal (admin only)
          const appealId = parseInt(endpoint);
          if (isNaN(appealId)) {
            return new Response(JSON.stringify({ error: 'Invalid appeal ID' }), {
              status: 400,
              headers: corsHeaders,
            });
          }
          return await deleteAppeal(userId, env, corsHeaders, appealId);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint or method' }), {
      status: 404,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in appeals request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Submit a new book cover appeal
 */
async function submitAppeal(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: AppealSubmissionRequest = await request.json();

    // Validate required fields
    if (!body.book_title || !body.book_author || !body.image_data_url || !body.rejection_reason) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: book_title, book_author, image_data_url, rejection_reason'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate image data URL format
    if (!body.image_data_url.startsWith('data:image/')) {
      return new Response(JSON.stringify({
        error: 'Invalid image data URL format'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check for duplicate recent appeals from same user for same book
    const recentAppealStmt = env.DB.prepare(`
      SELECT id FROM book_cover_appeals
      WHERE user_id = ? AND book_title = ? AND book_author = ?
        AND submitted_at > datetime('now', '-1 hour')
        AND status IN ('pending', 'approved')
      LIMIT 1
    `);

    const recentAppeal = await recentAppealStmt.bind(
      userId,
      body.book_title.trim(),
      body.book_author.trim()
    ).first();

    if (recentAppeal) {
      return new Response(JSON.stringify({
        error: 'You have already submitted a recent appeal for this book. Please wait before submitting another.'
      }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    // Prepare metadata
    const imageMetadata = {
      size: body.image_data_url.length,
      format: body.image_data_url.startsWith('data:image/webp') ? 'webp' : 'jpeg',
      submitted_via: 'cover_selection_modal'
    };

    // Insert the appeal
    const insertStmt = env.DB.prepare(`
      INSERT INTO book_cover_appeals (
        user_id, book_title, book_author, appeal_reason,
        image_data_url, image_metadata, ai_classification_results,
        rejection_reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = await insertStmt.bind(
      userId,
      body.book_title.trim(),
      body.book_author.trim(),
      body.appeal_reason?.trim() || null,
      body.image_data_url,
      JSON.stringify(imageMetadata),
      body.ai_classification_results ? JSON.stringify(body.ai_classification_results) : null,
      body.rejection_reason
    ).run();

    if (!result.success) {
      throw new Error('Failed to insert appeal into database');
    }

    // Create notifications for admins
    try {
      const recipients = await getNotificationRecipients(env, 'appeal_submitted');

      for (const recipient of recipients) {
        await createInAppNotification(
          env,
          recipient.userId,
          'appeal_submitted',
          'New Appeal Submitted',
          `A user has appealed an AI book cover rejection for "${body.book_title}" by ${body.book_author}`,
          '/admin/appeals',
          'Review Appeals',
          userId,
          undefined,
          {
            bookTitle: body.book_title,
            bookAuthor: body.book_author,
            appealReason: body.appeal_reason
          }
        );
      }

      console.log(`Created appeal notifications for ${recipients.length} admins`);
    } catch (notificationError) {
      console.error('Failed to create appeal notifications:', notificationError);
      // Don't fail the appeal submission if notifications fail
    }

    return new Response(JSON.stringify({
      success: true,
      appeal_id: result.meta.last_row_id,
      message: 'Your appeal has been submitted successfully. An admin will review it shortly.'
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error submitting appeal:', error);
    return new Response(JSON.stringify({
      error: 'Failed to submit appeal. Please try again.'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * List appeals for regular users (their own) or admins (all)
 */
async function listAppeals(userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Get user data for role checking
    const user = await getUserData(userId, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    let stmt;
    let params: any[] = [];

    if (user.user_role === 'admin' || user.user_role === 'super_admin') {
      // Admins see all appeals with user info
      stmt = env.DB.prepare(`
        SELECT
          a.*,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          resolver.email as resolved_by_email,
          resolver.first_name as resolved_by_first_name
        FROM book_cover_appeals a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN users resolver ON a.resolved_by = resolver.id
        ORDER BY a.submitted_at DESC
      `);
    } else {
      // Regular users see only their own appeals
      stmt = env.DB.prepare(`
        SELECT * FROM book_cover_appeals
        WHERE user_id = ?
        ORDER BY submitted_at DESC
      `);
      params = [userId];
    }

    const appeals = await stmt.bind(...params).all();

    // Process appeals for response
    const processedAppeals = appeals.results?.map((appeal: any) => {
      // Parse JSON fields safely
      let imageMetadata = null;
      let aiClassificationResults = null;

      try {
        if (appeal.image_metadata) {
          imageMetadata = JSON.parse(appeal.image_metadata);
        }
      } catch (e) {
        console.warn('Failed to parse image metadata for appeal', appeal.id);
      }

      try {
        if (appeal.ai_classification_results) {
          aiClassificationResults = JSON.parse(appeal.ai_classification_results);
        }
      } catch (e) {
        console.warn('Failed to parse AI results for appeal', appeal.id);
      }

      return {
        ...appeal,
        image_metadata: imageMetadata,
        ai_classification_results: aiClassificationResults,
        // Only include image data URL for admin users - regular users don't need it for performance
        image_data_url: (user.user_role === 'admin' || user.user_role === 'super_admin') ? appeal.image_data_url : undefined
      };
    }) || [];

    return new Response(JSON.stringify({
      appeals: processedAppeals,
      total: processedAppeals.length
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error listing appeals:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load appeals'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Admin-only endpoint for appeals management
 */
async function listAppealsForAdmin(userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  // Get user data for role checking
  const user = await getUserData(userId, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Check admin permissions
  if (user.user_role !== 'admin' && user.user_role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  return await listAppeals(userId, env, corsHeaders);
}

/**
 * Resolve an appeal (admin only)
 */
async function resolveAppeal(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Get user data for role checking
  const user = await getUserData(userId, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Check admin permissions
  if (user.user_role !== 'admin' && user.user_role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const body: AppealResolutionRequest = await request.json();

    if (!body.appeal_id || !body.action) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: appeal_id, action'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!['approve', 'reject', 'add_to_allowlist'].includes(body.action)) {
      return new Response(JSON.stringify({
        error: 'Invalid action. Must be: approve, reject, or add_to_allowlist'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get the appeal
    const appealStmt = env.DB.prepare(`
      SELECT * FROM book_cover_appeals WHERE id = ?
    `);
    const appeal = await appealStmt.bind(body.appeal_id).first() as BookCoverAppeal | null;

    if (!appeal) {
      return new Response(JSON.stringify({ error: 'Appeal not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (appeal.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Appeal has already been resolved' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Start transaction for atomic operations
    const now = new Date().toISOString();
    let newStatus: string = 'pending'; // Initialize with default value
    let actions: string[] = [];

    if (body.action === 'approve') {
      newStatus = 'approved';
      actions.push('approved_image');
    } else if (body.action === 'reject') {
      newStatus = 'rejected';
      actions.push('rejected_appeal');
    } else if (body.action === 'add_to_allowlist') {
      // When adding to allowlist, also handle the specific image based on image_action
      if (body.image_action === 'approve') {
        newStatus = 'approved';
        actions.push('approved_image', 'added_to_allowlist');
      } else if (body.image_action === 'reject') {
        newStatus = 'rejected';
        actions.push('rejected_appeal', 'added_to_allowlist');
      } else {
        // Default to resolved if no image_action specified (backward compatibility)
        newStatus = 'resolved';
        actions.push('added_to_allowlist');
      }

      // Add specified labels to allowlist
      if (body.allowlist_labels && body.allowlist_labels.length > 0) {
        for (const label of body.allowlist_labels) {
          const allowlistStmt = env.DB.prepare(`
            INSERT OR REPLACE INTO ai_classification_allowlist
            (label, confidence_threshold, added_by, added_from_appeal_id, reason, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          await allowlistStmt.bind(
            label.toLowerCase().trim(),
            0.2, // Default threshold
            userId,
            appeal.id,
            `Added from appeal for "${appeal.book_title}" by ${appeal.book_author}`,
            true
          ).run();
        }
      }
    }

    // Update the appeal
    const updateStmt = env.DB.prepare(`
      UPDATE book_cover_appeals
      SET status = ?, admin_notes = ?, resolved_by = ?, resolved_at = ?
      WHERE id = ?
    `);

    await updateStmt.bind(
      newStatus,
      body.admin_notes || null,
      userId,
      now,
      appeal.id
    ).run();

    // Log resolution actions
    for (const actionType of actions) {
      const actionStmt = env.DB.prepare(`
        INSERT INTO appeal_resolution_actions
        (appeal_id, action_type, action_details, performed_by)
        VALUES (?, ?, ?, ?)
      `);

      const actionDetails = {
        admin_notes: body.admin_notes,
        allowlist_labels: body.allowlist_labels || [],
        resolution_timestamp: now
      };

      await actionStmt.bind(
        appeal.id,
        actionType,
        JSON.stringify(actionDetails),
        user.id
      ).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Appeal ${body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'resolved with allowlist update'}`,
      appeal_id: appeal.id,
      new_status: newStatus
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error resolving appeal:', error);
    return new Response(JSON.stringify({
      error: 'Failed to resolve appeal'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Get current AI classification allowlist (admin only)
 */
async function getAIAllowlist(userId: string, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  // Get user data for role checking
  const user = await getUserData(userId, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Check admin permissions
  if (user.user_role !== 'admin' && user.user_role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const stmt = env.DB.prepare(`
      SELECT
        a.*,
        u.email as added_by_email,
        u.first_name as added_by_first_name
      FROM ai_classification_allowlist a
      LEFT JOIN users u ON a.added_by = u.id
      WHERE a.is_active = ?
      ORDER BY a.created_at DESC
    `);

    const allowlistItems = await stmt.bind(true).all();

    return new Response(JSON.stringify({
      allowlist: allowlistItems.results || []
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error getting allowlist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load allowlist'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Add labels to allowlist (admin only)
 */
async function addToAllowlist(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Get user data for role checking
  const user = await getUserData(userId, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Check admin permissions
  if (user.user_role !== 'admin' && user.user_role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const body: any = await request.json();

    if (!body.labels || !Array.isArray(body.labels) || body.labels.length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing or invalid labels array'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const results = [];

    for (const label of body.labels) {
      if (typeof label !== 'string' || !label.trim()) {
        continue;
      }

      const stmt = env.DB.prepare(`
        INSERT OR REPLACE INTO ai_classification_allowlist
        (label, confidence_threshold, added_by, reason, is_active)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = await stmt.bind(
        label.toLowerCase().trim(),
        body.confidence_threshold || 0.2,
        userId,
        body.reason || 'Added via admin interface',
        true
      ).run();

      results.push({
        label: label.toLowerCase().trim(),
        success: result.success
      });
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      message: `Added ${results.filter(r => r.success).length} labels to allowlist`
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error adding to allowlist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to add to allowlist'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Update an appeal (admin only)
 */
async function updateAppeal(
  request: Request,
  user: any,
  env: Env,
  corsHeaders: Record<string, string>,
  appealId: number
): Promise<Response> {
  // Check admin permissions
  if (user.user_role !== 'admin' && user.user_role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const body: any = await request.json();

    const stmt = env.DB.prepare(`
      UPDATE book_cover_appeals
      SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = await stmt.bind(body.admin_notes || null, appealId).run();

    if (!result.success || result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Appeal not found or update failed' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Appeal updated successfully'
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error updating appeal:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update appeal'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Delete an appeal (admin only)
 */
async function deleteAppeal(
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>,
  appealId: number
): Promise<Response> {
  // Get user data for role checking
  const user = await getUserData(userId, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Check admin permissions
  if (user.user_role !== 'admin' && user.user_role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const stmt = env.DB.prepare(`DELETE FROM book_cover_appeals WHERE id = ?`);
    const result = await stmt.bind(appealId).run();

    if (!result.success || result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Appeal not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Appeal deleted successfully'
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error deleting appeal:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete appeal'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}