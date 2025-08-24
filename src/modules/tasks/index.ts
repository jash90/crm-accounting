// Tasks Module Main Entry Point

import { registerModule } from '@/lib/moduleRegistry';
import { isModuleAvailable, getModuleAPI } from '@/lib/moduleRegistry';
import { tasksAPI } from './api';

// Export types
export * from './types';

// Export hooks
export { useTasks } from './hooks/useTasks';
export {
  useClientTaskIntegration,
  useTasksModuleAvailable,
} from './hooks/useClientTaskIntegration';

// Export utilities
export { sanitizeTaskData, getDisplayValue } from './utils/taskDataSanitizer';

// Export API
export { tasksAPI } from './api';

// Export configuration
export {
  tasksModuleConfig,
  performanceThresholds,
  modulePermissions,
  loggingStrategy,
  exportConfig,
  moduleIntegrationConfig,
  kanbanConfig,
  recurrenceConfig,
  slaConfig,
} from './config';

// Export components
export { TaskCard } from './components/TaskCard';
export { TaskForm } from './components/TaskForm';
export { TaskClientSelector } from './components/TaskClientSelector';
export { UserSelector } from './components/UserSelector';
export { KanbanBoard } from './components/KanbanBoard';
export { KanbanColumn } from './components/KanbanColumn';
export { KanbanTaskCard } from './components/KanbanTaskCard';

// Export pages
export { TasksPage } from './pages/TasksPage';
export { AddTaskPage } from './pages/AddTaskPage';
export { EditTaskPage } from './pages/EditTaskPage';
export { TaskDetailPage } from './pages/TaskDetailPage';

// Client integration setup
export const initializeTasksModule = () => {
  // Register the module with its API
  registerModule('tasks', {
    name: 'Tasks Management',
    version: '1.0.0',
    description:
      'Comprehensive task management with Kanban boards and client integration',
    dependencies: {
      optional: ['clients'],
    },
    provides: {
      entities: ['tasks'],
      features: [
        'task-management',
        'kanban-boards',
        'recurring-tasks',
        'statutory-deadlines',
        'client-integration',
      ],
    },
    api: tasksAPI,
  });

  // Log module registration
  console.log('Tasks module: Registered with module registry');

  // Check if Clients module is available for integration
  if (isModuleAvailable('clients') || isModuleAvailable('Clients')) {
    console.log('Tasks module: Clients module detected, integration available');
  } else {
    console.log(
      'Tasks module: Clients module not available, running in standalone mode'
    );
  }
};

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  initializeTasksModule();
}
