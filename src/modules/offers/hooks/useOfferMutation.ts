import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';
import type { CreateOfferData } from '../types';

interface UseOfferMutationReturn {
  createDraftOffer: (data: CreateOfferData) => Promise<string>;
  sendOffer: (offerId: string) => Promise<{ token: string; offerUrl: string }>;
  acceptOffer: (token: string) => Promise<{ success: boolean; clientName: string; amount: number }>;
  loading: boolean;
  error: string | null;
}

export const useOfferMutation = (): UseOfferMutationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDraftOffer = async (data: CreateOfferData): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-draft-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create draft offer');
      }

      toast.success('Draft offer created successfully');
      return result.offerId;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to create draft offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendOffer = async (offerId: string): Promise<{ token: string; offerUrl: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ offerId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send offer');
      }

      toast.success('Offer sent successfully');
      return { token: result.token, offerUrl: result.offerUrl };
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to send offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async (token: string): Promise<{ success: boolean; clientName: string; amount: number }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept offer');
      }

      toast.success(`Offer accepted successfully!`);
      return result;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to accept offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createDraftOffer,
    sendOffer,
    acceptOffer,
    loading,
    error,
  };
};