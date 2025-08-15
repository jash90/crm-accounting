import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { logActivity } from '@/lib/activityLogger';
import type { Module } from '@/types/supabase';

export const useModules = () => {
  const { user } = useAuthStore();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = async () => {
    if (!user) {
      setModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (user.role === 'SUPERADMIN') {
        // Superadmin can see all modules
        const { data, error: fetchError } = await supabase
          .from('modules')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setModules(data || []);
      } else {
        // Get enabled modules for the company
        const { data: companyModules, error: companyError } = await supabase
          .from('company_modules')
          .select(`
            module_id,
            is_enabled,
            modules!company_modules_module_id_fkey (
              id,
              name,
              description,
              href,
              created_by,
              is_public_within_company,
              created_at
            )
          `)
          .eq('company_id', user.company_id);

        if (companyError) throw companyError;

        // Get global modules visible to companies
        const { data: globalModules, error: globalError } = await supabase
          .from('modules')
          .select('*')
          .eq('is_public_within_company', true)
          .order('created_at', { ascending: false });

        if (globalError) throw globalError;

        // Create a map of company module settings
        const companyModuleMap = new Map();
        companyModules?.forEach(cm => {
          if (cm.modules) {
            companyModuleMap.set(cm.module_id, {
              ...cm.modules,
              company_modules: [{ is_enabled: cm.is_enabled }]
            });
          }
        });

        // Start with enabled company modules (visible to employees)
        const enabledCompanyModules = Array.from(companyModuleMap.values())
          .filter(module => module.company_modules[0].is_enabled);

        // Add global modules that aren't already in company modules
        const globalModuleMap = new Map();
        globalModules?.forEach(module => {
          if (!companyModuleMap.has(module.id)) {
            globalModuleMap.set(module.id, {
              ...module,
              company_modules: [{ is_enabled: false }]
            });
          }
        });

        // Combine enabled company modules + available global modules
        const allModules = [
          ...enabledCompanyModules,
          ...Array.from(globalModuleMap.values())
        ];

        setModules(allModules);
      }
    } catch (err: any) {
      setError(err.message);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [user]);

  const createModule = async (moduleData: {
    name: string;
    description: string;
    href?: string;
    isPublic: boolean;
  }) => {
    if (!user || user.role !== 'SUPERADMIN') {
      throw new Error('Only superadmins can create modules');
    }

    try {
      const { data, error } = await supabase
        .from('modules')
        .insert([{
          name: moduleData.name,
          description: moduleData.description,
          href: moduleData.href,
          created_by: user.id,
          is_public_within_company: moduleData.isPublic,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchModules(); // Refresh the list
      
      // Log activity
      await logActivity({
        action_type: 'created',
        resource_type: 'module',
        resource_name: moduleData.name,
        details: { description: moduleData.description, isPublic: moduleData.isPublic }
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateModule = async (moduleId: string, updates: {
    name?: string;
    description?: string;
    href?: string;
    is_public_within_company?: boolean;
  }) => {
    if (!user || user.role !== 'SUPERADMIN') {
      throw new Error('Only superadmins can update modules');
    }

    try {
      const { error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', moduleId);

      if (error) throw error;

      await fetchModules(); // Refresh the list
      
      // Log activity
      await logActivity({
        action_type: 'updated',
        resource_type: 'module',
        resource_name: updates.name || 'Module',
        details: updates
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!user || user.role !== 'SUPERADMIN') {
      throw new Error('Only superadmins can delete modules');
    }

    try {
      // Get module name before deletion
      const { data: moduleToDelete } = await supabase
        .from('modules')
        .select('name')
        .eq('id', moduleId)
        .single();
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      await fetchModules(); // Refresh the list
      
      // Log activity
      await logActivity({
        action_type: 'deleted',
        resource_type: 'module',
        resource_name: moduleToDelete?.name || 'Module',
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const enableModuleForCompany = async (moduleId: string, companyId?: string) => {
    const targetCompanyId = companyId || user?.company_id;
    
    if (!targetCompanyId) {
      throw new Error('Company ID is required');
    }

    if (!user || !['OWNER', 'SUPERADMIN'].includes(user.role)) {
      throw new Error('Insufficient permissions');
    }

    try {
      const { data, error } = await supabase
        .from('company_modules')
        .upsert([{
          company_id: targetCompanyId,
          module_id: moduleId,
          is_enabled: true,
        }], {
          onConflict: 'company_id,module_id'
        })
        .select();

      if (error) throw error;

      // Update local state immediately for better UX
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === moduleId 
            ? { ...module, company_modules: [{ is_enabled: true }] }
            : module
        )
      );
      
      // Also refresh from server to ensure consistency
      await fetchModules();
      
      // Log activity
      const { data: moduleData } = await supabase
        .from('modules')
        .select('name')
        .eq('id', moduleId)
        .single();
      
      await logActivity({
        action_type: 'enabled',
        resource_type: 'module',
        resource_name: moduleData?.name || 'Module',
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const disableModuleForCompany = async (moduleId: string, companyId?: string) => {
    const targetCompanyId = companyId || user?.company_id;
    
    if (!targetCompanyId) {
      throw new Error('Company ID is required');
    }

    if (!user || !['OWNER', 'SUPERADMIN'].includes(user.role)) {
      throw new Error('Insufficient permissions');
    }

    try {
      const { data, error } = await supabase
        .from('company_modules')
        .upsert([{
          company_id: targetCompanyId,
          module_id: moduleId,
          is_enabled: false,
        }], {
          onConflict: 'company_id,module_id'
        })
        .select();

      if (error) throw error;

      // Update local state immediately for better UX
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === moduleId 
            ? { ...module, company_modules: [{ is_enabled: false }] }
            : module
        )
      );
      
      // Also refresh from server to ensure consistency
      await fetchModules();
      
      // Log activity
      const { data: moduleData } = await supabase
        .from('modules')
        .select('name')
        .eq('id', moduleId)
        .single();
      
      await logActivity({
        action_type: 'disabled',
        resource_type: 'module',
        resource_name: moduleData?.name || 'Module',
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getEnabledModulesForCompany = async (companyId?: string) => {
    const targetCompanyId = companyId || user?.company_id;
    
    if (!targetCompanyId) return [];

    try {
      const { data, error } = await supabase
        .from('company_modules')
        .select(`
          module_id,
          modules (*)
        `)
        .eq('company_id', targetCompanyId)
        .eq('is_enabled', true);

      if (error) throw error;
      
      return data?.map(item => item.modules).filter(Boolean) || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  const assignModuleToUser = async (moduleId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('users_modules')
        .insert([{
          user_id: userId,
          module_id: moduleId,
        }]);

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const unassignModuleFromUser = async (moduleId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('users_modules')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getUserModules = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users_modules')
        .select(`
          module_id,
          modules (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      return data?.map(item => item.modules).filter(Boolean) || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    modules,
    loading,
    error,
    refetch: fetchModules,
    createModule,
    updateModule,
    deleteModule,
    enableModuleForCompany,
    disableModuleForCompany,
    getEnabledModulesForCompany,
    assignModuleToUser,
    unassignModuleFromUser,
    getUserModules,
  };
};