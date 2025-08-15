import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Module } from '@/types/supabase';
import { useAuthStore } from '@/stores/auth';
import { useModules } from '@/hooks/useModules';
import { Package, MoreVertical, Edit, Trash2, Eye, EyeOff, Power, PowerOff } from 'lucide-react';
import { toast } from 'react-toastify';

interface ModuleCardProps {
  module: Module & { company_modules?: Array<{ is_enabled: boolean }> };
  onEdit?: (module: Module) => void;
  onDelete?: (module: Module) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ 
  module, 
  onEdit, 
  onDelete
}) => {
  const { user } = useAuthStore();
  const { enableModuleForCompany, disableModuleForCompany, refetch } = useModules();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const isEnabled = module.company_modules?.[0]?.is_enabled || false;
  const canEdit = user?.role === 'SUPERADMIN';
  const canDelete = user?.role === 'SUPERADMIN';
  const canToggleEnablement = user?.role === 'OWNER' || user?.role === 'SUPERADMIN';

  const handleModuleClick = () => {
    if (!module.href) return;
    
    // Check if module is enabled for user's company
    if (!isEnabled && user?.role !== 'SUPERADMIN') {
      navigate('/access-denied', { 
        state: { 
          moduleName: module.name,
          userRole: user?.role || 'EMPLOYEE'
        }
      });
      return;
    }
    
    // Navigate to the module
    navigate(module.href);
  };

  const handleToggleEnablement = async () => {
    if (!user?.company_id) return;

    try {
      if (isEnabled) {
        await disableModuleForCompany(module.id);
        toast.success(`${module.name} disabled for your company`);
      } else {
        await enableModuleForCompany(module.id);
        toast.success(`${module.name} enabled for your company`);
      }
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update module status');
    }
  };

  const getStatusBadge = () => {
    if (user?.role === 'SUPERADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Package className="h-3 w-3 mr-1" />
          Global Module
        </span>
      );
    }

    if (isEnabled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Power className="h-3 w-3 mr-1" />
          Enabled
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <PowerOff className="h-3 w-3 mr-1" />
          Disabled
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {module.name}
            </h3>
          </div>
        </div>
        
        {(canEdit || canDelete || canToggleEnablement) && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {canEdit && onEdit && (
                    <button
                      onClick={() => {
                        onEdit(module);
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Module
                    </button>
                  )}
                  {canToggleEnablement && (
                    <button
                      onClick={() => {
                        handleToggleEnablement();
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      {isEnabled ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Disable for Company
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Enable for Company
                        </>
                      )}
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => {
                        onDelete(module);
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Module
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-600 line-clamp-3">
        {module.description || 'No description available'}
      </p>

      {/* Module Link */}
      {module.href && (
        <div className="mt-3">
          <button
            onClick={handleModuleClick}
            className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Package className="h-4 w-4" />
            <span>Open Module</span>
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusBadge()}
        </div>
        
        <div className="text-xs text-gray-500">
          {new Date(module.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};