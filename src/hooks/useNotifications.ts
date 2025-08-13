import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface InAppNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  related_user_name?: string;
  related_location_name?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface UseNotificationsReturn {
  notifications: InAppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createTestNotification: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [session?.user?.email]);

  const refreshNotifications = useCallback(async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/notifications/in-app?limit=20`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  const markAsRead = useCallback(async (notificationId: number) => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
        
        // Update the notification in the local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [session?.user?.email]);

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
        },
      });

      if (response.ok) {
        setUnreadCount(0);
        
        // Update all notifications in the local state
        setNotifications(prev => 
          prev.map(n => ({ 
            ...n, 
            is_read: true, 
            read_at: n.read_at || new Date().toISOString() 
          }))
        );
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [session?.user?.email]);

  const createTestNotification = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
        // Refresh notifications to show the new test notification
        await refreshNotifications();
      }
    } catch (err) {
      console.error('Error creating test notification:', err);
    }
  }, [session?.user?.email, refreshNotifications]);

  // Fetch unread count on mount and when session changes
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Set up periodic refresh of unread count (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification,
  };
}

export function useUnreadNotificationCount(): { unreadCount: number; refreshCount: () => Promise<void> } {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Set up periodic refresh (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(refreshCount, 120000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return { unreadCount, refreshCount };
}