import type { Task } from '../types';

/**
 * Utility functions for optimistic updates in the Tasks module
 */

/**
 * Create an optimistically updated task
 */
export const createOptimisticTaskUpdate = (
  task: Task,
  updates: Partial<Task>
): Task => {
  return {
    ...task,
    ...updates,
    updated_at: new Date().toISOString(),
  };
};

/**
 * Apply optimistic update to a tasks array
 */
export const applyOptimisticUpdate = (
  tasks: Task[],
  taskId: string,
  updates: Partial<Task>
): Task[] => {
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      const updatedTask = createOptimisticTaskUpdate(task, updates);
      console.log('🔄 Optimistic update applied to task:', {
        taskId,
        before: { status: task.status, board_column: task.board_column },
        after: { status: updatedTask.status, board_column: updatedTask.board_column },
        updates
      });
      return updatedTask;
    }
    return task;
  });
  
  return updatedTasks;
};

/**
 * Validate that an optimistic update was successful
 */
export const validateOptimisticUpdate = (
  originalTask: Task,
  updatedTask: Task,
  expectedUpdates: Partial<Task>
): boolean => {
  for (const [key, expectedValue] of Object.entries(expectedUpdates)) {
    if (updatedTask[key as keyof Task] !== expectedValue) {
      console.warn(
        `Optimistic update validation failed for field ${key}:`,
        {
          expected: expectedValue,
          actual: updatedTask[key as keyof Task],
          taskId: updatedTask.id,
        }
      );
      return false;
    }
  }
  return true;
};

/**
 * Create a rollback version of a task
 */
export const createRollbackTask = (
  currentTask: Task,
  originalValues: Partial<Task>
): Task => {
  return {
    ...currentTask,
    ...originalValues,
  };
};
