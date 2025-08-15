import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
// import { logActivity } from '@/lib/activityLogger';
import type { Client } from '@/types/supabase';
import { clientEvents } from '@/lib/eventBus';
import { performanceThresholds } from '../config';
import { toast } from 'react-toastify';
import { useClientHistory, ACTIVITY_TYPES } from './useClientHistory';

export const useClients = () => {
  const { user } = useAuthStore();
  const { logActivity } = useClientHistory();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!user || !user.company_id) {
      setClients([]);
      setLoading(false);
      return;
    }

    const startTime = performance.now();

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user.company_id)
        .order('client_number', { ascending: true });

      if (fetchError) throw fetchError;

      setClients(data || []);

      // Performance monitoring
      const duration = performance.now() - startTime;
      if (duration > performanceThresholds.operations.fetchList) {
        console.warn(
          `[Clients] Slow fetch operation: ${duration.toFixed(2)}ms for ${data?.length || 0} clients`
        );
        if (process.env.NODE_ENV === 'development') {
          toast.warning(`Slow client fetch: ${duration.toFixed(0)}ms`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const getNextClientNumber = async (): Promise<number> => {
    if (!user?.company_id) throw new Error('No company ID');

    const { data, error } = await supabase.rpc('get_next_client_number', {
      company_uuid: user.company_id,
    });

    if (error) throw error;
    return data;
  };

  const createClient = async (clientData: {
    company_name: string;
    start_date?: string;
    end_date?: string;
    business_type?: string;
    employment_form?: string;
    zus_details?: string;
    zus_startup_relief?: boolean;
    zus_startup_relief_months?: number;
    tax_form?: string;
    vat_status?: string;
    vat_frequency?: string;
    gtu_codes?: string[];
    vat_eu_registration?: boolean;
    labor_fund?: boolean;
    free_amount_2022?: boolean;
    fixed_costs?: string[];
    vehicles_assets?: string;
    depreciation_info?: string;
    e_szok_system?: boolean;
    has_employees?: boolean;
    phone?: string;
    email?: string;
    database_status?: string;
    aml_group?: string;
    aml_date?: string;
    service_provider?: string;
    contract_status?: string;
    annexes_2022_status?: string;
    annexes_2022_sent_date?: string;
    annexes_2023_status?: string;
    annexes_2023_sent_date?: string;
    additional_notes?: string;
  }) => {
    if (!user || !user.company_id) throw new Error('Not authenticated');

    try {
      const clientNumber = await getNextClientNumber();

      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            ...clientData,
            client_number: clientNumber,
            company_id: user.company_id,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchClients(); // Refresh the list

      // Manual logging for creation (automatic triggers removed)
      try {
        await logActivity({
          clientId: data[0].id,
          activityType: ACTIVITY_TYPES.CREATED,
          activityTitle: 'Client created',
          activityDescription: `Created client: ${clientData.company_name}`,
          newData: clientData,
          preventDuplicates: true,
        });
      } catch (logError) {
        console.error('Error logging client creation:', logError);
      }

      // Emit event for other modules
      clientEvents.created({
        id: data[0].id,
        name: clientData.company_name,
        email: clientData.email,
        client_number: clientNumber,
        tax_form: clientData.tax_form,
        vat_status: clientData.vat_status,
      });

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId);

      if (error) throw error;

      await fetchClients(); // Refresh the list

      // Manual logging for updates (automatic triggers removed)
      try {
        await logActivity({
          clientId: clientId,
          activityType: ACTIVITY_TYPES.UPDATED,
          activityTitle: 'Client updated',
          activityDescription: `Updated client: ${updates.company_name || 'Client'}`,
          newData: updates,
          preventDuplicates: true,
        });
      } catch (logError) {
        console.error('Error logging client update:', logError);
      }

      // Emit event for other modules
      clientEvents.updated({
        id: clientId,
        name: updates.company_name || 'Client',
        ...updates,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      // Get client name before deletion
      const { data: clientToDelete } = await supabase
        .from('clients')
        .select('company_name, client_number')
        .eq('id', clientId)
        .single();

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      await fetchClients(); // Refresh the list

      // Manual logging for deletion (automatic triggers removed)
      try {
        await logActivity({
          clientId: clientId,
          activityType: ACTIVITY_TYPES.DELETED,
          activityTitle: 'Client deleted',
          activityDescription: `Deleted client: ${clientToDelete?.company_name || 'Client'}`,
          oldData: clientToDelete,
          preventDuplicates: true,
        });
      } catch (logError) {
        console.error('Error logging client deletion:', logError);
      }

      // Emit event for other modules
      clientEvents.deleted({
        id: clientId,
        name: clientToDelete?.company_name || 'Client',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const searchClients = async (searchTerm: string) => {
    if (!user || !user.company_id) return [];

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user.company_id)
        .or(
          `company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,business_type.ilike.%${searchTerm}%`
        )
        .order('client_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    }
  };

  const filterByStatus = async (status: string) => {
    if (!user || !user.company_id) return [];

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user.company_id)
        .eq('contract_status', status)
        .order('client_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    }
  };

  const filterByTaxForm = async (taxForm: string) => {
    if (!user || !user.company_id) return [];

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user.company_id)
        .eq('tax_form', taxForm)
        .order('client_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    }
  };

  const logClientView = useCallback(
    async (clientId: string, clientName: string) => {
      // Debounce to prevent rapid successive calls
      const debounceKey = `view_${clientId}`;
      const now = Date.now();
      const lastCall = (window as any).__clientViewDebounce?.[debounceKey] || 0;

      // Only log if it's been at least 5 seconds since last call for this client
      if (now - lastCall < 5000) {
        return;
      }

      // Update debounce tracker
      if (!(window as any).__clientViewDebounce) {
        (window as any).__clientViewDebounce = {};
      }
      (window as any).__clientViewDebounce[debounceKey] = now;

      try {
        await logActivity({
          clientId,
          activityType: ACTIVITY_TYPES.VIEWED,
          activityTitle: 'Client viewed',
          activityDescription: `Viewed client "${clientName}" details`,
          preventDuplicates: true, // Prevent multiple view logs within 30 minutes
        });
      } catch (error) {
        console.warn('Error logging client view:', error);
        // Silently fail for logging - don't break the UI
        // This is non-critical functionality
      }
    },
    [logActivity]
  );

  const logClientContact = async (
    clientId: string,
    clientName: string,
    contactType: 'email' | 'phone' | 'meeting',
    description?: string
  ) => {
    try {
      const activityTypes = {
        email: ACTIVITY_TYPES.EMAIL_SENT,
        phone: ACTIVITY_TYPES.PHONE_CALL,
        meeting: ACTIVITY_TYPES.MEETING_COMPLETED,
      };

      const titles = {
        email: 'Email sent',
        phone: 'Phone call made',
        meeting: 'Meeting completed',
      };

      await logActivity({
        clientId,
        activityType: activityTypes[contactType],
        activityTitle: titles[contactType],
        activityDescription:
          description || `${titles[contactType]} with client "${clientName}"`,
      });
    } catch (error) {
      console.error('Error logging client contact:', error);
    }
  };

  const logCustomActivity = async (
    clientId: string,
    activityType: string,
    title: string,
    description?: string,
    additionalData?: Record<string, unknown>
  ) => {
    try {
      await logActivity({
        clientId,
        activityType,
        activityTitle: title,
        activityDescription: description,
        newData: additionalData,
      });
    } catch (error) {
      console.error('Error logging custom activity:', error);
    }
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    filterByStatus,
    filterByTaxForm,
    getNextClientNumber,
    // History logging methods
    logClientView,
    logClientContact,
    logCustomActivity,
  };
};
