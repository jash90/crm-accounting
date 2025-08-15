import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Invite } from '@/types/supabase';

export const useInvites = () => {
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = async () => {
    if (!user || !['OWNER', 'SUPERADMIN'].includes(user.role)) {
      setInvites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invites')
        .select('*')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvites(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [user]);

  const resendInvite = async (inviteId: string) => {
    try {
      // Update the expiry date
      const { error } = await supabase
        .from('invites')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING'
        })
        .eq('id', inviteId);

      if (error) throw error;

      await fetchInvites(); // Refresh the list
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('invites')
        .update({ status: 'EXPIRED' })
        .eq('id', inviteId);

      if (error) throw error;

      await fetchInvites(); // Refresh the list
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    invites,
    loading,
    error,
    refetch: fetchInvites,
    resendInvite,
    cancelInvite,
  };
};