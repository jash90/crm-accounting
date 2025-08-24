// Tasks Module TypeScript Interfaces

/**
 * Core task entity representing a work item in the system
 */
export interface Task {
  readonly id: string;
  readonly company_id: string;
  client_id?: string;
  client_name?: string;

  // Task details
  title: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;

  // Dates and deadlines (ISO 8601 format)
  due_date?: string;
  start_date?: string;
  completed_at?: string;

  // Recurring task settings
  recurrence_pattern?: RecurrencePattern;
  recurrence_config?: RecurrenceConfig;
  next_occurrence?: string;
  parent_task_id?: string;

  // Assignment and tracking
  assigned_to?: string;
  assigned_by?: string;
  time_estimate?: number; // in minutes
  time_spent: number; // in minutes

  // SLA and compliance
  sla_deadline?: string;
  is_statutory: boolean;
  statutory_type?: StatutoryType;

  // Kanban specific
  board_column: BoardColumn;
  board_order: number;

  // Metadata
  tags?: readonly string[];
  attachments?: readonly TaskAttachment[];

  // Enriched data (from joins)
  assigned_to_email?: string;
  assigned_to_role?: string;
  created_by_email?: string;
  created_by_role?: string;
  checklist_count?: number;
  comments_count?: number;

  // Timestamps (ISO 8601 format)
  readonly created_at: string;
  readonly updated_at: string;
  readonly created_by: string;
}

/**
 * Checklist item within a task for tracking subtasks
 */
export interface TaskChecklistItem {
  readonly id: string;
  readonly task_id: string;
  title: string;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  order_index: number;
  readonly created_at: string;
}

/**
 * Comment on a task for collaboration and communication
 */
export interface TaskComment {
  readonly id: string;
  readonly task_id: string;
  readonly user_id: string;
  comment: string;
  readonly created_at: string;
  readonly updated_at: string;

  // Enriched data
  user_name?: string;
  user_email?: string;
}

/**
 * Template for creating recurring or standardized tasks
 */
export interface TaskTemplate {
  readonly id: string;
  readonly company_id: string;
  name: string;
  task_type: TaskType;
  default_config: Readonly<TaskTemplateConfig>;
  is_active: boolean;
  readonly created_at: string;
}

/**
 * Configuration for task templates
 */
export interface TaskTemplateConfig {
  title: string;
  description?: string;
  priority: TaskPriority;
  time_estimate?: number;
  tags?: readonly string[];
  checklist_items?: readonly string[];
  recurrence_pattern?: RecurrencePattern;
  recurrence_config?: RecurrenceConfig;
}

/**
 * File attachment associated with a task
 */
export interface TaskAttachment {
  readonly id: string;
  filename: string;
  url: string;
  size: number; // in bytes
  mime_type: string;
  readonly uploaded_at: string;
  readonly uploaded_by: string;
}

/**
 * Configuration for recurring task patterns
 */
export interface RecurrenceConfig {
  interval: number;
  end_date?: string;
  max_occurrences?: number;
  days_of_week?: readonly number[]; // 0-6 (Sunday-Saturday)
  day_of_month?: number; // 1-31
  month_of_year?: number; // 1-12
  custom_rules?: Readonly<Record<string, unknown>>;
}

/**
 * Statistics summary for client tasks
 */
export interface ClientTaskStats {
  readonly total: number;
  readonly completed: number;
  readonly pending: number;
  readonly overdue: number;
  readonly in_progress: number;
  readonly todo: number;
}

// Enums
export const TASK_TYPES = {
  ONE_TIME: 'one-time',
  RECURRING: 'recurring',
  MILESTONE: 'milestone',
} as const;

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const RECURRENCE_PATTERNS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const;

export const STATUTORY_TYPES = {
  VAT_7: 'VAT-7',
  CIT_8: 'CIT-8',
  PIT_4: 'PIT-4',
  ZUS: 'ZUS',
  JPK: 'JPK',
  CEIDG: 'CEIDG',
  CUSTOMS: 'CUSTOMS',
  OTHER: 'OTHER',
} as const;

export const BOARD_COLUMNS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Type aliases
export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
export type TaskPriority =
  (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES];
export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];
export type RecurrencePattern =
  (typeof RECURRENCE_PATTERNS)[keyof typeof RECURRENCE_PATTERNS];
export type StatutoryType =
  (typeof STATUTORY_TYPES)[keyof typeof STATUTORY_TYPES];
export type BoardColumn = (typeof BOARD_COLUMNS)[keyof typeof BOARD_COLUMNS];

