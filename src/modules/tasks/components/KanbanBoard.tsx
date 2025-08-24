import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'react-toastify';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { useTasks } from '../hooks/useTasks';
import type { Task, BoardColumn } from '../types';

// Column configuration with WIP limits
const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-50', limit: null },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50', limit: null },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-50', limit: 3 },
  { id: 'review', title: 'Review', color: 'bg-purple-50', limit: 2 },
  { id: 'completed', title: 'Completed', color: 'bg-green-50', limit: null },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-red-50', limit: null },
] as const;

interface KanbanBoardProps {
  tasks: Task[];
  loading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks: initialTasks,
  loading = false,
}) => {
  const { updateTaskStatus } = useTasks();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update local tasks when props change
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    COLUMNS.forEach((column) => {
      grouped[column.id] = [];
    });

    tasks.forEach((task) => {
      const columnId = task.board_column || 'todo';
      if (!grouped[columnId]) {
        grouped[columnId] = [];
      }
      grouped[columnId].push(task);
    });

    // Sort tasks within each column by board_order
    Object.keys(grouped).forEach((columnId) => {
      grouped[columnId].sort((a, b) => a.board_order - b.board_order);
    });

    return grouped;
  }, [tasks]);

  // Get all task IDs for each column (needed for sortable context)
  const getColumnTaskIds = useCallback(
    (columnId: string) => {
      return tasksByColumn[columnId]?.map((task) => task.id) || [];
    },
    [tasksByColumn]
  );

  // Find the container (column) for a given task ID
  const findContainer = useCallback(
    (id: string) => {
      if (COLUMNS.find((col) => col.id === id)) {
        return id; // It's a column ID
      }

      // It's a task ID, find which column it belongs to
      const columnId = Object.keys(tasksByColumn).find((key) =>
        tasksByColumn[key].some((task) => task.id === id)
      );

      return columnId || null;
    },
    [tasksByColumn]
  );

  // Get active task
  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeId) || null,
    [tasks, activeId]
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  }, []);

  // Handle drag over (for live sorting preview)
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeContainer = findContainer(active.id as string);
      const overContainer = findContainer(over.id as string);

      if (
        !activeContainer ||
        !overContainer ||
        activeContainer === overContainer
      ) {
        return;
      }

      setTasks((prevTasks) => {
        const activeTask = prevTasks.find((t) => t.id === active.id);
        if (!activeTask) return prevTasks;

        // Check WIP limit for target column
        const targetColumn = COLUMNS.find((col) => col.id === overContainer);
        if (targetColumn?.limit) {
          const targetTasks = prevTasks.filter(
            (t) => t.board_column === overContainer
          );
          if (targetTasks.length >= targetColumn.limit) {
            return prevTasks; // Don't move if limit reached
          }
        }

        // Move task to new column
        return prevTasks.map((task) => {
          if (task.id === active.id) {
            return {
              ...task,
              board_column: overContainer as BoardColumn,
              status: mapColumnToStatus(overContainer),
            };
          }
          return task;
        });
      });
    },
    [findContainer]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);

      if (!over) return;

      const activeContainer = findContainer(active.id as string);
      const overContainer = findContainer(over.id as string);

      if (!activeContainer || !overContainer) return;

      const activeTask = tasks.find((t) => t.id === active.id);
      if (!activeTask) return;

      // Moving to a different column
      if (activeContainer !== overContainer) {
        // Check WIP limit
        const targetColumn = COLUMNS.find((col) => col.id === overContainer);
        if (targetColumn?.limit) {
          const targetTasks = tasks.filter(
            (t) => t.board_column === overContainer
          );
          if (targetTasks.length >= targetColumn.limit) {
            toast.warning(
              `${targetColumn.title} column is at its limit (${targetColumn.limit} tasks)`
            );
            // Reset local state
            setTasks(initialTasks);
            return;
          }
        }

        const newStatus = mapColumnToStatus(overContainer);

        try {
          await updateTaskStatus(
            active.id as string,
            newStatus,
            overContainer as BoardColumn
          );
          toast.success(
            `Task moved to ${targetColumn?.title || overContainer}`
          );
        } catch (error) {
          console.error('Failed to update task:', error);
          toast.error('Failed to move task');
          // Reset local state on error
          setTasks(initialTasks);
        }
      }
      // Reordering within the same column
      else {
        const columnTasks = tasksByColumn[activeContainer];
        const activeIndex = columnTasks.findIndex((t) => t.id === active.id);
        const overIndex = columnTasks.findIndex((t) => t.id === over.id);

        if (activeIndex !== overIndex) {
          const reorderedTasks = arrayMove(columnTasks, activeIndex, overIndex);

          // Update board_order for all affected tasks
          const updates = reorderedTasks.map((task, index) => ({
            ...task,
            board_order: index,
          }));

          // Update local state
          setTasks((prevTasks) => {
            const otherTasks = prevTasks.filter(
              (t) => t.board_column !== activeContainer
            );
            return [...otherTasks, ...updates];
          });

          // Here you would typically update the board_order in the database
          // For now, just update the status to trigger a refresh
          try {
            await updateTaskStatus(
              active.id as string,
              activeTask.status,
              activeContainer as BoardColumn
            );
          } catch (error) {
            console.error('Failed to reorder task:', error);
            setTasks(initialTasks);
          }
        }
      }
    },
    [tasks, tasksByColumn, findContainer, updateTaskStatus, initialTasks]
  );

  // Map column to status
  const mapColumnToStatus = (columnId: string): string => {
    const statusMap: Record<string, string> = {
      backlog: 'todo',
      todo: 'todo',
      'in-progress': 'in-progress',
      review: 'review',
      completed: 'completed',
      cancelled: 'cancelled',
    };
    return statusMap[columnId] || 'todo';
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className={`${column.color} rounded-lg p-4 h-[600px]`}>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 kanban-board">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <KanbanTaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
