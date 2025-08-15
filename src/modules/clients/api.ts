/**
 * Clients Module API
 * Exposes client-related functionality for other modules
 */

import { supabase } from '@/lib/supabase';
import type { Client } from '@/types/supabase';

export interface ClientsAPI {
  getClient: (id: string) => Promise<Client | null>;
  searchClients: (term: string) => Promise<Client[]>;
  getClientsByStatus: (status: string) => Promise<Client[]>;
  getClientByEmail: (email: string) => Promise<Client | null>;
  getClientsByTaxForm: (taxForm: string) => Promise<Client[]>;
  getActiveClients: () => Promise<Client[]>;
  getClientCount: () => Promise<number>;
  validateClient: (clientId: string) => Promise<boolean>;
}

export const clientsAPI: ClientsAPI = {
  /**
   * Get a single client by ID
   */
  getClient: async (id: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching client:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getClient:', error);
      return null;
    }
  },

  /**
   * Search clients by company name or email
   */
  searchClients: async (term: string): Promise<Client[]> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(
          `company_name.ilike.%${term}%,email.ilike.%${term}%,nip.ilike.%${term}%`
        )
        .order('company_name');

      if (error) {
        console.error('Error searching clients:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchClients:', error);
      return [];
    }
  },

  /**
   * Get clients by contract status
   */
  getClientsByStatus: async (status: string): Promise<Client[]> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('contract_status', status)
        .order('company_name');

      if (error) {
        console.error('Error fetching clients by status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientsByStatus:', error);
      return [];
    }
  },

  /**
   * Get client by email
   */
  getClientByEmail: async (email: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Not found is ok
        console.error('Error fetching client by email:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getClientByEmail:', error);
      return null;
    }
  },

  /**
   * Get clients by tax form
   */
  getClientsByTaxForm: async (taxForm: string): Promise<Client[]> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('tax_form', taxForm)
        .order('company_name');

      if (error) {
        console.error('Error fetching clients by tax form:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientsByTaxForm:', error);
      return [];
    }
  },

  /**
   * Get all active clients (signed contracts)
   */
  getActiveClients: async (): Promise<Client[]> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .in('contract_status', ['Signed', 'Podpisana'])
        .order('company_name');

      if (error) {
        console.error('Error fetching active clients:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveClients:', error);
      return [];
    }
  },

  /**
   * Get total count of clients
   */
  getClientCount: async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting clients:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getClientCount:', error);
      return 0;
    }
  },

  /**
   * Validate if a client exists and is active
   */
  validateClient: async (clientId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, contract_status')
        .eq('id', clientId)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if client has signed contract
      return ['Signed', 'Podpisana'].includes(data.contract_status || '');
    } catch (error) {
      console.error('Error in validateClient:', error);
      return false;
    }
  },
};
