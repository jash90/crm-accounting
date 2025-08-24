import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TaskForm } from '../components/TaskForm';
import { useTasks } from '../hooks/useTasks';
import type { Task, TaskFormData } from '../types';

export const EditTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getTaskById } = useTasks();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Convert Task to TaskFormData
  const getInitialFormData = (task: Task): TaskFormData => {
    return {
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      start_date: task.start_date ? task.start_date.split('T')[0] : '',
      client_id: task.client_id || '',
      client_name: task.client_name || '',
      assigned_to: task.assigned_to || '',
      time_estimate: task.time_estimate,
      sla_deadline: task.sla_deadline ? task.sla_deadline.split('T')[0] : '',
      is_statutory: task.is_statutory,
      statutory_type: task.statutory_type,
      tags: task.tags || [],
      recurrence_pattern: task.recurrence_pattern,
      recurrence_config: task.recurrence_config,
      board_column: task.board_column,
    };
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
              Edit Task
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Go back to tasks"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Task
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Modify task details and settings
            </p>
          </div>
        </div>

        {/* Task Form */}
        <TaskForm
          mode="edit"
          taskId={task.id}
          initialData={getInitialFormData(task)}
          onCancel={() => navigate('/tasks')}
        />
      </div>
    </div>
  );
};