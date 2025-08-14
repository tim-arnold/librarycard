import { Env } from '../types';
import { isUserAdmin } from '../auth';
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../notifications/index';

export async function getInAppNotifications(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unread_only') === 'true';

    const notifications = await getUserNotifications(env, userId, limit, offset, unreadOnly);
    const unreadCount = await getUnreadNotificationCount(env, userId);

    return new Response(JSON.stringify({ 
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting in-app notifications:', error);
    return new Response(JSON.stringify({ error: 'Failed to get notifications' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getUnreadCount(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    const unreadCount = await getUnreadNotificationCount(env, userId);

    return new Response(JSON.stringify({ 
      unreadCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    return new Response(JSON.stringify({ error: 'Failed to get unread count' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function markNotificationRead(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    const { notificationId } = await request.json() as { notificationId: number };

    if (!notificationId || typeof notificationId !== 'number') {
      return new Response(JSON.stringify({ error: 'Valid notificationId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const success = await markNotificationAsRead(env, notificationId, userId);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Notification not found or already read' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const unreadCount = await getUnreadNotificationCount(env, userId);

    return new Response(JSON.stringify({ 
      success: true,
      unreadCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return new Response(JSON.stringify({ error: 'Failed to mark notification as read' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function markAllNotificationsRead(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    await markAllNotificationsAsRead(env, userId);

    return new Response(JSON.stringify({ 
      success: true,
      unreadCount: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return new Response(JSON.stringify({ error: 'Failed to mark all notifications as read' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function createTestNotification(
  request: Request, 
  userId: string, 
  env: Env, 
  corsHeaders: Record<string, string>
) {
  try {
    // Only allow admins to create test notifications
    if (!(await isUserAdmin(userId, env))) {
      return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { createInAppNotification } = await import('../notifications/index');
    
    await createInAppNotification(
      env,
      userId,
      'system_maintenance',
      'Test Notification',
      'This is a test notification to verify the system is working correctly.',
      '/admin',
      'View Admin',
      userId
    );

    const unreadCount = await getUnreadNotificationCount(env, userId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Test notification created',
      unreadCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return new Response(JSON.stringify({ error: 'Failed to create test notification' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}