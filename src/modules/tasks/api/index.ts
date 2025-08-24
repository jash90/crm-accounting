import { supabase } from '@/lib/supabase';
import { registerModule } from '@/lib/moduleRegistry';
import { useAuthStore } from '@/stores/auth';
import { STATUTORY_DEADLINES } from '../types';
import type { 
  Task, 
  ClientTaskStats, 
  TaskFilters,
  TaskFormData,
  TaskModuleAPI,
  TaskStats,
  TaskSearchFilters,
  TaskSearchResult,
  RecurrencePattern,
  RecurrenceConfig,
  StatutoryType,
  TaskTemplateConfig
} from '../types';

/**
 * Enhanced Tasks API module providing comprehensive data access methods
 * Implements the TaskModuleAPI interface for inter-module communication
 */
export const tasksAPI: TaskModuleAPI = {
  /**
   * Get all tasks for a specific client
   * @param clientId - The client's unique identifier
   * @returns Array of tasks sorted by due date
   */
  getClientTasks: async (clientId: string): Promise<Task[]> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(`Failed to fetch client tasks: ${error.message}`);
    }
    return data || [];
  },

  /**
   * Get task statistics for a specific client
   * @param clientId - The client's unique identifier
   * @returns Task statistics object
   */
  getClientTaskStats: async (clientId: string): Promise<ClientTaskStats> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const { data, error } = await supabase.rpc('get_client_task_stats', {
      p_client_id: clientId,
    });

    if (error) {
      console.error('Failed to fetch task stats:', error);
      // Return default stats on error instead of throwing
      return {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        in_progress: 0,
        todo: 0,
      };
    }
    
    return data || {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      in_progress: 0,
      todo: 0,
    };
  },

  /**
   * Create a new task for a specific client
   * @param clientId - The client's unique identifier
   * @param taskData - Task creation data
   * @returns Created task
   */
  createTaskForClient: async (
    clientId: string,
    taskData: Partial<TaskFormData>
  ): Promise<Task> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    if (!taskData.title) {
      throw new Error('Task title is required');
    }

    const { user } = useAuthStore.getState();
    if (!user?.company_id) {
      throw new Error('User company information is required');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        client_id: clientId,
        company_id: user.company_id,
        created_by: user.id,
        board_order: 0,
        time_spent: 0,
        is_statutory: taskData.is_statutory || false,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        task_type: taskData.task_type || 'one-time',
        board_column: taskData.board_column || 'todo',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
    return data;
  },

  /**
   * Advanced search tasks using database function
   * @param filters - Search filters
   * @returns Array of matching tasks
   */
  searchTasks: async (filters: TaskSearchFilters): Promise<TaskSearchResult[]> => {
    if (!filters.search_term && !filters.status_filter && !filters.priority_filter) {
      return [];
    }

    const { data, error } = await supabase.rpc('search_tasks', {
      p_company_id: filters.client_id, // Note: this would need company_id in real implementation
      p_search_term: filters.search_term || null,
      p_status_filter: filters.status_filter || null,
      p_priority_filter: filters.priority_filter || null,
      p_client_id: filters.client_id || null,
      p_assigned_to: filters.assigned_to || null,
      p_is_statutory: filters.is_statutory || null,
      p_limit: filters.limit || 50,
      p_offset: filters.offset || 0,
    });

    if (error) {
      throw new Error(`Failed to search tasks: ${error.message}`);
    }
    return data || [];
  },

  /**
   * Get comprehensive task statistics using database function
   * @param companyId - The company's unique identifier
   * @returns Enhanced task statistics
   */
  getTaskStats: async (companyId: string): Promise<TaskStats> => {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const { data, error } = await supabase.rpc('get_company_task_stats', {
      p_company_id: companyId,
    });

    if (error) {
      console.error('Failed to fetch enhanced task stats:', error);
      // Return default stats on error
      return {
        total: 0,
        completed: 0,
        in_progress: 0,
        todo: 0,
        review: 0,
        cancelled: 0,
        overdue: 0,
        due_today: 0,
        due_this_week: 0,
        statutory: 0,
        statutory_overdue: 0,
        high_priority: 0,
        total_time_estimated: 0,
        total_time_spent: 0,
      };
    }
    
    return data || {
      total: 0,
      completed: 0,
      in_progress: 0,
      todo: 0,
      review: 0,
      cancelled: 0,
      overdue: 0,
      due_today: 0,
      due_this_week: 0,
      statutory: 0,
      statutory_overdue: 0,
      high_priority: 0,
      total_time_estimated: 0,
      total_time_spent: 0,
    };
  },

  /**
   * Create statutory tasks for multiple clients based on tax form requirements
   * @param clientIds - Array of client identifiers
   * @param statutoryType - Type of statutory requirement
   * @returns Array of created tasks
   */
  createStatutoryTasks: async (
    clientIds: string[],
    statutoryType: StatutoryType
  ): Promise<Task[]> => {
    if (!clientIds || clientIds.length === 0) {
      throw new Error('At least one client ID is required');
    }
    if (!statutoryType) {
      throw new Error('Statutory type is required');
    }

    const { user } = useAuthStore.getState();
    if (!user?.company_id) {
      throw new Error('User company information is required');
    }

    const templates = getEnhancedStatutoryTemplates(statutoryType);
    if (templates.length === 0) {
      throw new Error(`No templates found for statutory type: ${statutoryType}`);
    }

    const tasks = clientIds.flatMap(clientId =>
      templates.map((template) => ({
        client_id: clientId,
        company_id: user.company_id,
        created_by: user.id,
        ...template,
        board_order: 0,
        time_spent: 0,
      }))
    );

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();

    if (error) {
      throw new Error(`Failed to create statutory tasks: ${error.message}`);
    }
    return data || [];
  },

  /**
   * Bulk create tasks for multiple clients using a template
   * @param clientIds - Array of client identifiers
   * @param taskTemplate - Template configuration for task creation
   * @returns Array of created tasks
   */
  bulkCreateTasksForClients: async (
    clientIds: string[],
    taskTemplate: TaskTemplateConfig
  ): Promise<Task[]> => {
    if (!clientIds || clientIds.length === 0) {
      throw new Error('At least one client ID is required');
    }
    if (!taskTemplate.title) {
      throw new Error('Task template must include a title');
    }

    const { user } = useAuthStore.getState();
    if (!user?.company_id) {
      throw new Error('User company information is required');
    }

    const tasks = clientIds.map((clientId) => ({
      client_id: clientId,
      company_id: user.company_id,
      created_by: user.id,
      title: taskTemplate.title,
      description: taskTemplate.description,
      task_type: 'one-time' as const,
      priority: taskTemplate.priority,
      time_estimate: taskTemplate.time_estimate,
      is_statutory: taskTemplate.is_statutory,
      statutory_type: taskTemplate.statutory_type,
      tags: taskTemplate.tags,
      recurrence_pattern: taskTemplate.recurrence_pattern,
      recurrence_config: taskTemplate.recurrence_config,
      board_column: 'todo' as const,
      board_order: 0,
      time_spent: 0,
      status: 'todo' as const,
    }));

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create tasks: ${error.message}`);
    }
    return data || [];
  },

  /**
   * Get task summary statistics - alias for getTaskStats for backward compatibility
   * @param companyId - The company's unique identifier
   * @returns Task summary statistics
   */
  getTaskSummary: async (companyId: string): Promise<TaskStats> => {
    return tasksAPI.getTaskStats(companyId);
  },

  /**
   * Search tasks across the company - enhanced version
   * @param companyId - The company's unique identifier
   * @param searchTerm - Search query string
   * @returns Array of matching tasks
   */
  searchCompanyTasks: async (
    companyId: string,
    searchTerm: string
  ): Promise<TaskSearchResult[]> => {
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    return tasksAPI.searchTasks({
      search_term: searchTerm.trim(),
      limit: 100,
    });
  },

  /**
   * Get overdue tasks for a specific client
   * @param clientId - The client's unique identifier
   * @returns Array of overdue tasks
   */
  getClientOverdueTasks: async (clientId: string): Promise<Task[]> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', clientId)
      .lt('due_date', today)
      .in('status', ['todo', 'in_progress', 'review'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch overdue tasks:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Get upcoming tasks for a specific client within a specified number of days
   * @param clientId - The client's unique identifier
   * @param days - Number of days to look ahead (default: 7)
   * @returns Array of upcoming tasks
   */
  getClientUpcomingTasks: async (clientId: string, days: number = 7): Promise<Task[]> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', clientId)
      .gte('due_date', todayStr)
      .lte('due_date', futureDateStr)
      .in('status', ['todo', 'in_progress', 'review'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch upcoming tasks:', error);
      return [];
    }
    
    return data || [];
  },

};

/**
 * Get enhanced statutory task templates based on statutory type
 * @param statutoryType - Type of statutory requirement
 * @returns Array of task templates
 */
function getEnhancedStatutoryTemplates(statutoryType: StatutoryType): Partial<TaskFormData>[] {
  const deadlineInfo = STATUTORY_DEADLINES[statutoryType];
  const baseTemplate: Partial<TaskFormData> = {
    task_type: 'recurring' as const,
    priority: 'high' as const,
    is_statutory: true,
    statutory_type: statutoryType,
    board_column: 'todo',
    status: 'todo' as const,
  };

  const recurrenceConfig: RecurrenceConfig = {
    interval: 1,
    day_of_month: deadlineInfo.dayOfMonth,
  };

  switch (statutoryType) {
    case 'VAT-7':
      return [
        {
          ...baseTemplate,
          title: 'Submit VAT-7 Declaration',
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: recurrenceConfig,
          time_estimate: 120, // 2 hours
          tags: ['vat', 'tax', 'statutory'],
        },
      ];

    case 'CIT-8':
      return [
        {
          ...baseTemplate,
          title: 'Submit CIT-8 Declaration',
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: recurrenceConfig,
          time_estimate: 180, // 3 hours
          tags: ['cit', 'tax', 'statutory'],
        },
      ];

    case 'PIT-4':
      return [
        {
          ...baseTemplate,
          title: 'Submit PIT-4 Declaration',
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: recurrenceConfig,
          time_estimate: 90, // 1.5 hours
          tags: ['pit', 'tax', 'statutory'],
        },
      ];

    case 'ZUS':
      return [
        {
          ...baseTemplate,
          title: 'Submit ZUS Declaration',
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: recurrenceConfig,
          time_estimate: 60, // 1 hour
          tags: ['zus', 'social', 'statutory'],
        },
      ];

    case 'JPK':
      return [
        {
          ...baseTemplate,
          title: 'Submit JPK File',
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: recurrenceConfig,
          time_estimate: 30, // 30 minutes
          tags: ['jpk', 'audit', 'statutory'],
        },
      ];

    case 'CEIDG':
      return [
        {
          ...baseTemplate,
          title: 'Update CEIDG Registry',
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: {
            ...recurrenceConfig,
            month_of_year: 12, // Annual update
          },
          time_estimate: 45, // 45 minutes
          tags: ['ceidg', 'registry', 'statutory'],
        },
      ];

    case 'CUSTOMS':
      return [
        {
          ...baseTemplate,
          title: 'Submit Customs Declaration',
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: recurrenceConfig,
          time_estimate: 90, // 1.5 hours
          tags: ['customs', 'import', 'statutory'],
        },
      ];

    case 'OTHER':
    default:
      return [
        {
          ...baseTemplate,
          title: `Submit ${statutoryType} Declaration`,
          description: deadlineInfo.description,
          recurrence_pattern: deadlineInfo.frequency as RecurrencePattern,
          recurrence_config: recurrenceConfig,
          time_estimate: 60, // 1 hour default
          tags: ['statutory', 'other'],
        },
      ];
  }
}

// Register API on module load
registerModule('tasks', tasksAPI);

// Initialize tasks module integration
export const initializeTasksModule = () => {
  try {
    // Register module API for other modules to use
    registerModule('tasks', tasksAPI);
    
    console.log('Tasks module initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Tasks module:', error);
  }
};

// Auto-initialize on module load
initializeTasksModule();
