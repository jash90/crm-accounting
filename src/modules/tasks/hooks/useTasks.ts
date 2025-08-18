import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'react-toastify';
import { isModuleAvailable, getModuleAPI } from '@/lib/moduleRegistry';
import { PERFORMANCE_THRESHOLDS } from '../types';
import type {
  Task,
  TaskFormData,
  TaskFilters,
  TaskWithDetails,
  TaskStats,
  TaskSearchFilters,
  TaskSearchResult,
} from '../types';
import { sanitizeTaskData } from '../utils/taskDataSanitizer';
import { applyOptimisticUpdate, createRollbackTask } from '../utils/optimisticUpdates';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Memoized company ID for performance
  const companyId = useMemo(() => user?.company_id, [user?.company_id]);

  /**
   * Fetch tasks with optional filtering and client enrichment
   * Optimized with proper error handling and memoization
   */
  const fetchTasks = useCallback(
    async (filters?: TaskFilters) => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('tasks')
          .select(
            `
          *,
          assigned_user:users!assigned_to(id, email, role),
          checklist_items:task_checklist_items(*)
        `
          )
          .eq('company_id', companyId);

        // Apply filters
        if (filters?.status?.length) {
          query = query.in('status', filters.status);
        }
        if (filters?.priority?.length) {
          query = query.in('priority', filters.priority);
        }
        if (filters?.assigned_to?.length) {
          query = query.in('assigned_to', filters.assigned_to);
        }
        if (filters?.client_id) {
          query = query.eq('client_id', filters.client_id);
        }
        if (filters?.due_date_from) {
          query = query.gte('due_date', filters.due_date_from);
        }
        if (filters?.due_date_to) {
          query = query.lte('due_date', filters.due_date_to);
        }
        if (filters?.is_statutory !== undefined) {
          query = query.eq('is_statutory', filters.is_statutory);
        }
        if (filters?.tags?.length) {
          query = query.overlaps('tags', filters.tags);
        }
        if (filters?.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query
          .order('due_date', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Process assignment data and enrich with client data if available
        let enrichedTasks = (data || []).map(task => ({
          ...task,
          assigned_to_email: task.assigned_user?.email,
          assigned_to_role: task.assigned_user?.role,
        }));
        if (isModuleAvailable('clients')) {
          try {
            const clientsAPI = getModuleAPI('clients');
            const clientIds = [
              ...new Set(
                enrichedTasks.filter((t) => t.client_id).map((t) => t.client_id)
              ),
            ];

            if (clientIds.length > 0) {
              const clientsData = await Promise.all(
                clientIds.map((id) => clientsAPI.getClient(id))
              );

              const clientMap = new Map(
                clientsData
                  .filter(Boolean)
                  .map((c: { id: string }) => [c.id, c])
              );

              enrichedTasks = enrichedTasks.map((task) => ({
                ...task,
                client: task.client_id ? clientMap.get(task.client_id) : null,
              }));
            }
          } catch (clientError) {
            console.warn(
              'Failed to enrich tasks with client data:',
              clientError
            );
          }
        }

        setTasks(enrichedTasks);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        toast.error(
          `Error fetching tasks: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
        );
      } finally {
        setLoading(false);
      }
    },
    [companyId]
  );

  // Create task with enhanced data sanitization and activity logging
  const createTask = async (taskData: TaskFormData): Promise<Task> => {
    if (!user?.company_id) {
      throw new Error('No company selected');
    }

    try {
      // Start performance monitoring
      const startTime = Date.now();

      // Sanitize the task data to handle UUID and timestamp fields
      const sanitizedData = sanitizeTaskData(taskData);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...sanitizedData,
          company_id: user.company_id,
          created_by: user.id,
          board_order: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Performance monitoring
      const duration = Date.now() - startTime;
      if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
        console.warn(`Slow task creation: ${duration}ms`);
      }

      // Log activity if client is associated and Clients module is available
      if (data.client_id && isModuleAvailable('clients')) {
        try {
          const clientsAPI = getModuleAPI('clients');
          await clientsAPI.logActivity({
            clientId: data.client_id,
            activityType: 'created',
            activityTitle: 'Task Created',
            activityDescription: `Created task: ${data.title}`,
            newData: { taskId: data.id, title: data.title },
            source: 'tasks-module',
          });
        } catch (logError) {
          console.warn('Failed to log task creation activity:', logError);
        }
      }

      await fetchTasks();

      toast.success('Task created successfully');
      return data;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error creating task: ${errorMessage}`);
      throw err;
    }
  };

  // Update task
  const updateTask = async (
    taskId: string,
    updates: Partial<TaskFormData>
  ): Promise<Task> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Log activity if client is associated and Clients module is available
      if (data.client_id && isModuleAvailable('clients')) {
        try {
          const clientsAPI = getModuleAPI('clients');
          await clientsAPI.logActivity({
            clientId: data.client_id,
            activityType: 'updated',
            activityTitle: 'Task Updated',
            activityDescription: `Updated task: ${data.title}`,
            newData: updates,
            source: 'tasks-module',
          });
        } catch (logError) {
          console.warn('Failed to log task update activity:', logError);
        }
      }

      await fetchTasks();

      toast.success('Task updated successfully');
      return data;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error updating task: ${errorMessage}`);
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;

      // Log activity if client is associated and Clients module is available
      if (task.client_id && isModuleAvailable('clients')) {
        try {
          const clientsAPI = getModuleAPI('clients');
          await clientsAPI.logActivity({
            clientId: task.client_id,
            activityType: 'deleted',
            activityTitle: 'Task Deleted',
            activityDescription: `Deleted task: ${task.title}`,
            source: 'tasks-module',
          });
        } catch (logError) {
          console.warn('Failed to log task deletion activity:', logError);
        }
      }

      await fetchTasks();

      toast.success('Task deleted successfully');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error deleting task: ${errorMessage}`);
      throw err;
    }
  };

  // Update task status with optimistic updates
  const updateTaskStatus = async (
    taskId: string,
    newStatus: string,
    newColumn?: string
  ): Promise<void> => {
    // Find the task to update
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) {
      throw new Error('Task not found');
    }

    // Store original values for rollback
    const originalStatus = taskToUpdate.status;
    const originalColumn = taskToUpdate.board_column;

    try {
      // Optimistic update - update local state immediately
      const optimisticUpdates = {
        status: newStatus,
        ...(newColumn && { board_column: newColumn }),
        updated_at: new Date().toISOString(), // Mark as optimistically updated
      };
      
      setTasks(currentTasks => {
        const updatedTasks = applyOptimisticUpdate(currentTasks, taskId, optimisticUpdates);
        console.log('🔄 Optimistic update applied:', { 
          taskId, 
          newStatus, 
          newColumn,
          from: `${originalColumn}/${originalStatus}`,
          to: `${newColumn}/${newStatus}`,
          taskAfterUpdate: updatedTasks.find(t => t.id === taskId)
        });
        return [...updatedTasks]; // Ensure new array reference
      });

      // Prepare database updates
      const updates: Record<string, unknown> = { status: newStatus };
      if (newColumn) {
        updates.board_column = newColumn;
      }

      console.log('💾 Database update starting', { taskId, updates });
      
      // Update database
      const { error, data } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('❌ Database update failed:', error);
        throw error;
      }
      
      if (!data) {
        console.error('❌ Database update returned no data');
        throw new Error('Database update failed - no data returned');
      }
      
      console.log('✅ Database update successful', { 
        taskId, 
        updatedTask: data,
        confirmedStatus: data.status,
        confirmedColumn: data.board_column 
      });

      // Log activity if client is associated and Clients module is available
      if (taskToUpdate.client_id && isModuleAvailable('clients')) {
        try {
          const clientsAPI = getModuleAPI('clients');
          await clientsAPI.logActivity({
            clientId: taskToUpdate.client_id,
            activityType: 'status_changed',
            activityTitle: 'Task Status Changed',
            activityDescription: `Task status changed to: ${newStatus}`,
            newData: { status: newStatus, board_column: newColumn },
            source: 'tasks-module',
          });
        } catch (logError) {
          console.warn('Failed to log task status change activity:', logError);
        }
      }

      // Verify the optimistic update matches the database response
      setTasks(currentTasks => {
        const currentTask = currentTasks.find(t => t.id === taskId);
        if (!currentTask) {
          console.warn('⚠️ Task not found in current state during confirmation');
          return currentTasks;
        }

        // Only update if the database response differs from our optimistic state
        const needsUpdate = currentTask.status !== newStatus || 
                           (newColumn && currentTask.board_column !== newColumn) ||
                           !currentTask.updated_at || 
                           currentTask.updated_at < (data.updated_at || new Date().toISOString());

        if (!needsUpdate) {
          console.log('✅ Optimistic state already matches database, no update needed');
          return currentTasks;
        }

        const updatedTasks = currentTasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              status: newStatus,
              ...(newColumn && { board_column: newColumn }),
              updated_at: data.updated_at || new Date().toISOString()
            };
          }
          return t;
        });
        
        console.log('🔄 Final state update after database confirmation:', {
          taskId,
          newStatus,
          newColumn,
          wasOptimistic: !needsUpdate,
          taskFound: updatedTasks.find(t => t.id === taskId)
        });
        
        return updatedTasks;
      });

      toast.success('Task status updated');
      console.log('🎉 Task update complete - state synchronized with database');
      
    } catch (err: unknown) {
      console.error('❌ Database update failed, rolling back', err);
      
      // Rollback optimistic update on error
      setTasks(currentTasks => {
        const rollbackUpdates = {
          status: originalStatus,
          board_column: originalColumn,
          updated_at: taskToUpdate.updated_at, // Restore original timestamp
        };
        const rolledBackTasks = applyOptimisticUpdate(currentTasks, taskId, rollbackUpdates);
        console.log('🔄 Rolling back optimistic update', { 
          taskId, 
          originalStatus, 
          originalColumn,
          error: err instanceof Error ? err.message : 'Unknown error',
          taskAfterRollback: rolledBackTasks.find(t => t.id === taskId)
        });
        return [...rolledBackTasks]; // Ensure new array reference
      });

      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error updating task status: ${errorMessage}`);
      throw err;
    }
  };

  // Assign task (supports both assign and unassign)
  const assignTask = async (taskId: string, userId: string | null): Promise<void> => {
    // Store original task state for rollback
    const originalTask = tasks.find((t) => t.id === taskId);
    if (!originalTask) throw new Error('Task not found');
    
    const originalAssignedTo = originalTask.assigned_to;
    const originalAssignedToEmail = originalTask.assigned_to_email;
    const originalAssignedToRole = originalTask.assigned_to_role;

    try {
      console.log('🔄 assignTask called:', { taskId, userId, currentUser: user?.id, userRole: user?.role });
      
      // Check authentication
      if (!user?.id || !user?.company_id) {
        throw new Error('User not authenticated or missing company');
      }

      let assigneeUser = null;
      // Validate assignee if provided
      if (userId) {
        console.log('👤 Validating assignee user...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, company_id, role')
          .eq('id', userId)
          .eq('company_id', user.company_id)
          .single();

        if (userError) {
          console.error('❌ User validation error:', userError);
          throw new Error(`Invalid user: ${userError.message}`);
        }

        if (!userData) {
          throw new Error('User not found or not in the same company');
        }

        assigneeUser = userData;
        console.log('✅ Assignee validated:', assigneeUser);
      }

      // Apply optimistic update immediately
      const optimisticUpdates = userId && assigneeUser
        ? { 
            assigned_to: userId, 
            assigned_to_email: assigneeUser.email,
            assigned_to_role: assigneeUser.role
          }
        : { 
            assigned_to: null, 
            assigned_to_email: null,
            assigned_to_role: null
          };

      const updatedTasks = applyOptimisticUpdate(tasks, taskId, optimisticUpdates);
      console.log('🔄 Optimistic assignment update:', { taskId, userId, assigneeEmail: assigneeUser?.email });
      setTasks([...updatedTasks]); // Ensure new array reference

      const updateData = userId 
        ? { assigned_to: userId, assigned_by: user.id }
        : { assigned_to: null, assigned_by: user.id };

      console.log('💾 Updating task with data:', updateData);

      const { error, data } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('company_id', user.company_id)
        .select(`
          *,
          assigned_user:users!assigned_to(id, email, role)
        `);

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          taskId,
          userId,
          userCompanyId: user.company_id
        });
        throw error;
      }

      console.log('✅ Task assignment updated successfully:', data);

      // Update the task with complete data from database
      if (data && data.length > 0) {
        const updatedTask = data[0];
        const finalUpdates = {
          assigned_to: updatedTask.assigned_to,
          assigned_to_email: updatedTask.assigned_user?.email,
          assigned_to_role: updatedTask.assigned_user?.role,
          assigned_by: updatedTask.assigned_by
        };
        
        const finalTasks = applyOptimisticUpdate(tasks, taskId, finalUpdates);
        setTasks([...finalTasks]);
      }

      // Log activity if client is associated and Clients module is available
      if (originalTask.client_id && isModuleAvailable('clients')) {
        try {
          const clientsAPI = getModuleAPI('clients');
          await clientsAPI.logActivity({
            clientId: originalTask.client_id,
            activityType: 'assigned',
            activityTitle: 'Task Assigned',
            activityDescription: `Task assigned to user`,
            newData: { assigned_to: userId },
            source: 'tasks-module',
          });
        } catch (logError) {
          console.warn('Failed to log task assignment activity:', logError);
        }
      }

      toast.success(userId ? 'Task assigned successfully' : 'Task unassigned successfully');
    } catch (err: unknown) {
      console.error('❌ Assignment failed, rolling back:', err);
      
      // Rollback optimistic update on error
      setTasks(currentTasks => {
        const rollbackUpdates = {
          assigned_to: originalAssignedTo,
          assigned_to_email: originalAssignedToEmail,
          assigned_to_role: originalAssignedToRole,
        };
        const rolledBackTasks = applyOptimisticUpdate(currentTasks, taskId, rollbackUpdates);
        console.log('🔄 Rolling back assignment update', { taskId, originalAssignedTo, originalAssignedToEmail });
        return [...rolledBackTasks]; // Ensure new array reference
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error assigning task: ${errorMessage}`);
      throw err;
    }
  };

  /**
   * Search tasks by title and description
   */
  const searchTasks = useCallback(
    async (searchTerm: string): Promise<Task[]> => {
      if (!companyId) return [];
      if (!searchTerm?.trim()) return [];

      try {
        const sanitizedTerm = searchTerm.trim();
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('company_id', companyId)
          .or(`title.ilike.%${sanitizedTerm}%,description.ilike.%${sanitizedTerm}%`)
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(50); // Limit for performance

        if (error) {
          throw new Error(`Search failed: ${error.message}`);
        }
        return data || [];
      } catch (err: unknown) {
        console.error('Error searching tasks:', err);
        return [];
      }
    },
    [companyId]
  );

  /**
   * Get a single task with full details by ID
   */
  const getTaskById = useCallback(
    async (taskId: string): Promise<TaskWithDetails | null> => {
      if (!companyId || !taskId) return null;

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(
            `
            *,
            assigned_user:users!assigned_to(id, email, role),
            checklist_items:task_checklist_items(*),
            comments:task_comments(*)
          `
          )
          .eq('id', taskId)
          .eq('company_id', companyId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Task not found
            return null;
          }
          throw new Error(`Failed to fetch task: ${error.message}`);
        }
        
        if (!data) return null;
        
        // Process assignment data for compatibility
        return {
          ...data,
          assigned_to_email: data.assigned_user?.email,
          assigned_to_role: data.assigned_user?.role,
        };
      } catch (err: unknown) {
        console.error('Error fetching task:', err);
        return null;
      }
    },
    [companyId]
  );

  // Initialize on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /**
   * Get comprehensive task statistics using database function
   */
  const getTaskStats = useCallback(
    async (): Promise<TaskStats | null> => {
      if (!companyId) return null;

      try {
        const startTime = Date.now();
        const { data, error } = await supabase.rpc('get_company_task_stats', {
          p_company_id: companyId,
        });

        if (error) throw error;

        const duration = Date.now() - startTime;
        if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
          console.warn(`Slow task stats query: ${duration}ms`);
        }

        return data;
      } catch (err: unknown) {
        console.error('Error fetching task stats:', err);
        return null;
      }
    },
    [companyId]
  );

  /**
   * Advanced task search using database function
   */
  const searchTasksAdvanced = useCallback(
    async (filters: TaskSearchFilters): Promise<TaskSearchResult[]> => {
      if (!companyId) return [];

      try {
        const startTime = Date.now();
        const { data, error } = await supabase.rpc('search_tasks', {
          p_company_id: companyId,
          p_search_term: filters.search_term || null,
          p_status_filter: filters.status_filter || null,
          p_priority_filter: filters.priority_filter || null,
          p_client_id: filters.client_id || null,
          p_assigned_to: filters.assigned_to || null,
          p_is_statutory: filters.is_statutory || null,
          p_limit: filters.limit || 50,
          p_offset: filters.offset || 0,
        });

        if (error) throw error;

        const duration = Date.now() - startTime;
        if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
          console.warn(`Slow task search: ${duration}ms`);
        }

        return data || [];
      } catch (err: unknown) {
        console.error('Error searching tasks:', err);
        return [];
      }
    },
    [companyId]
  );

  /**
   * Create recurring task instance using database function
   */
  const createRecurringTaskInstance = useCallback(
    async (parentTaskId: string): Promise<string | null> => {
      if (!companyId) return null;

      try {
        const { data, error } = await supabase.rpc('create_recurring_task_instance', {
          p_parent_task_id: parentTaskId,
        });

        if (error) throw error;

        toast.success('Recurring task instance created');
        await fetchTasks(); // Refresh tasks list

        return data; // Returns new task ID
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error creating recurring task instance:', err);
        toast.error(`Error creating recurring task: ${errorMessage}`);
        return null;
      }
    },
    [companyId, fetchTasks]
  );

  /**
   * Get tasks using enhanced view with details
   */
  const getTasksWithDetails = useCallback(
    async (limit = 100): Promise<Task[]> => {
      if (!companyId) return [];

      try {
        const startTime = Date.now();
        const { data, error } = await supabase.rpc('get_tasks_with_details', {
          p_company_id: companyId,
          p_limit: limit,
        });

        if (error) throw error;

        const duration = Date.now() - startTime;
        if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
          console.warn(`Slow detailed tasks query: ${duration}ms`);
        }

        return data || [];
      } catch (err: unknown) {
        console.error('Error fetching detailed tasks:', err);
        return [];
      }
    },
    [companyId]
  );

  /**
   * Get tasks from dashboard view
   */
  const getDashboardTasks = useCallback(
    async (): Promise<Task[]> => {
      if (!companyId) return [];

      try {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('task_dashboard')
          .select('*')
          .eq('company_id', companyId)
          .order('urgency_status')
          .order('due_date', { ascending: true })
          .limit(100);

        if (error) throw error;

        const duration = Date.now() - startTime;
        if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
          console.warn(`Slow dashboard tasks query: ${duration}ms`);
        }

        return data || [];
      } catch (err: unknown) {
        console.error('Error fetching dashboard tasks:', err);
        return [];
      }
    },
    [companyId]
  );

  /**
   * Bulk update task statuses
   */
  const bulkUpdateTaskStatus = useCallback(
    async (taskIds: string[], newStatus: string): Promise<boolean> => {
      if (!companyId || taskIds.length === 0) return false;

      try {
        const startTime = Date.now();
        const { error } = await supabase
          .from('tasks')
          .update({ 
            status: newStatus,
            ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
          })
          .in('id', taskIds)
          .eq('company_id', companyId);

        if (error) throw error;

        const duration = Date.now() - startTime;
        if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
          console.warn(`Slow bulk update: ${duration}ms`);
        }

        toast.success(`Updated ${taskIds.length} tasks`);
        await fetchTasks(); // Refresh tasks list

        return true;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error bulk updating tasks:', err);
        toast.error(`Error updating tasks: ${errorMessage}`);
        return false;
      }
    },
    [companyId, fetchTasks]
  );

  // Memoized computed values for performance
  const tasksCount = useMemo(() => tasks.length, [tasks.length]);
  const completedTasksCount = useMemo(
    () => tasks.filter(t => t.status === 'completed').length,
    [tasks]
  );
  const overdueTasksCount = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => 
      t.status !== 'completed' && 
      t.status !== 'cancelled' &&
      t.due_date && 
      new Date(t.due_date) < now
    ).length;
  }, [tasks]);

  return {
    // State
    tasks,
    loading,
    error,
    
    // Basic CRUD operations
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    
    // Search and retrieval
    searchTasks,
    getTaskById,
    
    // Enhanced database functions
    getTaskStats,
    searchTasksAdvanced,
    createRecurringTaskInstance,
    getTasksWithDetails,
    getDashboardTasks,
    bulkUpdateTaskStatus,
    
    // Computed values
    tasksCount,
    completedTasksCount,
    overdueTasksCount,
  };
};
