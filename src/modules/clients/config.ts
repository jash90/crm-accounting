/**
 * Clients Module Configuration
 * Defines module capabilities, dependencies, and performance thresholds
 */

import type { ModuleCapabilities } from '@/lib/moduleRegistry';

export const clientsModuleConfig: ModuleCapabilities = {
  name: 'Clients',
  version: '1.1.0',
  description:
    'Manage accounting and bookkeeping clients with comprehensive client profiles',

  dependencies: {
    // No required dependencies - module works standalone
    required: [],
    // Optional modules that enhance functionality
    optional: [
      'Invoices', // Generate invoices for clients
      'Contracts', // Manage client contracts
      'Documents', // Attach documents to clients
      'Tasks', // Assign tasks related to clients
      'Reports', // Generate client reports
      'Communications', // Track client communications
    ],
  },

  provides: {
    // Entities this module manages
    entities: ['client', 'clients'],

    // Features this module provides
    features: [
      'client-management',
      'client-search',
      'tax-configuration',
      'contract-tracking',
      'aml-compliance',
      'contact-management',
    ],
  },

  // Events emitted by this module
  events: [
    'client:created',
    'client:updated',
    'client:deleted',
    'client:statusChanged',
    'client:contractSigned',
    'client:contactAdded',
    'client:contactRemoved',
  ],

  // Hooks provided by this module
  hooks: ['useClients', 'useClientDetails', 'useClientsModuleIntegration'],
};

// Performance thresholds for monitoring
export const performanceThresholds = {
  // Maximum time in milliseconds for operations
  operations: {
    fetchList: 1000, // Fetching client list
    fetchSingle: 500, // Fetching single client
    create: 800, // Creating new client
    update: 600, // Updating client
    delete: 400, // Deleting client
    search: 700, // Searching clients
    bulkUpdate: 2000, // Bulk operations
  },

  // Data limits for performance
  limits: {
    maxClientsPerPage: 50,
    maxSearchResults: 100,
    maxContactsPerClient: 10,
    maxBulkOperations: 25,
  },

  // Cache settings
  cache: {
    clientListTTL: 60000, // 1 minute
    clientDetailsTTL: 300000, // 5 minutes
    searchResultsTTL: 30000, // 30 seconds
  },
};

// Module permissions
export const modulePermissions = {
  // Basic CRUD permissions
  'clients:read': {
    description: 'View client information',
    roles: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  },
  'clients:create': {
    description: 'Create new clients',
    roles: ['SUPERADMIN', 'OWNER'],
  },
  'clients:update': {
    description: 'Update client information',
    roles: ['SUPERADMIN', 'OWNER'],
  },
  'clients:delete': {
    description: 'Delete clients',
    roles: ['SUPERADMIN', 'OWNER'],
  },

  // Advanced permissions
  'clients:export': {
    description: 'Export client data',
    roles: ['SUPERADMIN', 'OWNER'],
  },
  'clients:bulk': {
    description: 'Perform bulk operations on clients',
    roles: ['SUPERADMIN', 'OWNER'],
  },
  'clients:sensitive': {
    description: 'View sensitive client information (tax, financial)',
    roles: ['SUPERADMIN', 'OWNER'],
  },
};

// Logging configuration
export const loggingConfig = {
  // What to always log
  always: [
    'create',
    'update',
    'delete',
    'statusChange',
    'contractSign',
    'bulkOperation',
  ],

  // What to log conditionally (in debug mode)
  conditional: ['search', 'view', 'export'],

  // What to never log
  never: ['password', 'sensitive_financial_data', 'personal_identification'],

  // Performance thresholds for logging warnings
  performanceWarnings: {
    enabled: true,
    threshold: 1000, // Log operations taking more than 1 second
  },
};

// Export configuration
export const exportConfig = {
  // Supported export formats
  formats: ['csv', 'json', 'xlsx', 'pdf'],

  // Fields to include in exports
  defaultFields: [
    'company_name',
    'nip',
    'email',
    'phone',
    'address',
    'tax_form',
    'vat_status',
    'contract_status',
  ],

  // Fields that require special permission to export
  sensitiveFields: [
    'bank_account',
    'financial_data',
    'aml_group',
    'internal_notes',
  ],

  // Maximum records per export
  maxRecords: 1000,
};

// Integration points for other modules
export const integrationPoints = {
  // Data that can be provided to other modules
  provides: {
    clientSelector: true, // UI component for selecting clients
    clientValidator: true, // Function to validate client exists
    clientDetails: true, // Function to get client details
    clientSearch: true, // Function to search clients
  },

  // Data this module can consume from others
  consumes: {
    invoiceGenerator: 'Invoices',
    contractManager: 'Contracts',
    documentAttacher: 'Documents',
    taskAssigner: 'Tasks',
    reportGenerator: 'Reports',
  },
};
