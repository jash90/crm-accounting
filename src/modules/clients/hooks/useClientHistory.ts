import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'react-toastify';

export interface ClientHistoryActivity {
  id: string;
  client_id: string;
  company_id: string;
  user_id: string | null;
  activity_type: string;
  activity_title: string;
  activity_description: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  source: string;
  created_at: string;
  user?: {
    email: string;
    role: string;
  } | null;
}

export interface ClientActivitySummary {
  total_activities: number;
  last_activity_date: string | null;
  most_common_activity: string | null;
  unique_users_count: number;
}

export interface UseClientHistoryReturn {
  activities: ClientHistoryActivity[];
  summary: ClientActivitySummary | null;
  loading: boolean;
  error: string | null;
  fetchHistory: (clientId: string, limit?: number) => Promise<void>;
  fetchSummary: (clientId: string) => Promise<void>;
  logActivity: (params: LogActivityParams) => Promise<void>;
  deleteActivity: (activityId: string) => Promise<void>;
  clearHistory: (clientId: string) => Promise<void>;
  cleanupOldHistory: (daysToKeep?: number) => Promise<number>;
}

export interface LogActivityParams {
  clientId: string;
  activityType: string;
  activityTitle: string;
  activityDescription?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changedFields?: string[];
  source?: string;
  preventDuplicates?: boolean;
}

// Global request limiter to prevent overwhelming the server
const requestLimiter = {
  lastRequests: new Map<string, number>(),
  minInterval: 1000, // Minimum 1 second between identical requests

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const lastRequest = this.lastRequests.get(key) || 0;

    if (now - lastRequest < this.minInterval) {
      return false;
    }

    this.lastRequests.set(key, now);
    return true;
  },
};

