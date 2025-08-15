import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { logActivity } from '@/lib/activityLogger';
import type { Contact } from '@/types/supabase';

export const useContacts = () => {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    if (!user || !user.company_id) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setContacts(data || []);
    } catch (err: any) {
      setError(err.message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const createContact = async (contactData: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    skills?: string[];
    hourly_rate?: number;
    availability?: 'Available' | 'Busy' | 'Unavailable';
    notes?: string;
  }) => {
    if (!user || !user.company_id) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...contactData,
          company_id: user.company_id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchContacts(); // Refresh the list
      
      // Log activity
      await logActivity({
        action_type: 'created',
        resource_type: 'contact',
        resource_name: contactData.name,
        details: { 
          email: contactData.email, 
          company: contactData.company,
          title: contactData.title 
        }
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (error) throw error;

      await fetchContacts(); // Refresh the list
      
      // Log activity
      await logActivity({
        action_type: 'updated',
        resource_type: 'contact',
        resource_name: updates.name || 'Contact',
        details: updates
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      // Get contact name before deletion
      const { data: contactToDelete } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', contactId)
        .single();
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      await fetchContacts(); // Refresh the list
      
      // Log activity
      await logActivity({
        action_type: 'deleted',
        resource_type: 'contact',
        resource_name: contactToDelete?.name || 'Contact',
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const searchContacts = async (searchTerm: string) => {
    if (!user || !user.company_id) return [];

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', user.company_id)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  const filterBySkills = async (skills: string[]) => {
    if (!user || !user.company_id || skills.length === 0) return contacts;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', user.company_id)
        .overlaps('skills', skills)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  const filterByAvailability = async (availability: 'Available' | 'Busy' | 'Unavailable') => {
    if (!user || !user.company_id) return [];

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', user.company_id)
        .eq('availability', availability)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    filterBySkills,
    filterByAvailability,
  };
};