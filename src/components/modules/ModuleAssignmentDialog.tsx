import React, { useState, useEffect } from 'react';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useModules } from '@/hooks/useModules';
import { toast } from 'react-toastify';
import { X, Users, Check } from 'lucide-react';
import type { Module } from '@/types/supabase';

interface ModuleAssignmentDialogProps {
  module: Module;
  onClose: () => void;
}

export const ModuleAssignmentDialog: React.FC<ModuleAssignmentDialogProps> = ({ 
  module, 
  onClose 
}) => {
  const { users, loading: usersLoading } = useCompanyUsers();
  const { assignModuleToUser, unassignModuleFromUser } = useModules();
  const [assignedUsers, setAssignedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssignedUsers = async () => {
      try {
        // This would be a more efficient query in practice
        const assignments = await Promise.all(
          users.map(async (user) => {
            try {
              const { data } = await supabase
                .from('users_modules')
                .select('user_id')
                .eq('user_id', user.id)
                .eq('module_id', module.id)
                .single();
              
              return data ? user.id : null;
            } catch {
              return null;
            }
          })
        );
        
        const assigned = new Set(assignments.filter(Boolean) as string[]);
        setAssignedUsers(assigned);
      } catch (error) {
        console.error('Failed to fetch assigned users:', error);
      }
    };

    if (users.length > 0) {
      fetchAssignedUsers();
    }
  }, [users, module.id]);

  const handleToggleAssignment = async (userId: string, isAssigned: boolean) => {
    setLoading(true);
    try {
      if (isAssigned) {
        await unassignModuleFromUser(module.id, userId);
        setAssignedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success('Module unassigned successfully');
      } else {
        await assignModuleToUser(module.id, userId);
        setAssignedUsers(prev => new Set([...prev, userId]));
        toast.success('Module assigned successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update assignment');
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
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
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
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Assign Module: {module.name}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Select which team members should have access to this module.
                </p>
              </div>

              <div className="mt-6">
                {usersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading team members...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No team members found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {users.map((user) => {
                      const isAssigned = assignedUsers.has(user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.email}</p>
                              <p className="text-xs text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.role === 'OWNER' 
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.role}
                                </span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleAssignment(user.id, isAssigned)}
                            disabled={loading}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              isAssigned
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isAssigned && <Check className="h-4 w-4" />}
                            <span>{isAssigned ? 'Assigned' : 'Assign'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};