export const useClientHistory = (): UseClientHistoryReturn => {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ClientHistoryActivity[]>([]);
  const [summary, setSummary] = useState<ClientActivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (clientId: string, limit = 50) => {
      if (!user?.company_id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Rate limiting to prevent overwhelming the server
      const requestKey = `fetchHistory_${clientId}`;
      if (!requestLimiter.canMakeRequest(requestKey)) {
        console.warn('Fetch history request rate limited');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Use a function to fetch history instead of direct table query
        // This bypasses RLS issues and provides better error handling
        const { data, error: fetchError } = await supabase.rpc(
          'get_client_history_with_users',
          {
            p_client_id: clientId,
            p_limit: limit,
          }
        );

        if (fetchError) {
          console.error('Function failed:', fetchError);
          // Don't use fallback to avoid the problematic direct table query
          // Just set empty activities and let the user know
          setActivities([]);
          throw fetchError;
        } else {
          // Transform data to match expected format (user_data -> user)
          const transformedData = (data || []).map((item) => ({
            ...item,
            user: item.user_data,
          }));
          setActivities(transformedData);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch client history';
        setError(errorMessage);
        console.error('Error fetching client history:', err);

        // Set empty activities to stop infinite loading
        setActivities([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.company_id]
  );

  const fetchSummary = useCallback(
    async (clientId: string) => {
      if (!user?.company_id) return;

      // Rate limiting for summary fetching
      const requestKey = `fetchSummary_${clientId}`;
      if (!requestLimiter.canMakeRequest(requestKey)) {
        console.warn('Fetch summary request rate limited');
        return;
      }

      try {
        const { data, error: summaryError } = await supabase.rpc(
          'get_client_activity_summary',
          { p_client_id: clientId }
        );

        if (summaryError) throw summaryError;

        if (data && data.length > 0) {
          setSummary({
            total_activities: Number(data[0].total_activities),
            last_activity_date: data[0].last_activity_date,
            most_common_activity: data[0].most_common_activity,
            unique_users_count: Number(data[0].unique_users_count),
          });
        }
      } catch (err) {
        console.error('Error fetching activity summary:', err);
      }
    },
    [user?.company_id]
  );

  const logActivity = useCallback(
    async (params: LogActivityParams) => {
      if (!user?.company_id) {
        throw new Error('User not authenticated');
      }

      // Rate limiting for activity logging
      const requestKey = `logActivity_${params.clientId}_${params.activityType}`;
      if (!requestLimiter.canMakeRequest(requestKey)) {
        console.warn('Log activity request rate limited');
        return; // Silently skip to prevent overwhelming
      }

      try {
        const { error: logError } = await supabase.rpc('log_client_activity', {
          p_client_id: params.clientId,
          p_activity_type: params.activityType,
          p_activity_title: params.activityTitle,
          p_activity_description: params.activityDescription || null,
          p_old_data: params.oldData || null,
          p_new_data: params.newData || null,
          p_changed_fields: params.changedFields || null,
          p_source: params.source || 'web',
          p_prevent_duplicates: params.preventDuplicates !== false, // Default to true
        });

        if (logError) throw logError;

        // Don't automatically refresh to avoid request loops
        // The UI will refresh when the user navigates or manually refreshes
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to log activity';
        console.error('Error logging activity:', err);
        throw new Error(errorMessage);
      }
    },
    [user?.company_id]
  );

  const deleteActivity = useCallback(
    async (activityId: string) => {
      if (!user?.company_id) {
        throw new Error('User not authenticated');
      }

      try {
        const { error: deleteError } = await supabase
          .from('client_history')
          .delete()
          .eq('id', activityId)
          .eq('company_id', user.company_id);

        if (deleteError) throw deleteError;

        // Remove from local state
        setActivities((prev) =>
          prev.filter((activity) => activity.id !== activityId)
        );

        toast.success('Activity deleted successfully');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete activity';
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user?.company_id]
  );

  const clearHistory = useCallback(
    async (clientId: string) => {
      if (!user?.company_id) {
        throw new Error('User not authenticated');
      }

      try {
        const { error: clearError } = await supabase
          .from('client_history')
          .delete()
          .eq('client_id', clientId)
          .eq('company_id', user.company_id);

        if (clearError) throw clearError;

        setActivities([]);
        setSummary(null);

        toast.success('Client history cleared successfully');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to clear history';
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user?.company_id]
  );

  const cleanupOldHistory = useCallback(
    async (daysToKeep = 365) => {
      if (!user?.company_id) {
        throw new Error('User not authenticated');
      }

      // Only allow superadmins and owners to cleanup history
      if (user.role !== 'SUPERADMIN' && user.role !== 'OWNER') {
        throw new Error('Insufficient permissions to cleanup history');
      }

      try {
        const { data, error: cleanupError } = await supabase.rpc(
          'cleanup_old_client_history',
          { p_days_to_keep: daysToKeep }
        );

        if (cleanupError) throw cleanupError;

        const deletedCount = data || 0;
        toast.success(`Cleaned up ${deletedCount} old history entries`);
        return deletedCount;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cleanup history';
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user?.company_id, user?.role]
  );

  return {
    activities,
    summary,
    loading,
    error,
    fetchHistory,
    fetchSummary,
    logActivity,
    deleteActivity,
    clearHistory,
    cleanupOldHistory,
  };
};

// Activity type definitions for better type safety
export const ACTIVITY_TYPES = {
  // Basic CRUD operations
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  VIEWED: 'viewed',

  // Communication activities
  CONTACTED: 'contacted',
  EMAIL_SENT: 'email_sent',
  PHONE_CALL: 'phone_call',
  MEETING_SCHEDULED: 'meeting_scheduled',
  MEETING_COMPLETED: 'meeting_completed',

  // Document activities
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_DELETED: 'document_deleted',

  // Financial activities
  INVOICE_GENERATED: 'invoice_generated',
  INVOICE_SENT: 'invoice_sent',
  PAYMENT_RECEIVED: 'payment_received',

  // Contract activities
  CONTRACT_SIGNED: 'contract_signed',
  CONTRACT_UPDATED: 'contract_updated',
  CONTRACT_EXPIRED: 'contract_expired',

  // Note activities
  NOTE_ADDED: 'note_added',
  NOTE_UPDATED: 'note_updated',
  NOTE_DELETED: 'note_deleted',

  // Status changes
  STATUS_CHANGED: 'status_changed',
  ASSIGNED: 'assigned',
  UNASSIGNED: 'unassigned',

  // System activities
  EXPORTED: 'exported',
  IMPORTED: 'imported',
  MERGED: 'merged',
  ARCHIVED: 'archived',
  RESTORED: 'restored',
  SYSTEM_UPDATE: 'system_update',
  BULK_OPERATION: 'bulk_operation',
  OTHER: 'other',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];
