import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, List, Grid3X3, Columns3 } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { KanbanBoard } from '../components/KanbanBoard';
import { UserSelector } from '../components/UserSelector';
import { useAuthStore } from '@/stores/auth';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import type { Task, TaskFilters } from '../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../types';

export const TasksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { users } = useCompanyUsers();
  const { tasks, loading, error, fetchTasks, updateTaskStatus, deleteTask } =
    useTasks();
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'list'>(
    'kanban'
  );
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Get client filter from URL if present
  const clientId = searchParams.get('clientId');

  useEffect(() => {
    if (clientId) {
      setFilters((prev) => ({ ...prev, client_id: clientId }));
    }
  }, [clientId]);

  useEffect(() => {
    fetchTasks(filters);
  }, [filters, fetchTasks]);

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    // Navigate to task detail page
    navigate(`/tasks/${task.id}`);
  };

  const handleCreateTask = () => {
    const url = clientId ? `/tasks/new?clientId=${clientId}` : '/tasks/new';
    navigate(url);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filters.status?.length && !filters.status.includes(task.status))
      return false;
    if (filters.priority?.length && !filters.priority.includes(task.priority))
      return false;
    if (filters.assigned_to?.length) {
      const isUnassignedFilter = filters.assigned_to.includes('unassigned');
      const hasUserFilters = filters.assigned_to.filter(
        (f) => f !== 'unassigned'
      );

      const matchesUnassigned = isUnassignedFilter && !task.assigned_to;
      const matchesUser =
        hasUserFilters.length > 0 &&
        task.assigned_to &&
        hasUserFilters.includes(task.assigned_to);

      if (!matchesUnassigned && !matchesUser) {
        return false;
      }
    }
    if (filters.client_id && task.client_id !== filters.client_id) return false;
    if (
      filters.is_statutory !== undefined &&
      task.is_statutory !== filters.is_statutory
    )
      return false;
    return true;
  });

  const getTaskStats = () => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(
      (t) => t.status === 'completed'
    ).length;
    const pending = total - completed;
    const overdue = filteredTasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.due_date &&
        new Date(t.due_date) < new Date()
    ).length;
    const dueToday = filteredTasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.due_date &&
        new Date(t.due_date).toDateString() === new Date().toDateString()
    ).length;

    return { total, completed, pending, overdue, dueToday };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-200 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
              Error loading tasks
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-4">{error}</div>
            <button
              onClick={() => fetchTasks()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tasks
            </h1>
            {clientId && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Filtered by client
              </p>
            )}
          </div>

          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-md border ${
                showFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>

            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 ${
                  viewMode === 'kanban'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Kanban Board"
              >
                <Columns3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {user?.company_id && (
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Pending
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Completed
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Overdue
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.dueToday}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Due Today
            </div>
          </div>
        </div>

        {/* Search and Filters - Hide in Kanban view for cleaner experience */}
        {viewMode !== 'kanban' && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filters.status?.join(',') || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'status',
                        e.target.value ? e.target.value.split(',') : undefined
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    {Object.values(TASK_STATUSES).map((status) => (
                      <option key={status} value={status}>
                        {status.replace('-', ' ')}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.priority?.join(',') || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'priority',
                        e.target.value ? e.target.value.split(',') : undefined
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Priorities</option>
                    {Object.values(TASK_PRIORITIES).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.is_statutory?.toString() || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'is_statutory',
                        e.target.value === 'true'
                          ? true
                          : e.target.value === 'false'
                            ? false
                            : undefined
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Tasks</option>
                    <option value="true">Statutory Only</option>
                    <option value="false">Non-Statutory Only</option>
                  </select>

                  {/* Assignment Filter */}
                  <select
                    value={filters.assigned_to?.join(',') || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'assigned_to',
                        e.target.value ? e.target.value.split(',') : undefined
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Assignments</option>
                    <option value="unassigned">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name || user.last_name
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : user.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Views */}
        {viewMode === 'kanban' ? (
          <div className="h-[calc(100vh-400px)]">
            <KanbanBoard tasks={filteredTasks} loading={loading} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              {filters.search || Object.keys(filters).length > 0
                ? 'No tasks match your filters'
                : 'No tasks yet'}
            </div>
            {!filters.search &&
              Object.keys(filters).length === 0 &&
              user?.company_id && (
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Create your first task
                </button>
              )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
                onStatusChange={handleStatusChange}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
