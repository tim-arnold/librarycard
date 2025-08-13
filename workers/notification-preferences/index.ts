import { Env } from '../types';
import { isUserAdmin } from '../auth';

export async function getUserNotificationPreferences(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('location_id');

    let preferences;
    if (locationId) {
      // Get preferences for a specific location
      preferences = await env.DB.prepare(`
        SELECT notification_type, enabled, location_id
        FROM notification_preferences 
        WHERE user_id = ? AND (location_id = ? OR location_id IS NULL)
        ORDER BY location_id DESC, notification_type ASC
      `).bind(userId, parseInt(locationId)).all();
    } else {
      // Get all global preferences
      preferences = await env.DB.prepare(`
        SELECT notification_type, enabled, location_id
        FROM notification_preferences 
        WHERE user_id = ? AND location_id IS NULL
        ORDER BY notification_type ASC
      `).bind(userId).all();
    }

    return new Response(JSON.stringify({ 
      preferences: preferences.results,
      locationId: locationId ? parseInt(locationId) : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to get notification preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function updateNotificationPreference(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    const { notificationType, enabled, locationId } = await request.json() as {
      notificationType: string;
      enabled: boolean;
      locationId?: number;
    };

    if (!notificationType) {
      return new Response(JSON.stringify({ error: 'notificationType is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate notification type
    const validTypes = [
      'user_registration',
      'location_access_granted',
      'location_access_revoked',
      'permission_granted',
      'permission_revoked',
      'book_added',
      'book_removed',
      'genre_suggestion',
      'system_maintenance'
    ];

    if (!validTypes.includes(notificationType)) {
      return new Response(JSON.stringify({ error: 'Invalid notification type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has access to location if locationId is provided
    if (locationId) {
      const hasAccess = await env.DB.prepare(`
        SELECT 1 FROM locations l
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE l.id = ? AND (l.owner_id = ? OR lm.user_id = ?)
      `).bind(locationId, userId, userId).first();

      if (!hasAccess && !(await isUserAdmin(userId, env))) {
        return new Response(JSON.stringify({ error: 'Access denied to this location' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update or insert preference
    await env.DB.prepare(`
      INSERT OR REPLACE INTO notification_preferences 
      (user_id, notification_type, enabled, location_id, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, notificationType, enabled, locationId || null).run();

    return new Response(JSON.stringify({ 
      success: true,
      notificationType,
      enabled,
      locationId: locationId || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating notification preference:', error);
    return new Response(JSON.stringify({ error: 'Failed to update notification preference' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getNotificationSettings(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    // Get user's available locations for location-specific preferences
    const locations = await env.DB.prepare(`
      SELECT DISTINCT l.id, l.name
      FROM locations l
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE l.owner_id = ? OR lm.user_id = ?
      ORDER BY l.name
    `).bind(userId, userId).all();

    // Get all global notification preferences
    const globalPreferences = await env.DB.prepare(`
      SELECT notification_type, enabled
      FROM notification_preferences 
      WHERE user_id = ? AND location_id IS NULL
    `).bind(userId).all();

    // Get location-specific preferences
    const locationPreferences: Record<string, any[]> = {};
    for (const location of locations.results) {
      const prefs = await env.DB.prepare(`
        SELECT notification_type, enabled
        FROM notification_preferences 
        WHERE user_id = ? AND location_id = ?
      `).bind(userId, (location as any).id).all();
      
      locationPreferences[(location as any).id] = prefs.results;
    }

    // Get notification types with descriptions
    const notificationTypes = [
      { 
        key: 'user_registration', 
        label: 'User Registrations', 
        description: 'New user signup requests',
        scope: 'global',
        adminOnly: true
      },
      { 
        key: 'location_access_granted', 
        label: 'Location Access Granted', 
        description: 'When you are granted access to a location',
        scope: 'personal'
      },
      { 
        key: 'location_access_revoked', 
        label: 'Location Access Revoked', 
        description: 'When your access to a location is removed',
        scope: 'personal'
      },
      { 
        key: 'permission_granted', 
        label: 'Permission Granted', 
        description: 'When you are granted new permissions',
        scope: 'personal'
      },
      { 
        key: 'permission_revoked', 
        label: 'Permission Revoked', 
        description: 'When your permissions are removed',
        scope: 'personal'
      },
      { 
        key: 'book_added', 
        label: 'Books Added', 
        description: 'When books are added to locations',
        scope: 'location',
        adminOnly: true
      },
      { 
        key: 'book_removed', 
        label: 'Books Removed', 
        description: 'When books are removed from locations',
        scope: 'location',
        adminOnly: true
      },
      { 
        key: 'genre_suggestion', 
        label: 'Genre Suggestions', 
        description: 'Genre suggestions and approvals',
        scope: 'global',
        adminOnly: true
      },
      { 
        key: 'system_maintenance', 
        label: 'System Maintenance', 
        description: 'System maintenance and updates',
        scope: 'global',
        adminOnly: true
      }
    ];

    // Filter notification types based on user role
    const isAdmin = await isUserAdmin(userId, env);
    const filteredTypes = notificationTypes.filter(type => 
      !type.adminOnly || isAdmin
    );

    return new Response(JSON.stringify({ 
      notificationTypes: filteredTypes,
      globalPreferences: globalPreferences.results,
      locationPreferences,
      locations: locations.results,
      isAdmin
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting notification settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to get notification settings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function resetNotificationPreferences(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    const { locationId } = await request.json() as { locationId?: number };

    if (locationId) {
      // Reset preferences for specific location
      await env.DB.prepare(`
        DELETE FROM notification_preferences 
        WHERE user_id = ? AND location_id = ?
      `).bind(userId, locationId).run();
    } else {
      // Reset all global preferences
      await env.DB.prepare(`
        DELETE FROM notification_preferences 
        WHERE user_id = ? AND location_id IS NULL
      `).bind(userId).run();

      // Re-insert default preferences for admin users
      if (await isUserAdmin(userId, env)) {
        const defaultPreferences = [
          { type: 'user_registration', enabled: true },
          { type: 'location_access_granted', enabled: true },
          { type: 'location_access_revoked', enabled: true },
          { type: 'permission_granted', enabled: true },
          { type: 'permission_revoked', enabled: true },
          { type: 'book_added', enabled: false },
          { type: 'book_removed', enabled: true },
          { type: 'genre_suggestion', enabled: true },
          { type: 'system_maintenance', enabled: true }
        ];

        for (const pref of defaultPreferences) {
          await env.DB.prepare(`
            INSERT INTO notification_preferences (user_id, notification_type, enabled)
            VALUES (?, ?, ?)
          `).bind(userId, pref.type, pref.enabled).run();
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: locationId 
        ? 'Location notification preferences reset to defaults'
        : 'Global notification preferences reset to defaults'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to reset notification preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}