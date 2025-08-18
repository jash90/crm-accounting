import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanTaskCard } from './KanbanTaskCard';
import type { Task } from '../types';

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
  };
  tasks: Task[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks }) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id,
      accepts: ['task'], // Explicitly accept task types
    },
  });

  const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

  // Enhanced drop zone detection
  const isDraggedTaskFromDifferentColumn = useMemo(() => {
    if (!active || !isOver) return false;
    
    const draggedTaskId = active.id;
    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    
    // Check if the dragged task is from a different column
    return draggedTask ? draggedTask.board_column !== column.id : true;
  }, [active, isOver, tasks, column.id]);

  const getPriorityCount = (priority: string) => {
    return tasks.filter(task => task.priority === priority).length;
  };

  const getOverdueCount = () => {
    const now = new Date();
    return tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    ).length;
  };

  const overdueCount = getOverdueCount();
  const urgentCount = getPriorityCount('urgent');
  const highCount = getPriorityCount('high');

  return (
    <div className="flex-shrink-0 w-80">
      <div
        ref={setNodeRef}
        className={`rounded-lg p-4 h-full transition-all duration-200 ${
          isOver && isDraggedTaskFromDifferentColumn 
            ? 'ring-2 ring-blue-500 ring-opacity-75 bg-blue-50 dark:bg-blue-900/30 scale-[1.02] shadow-lg' 
            : isOver 
            ? 'ring-1 ring-gray-300 bg-gray-50 dark:bg-gray-800/50'
            : ''
        } ${column.color} min-h-[600px]`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            {column.title}
            {column.id === 'in-progress' && (
              <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="bg-white bg-opacity-70 rounded-full px-2 py-1 text-xs font-medium text-gray-700">
              {tasks.length}
            </span>
            {overdueCount > 0 && (
              <span className="bg-red-100 text-red-800 rounded-full px-2 py-1 text-xs font-medium">
                {overdueCount} overdue
              </span>
            )}
            {urgentCount > 0 && (
              <span className="bg-red-50 text-red-700 rounded-full px-2 py-1 text-xs font-medium">
                {urgentCount} urgent
              </span>
            )}
          </div>
        </div>

        {/* Priority Indicators */}
        {(urgentCount > 0 || highCount > 0 || overdueCount > 0) && (
          <div className="mb-3 text-xs text-gray-600">
            {overdueCount > 0 && (
              <div className="text-red-600 font-medium">⚠️ {overdueCount} overdue</div>
            )}
            {urgentCount > 0 && (
              <div className="text-red-600">🔥 {urgentCount} urgent</div>
            )}
            {highCount > 0 && (
              <div className="text-orange-600">⚡ {highCount} high priority</div>
            )}
          </div>
        )}

        {/* Tasks */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className={`space-y-3 min-h-[200px] transition-all duration-200 ${
            isOver && isDraggedTaskFromDifferentColumn 
              ? 'bg-blue-50/70 dark:bg-blue-900/20 rounded-lg p-2 border-2 border-dashed border-blue-300 dark:border-blue-600' 
              : isOver 
              ? 'bg-gray-50/50 dark:bg-gray-800/20 rounded-lg p-2'
              : ''
          }`}>
            {tasks.length === 0 ? (
              <div className={`text-center py-8 text-gray-500 transition-all duration-200 ${
                isOver && isDraggedTaskFromDifferentColumn 
                  ? 'text-blue-600 dark:text-blue-400 scale-105' 
                  : isOver 
                  ? 'text-gray-600 dark:text-gray-300'
                  : ''
              }`}>
                <div className="text-4xl mb-2">
                  {isOver && isDraggedTaskFromDifferentColumn ? '📥' : '📋'}
                </div>
                <p className="text-sm font-medium">
                  {isOver && isDraggedTaskFromDifferentColumn 
                    ? 'Drop task here' 
                    : 'No tasks'
                  }
                </p>
                <p className="text-xs text-gray-400">
                  {column.id === 'backlog' && 'Plan your upcoming tasks here'}
                  {column.id === 'todo' && 'Drag tasks here to start working'}
                  {column.id === 'in-progress' && 'Move tasks here when you start work'}
                  {column.id === 'review' && 'Tasks ready for review will appear here'}
                  {column.id === 'completed' && 'Completed tasks will appear here'}
                  {column.id === 'cancelled' && 'Cancelled tasks will appear here'}
                </p>
              </div>
            ) : (
              <>
                {tasks.map(task => (
                  <KanbanTaskCard key={task.id} task={task} />
                ))}
                {/* Drop zone indicator when dragging over non-empty column */}
                {isOver && isDraggedTaskFromDifferentColumn && (
                  <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/20 text-center">
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Drop here to move to {column.title}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </SortableContext>

        {/* Quick Add Button for Todo Column */}
        {column.id === 'todo' && (
          <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
            <button
              onClick={() => {
                // This could open a quick task creation modal
                window.location.href = '/tasks/new';
              }}
              className="w-full bg-white bg-opacity-50 hover:bg-opacity-70 border-2 border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center justify-center"
            >
              <span className="text-lg mr-2">+</span>
              Add new task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
