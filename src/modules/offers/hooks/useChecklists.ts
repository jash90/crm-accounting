import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Checklist } from '../types';

interface UseChecklistsReturn {
  checklists: Checklist[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getChecklistsByClient: (clientId: string) => Promise<Checklist[]>;
  updateChecklist: (id: string, updates: Partial<Checklist>) => Promise<void>;
  createChecklist: (checklist: Omit<Checklist, 'id' | 'company_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  toggleComplete: (id: string, isCompleted: boolean) => Promise<void>;
}

export const useChecklists = (): UseChecklistsReturn => {
  const { user } = useAuthStore();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklists = async () => {
    if (!user?.company_id) {
      setChecklists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('checklists')
        .select('*')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setChecklists(data || []);
    } catch (err: any) {
      setError(err.message);
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [user]);

  const getChecklistsByClient = async (clientId: string): Promise<Checklist[]> => {
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching checklists:', err);
      return [];
    }
  };

  const updateChecklist = async (id: string, updates: Partial<Checklist>) => {
    try {
      const { error } = await supabase
        .from('checklists')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchChecklists();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const createChecklist = async (checklistData: Omit<Checklist, 'id' | 'company_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user?.company_id) throw new Error('No company ID');

    try {
      const { error } = await supabase
        .from('checklists')
        .insert([{
          ...checklistData,
          company_id: user.company_id,
          created_by: user.id,
        }]);

      if (error) throw error;
      await fetchChecklists();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteChecklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchChecklists();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const updates: Partial<Checklist> = {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        completed_by: isCompleted ? user?.id : null,
      };

      await updateChecklist(id, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    checklists,
    loading,
    error,
    refetch: fetchChecklists,
    getChecklistsByClient,
    updateChecklist,
    createChecklist,
    deleteChecklist,
    toggleComplete,
  };
};