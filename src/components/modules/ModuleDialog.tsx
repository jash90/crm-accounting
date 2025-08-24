import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useModules } from '@/hooks/useModules';
import { toast } from 'react-toastify';
import { X, Package } from 'lucide-react';
import type { Module } from '@/types/supabase';

interface ModuleDialogProps {
  module?: Module | null;
  onClose: () => void;
}

export const ModuleDialog: React.FC<ModuleDialogProps> = ({
  module,
  onClose,
}) => {
  const { user } = useAuthStore();
  const { createModule, updateModule } = useModules();
  const [name, setName] = useState(module?.name || '');
  const [description, setDescription] = useState(module?.description || '');
  const [href, setHref] = useState(module?.href || '');
  const [isPublic, setIsPublic] = useState(
    module?.is_public_within_company !== false
  );
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(module);

  // Only allow superadmins to create/edit modules
  if (user?.role !== 'SUPERADMIN') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Access Denied
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Only Super Administrators can create or edit modules.
              </p>
              <button
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && module) {
        await updateModule(module.id, {
          name,
          description,
          href: href || undefined,
          is_public_within_company: isPublic,
        });
        toast.success('Module updated successfully!');
      } else {
        await createModule({
          name,
          description,
          href: href || undefined,
          isPublic,
        });
        toast.success('Module created successfully!');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isEditing ? 'Edit Global Module' : 'Create Global Module'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {isEditing
                    ? 'Update the global module details. Companies can enable/disable this module separately.'
                    : 'Create a new global module that companies can enable for their users.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="module-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Module Name
                  </label>
                  <input
                    id="module-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter module name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="module-description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="module-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Describe what this module does"
                  />
                </div>

                <div>
                  <label
                    htmlFor="module-href"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Module Route
                  </label>
                  <input
                    id="module-href"
                    type="text"
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="/dashboard"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional route path within the application (e.g., /clients,
                    /reports)
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module Visibility
                    </label>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="module-public"
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="module-public"
                          className="font-medium text-gray-700"
                        >
                          Visible to company owners
                        </label>
                        <p className="text-gray-500">
                          Company owners can see this module in their modules
                          list and enable/disable it for their company
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? 'Saving...'
                      : isEditing
                        ? 'Update Module'
                        : 'Create Module'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
