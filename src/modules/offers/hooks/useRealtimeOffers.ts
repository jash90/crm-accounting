import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Offer } from '../types';

interface UseRealtimeOffersReturn {
  offers: Offer[];
  loading: boolean;
  error: string | null;
}

export const useRealtimeOffers = (): UseRealtimeOffersReturn => {
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.company_id) {
      setOffers([]);
      setLoading(false);
      return;
    }

    const fetchOffers = async () => {
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

    // Initial fetch
    fetchOffers();

    // Set up real-time subscription
    const channel = supabase
      .channel('offers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `company_id=eq.${user.company_id}`,
        },
        (payload) => {
          console.log('Offer change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new offer
            fetchOffers(); // Refetch to get client data
          } else if (payload.eventType === 'UPDATE') {
            // Update existing offer
            setOffers(currentOffers => 
              currentOffers.map(offer => 
                offer.id === payload.new.id 
                  ? { ...offer, ...payload.new }
                  : offer
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted offer
            setOffers(currentOffers => 
              currentOffers.filter(offer => offer.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return { offers, loading, error };
};