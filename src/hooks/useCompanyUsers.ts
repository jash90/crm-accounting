import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/supabase';

export const useCompanyUsers = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyUsers = async () => {
    if (!user || !user.company_id) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyUsers();
  }, [user]);

  const getUserAssignedModules = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users_modules')
        .select('module_id')
        .eq('user_id', userId);

      if (error) throw error;
      
      return data?.map(item => item.module_id) || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  return {
    users,
    loading,
    error,
    refetch: fetchCompanyUsers,
    getUserAssignedModules,
  };
};