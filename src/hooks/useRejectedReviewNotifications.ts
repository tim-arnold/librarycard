import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface RejectedReviewNotification {
  id: number;
  book_title: string;
  book_authors: string;
  review_rejection_reason: string;
  notification_id?: number;
  is_notification_read: boolean;
  rejected_at: string;
}

interface UseRejectedReviewNotificationsReturn {
  rejectedReviews: RejectedReviewNotification[];
  unreadRejectedCount: number;
  loading: boolean;
  error: string | null;
  refreshRejectedReviews: () => Promise<void>;
}

export function useRejectedReviewNotifications(): UseRejectedReviewNotificationsReturn {
  const { data: session } = useSession();
  const [rejectedReviews, setRejectedReviews] = useState<RejectedReviewNotification[]>([]);
  const [unreadRejectedCount, setUnreadRejectedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRejectedReviews = useCallback(async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/user/rejected-reviews`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRejectedReviews(data.rejectedReviews || []);
        setUnreadRejectedCount(data.unreadCount || 0);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch rejected reviews');
      }
    } catch (err) {
      setError('Failed to fetch rejected reviews');
      console.error('Error fetching rejected reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Fetch rejected reviews on mount and when session changes
  useEffect(() => {
    refreshRejectedReviews();
  }, [refreshRejectedReviews]);

  return {
    rejectedReviews,
    unreadRejectedCount,
    loading,
    error,
    refreshRejectedReviews,
  };
}