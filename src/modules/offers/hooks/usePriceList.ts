import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { PriceListItem } from '../types';

interface UsePriceListReturn {
  items: PriceListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createItem: (item: Omit<PriceListItem, 'id' | 'company_id' | 'created_by' | 'created_at'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<PriceListItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const usePriceList = (): UsePriceListReturn => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!user?.company_id) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('price_list_items')
        .select('*')
        .eq('company_id', user.company_id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const createItem = async (itemData: Omit<PriceListItem, 'id' | 'company_id' | 'created_by' | 'created_at'>) => {
    if (!user?.company_id) throw new Error('No company ID');

    try {
      const { error } = await supabase
        .from('price_list_items')
        .insert([{
          ...itemData,
          company_id: user.company_id,
          created_by: user.id,
        }]);

      if (error) throw error;

      await fetchItems(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<PriceListItem>) => {
    try {
      const { error } = await supabase
        .from('price_list_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchItems(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('price_list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchItems(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
};