import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface AdminPendingCounts {
  pendingRequests: number;
  pendingReviews: number;
  pendingSignupRequests: number;
  pendingSeries: number;
  pendingAppeals: number;
  total: number;
}

export function useAdminPendingCounts() {
  const { data: session } = useSession();
  const [counts, setCounts] = useState<AdminPendingCounts>({
    pendingRequests: 0,
    pendingReviews: 0,
    pendingSignupRequests: 0,
    pendingSeries: 0,
    pendingAppeals: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const overview = data.overview;

        // Also fetch appeals count
        let pendingAppeals = 0;
        try {
          const appealsResponse = await fetch(`${getApiBaseUrl()}/api/appeals`, {
            headers: {
              'Authorization': `Bearer ${session.user.email}`,
              'Content-Type': 'application/json',
            },
          });

          if (appealsResponse.ok) {
            const appealsData = await appealsResponse.json();
            pendingAppeals = appealsData.appeals.filter((appeal: any) => appeal.status === 'pending').length;
          }
        } catch (error) {
          console.error('Error fetching appeals count:', error);
        }

        const newCounts = {
          pendingRequests: overview.pendingRequests || 0,
          pendingReviews: overview.pendingReviews || 0,
          pendingSignupRequests: overview.pendingSignupRequests || 0,
          pendingSeries: overview.pendingSeries || 0,
          pendingAppeals: pendingAppeals,
          total: (overview.pendingRequests || 0) + (overview.pendingReviews || 0) + (overview.pendingSignupRequests || 0) + (overview.pendingSeries || 0) + pendingAppeals,
        };
        setCounts(newCounts);
      }
    } catch (error) {
      console.error('Error fetching admin pending counts:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Set up frequent refresh for dynamic updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { counts, loading, refreshCounts: fetchCounts };
}