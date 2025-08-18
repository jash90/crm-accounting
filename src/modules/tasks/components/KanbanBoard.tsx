import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  CollisionDetection,
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
        distance: 3, // Lower threshold for better responsiveness
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    })
  );

  // Custom collision detection that prioritizes columns over tasks
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // First, get all collisions
    const pointerCollisions = pointerWithin(args);
    const rectCollisions = rectIntersection(args);
    
    // Combine and prioritize column collisions
    const allCollisions = [...pointerCollisions, ...rectCollisions];
    
    // Filter for column collisions first
    const columnCollisions = allCollisions.filter(collision => {
      const data = args.droppableContainers.get(collision.id)?.data.current;
      return data?.type === 'column';
    });
    
    // If we have column collisions, return the first one
    if (columnCollisions.length > 0) {
      return [columnCollisions[0]];
    }
    
    // Otherwise, return task collisions
    const taskCollisions = allCollisions.filter(collision => {
      const data = args.droppableContainers.get(collision.id)?.data.current;
      return data?.type === 'task';
    });
    
    return taskCollisions.length > 0 ? [taskCollisions[0]] : [];
  }, []);

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    
    if (task) {
      console.log('🚀 Drag Start:', { 
        taskId: task.id, 
        title: task.title, 
        currentColumn: task.board_column,
        currentStatus: task.status 
      });
      setActiveTask(task);
    } else {
      console.warn('❌ Task not found for drag start:', active.id);
      setActiveTask(null);
    }
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const overData = over.data?.current;
    const activeTask = tasks.find(t => t.id === active.id);
    
    if (!activeTask) return;
    
    // Determine target column
    let targetColumn: string | null = null;
    
    if (overData?.type === 'column') {
      targetColumn = overData.columnId;
    } else if (overData?.type === 'task') {
      const targetTask = tasks.find(t => t.id === over.id);
      targetColumn = targetTask?.board_column || null;
    }
    
    // Log drag over for debugging
    console.log('🎯 Drag Over:', { 
      activeId: active.id, 
      overId: over.id,
      overType: overData?.type,
      currentColumn: activeTask.board_column,
      targetColumn,
      wouldMove: targetColumn && targetColumn !== activeTask.board_column
    });
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      console.log('❌ No drop target found');
      return;
    }

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error('❌ Task not found:', taskId);
      return;
    }

    // Determine target column with improved logic
    let targetColumn: string | null = null;
    const overData = over.data?.current;
    
    if (overData?.type === 'column') {
      // Dropped directly on a column
      targetColumn = overData.columnId;
      console.log('🎯 Dropped on column:', targetColumn);
    } else if (overData?.type === 'task') {
      // Dropped on a task - use that task's column
      const targetTask = tasks.find(t => t.id === over.id);
      if (targetTask) {
        targetColumn = targetTask.board_column;
        console.log('🎯 Dropped on task in column:', targetColumn);
      }
    } else {
      // Fallback: check if overId matches a column directly
      const columnMatch = DEFAULT_BOARD_COLUMNS.find(col => col.id === over.id);
      if (columnMatch) {
        targetColumn = columnMatch.id;
        console.log('🎯 Fallback: Dropped on column:', targetColumn);
      }
    }

    if (!targetColumn) {
      console.error('❌ Could not determine target column', {
        overId: over.id,
        overData,
        availableColumns: DEFAULT_BOARD_COLUMNS.map(c => c.id)
      });
      return;
    }

    // Validate target column
    const isValidColumn = DEFAULT_BOARD_COLUMNS.some(col => col.id === targetColumn);
    if (!isValidColumn) {
      console.error('❌ Invalid target column:', targetColumn);
      return;
    }

    const newStatus = mapColumnToStatus(targetColumn);
    const newColumn = targetColumn as BoardColumn;

    console.log('🔄 Drag operation:', {
      taskId: task.id,
      title: task.title,
      from: `${task.board_column}/${task.status}`,
      to: `${newColumn}/${newStatus}`,
      changed: newColumn !== task.board_column || newStatus !== task.status
    });

    // Only update if something actually changed
    if (newColumn !== task.board_column || newStatus !== task.status) {
      try {
        console.log('💾 Updating task status...');
        await updateTaskStatus(taskId, newStatus, newColumn);
        console.log('✅ Task status updated successfully');
        
        const columnTitle = DEFAULT_BOARD_COLUMNS.find(c => c.id === newColumn)?.title || newColumn;
        toast.success(`Task moved to ${columnTitle}`);
      } catch (error) {
        console.error('❌ Failed to update task status:', error);
        toast.error('Failed to move task. Please try again.');
      }
    } else {
      console.log('📌 No change needed - task already in target column');
    }
  }, [tasks, updateTaskStatus, mapColumnToStatus]);

  const mapColumnToStatus = useCallback((column: string): string => {
    const statusMap: Record<string, string> = {
      'backlog': 'todo',
      'todo': 'todo',
      'in-progress': 'in-progress',
      'review': 'review',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    
    const mappedStatus = statusMap[column] || 'todo';
    return mappedStatus;
  }, []);

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
      collisionDetection={customCollisionDetection}
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

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskDragOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