// Form data interfaces
export interface TaskFormData {
  title: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  start_date?: string;
  client_id?: string;
  client_name?: string;
  assigned_to?: string;
  time_estimate?: number;
  sla_deadline?: string;
  is_statutory: boolean;
  statutory_type?: StatutoryType;
  tags?: string[];
  recurrence_pattern?: RecurrencePattern;
  recurrence_config?: RecurrenceConfig;
  board_column: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string[];
  client_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  is_statutory?: boolean;
  tags?: string[];
  search?: string;
}

// API response interfaces
/**
 * Response for task list queries
 */
export interface TasksResponse {
  readonly data: readonly Task[];
  readonly count: number;
  readonly hasMore: boolean;
}

/**
 * Response for single task with details
 */
export interface TaskResponse {
  readonly data: Task;
  readonly checklist_items: readonly TaskChecklistItem[];
  readonly comments: readonly TaskComment[];
}

// Event interfaces
/**
 * Event emitted when a task is created
 */
export interface TaskCreatedEvent {
  readonly task: Task;
  readonly source: string;
  readonly timestamp?: string;
}

/**
 * Event emitted when a task is updated
 */
export interface TaskUpdatedEvent {
  readonly task: Task;
  readonly changes: Partial<Task>;
  readonly source: string;
  readonly timestamp?: string;
}

/**
 * Event emitted when a task is deleted
 */
export interface TaskDeletedEvent {
  readonly taskId: string;
  readonly source: string;
  readonly timestamp?: string;
}

/**
 * Event emitted when task status changes
 */
export interface TaskStatusChangedEvent {
  readonly taskId: string;
  readonly oldStatus: TaskStatus;
  readonly newStatus: TaskStatus;
  readonly source: string;
  readonly timestamp?: string;
}

/**
 * Event emitted when task is assigned
 */
export interface TaskAssignedEvent {
  readonly taskId: string;
  readonly oldAssignee?: string;
  readonly newAssignee: string;
  readonly source: string;
  readonly timestamp?: string;
}

// Utility types
/**
 * Task with all related data loaded
 */
export type TaskWithDetails = Task & {
  readonly checklist_items: readonly TaskChecklistItem[];
  readonly comments: readonly TaskComment[];
  readonly client?: unknown; // Will be Client type when Clients module is available
};

/**
 * Minimal task data for list views
 */
export type TaskSummary = Pick<
  Task,
  | 'id'
  | 'title'
  | 'status'
  | 'priority'
  | 'due_date'
  | 'assigned_to'
  | 'client_name'
>;

// Constants
export const DEFAULT_BOARD_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100', wipLimit: null },
  { id: 'todo', title: 'To Do', color: 'bg-blue-100', wipLimit: null },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-yellow-100',
    wipLimit: 3,
  },
  { id: 'review', title: 'Review', color: 'bg-purple-100', wipLimit: 2 },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-green-100',
    wipLimit: null,
  },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-red-100', wipLimit: null },
] as const;

export const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
} as const;

export const STATUS_COLORS = {
  todo: 'text-gray-600 bg-gray-100',
  'in-progress': 'text-blue-600 bg-blue-100',
  review: 'text-purple-600 bg-purple-100',
  completed: 'text-green-600 bg-green-100',
  cancelled: 'text-red-600 bg-red-100',
} as const;

export const STATUTORY_DEADLINES = {
  'VAT-7': {
    frequency: 'monthly' as const,
    dayOfMonth: 25,
    description: 'Monthly VAT return',
  },
  'CIT-8': {
    frequency: 'monthly' as const,
    dayOfMonth: 31,
    description: 'Corporate income tax return',
  },
  'PIT-4': {
    frequency: 'monthly' as const,
    dayOfMonth: 20,
    description: 'Personal income tax withholding',
  },
  ZUS: {
    frequency: 'monthly' as const,
    dayOfMonth: 15,
    description: 'Social security contributions',
  },
  JPK: {
    frequency: 'monthly' as const,
    dayOfMonth: 25,
    description: 'Standard Audit File',
  },
  CEIDG: {
    frequency: 'yearly' as const,
    dayOfMonth: 30,
    description: 'Business registry update',
  },
  CUSTOMS: {
    frequency: 'monthly' as const,
    dayOfMonth: 15,
    description: 'Customs declaration',
  },
  OTHER: {
    frequency: 'monthly' as const,
    dayOfMonth: 30,
    description: 'Other statutory requirement',
  },
} as const satisfies Record<
  string,
  { frequency: string; dayOfMonth: number; description: string }
>;

// Enhanced interfaces for database schema features
/**
 * Task activity log for audit trail
 */
