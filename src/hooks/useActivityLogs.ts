import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { ActivityLog } from '@/types/supabase';

interface ActivityLogWithUser extends ActivityLog {
  user_email?: string;
}

export const useActivityLogs = (limit = 10) => {
  const { user } = useAuthStore();
  const [activityLogs, setActivityLogs] = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = async () => {
    if (!user || !user.company_id) {
      setActivityLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          users!activity_logs_user_id_fkey (email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // For non-superadmins, filter by company
      if (user.role !== 'SUPERADMIN') {
        query = query.eq('company_id', user.company_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to include user email
      const transformedData = data?.map(log => ({
        ...log,
        user_email: (log as any).users?.email
      })) || [];

      setActivityLogs(transformedData);
    } catch (err: any) {
      setError(err.message);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [user, limit]);

  return {
    activityLogs,
    loading,
    error,
    refetch: fetchActivityLogs,
  };
};