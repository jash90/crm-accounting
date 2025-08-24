import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { UserSelector } from '../components/UserSelector';
import type { TaskWithDetails } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../types';

export const TaskDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getTaskById, deleteTask, updateTaskStatus, assignTask } = useTasks();
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAssignmentSelector, setShowAssignmentSelector] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      if (!id) {
        setError('Task ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const taskData = await getTaskById(id);
        
        if (!taskData) {
          setError('Task not found');
        } else {
          setTask(taskData);
        }
      } catch (err) {
        console.error('Error loading task:', err);
        setError(err instanceof Error ? err.message : 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id, getTaskById]);

  const handleAssignmentChange = async (userId: string | null) => {
    if (!task) return;
    
    try {
      await assignTask(task.id, userId);
      // Reload task to get updated data
      const updatedTask = await getTaskById(task.id);
      if (updatedTask) {
        setTask(updatedTask);
      }
      setShowAssignmentSelector(false);
    } catch (err) {
      console.error('Error updating task assignment:', err);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteTask(task.id);
      navigate('/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      await updateTaskStatus(task.id, newStatus as any);
      // Reload task to get updated data
      const updatedTask = await getTaskById(task.id);
      if (updatedTask) {
        setTask(updatedTask);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading task...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/tasks')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Go back to tasks"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Task Details
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
                Error loading task
              </div>
              <div className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Task not found'}
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Back to Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'completed' && 
    task.status !== 'cancelled';

  const isDueToday = task.due_date && 
    new Date(task.due_date).toDateString() === new Date().toDateString();

  const priorityColor = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || 'text-gray-600 bg-gray-100';
  const statusColor = STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || 'text-gray-600 bg-gray-100';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tasks')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Go back to tasks"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Task Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage task information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/tasks/${task.id}/edit`)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {task.title}
                  </h2>
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Status and Priority Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
                  {task.priority}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                  {task.status.replace('-', ' ')}
                </span>
                {task.is_statutory && task.statutory_type && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400">
                    {task.statutory_type}
                  </span>
                )}
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Due Date</div>
                      <div className={`font-medium ${
                        isOverdue ? 'text-red-600 dark:text-red-400' :
                        isDueToday ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-gray-900 dark:text-white'
                      }`}>
                        {format(new Date(task.due_date), 'PPP')}
                        {isOverdue && <span className="ml-1">(Overdue)</span>}
                        {isDueToday && <span className="ml-1">(Due Today)</span>}
                      </div>
                    </div>
                  </div>
                )}

                {task.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Start Date</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {format(new Date(task.start_date), 'PPP')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment Section */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Assigned To</div>
                    {task.assigned_to ? (
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {task.assigned_to_email || 'Unknown User'}
                          {task.assigned_to_role && ` (${task.assigned_to_role})`}
                        </div>
                        <button
                          onClick={() => setShowAssignmentSelector(!showAssignmentSelector)}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAssignmentSelector(!showAssignmentSelector)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Assign to user
                      </button>
                    )}
                    {showAssignmentSelector && (
                      <div className="mt-2">
                        <UserSelector
                          value={task.assigned_to}
                          onChange={handleAssignmentChange}
                          placeholder="Select user to assign..."
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {task.client_id && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Client</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(task as any).client?.company_name || task.client_name || 'Unknown Client'}
                      </div>
                    </div>
                  </div>
                )}

                {task.time_estimate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Time</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {Math.round(task.time_estimate / 60)} hours
                      </div>
                    </div>
                  </div>
                )}

                {task.time_spent > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Time Spent</div>
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {Math.round(task.time_spent / 60)} hours
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Checklist Items */}
            {task.checklist_items && task.checklist_items.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Checklist ({task.checklist_items.filter(item => item.is_completed).length}/{task.checklist_items.length})
                </h3>
                <div className="space-y-3">
                  {task.checklist_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.is_completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded" />
                      )}
                      <span className={`flex-1 ${
                        item.is_completed 
                          ? 'text-gray-500 dark:text-gray-400 line-through' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {item.title}
                      </span>
                      {item.completed_at && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(item.completed_at), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {task.comments && task.comments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Comments ({task.comments.length})
                </h3>
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.user_name || comment.user_email || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Task Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Task Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(task.created_at), 'PPP')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(task.updated_at), 'PPP')}
                  </div>
                </div>
                {task.created_by_email && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created by:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {task.created_by_email}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Task Type:</span>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {task.task_type.replace('-', ' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};