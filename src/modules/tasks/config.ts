// Tasks Module Configuration

export const tasksModuleConfig = {
  id: 'tasks',
  name: 'Tasks Management',
  version: '1.0.0',
  description:
    'Comprehensive task management with Kanban boards, recurring tasks, and client integration',
  author: 'CRM Accounting Platform',
  dependencies: [], // No hard dependencies, but integrates with Clients module when available
  features: [
    'task-management',
    'kanban-boards',
    'recurring-tasks',
    'statutory-deadlines',
    'client-integration',
    'time-tracking',
    'task-templates',
  ],
  permissions: {
    view: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
    create: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
    edit: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
    delete: ['SUPERADMIN', 'OWNER'],
    assign: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
    manage_templates: ['SUPERADMIN', 'OWNER'],
  },
};

export const performanceThresholds = {
  fetchTasks: 2000, // ms
  createTask: 1500, // ms
  updateTask: 1000, // ms
  deleteTask: 800, // ms
  searchTasks: 1500, // ms
  getClientTaskStats: 1000, // ms
  bulkCreateTasks: 3000, // ms
};

export const modulePermissions = {
  view: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  create: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  edit: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  delete: ['SUPERADMIN', 'OWNER'],
  assign: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  manage_templates: ['SUPERADMIN', 'OWNER'],
  view_statistics: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  bulk_operations: ['SUPERADMIN', 'OWNER'],
};

export const loggingStrategy = {
  logLevel: 'info',
  logClientActivities: true,
  logTaskOperations: true,
  logPerformanceMetrics: true,
  logErrors: true,
};

export const exportConfig = {
  supportedFormats: ['csv', 'json', 'pdf'],
  maxExportSize: 10000, // records
  includeAttachments: false,
  includeComments: true,
  includeChecklist: true,
};

export const moduleIntegrationConfig = {
  supportedFeatures: [
    'client-actions',
    'bulk-operations',
    'data-export',
    'activity-logging',
    'real-time-updates',
    'statutory-templates',
    'recurring-tasks',
  ],
  eventBusTopics: [
    'task:created',
    'task:updated',
    'task:deleted',
    'task:status-changed',
    'task:assigned',
    'task:completed',
  ],
  apiEndpoints: [
    '/api/tasks',
    '/api/tasks/search',
    '/api/tasks/export',
    '/api/tasks/templates',
    '/api/tasks/statutory',
  ],
  clientIntegration: {
    actions: [
      'create-task',
      'view-tasks',
      'task-statistics',
      'create-statutory-tasks',
    ],
    dataEnrichment: ['task-stats', 'overdue-tasks', 'upcoming-tasks'],
  },
};

export const kanbanConfig = {
  defaultColumns: [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-100', maxTasks: 100 },
    { id: 'todo', title: 'To Do', color: 'bg-blue-100', maxTasks: 50 },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-yellow-100',
      maxTasks: 20,
    },
    { id: 'review', title: 'Review', color: 'bg-purple-100', maxTasks: 30 },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-green-100',
      maxTasks: 200,
    },
  ],
  allowCustomColumns: true,
  maxColumns: 10,
  dragAndDrop: true,
  columnLimits: true,
};

export const recurrenceConfig = {
  supportedPatterns: [
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
    'custom',
  ],
  maxOccurrences: 1000,
  maxEndDate: 10, // years from now
  statutoryDefaults: {
    'VAT-7': { pattern: 'monthly', dayOfMonth: 25, priority: 'high' },
    'CIT-8': { pattern: 'monthly', dayOfMonth: 20, priority: 'high' },
    'PIT-4': { pattern: 'monthly', dayOfMonth: 20, priority: 'high' },
    ZUS: { pattern: 'monthly', dayOfMonth: 10, priority: 'high' },
  },
};

export const slaConfig = {
  enabled: true,
  defaultSLA: 24, // hours
  escalationLevels: [
    { hours: 24, action: 'email_notification' },
    { hours: 48, action: 'manager_notification' },
    { hours: 72, action: 'urgent_escalation' },
  ],
  businessHours: {
    start: '09:00',
    end: '17:00',
    timezone: 'Europe/Warsaw',
  },
};
