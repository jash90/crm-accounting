import React from 'react';
import { KanbanTaskCard } from './KanbanTaskCard';
import type { Task } from '../types';

interface TaskDragOverlayProps {
  task: Task;
}

export const TaskDragOverlay: React.FC<TaskDragOverlayProps> = ({ task }) => {
  return (
    <div className="opacity-90 transform rotate-3 scale-105 shadow-2xl">
      <KanbanTaskCard task={task} isDragging />
    </div>
  );
};