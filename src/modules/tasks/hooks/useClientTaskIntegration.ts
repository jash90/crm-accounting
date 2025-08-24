/**
 * Hook for integrating tasks with the Clients module
 * Provides task-related data and actions for client cards
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isModuleAvailable, getModuleAPI } from '@/lib/moduleRegistry';
import { tasksAPI } from '../api';
import type { ClientTaskStats, Task } from '../types';

export interface ClientTaskIntegration {
  stats: ClientTaskStats | null;
  overdueTasks: Task[];
  upcomingTasks: Task[];
  loading: boolean;
  error: Error | null;
  actions: {
    createTask: (clientId: string) => void;
    viewTasks: (clientId: string) => void;
    createStatutoryTasks: (clientId: string, type: string) => Promise<void>;
  };
}

export function useClientTaskIntegration(clientId?: string): ClientTaskIntegration {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ClientTaskStats | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch task data for the client
  const fetchTaskData = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all task data in parallel
      const [statsData, overdueData, upcomingData] = await Promise.all([
        tasksAPI.getClientTaskStats(clientId),
        tasksAPI.getClientOverdueTasks(clientId),
        tasksAPI.getClientUpcomingTasks(clientId, 7),
      ]);

      setStats(statsData);
      setOverdueTasks(overdueData);
      setUpcomingTasks(upcomingData);
    } catch (err) {
      console.error('Failed to fetch task data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch task data'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Fetch data on mount and when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchTaskData();
    }
  }, [clientId, fetchTaskData]);

  // Action handlers
  const createTask = useCallback(
    (clientId: string) => {
      navigate(`/tasks/new?clientId=${clientId}`);
    },
    [navigate]
  );

  const viewTasks = useCallback(
    (clientId: string) => {
      navigate(`/tasks?clientId=${clientId}`);
    },
    [navigate]
  );

  const createStatutoryTasks = useCallback(
    async (clientId: string, type: string) => {
      try {
        await tasksAPI.createStatutoryTasks([clientId], type as any);
        // Refresh task data
        if (clientId === clientId) {
          await fetchTaskData();
        }
      } catch (err) {
        console.error('Failed to create statutory tasks:', err);
        throw err;
      }
    },
    [fetchTaskData]
  );

  return {
    stats,
    overdueTasks,
    upcomingTasks,
    loading,
    error,
    actions: {
      createTask,
      viewTasks,
      createStatutoryTasks,
    },
  };
}

/**
 * Helper hook to check if Tasks module is available
 */
export function useTasksModuleAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Check both lowercase and capitalized versions
    setAvailable(isModuleAvailable('tasks') || isModuleAvailable('Tasks'));
  }, []);

  return available;
}