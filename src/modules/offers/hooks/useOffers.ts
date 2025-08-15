import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Offer } from '../types';

interface UseOffersReturn {
  offers: Offer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getOfferById: (id: string) => Promise<Offer | null>;
  getOfferByToken: (token: string) => Promise<Offer | null>;
}

export const useOffers = (): UseOffersReturn => {
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    if (!user?.company_id) {
      setOffers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('offers')
        .select(`
          *,
          clients (
            id,
            email,
            company_name
          ),
          offer_items (
            id,
            name,
            description,
            qty,
            price,
            line_total
          )
        `)
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOffers(data || []);
    } catch (err: any) {
      setError(err.message);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const getOfferById = async (id: string): Promise<Offer | null> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          clients (
            id,
            email,
            company_name
          ),
          offer_items (
            id,
            name,
            description,
            qty,
            price,
            line_total
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching offer:', err);
      return null;
    }
  };

  const getOfferByToken = async (token: string): Promise<Offer | null> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          clients (
            id,
            email,
            company_name
          ),
          offer_items (
            id,
            name,
            description,
            qty,
            price,
            line_total
          )
        `)
        .eq('token', token)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching offer by token:', err);
      return null;
    }
  };

  return {
    offers,
    loading,
    error,
    refetch: fetchOffers,
    getOfferById,
    getOfferByToken,
  };
};