export interface TaskActivity {
  readonly id: string;
  readonly task_id: string;
  readonly user_id: string;
  action_type: TaskActivityType;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  description?: string;
  readonly created_at: string;
}

export type TaskActivityType =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'completed'
  | 'commented'
  | 'deleted';

/**
 * Enhanced task statistics from database function
 */
export interface TaskStats {
  readonly total: number;
  readonly completed: number;
  readonly in_progress: number;
  readonly todo: number;
  readonly review: number;
  readonly cancelled: number;
  readonly overdue: number;
  readonly due_today: number;
  readonly due_this_week: number;
  readonly statutory: number;
  readonly statutory_overdue: number;
  readonly high_priority: number;
  readonly total_time_estimated: number;
  readonly total_time_spent: number;
}

/**
 * Task search result interface
 */
export interface TaskSearchResult {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly due_date?: string;
  readonly client_name?: string;
  readonly assigned_to_email?: string;
  readonly is_statutory: boolean;
  readonly statutory_type?: StatutoryType;
  readonly created_at: string;
}

/**
 * Task dashboard view interface
 */
export interface TaskDashboardItem {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly due_date?: string;
  readonly client_name?: string;
  readonly is_statutory: boolean;
  readonly statutory_type?: StatutoryType;
  readonly assigned_to_email?: string;
  readonly urgency_status: 'overdue' | 'due_today' | 'due_soon' | 'normal';
  readonly days_overdue?: number;
}

/**
 * Enhanced search filters for the search function
 */
export interface TaskSearchFilters {
  search_term?: string;
  status_filter?: TaskStatus[];
  priority_filter?: TaskPriority[];
  client_id?: string;
  assigned_to?: string;
  is_statutory?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Bulk operation interfaces
 */
export interface BulkTaskOperation {
  task_ids: readonly string[];
  operation: 'status_change' | 'assign' | 'priority_change' | 'delete';
  data: Record<string, unknown>;
}

export interface BulkTaskResult {
  readonly success_count: number;
  readonly error_count: number;
  readonly errors?: Array<{ task_id: string; error: string }>;
}

/**
 * Task view configuration
 */
export interface TaskViewConfig {
  view_type: 'grid' | 'list' | 'kanban';
  items_per_page: number;
  columns_visible: readonly string[];
  filters: TaskFilters;
  sort: TaskSortOptions;
}

export interface TaskSortOptions {
  field:
    | 'due_date'
    | 'created_at'
    | 'updated_at'
    | 'priority'
    | 'status'
    | 'title';
  direction: 'asc' | 'desc';
}

/**
 * Module API interface for inter-module communication
 */
export interface TaskModuleAPI {
  getClientTasks: (clientId: string) => Promise<readonly Task[]>;
  getClientTaskStats: (clientId: string) => Promise<ClientTaskStats>;
  createTaskForClient: (
    clientId: string,
    taskData: Partial<TaskFormData>
  ) => Promise<Task>;
  searchTasks: (
    filters: TaskSearchFilters
  ) => Promise<readonly TaskSearchResult[]>;
  getTaskStats: (companyId: string) => Promise<TaskStats>;
  createStatutoryTasks: (
    clientIds: readonly string[],
    statutoryType: StatutoryType
  ) => Promise<readonly Task[]>;
  bulkCreateTasksForClients: (
    clientIds: readonly string[],
    taskTemplate: TaskTemplateConfig
  ) => Promise<readonly Task[]>;
  getTaskSummary: (companyId: string) => Promise<TaskStats>;
  searchCompanyTasks: (
    companyId: string,
    searchTerm: string
  ) => Promise<readonly TaskSearchResult[]>;
}

/**
 * Performance monitoring thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_MS: 1000,
  VERY_SLOW_QUERY_MS: 3000,
  MAX_TASKS_PER_PAGE: 100,
  SEARCH_DEBOUNCE_MS: 300,
  AUTO_REFRESH_INTERVAL_MS: 30000,
} as const;

/**
 * Default values for forms and configurations
 */
export const DEFAULT_TASK_FORM_DATA: TaskFormData = {
  title: '',
  description: '',
  task_type: 'one-time',
  priority: 'medium',
  status: 'todo',
  is_statutory: false,
  tags: [],
  board_column: 'todo',
};

export const DEFAULT_TASK_VIEW_CONFIG: TaskViewConfig = {
  view_type: 'grid',
  items_per_page: 20,
  columns_visible: [
    'title',
    'status',
    'priority',
    'due_date',
    'assigned_to',
    'client_name',
  ],
  filters: {},
  sort: { field: 'due_date', direction: 'asc' },
};
