import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { logActivity } from '@/lib/activityLogger';
import type { Client } from '@/types/supabase';
import { clientEvents } from '@/lib/eventBus';
import { performanceThresholds } from '../config';
import { toast } from 'react-toastify';

export const useClients = () => {
  const { user } = useAuthStore();
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

      // Log activity
      await logActivity({
        action_type: 'created',
        resource_type: 'client',
        resource_name: clientData.company_name,
        details: {
          client_number: clientNumber,
          business_type: clientData.business_type,
          tax_form: clientData.tax_form,
          vat_status: clientData.vat_status,
        },
      });

      // Emit event for other modules
      clientEvents.created({
        id: data.id,
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

      // Log activity
      await logActivity({
        action_type: 'updated',
        resource_type: 'client',
        resource_name: updates.company_name || 'Client',
        details: updates,
      });

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

      // Log activity
      await logActivity({
        action_type: 'deleted',
        resource_type: 'client',
        resource_name: clientToDelete?.company_name || 'Client',
        details: { client_number: clientToDelete?.client_number },
      });

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
  };
};
