import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Building2, FileText, Tags, Repeat, AlertCircle, UserCheck } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { TaskClientSelector } from './TaskClientSelector';
import { UserSelector } from './UserSelector';
import { useAuthStore } from '@/stores/auth';
import { sanitizeTaskData, getDisplayValue } from '../utils/taskDataSanitizer';
import type { TaskFormData, TaskType, TaskPriority, TaskStatus, RecurrencePattern } from '../types';
import { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES, RECURRENCE_PATTERNS, STATUTORY_TYPES } from '../types';

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit?: (data: TaskFormData) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  taskId?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  mode = 'create',
  taskId,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createTask, updateTask, loading } = useTasks();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    task_type: 'one-time',
    priority: 'medium',
    status: 'todo',
    due_date: undefined,
    start_date: undefined,
    client_id: searchParams.get('clientId') || undefined,
    client_name: '',
    assigned_to: undefined,
    time_estimate: undefined,
    sla_deadline: undefined,
    is_statutory: false,
    statutory_type: undefined,
    tags: [],
    recurrence_pattern: undefined,
    recurrence_config: undefined,
    board_column: 'todo',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.due_date && formData.start_date) {
      const dueDate = new Date(formData.due_date);
      const startDate = new Date(formData.start_date);
      if (dueDate < startDate) {
        newErrors.due_date = 'Due date cannot be before start date';
      }
    }

    if (formData.time_estimate && formData.time_estimate < 0) {
      newErrors.time_estimate = 'Time estimate must be positive';
    }

    if (formData.is_statutory && !formData.statutory_type) {
      newErrors.statutory_type = 'Statutory type is required for statutory tasks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const taskData = sanitizeTaskData({
        ...formData,
        time_estimate: formData.time_estimate ? Math.round(formData.time_estimate * 60) : undefined, // Convert hours to minutes
      });

      if (onSubmit) {
        onSubmit(taskData);
      } else if (mode === 'create') {
        await createTask(taskData);
        navigate('/tasks');
      } else if (mode === 'edit' && taskId) {
        await updateTask(taskId, taskData);
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      // Show error to user
      if (error instanceof Error) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/tasks');
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    // Handle empty strings for UUID and timestamp fields
    let processedValue = value;
    
    // UUID fields should be undefined instead of empty strings
    if (['client_id', 'assigned_to'].includes(field) && value === '') {
      processedValue = undefined;
    }
    
    // Timestamp fields should be undefined instead of empty strings
    if (['due_date', 'start_date', 'sla_deadline'].includes(field) && value === '') {
      processedValue = undefined;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Check if user has a company
  if (!user?.company_id) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unable to Create Task
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Company Assignment Required</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be assigned to a company before you can create tasks. Please contact your administrator to assign you to a company.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/tasks')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Back to Tasks
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error Display */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error creating task
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {errors.general}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.title
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="Enter task title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter task description"
              />
            </div>
          </div>

          {/* Task Properties */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Type
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => handleInputChange('task_type', e.target.value as TaskType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {Object.values(TASK_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {type.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {Object.values(TASK_PRIORITIES).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {Object.values(TASK_STATUSES).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={getDisplayValue(formData.start_date)}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due Date
              </label>
              <input
                type="date"
                value={getDisplayValue(formData.due_date)}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.due_date
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Time Estimate (hours)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.time_estimate ? Math.round((formData.time_estimate / 60) * 10) / 10 : ''}
                onChange={(e) => handleInputChange('time_estimate', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.time_estimate
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="0.0"
              />
              {errors.time_estimate && <p className="mt-1 text-sm text-red-600">{errors.time_estimate}</p>}
            </div>
          </div>

          {/* Client Assignment */}
          <TaskClientSelector
            value={formData.client_id}
            onChange={(clientId, clientName) => {
              handleInputChange('client_id', clientId);
              if (clientName) {
                handleInputChange('client_name', clientName);
              }
            }}
            className="md:col-span-2"
          />

          {/* User Assignment */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserCheck className="inline h-4 w-4 mr-1" />
              Assign to User
            </label>
            <UserSelector
              value={formData.assigned_to}
              onChange={(userId) => handleInputChange('assigned_to', userId)}
              placeholder="Select user to assign task..."
              className="w-full"
            />
          </div>

          {/* Statutory Task */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_statutory"
                checked={formData.is_statutory}
                onChange={(e) => handleInputChange('is_statutory', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="is_statutory" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                This is a statutory task
              </label>
            </div>

            {formData.is_statutory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statutory Type *
                </label>
                <select
                  value={formData.statutory_type || ''}
                  onChange={(e) => handleInputChange('statutory_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.statutory_type
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                >
                  <option value="">Select statutory type</option>
                  {Object.values(STATUTORY_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.statutory_type && <p className="mt-1 text-sm text-red-600">{errors.statutory_type}</p>}
              </div>
            )}
          </div>

          {/* Recurring Task */}
          {formData.task_type === 'recurring' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Repeat className="inline h-4 w-4 mr-1" />
                Recurrence Pattern
              </label>
              <select
                value={formData.recurrence_pattern || ''}
                onChange={(e) => handleInputChange('recurrence_pattern', e.target.value as RecurrencePattern)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select recurrence pattern</option>
                {Object.values(RECURRENCE_PATTERNS).map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {pattern}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};