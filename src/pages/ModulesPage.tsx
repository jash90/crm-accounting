import React from 'react';
import { useAuthStore } from '@/stores/auth';
import { useModules } from '@/hooks/useModules';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { ModuleFilters } from '@/components/modules/ModuleFilters';
import { ModuleDialog } from '@/components/modules/ModuleDialog';
import { ModuleAssignmentDialog } from '@/components/modules/ModuleAssignmentDialog';
import { Plus, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Module } from '@/types/supabase';

export const ModulesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { modules, loading, deleteModule, toggleModuleVisibility, refetch } = useModules();
  const [showModuleDialog, setShowModuleDialog] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<Module | null>(null);
  const [assigningModule, setAssigningModule] = React.useState<Module | null>(null);

  const getPageTitle = () => {
    if (user?.role === 'SUPERADMIN') return 'Global Modules';
    if (user?.role === 'OWNER') return 'Available Modules';
    return 'My Modules';
  };

  const getPageDescription = () => {
    if (user?.role === 'SUPERADMIN') return 'Create and manage global modules that companies can enable';
    if (user?.role === 'OWNER') return 'Enable or disable modules for your company users';
    return 'View modules enabled for your company';
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setShowModuleDialog(true);
  };

  const handleDeleteModule = async (module: Module) => {
    if (!window.confirm(`Are you sure you want to delete "${module.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteModule(module.id);
      toast.success('Module deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete module');
    }
  };

  const handleAssignUsers = (module: Module) => {
    setAssigningModule(module);
  };

  const handleToggleVisibility = async (module: Module) => {
    const action = module.is_public_within_company ? 'private' : 'public';
    const confirmMessage = `Are you sure you want to make "${module.name}" ${action} within your company?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await toggleModuleVisibility(module.id, module.is_public_within_company);
      toast.success(`Module visibility updated to ${action}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update module visibility');
    }
  };
  const handleDialogClose = () => {
    setShowModuleDialog(false);
    setEditingModule(null);
    refetch();
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">{getPageDescription()}</p>
        </div>
        
        {(user?.role === 'SUPERADMIN' || user?.role === 'OWNER') && (
          <button 
            onClick={() => setShowModuleDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </button>
        )}
      </div>

      <ModuleFilters />

      {/* Module Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading modules...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No modules found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'SUPERADMIN' || user?.role === 'OWNER' 
              ? 'Get started by creating your first module.'
              : 'No modules have been assigned to you yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onEdit={handleEditModule}
              onDelete={handleDeleteModule}
              onAssignUsers={handleAssignUsers}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      {/* Module Dialog */}
      {showModuleDialog && (
        <ModuleDialog 
          module={editingModule} 
          onClose={handleDialogClose} 
        />
      )}

      {/* Module Assignment Dialog */}
      {assigningModule && (
        <ModuleAssignmentDialog
          module={assigningModule}
          onClose={() => setAssigningModule(null)}
        />
      )}
    </div>
  );
};