import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanTaskCard } from './KanbanTaskCard';
import type { Task } from '../types';

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
    limit: number | null;
  };
  tasks: Task[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((task) => task.id);
  const isAtLimit = column.limit !== null && tasks.length >= column.limit;
  const isOverLimit = column.limit !== null && tasks.length > column.limit;

  return (
    <div className="flex-shrink-0 w-80">
      <div
        ref={setNodeRef}
        data-column-id={column.id}
        className={`
          ${column.color} 
          rounded-lg p-4 min-h-[600px] 
          transition-all duration-200
          ${isOver ? 'ring-2 ring-blue-400 bg-opacity-70' : ''}
          ${isOverLimit ? 'ring-2 ring-red-400' : ''}
        `}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{column.title}</h3>
          <div className="flex items-center gap-2">
            {column.limit !== null && (
              <span
                className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${
                    isOverLimit
                      ? 'bg-red-100 text-red-800'
                      : isAtLimit
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }
                `}
              >
                {tasks.length}/{column.limit}
              </span>
            )}
            {column.limit === null && (
              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                {tasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Tasks Container */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm font-medium">
                  {isOver ? 'Drop task here' : 'No tasks'}
                </p>
              </div>
            ) : (
              tasks.map((task) => <KanbanTaskCard key={task.id} task={task} />)
            )}
          </div>
        </SortableContext>

        {/* Quick Add Button */}
        {column.id === 'todo' && (
          <button
            onClick={() => (window.location.href = '/tasks/new')}
            className="
              mt-4 w-full p-3 
              border-2 border-dashed border-gray-300 
              rounded-lg text-gray-500 
              hover:border-gray-400 hover:text-gray-600 
              transition-colors
            "
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  );
};
