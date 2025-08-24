import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, User, GripVertical } from 'lucide-react';
import type { Task } from '../types';
import { formatDate } from '@/lib/utils';

interface KanbanTaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
  task,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'completed';

  const isDueToday =
    task.due_date &&
    new Date(task.due_date).toDateString() === new Date().toDateString();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    // Removed emoji icons - returning null for all priorities
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      {...attributes}
      {...listeners}
      className={`
        task-card
        bg-white rounded-lg p-3 shadow-sm border border-gray-200
        hover:shadow-md transition-all cursor-grab active:cursor-grabbing
        ${isDragging || isSortableDragging ? 'opacity-50 rotate-2 scale-105 cursor-grabbing' : ''}
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
        ${isDueToday ? 'border-l-4 border-l-yellow-500' : ''}
      `}
      onClick={(e) => {
        // Don't navigate if dragging
        if (!isDragging && !isSortableDragging && !e.defaultPrevented) {
          window.location.href = `/tasks/${task.id}`;
        }
      }}
    >
      {/* Drag Handle and Priority */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-gray-400">
            <GripVertical className="h-4 w-4" />
          </div>
          {getPriorityIcon(task.priority) && (
            <span className="text-sm">{getPriorityIcon(task.priority)}</span>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta Information */}
      <div className="space-y-1">
        {/* Client */}
        {task.client_name && (
          <div className="flex items-center text-xs text-gray-500">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate">{task.client_name}</span>
          </div>
        )}

        {/* Due Date */}
        {task.due_date && (
          <div
            className={`flex items-center text-xs ${
              isOverdue
                ? 'text-red-600 font-medium'
                : isDueToday
                  ? 'text-yellow-600 font-medium'
                  : 'text-gray-500'
            }`}
          >
            <Calendar className="h-3 w-3 mr-1" />
            <span>{isDueToday ? 'Due today' : formatDate(task.due_date)}</span>
          </div>
        )}

        {/* Time Estimate */}
        {task.time_estimate && task.time_estimate > 0 && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {Math.floor(task.time_estimate / 60)}h {task.time_estimate % 60}m
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {/* Assignee */}
        <div className="flex items-center text-xs text-gray-500">
          {task.assigned_to_email ? (
            <>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-1">
                {task.assigned_to_email.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[100px]">
                {task.assigned_to_email.split('@')[0]}
              </span>
            </>
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2">
          {task.checklist_count && task.checklist_count > 0 && (
            <span className="text-xs text-gray-500">
              {task.checklist_count} items
            </span>
          )}
          {task.comments_count && task.comments_count > 0 && (
            <span className="text-xs text-gray-500">
              {task.comments_count} comments
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
