/**
 * Task Data Sanitizer Utility
 * 
 * Ensures that task data is properly formatted for database insertion/update
 * by converting empty strings to undefined for UUID and timestamp fields.
 */

import type { TaskFormData } from '../types';

/**
 * UUID fields that should be undefined instead of empty strings
 */
const UUID_FIELDS: (keyof TaskFormData)[] = [
  'client_id',
  'assigned_to',
];

/**
 * Timestamp fields that should be undefined instead of empty strings
 */
const TIMESTAMP_FIELDS: (keyof TaskFormData)[] = [
  'due_date',
  'start_date',
  'sla_deadline',
];

/**
 * Sanitizes task form data to ensure compatibility with PostgreSQL
 * 
 * @param taskData - Raw form data from TaskForm
 * @returns Sanitized task data ready for database operations
 */
export function sanitizeTaskData(taskData: TaskFormData): TaskFormData {
  const sanitized = { ...taskData };

  // Validate required fields
  if (!sanitized.title || !sanitized.title.trim()) {
    throw new Error('Title is required');
  }
  
  if (!sanitized.task_type) {
    throw new Error('Task type is required');
  }
  
  if (!sanitized.priority) {
    throw new Error('Priority is required');
  }
  
  if (!sanitized.status) {
    throw new Error('Status is required');
  }
  
  if (!sanitized.board_column) {
    throw new Error('Board column is required');
  }

  // Handle UUID fields - convert empty strings to undefined
  UUID_FIELDS.forEach(field => {
    if (sanitized[field] === '') {
      (sanitized as any)[field] = undefined;
    }
  });

  // Handle timestamp fields - convert empty strings to undefined
  TIMESTAMP_FIELDS.forEach(field => {
    if (sanitized[field] === '') {
      (sanitized as any)[field] = undefined;
    }
  });

  // Handle other string fields - trim whitespace
  if (typeof sanitized.title === 'string') {
    sanitized.title = sanitized.title.trim();
  }
  
  if (typeof sanitized.description === 'string') {
    sanitized.description = sanitized.description.trim() || undefined;
  }

  return sanitized;
}

/**
 * Prepares display values for form inputs
 * Converts undefined values to empty strings for HTML inputs
 * 
 * @param value - Field value that might be undefined
 * @returns String value safe for HTML input display
 */
export function getDisplayValue(value: string | undefined): string {
  return value ?? '';
}