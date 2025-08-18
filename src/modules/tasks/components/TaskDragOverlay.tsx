import React from 'react';
import { KanbanTaskCard } from './KanbanTaskCard';
import type { Task } from '../types';

interface TaskDragOverlayProps {
  task: Task;
}

export const TaskDragOverlay: React.FC<TaskDragOverlayProps> = ({ task }) => {
  return (
    <div className="opacity-95 transform rotate-2 scale-110 shadow-2xl ring-2 ring-blue-500 ring-opacity-50 rounded-lg">
      <KanbanTaskCard task={task} isDragging />
    </div>
  );
};
