import React, { memo, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle,
  Circle,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onAssign?: (taskId: string, userId: string) => void;
  showActions?: boolean;
  className?: string;
}

/**
 * Optimized task card component with memoization for performance
 */

export const TaskCard: React.FC<TaskCardProps> = memo(({
  task,
  onClick,
  onStatusChange,
  onAssign,
  showActions = true,
  className = '',
}) => {
  // Memoized date calculations for performance
  const dateInfo = useMemo(() => {
    if (!task.due_date) return { isOverdue: false, isDueToday: false };
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    const isOverdue = dueDate < today && task.status !== 'completed' && task.status !== 'cancelled';
    const isDueToday = dueDateOnly.getTime() === today.getTime();
    
    return { isOverdue, isDueToday, dueDate };
  }, [task.due_date, task.status]);

  const { isOverdue, isDueToday, dueDate } = dateInfo;

  // Memoized color and formatting functions
  const priorityColor = useMemo(() => 
    PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || 'text-gray-600 bg-gray-100',
    [task.priority]
  );

  const statusColor = useMemo(() => 
    STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || 'text-gray-600 bg-gray-100',
    [task.status]
  );

  const formattedDueDate = useMemo(() => {
    if (!dueDate) return '';
    if (isDueToday) return 'Today';
    return format(dueDate, 'MMM dd');
  }, [dueDate, isDueToday]);

  // Memoized time formatting
  const timeInfo = useMemo(() => {
    const estimate = task.time_estimate ? Math.round(task.time_estimate / 60) : null;
    const spent = task.time_spent > 0 ? Math.round(task.time_spent / 60) : null;
    return { estimate, spent };
  }, [task.time_estimate, task.time_spent]);

  const handleCardClick = useMemo(
    () => () => onClick?.(task),
    [onClick, task]
  );

  const handleStatusChange = useMemo(
    () => (newStatus: TaskStatus) => onStatusChange?.(task.id, newStatus),
    [onStatusChange, task.id]
  );

  const handleAssign = useMemo(
    () => (userId: string) => onAssign?.(task.id, userId),
    [onAssign, task.id]
  );

  // Memoized CSS classes for performance
  const cardClasses = useMemo(() => {
    const baseClasses = `bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
      p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`;
    const statusClasses = isOverdue 
      ? 'border-red-300 dark:border-red-600'
      : isDueToday 
      ? 'border-yellow-300 dark:border-yellow-600'
      : '';
    return `${baseClasses} ${statusClasses} ${className}`.trim();
  }, [isOverdue, isDueToday, className]);

  return (
    <article
      className={cardClasses}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Task: ${task.title}, Status: ${task.status}, Priority: ${task.priority}${task.due_date ? `, Due: ${formattedDueDate}` : ''}`}
    >
      {/* Header */}
      <header className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {showActions && (
          <button 
            className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement actions menu
            }}
            aria-label="Task actions"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </button>
        )}
      </header>

      {/* Tags and Priority */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}
          aria-label={`Priority: ${task.priority}`}
        >
          {task.priority}
        </span>

        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          aria-label={`Status: ${task.status}`}
        >
          {task.status.replace('-', ' ')}
        </span>

        {task.is_statutory && task.statutory_type && (
          <span 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400"
            aria-label={`Statutory: ${task.statutory_type}`}
          >
            {task.statutory_type}
          </span>
        )}

        {task.tags && task.tags.length > 0 && (
          <span 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400"
            aria-label={`Tags: ${task.tags.join(', ')}`}
          >
            {task.tags[0]}
            {task.tags.length > 1 && ` +${task.tags.length - 1}`}
          </span>
        )}
      </div>

      {/* Client Info */}
      {task.client_id && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
          <Building2 className="h-3 w-3" />
          <span className="truncate">
            {task.client?.company_name || task.client_name || 'Unknown Client'}
          </span>
        </div>
      )}

      {/* Due Date */}
      {task.due_date && (
        <div
          className={`flex items-center gap-2 mb-3 text-xs ${
            isOverdue
              ? 'text-red-600 dark:text-red-400'
              : isDueToday
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Calendar className="h-3 w-3" aria-hidden="true" />
          <span className="font-medium">
            {isOverdue ? 'Overdue' : isDueToday ? 'Due today' : 'Due'}{' '}
            {formattedDueDate}
          </span>
          {isOverdue && <AlertCircle className="h-3 w-3" aria-label="Overdue task" />}
        </div>
      )}

      {/* Assignment and Time */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          {task.assigned_to ? (
            <>
              <User className="h-3 w-3" aria-hidden="true" />
              <span 
                className="truncate"
                aria-label={`Assigned to: ${task.assigned_to_email || 'Unknown user'}${task.assigned_to_role ? `, Role: ${task.assigned_to_role}` : ''}`}
              >
                {task.assigned_to_email || 'Assigned'}
                {task.assigned_to_role && ` (${task.assigned_to_role})`}
              </span>
            </>
          ) : (
            <span className="text-gray-400" aria-label="Task unassigned">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {timeInfo.estimate && (
            <>
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span aria-label={`Estimated time: ${timeInfo.estimate} hours`}>
                {timeInfo.estimate}h
              </span>
            </>
          )}

          {timeInfo.spent && (
            <span 
              className="text-green-600 dark:text-green-400"
              aria-label={`Time spent: ${timeInfo.spent} hours`}
            >
              {timeInfo.spent}h spent
            </span>
          )}
        </div>
      </div>

      {/* Created By Info */}
      {task.created_by && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <User className="h-3 w-3" />
          <span>
            Created by: {task.created_by_email || 'Unknown User'}
            {task.created_by_role && ` (${task.created_by_role})`}
          </span>
        </div>
      )}

      {/* Checklist Progress */}
      {task.checklist_count && task.checklist_count > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <CheckCircle className="h-3 w-3" />
            <span>Checklist items</span>
            <span className="ml-auto">{task.checklist_count}</span>
          </div>
        </div>
      )}

      {/* Recurring Task Indicator */}
      {task.task_type === 'recurring' && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <Circle className="h-3 w-3" />
          <span>Recurring</span>
          {task.recurrence_pattern && (
            <span className="text-gray-500">({task.recurrence_pattern})</span>
          )}
        </div>
      )}
    </article>
  );
});

TaskCard.displayName = 'TaskCard';
