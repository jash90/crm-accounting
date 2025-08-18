import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskDragOverlay } from './TaskDragOverlay';
import { useTasks } from '../hooks/useTasks';
import type { Task, BoardColumn } from '../types';
import { DEFAULT_BOARD_COLUMNS } from '../types';
import { toast } from 'react-toastify';
import { logDragDropDiagnostics, validateDragDrop } from '../utils/dragDropDiagnostics';
import { debugTaskState } from '../utils/taskStateVerification';

interface KanbanBoardProps {
  tasks: Task[];
  loading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  loading = false,
}) => {
  const { updateTaskStatus } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  console.log('🎛️ Kanban sensors configured:', sensors.length);

  // Group tasks by board column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    DEFAULT_BOARD_COLUMNS.forEach(column => {
      grouped[column.id] = [];
    });

    tasks.forEach(task => {
      const column = task.board_column || 'todo';
      if (!grouped[column]) {
        grouped[column] = [];
      }
      grouped[column].push(task);
    });

    // Sort tasks within each column by board_order, then by due_date
    Object.keys(grouped).forEach(columnId => {
      grouped[columnId].sort((a, b) => {
        // First sort by board_order
        if (a.board_order !== b.board_order) {
          return a.board_order - b.board_order;
        }
        // Then by due_date (overdue first)
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        // Finally by created_at (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    return grouped;
  }, [tasks]);

  // Debug task distribution (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 KanbanBoard: Tasks prop updated', {
        taskCount: tasks.length,
        taskIds: tasks.map(t => t.id),
        statusDistribution: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        columnDistribution: tasks.reduce((acc, task) => {
          const column = task.board_column || 'undefined';
          acc[column] = (acc[column] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      if (tasks.length > 0) {
        logDragDropDiagnostics(tasks);
      }
    }
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('🚀 Drag Start:', { activeId: active.id, activeData: active.data?.current });
    const task = tasks.find(t => t.id === active.id);
    console.log('📋 Dragging task:', task ? { id: task.id, title: task.title, column: task.board_column } : 'not found');
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This handles dragging over columns
    // The actual logic is handled in handleDragEnd
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    console.log('🎯 Drag End Event:', { 
      activeId: active.id, 
      overId: over?.id,
      overData: over?.data?.current 
    });

    if (!over) {
      console.log('❌ No drop target found');
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('❌ Task not found:', taskId);
      return;
    }

    console.log('📋 Current task state:', {
      id: task.id,
      title: task.title,
      currentColumn: task.board_column,
      currentStatus: task.status
    });

    // Determine the new column
    let newColumn = task.board_column;
    let newStatus = task.status;

    // Check if dropped on a column
    const targetColumn = DEFAULT_BOARD_COLUMNS.find(col => col.id === overId);
    if (targetColumn) {
      console.log('🎯 Dropped on column:', targetColumn.id);
      newColumn = targetColumn.id as BoardColumn;
      // Map column to status
      newStatus = mapColumnToStatus(newColumn);
    } else {
      // Dropped on another task, find which column that task is in
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask) {
        console.log('🎯 Dropped on task:', targetTask.id, 'in column:', targetTask.board_column);
        newColumn = targetTask.board_column;
        newStatus = mapColumnToStatus(newColumn);
      } else {
        console.log('❌ Could not determine target column - overId not found:', overId);
        return;
      }
    }

    console.log('🔄 Planned update:', {
      from: `${task.board_column}/${task.status}`,
      to: `${newColumn}/${newStatus}`
    });

    // Validate the drag operation
    const validation = validateDragDrop(taskId, task.board_column, newColumn, tasks);
    if (!validation.isValid) {
      console.warn('❌ Invalid drag operation:', validation.errors);
      return;
    }

    // Only update if the column actually changed
    if (newColumn !== task.board_column || newStatus !== task.status) {
      console.log(`🎯 Drag & Drop: Moving task "${task.title}" from ${task.board_column}/${task.status} to ${newColumn}/${newStatus}`);
      console.log('📊 Before update - Task state:', { 
        taskId, 
        currentColumn: task.board_column, 
        currentStatus: task.status,
        targetColumn: newColumn,
        targetStatus: newStatus
      });
      
      try {
        await updateTaskStatus(taskId, newStatus, newColumn);
        console.log('✅ Drag & Drop: Task status updated successfully');
        
        // Note: Verification removed - optimistic updates ensure correct state
        // The task should already be in the correct state due to optimistic updates
        
      } catch (error) {
        console.error('❌ Drag & Drop: Failed to update task status:', error);
        toast.error('Failed to update task status. Please try again.');
      }
    } else {
      console.log('📌 Drag & Drop: No change needed - task already in correct column');
    }
  };

  const mapColumnToStatus = (column: string): string => {
    switch (column) {
      case 'backlog':
        return 'todo';
      case 'todo':
        return 'todo';
      case 'in-progress':
        return 'in-progress';
      case 'review':
        return 'review';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'todo';
    }
  };

  if (loading) {
    return (
      <div className="flex space-x-6 h-full overflow-x-auto pb-6">
        {DEFAULT_BOARD_COLUMNS.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className={`rounded-lg p-4 h-full ${column.color}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <div className="bg-gray-200 rounded-full px-2 py-1 text-xs animate-pulse">
                  <div className="w-4 h-3 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-6 h-full overflow-x-auto pb-6">
        {DEFAULT_BOARD_COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskDragOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};