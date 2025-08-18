import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, User, AlertTriangle, CheckCircle2, Flag, GripVertical, UserPlus } from 'lucide-react';
import type { Task } from '../types';
import { formatDate } from '@/lib/utils';
import { useTasks } from '../hooks/useTasks';
import { UserSelector } from './UserSelector';

interface KanbanTaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ 
  task, 
  isDragging = false 
}) => {
  const { assignTask } = useTasks();
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
  const assignmentRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task: task,
      sortable: {
        containerId: task.board_column,
        items: [task.id],
        index: 0,
      },
    },
  });

  // Only log once when dragging starts
  if (isSortableDragging) {
    console.log(`🃏 Task card ${task.id} is being dragged`);
  }

  // Close assignment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assignmentRef.current && !assignmentRef.current.contains(event.target as Node)) {
        setShowAssignmentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAssignmentChange = async (userId: string | null) => {
    try {
      console.log('🔄 Assignment change:', { taskId: task.id, userId, currentAssignee: task.assigned_to });
      await assignTask(task.id, userId);
    } catch (error) {
      console.error('❌ Assignment failed:', error);
    }
    setShowAssignmentDropdown(false);
  };

  const handleAssignmentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowAssignmentDropdown(!showAssignmentDropdown);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'completed' && 
    task.status !== 'cancelled';

  const isDueToday = task.due_date && 
    new Date(task.due_date).toDateString() === new Date().toDateString();

  const isDueSoon = task.due_date && 
    !isDueToday && 
    new Date(task.due_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Flag className="h-3 w-3 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-orange-600" />;
      default:
        return null;
    }
  };

  const cardClasses = `
    bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer
    hover:shadow-md transition-all duration-200 group
    ${isDragging || isSortableDragging ? 'opacity-50' : ''}
    ${isOverdue ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' : ''}
    ${isDueToday ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20' : ''}
    ${task.is_statutory ? 'border-l-4 border-l-purple-500' : ''}
  `;

  const handleNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && !isSortableDragging) {
      console.log('🖱️ Task card clicked, navigating to detail');
      window.location.href = `/tasks/${task.id}`;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cardClasses}
    >
      {/* Header with priority, statutory indicator, and drag handle */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="h-4 w-4" />
          </div>
          {getPriorityIcon(task.priority)}
          {task.is_statutory && (
            <div className="flex items-center text-purple-600">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-xs ml-1 font-medium">Statutory</span>
            </div>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 
        className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 cursor-pointer"
        onClick={handleNavigation}
      >
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Client */}
      {task.client_name && (
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <User className="h-3 w-3 mr-1" />
          <span className="truncate">{task.client_name}</span>
        </div>
      )}

      {/* Due date */}
      {task.due_date && (
        <div className={`flex items-center text-xs mb-2 ${
          isOverdue ? 'text-red-600 font-medium' : 
          isDueToday ? 'text-yellow-600 font-medium' :
          isDueSoon ? 'text-orange-600' : 'text-gray-500'
        }`}>
          <Calendar className="h-3 w-3 mr-1" />
          <span>
            {isOverdue && '⚠️ '}
            {isDueToday ? 'Due today' : formatDate(task.due_date)}
          </span>
        </div>
      )}

      {/* Time estimate */}
      {task.time_estimate && (
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Clock className="h-3 w-3 mr-1" />
          <span>{Math.floor(task.time_estimate / 60)}h {task.time_estimate % 60}m</span>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Assignee Section */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center flex-1">
          {task.assigned_to_email ? (
            <div className="flex items-center">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {task.assigned_to_email.charAt(0).toUpperCase()}
              </div>
              <span className="ml-2 truncate max-w-24">
                {task.assigned_to_email.split('@')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <button
                onClick={handleAssignmentClick}
                className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                <span className="text-xs">Assign</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Quick status indicators */}
        <div className="flex items-center space-x-1">
          {task.checklist_count && task.checklist_count > 0 && (
            <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
              ✓ {task.checklist_count}
            </span>
          )}
          {task.comments_count && task.comments_count > 0 && (
            <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
              💬 {task.comments_count}
            </span>
          )}
          {/* Assignment dropdown for assigned tasks */}
          {task.assigned_to_email && (
            <div className="relative" ref={assignmentRef}>
              <button
                onClick={handleAssignmentClick}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Change assignment"
              >
                <User className="w-3 h-3" />
              </button>
              {showAssignmentDropdown && (
                <div className="absolute bottom-full right-0 mb-1 w-48 z-50">
                  <UserSelector
                    value={task.assigned_to}
                    onChange={handleAssignmentChange}
                    placeholder="Assign to..."
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignment dropdown for unassigned tasks */}
      {!task.assigned_to_email && showAssignmentDropdown && (
        <div className="mt-2" ref={assignmentRef}>
          <UserSelector
            value={null}
            onChange={handleAssignmentChange}
            placeholder="Assign to user..."
            className="w-full"
          />
        </div>
      )}

      {/* Statutory type */}
      {task.statutory_type && (
        <div className="mt-2 pt-2 border-t border-purple-100">
          <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
            {task.statutory_type}
          </span>
        </div>
      )}
    </div>
  );
};
