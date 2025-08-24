import React from 'react';
import { ClientCard } from './ClientCard';
import type { Client } from '@/types/supabase';
import { isModuleAvailable } from '@/lib/moduleRegistry';
import { ListTodo, AlertCircle, Clock, Plus, FileText } from 'lucide-react';

// Lazy load task integration if available
const TaskIntegration = React.lazy(() =>
  isModuleAvailable('tasks')
    ? import('@/modules/tasks').then(module => ({
        default: ({ clientId }: { clientId: string }) => {
          const { useClientTaskIntegration } = module;
          const { stats, overdueTasks, loading, actions } = useClientTaskIntegration(clientId);
          
          if (loading || !stats) return null;

          return (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <ListTodo className="h-4 w-4 mr-1" />
                  Tasks
                </h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => actions.createTask(clientId)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Create Task"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => actions.viewTasks(clientId)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="View All Tasks"
                  >
                    <ListTodo className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-gray-900">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-blue-600">{stats.pending}</span>
                </div>
                
                {stats.overdue > 0 && (
                  <div className="col-span-2 flex items-center justify-between bg-red-50 rounded px-2 py-1">
                    <span className="text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue:
                    </span>
                    <span className="font-medium text-red-700">{stats.overdue}</span>
                  </div>
                )}
                
                {overdueTasks.length > 0 && (
                  <div className="col-span-2 mt-1">
                    <div className="text-xs text-red-600 font-medium mb-1">
                      Overdue Tasks:
                    </div>
                    {overdueTasks.slice(0, 2).map(task => (
                      <div key={task.id} className="text-xs text-gray-600 pl-2 truncate">
                        • {task.title}
                      </div>
                    ))}
                    {overdueTasks.length > 2 && (
                      <div className="text-xs text-gray-500 pl-2">
                        +{overdueTasks.length - 2} more...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick action for statutory tasks */}
              <div className="mt-2">
                <button
                  onClick={async () => {
                    const taxForms = ['VAT-7', 'CIT-8', 'PIT-4', 'ZUS'];
                    const selectedForm = prompt(
                      `Select tax form:\n${taxForms.join('\n')}`,
                      'VAT-7'
                    );
                    if (selectedForm && taxForms.includes(selectedForm)) {
                      try {
                        await actions.createStatutoryTasks(clientId, selectedForm);
                        alert(`Created statutory tasks for ${selectedForm}`);
                      } catch (error) {
                        alert(`Error creating statutory tasks: ${error}`);
                      }
                    }
                  }}
                  className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center justify-center"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Create Statutory Tasks
                </button>
              </div>
            </div>
          );
        }
      }))
    : Promise.resolve({ default: () => null })
);

interface ClientCardWithTasksProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export const ClientCardWithTasks: React.FC<ClientCardWithTasksProps> = ({
  client,
  onEdit,
  onDelete,
}) => {
  const tasksAvailable = isModuleAvailable('tasks');

  return (
    <div className="relative">
      <ClientCard client={client} onEdit={onEdit} onDelete={onDelete} />
      
      {tasksAvailable && (
        <React.Suspense fallback={null}>
          <div className="px-6 pb-4 -mt-2">
            <TaskIntegration clientId={client.id} />
          </div>
        </React.Suspense>
      )}
    </div>
  );
};