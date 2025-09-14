// User Privacy Management - LCWEB-174
// API endpoints for user display preferences and privacy controls

import { Env, DisplayNamePreference, ActivityType } from '../types';
import { validateCustomUsername, setActivityPrivacy, getUserPrivacyOverrides } from '../privacy';

/**
 * Get user's display preferences
 */
export async function getUserDisplayPreferences(userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    const stmt = env.DB.prepare(`
      SELECT display_name_preference, custom_username
      FROM users
      WHERE id = ?
    `);

    const user = await stmt.bind(userId).first() as any;

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      display_name_preference: user.display_name_preference || 'first_name',
      custom_username: user.custom_username || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching user display preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch display preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Update user's display preferences
 */
export async function updateUserDisplayPreferences(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
) {
  try {
    const { display_name_preference, custom_username } = await request.json() as {
      display_name_preference: DisplayNamePreference;
      custom_username?: string;
    };

    // Validate display name preference
    const validPreferences = ['first_name', 'full_name', 'email', 'custom_username', 'anonymous'];
    if (!validPreferences.includes(display_name_preference)) {
      return new Response(JSON.stringify({ error: 'Invalid display name preference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate custom username if provided
    if (display_name_preference === 'custom_username' && custom_username) {
      const validation = await validateCustomUsername(custom_username, userId, env);
      if (!validation.isValid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update user preferences
    const stmt = env.DB.prepare(`
      UPDATE users
      SET display_name_preference = ?, custom_username = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    await stmt.bind(
      display_name_preference,
      display_name_preference === 'custom_username' ? custom_username : null,
      userId
    ).run();

    return new Response(JSON.stringify({
      message: 'Display preferences updated successfully',
      display_name_preference,
      custom_username: display_name_preference === 'custom_username' ? custom_username : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating user display preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to update display preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Set privacy override for a specific activity
 */
export async function setActivityPrivacyOverride(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
) {
  try {
    const { activity_type, activity_id, is_anonymous } = await request.json() as {
      activity_type: ActivityType;
      activity_id: string;
      is_anonymous: boolean;
    };

    // Validate activity type
    const validTypes = ['book_addition', 'review', 'checkout'];
    if (!validTypes.includes(activity_type)) {
      return new Response(JSON.stringify({ error: 'Invalid activity type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns this activity
    let ownershipQuery;
    switch (activity_type) {
      case 'book_addition':
        ownershipQuery = env.DB.prepare(`SELECT 1 FROM books WHERE id = ? AND added_by = ?`);
        break;
      case 'review':
        ownershipQuery = env.DB.prepare(`SELECT 1 FROM book_ratings WHERE id = ? AND user_id = ?`);
        break;
      case 'checkout':
        // TODO: Add checkout ownership verification when checkout system is expanded
        return new Response(JSON.stringify({ error: 'Checkout privacy not yet implemented' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      default:
        return new Response(JSON.stringify({ error: 'Invalid activity type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const ownership = await ownershipQuery.bind(activity_id, userId).first();
    if (!ownership) {
      return new Response(JSON.stringify({ error: 'You can only modify privacy settings for your own activities' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set the privacy override
    await setActivityPrivacy(userId, activity_type, activity_id, is_anonymous, env);

    return new Response(JSON.stringify({
      message: 'Activity privacy updated successfully',
      activity_type,
      activity_id,
      is_anonymous
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error setting activity privacy:', error);
    return new Response(JSON.stringify({ error: 'Failed to set activity privacy' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Get all privacy overrides for the current user
 */
export async function getUserPrivacyOverridesAPI(
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
) {
  try {
    const overrides = await getUserPrivacyOverrides(userId, env);

    // Enhance with activity details
    const enhancedOverrides = [];
    for (const override of overrides) {
      let activityDetails = {};

      switch (override.activity_type) {
        case 'book_addition':
          const bookStmt = env.DB.prepare(`SELECT title, authors FROM books WHERE id = ?`);
          const book = await bookStmt.bind(override.activity_id).first() as any;
          if (book) {
            activityDetails = {
              title: book.title,
              authors: book.authors,
              type_label: 'Book Addition'
            };
          }
          break;

        case 'review':
          const reviewStmt = env.DB.prepare(`
            SELECT br.rating, br.review_text, b.title, b.authors
            FROM book_ratings br
            JOIN books b ON br.book_id = b.id
            WHERE br.id = ?
          `);
          const review = await reviewStmt.bind(override.activity_id).first() as any;
          if (review) {
            activityDetails = {
              title: review.title,
              authors: review.authors,
              rating: review.rating,
              review_text: review.review_text,
              type_label: 'Book Review'
            };
          }
          break;
      }

      enhancedOverrides.push({
        ...override,
        ...activityDetails
      });
    }

    return new Response(JSON.stringify({
      overrides: enhancedOverrides
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching user privacy overrides:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch privacy overrides' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Bulk update privacy for multiple activities
 */
export async function bulkUpdateActivityPrivacy(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
) {
  try {
    const { updates } = await request.json() as {
      updates: Array<{
        activity_type: ActivityType;
        activity_id: string;
        is_anonymous: boolean;
      }>;
    };

    if (!Array.isArray(updates) || updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No updates provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    for (const update of updates) {
      try {
        await setActivityPrivacy(update.activity_type, update.activity_id, userId, update.is_anonymous, env);
        results.push({
          activity_type: update.activity_type,
          activity_id: update.activity_id,
          success: true
        });
      } catch (error) {
        results.push({
          activity_type: update.activity_type,
          activity_id: update.activity_id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Bulk privacy update completed',
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk privacy update:', error);
    return new Response(JSON.stringify({ error: 'Failed to update privacy settings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}