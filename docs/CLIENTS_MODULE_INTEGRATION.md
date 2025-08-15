# Clients Module Integration Guide

## Overview

The Clients module is a core component of the CRM Accounting Platform that manages client data, relationships, and activities. This guide provides comprehensive information for integrating with the Clients module from other modules or external systems.

## Module Information

- **Module ID**: `clients`
- **Version**: `1.1.0`
- **Status**: Active
- **Dependencies**: None (core module)
- **Location**: `src/modules/clients/`

## API Reference

### Client API (`clientsAPI`)

The Clients module exposes a typed API for other modules to interact with client data.

```typescript
import { getModuleAPI } from '@/lib/moduleRegistry';

// Get the clients API
const clientsAPI = getModuleAPI('clients');

// Available methods:
const client = await clientsAPI.getClient(clientId);
const clients = await clientsAPI.searchClients(searchTerm);
const statusClients = await clientsAPI.getClientsByStatus(status);
const exists = await clientsAPI.clientExistsByEmail(email);
```

#### Available API Methods

| Method                | Parameters           | Returns                   | Description                                     |
| --------------------- | -------------------- | ------------------------- | ----------------------------------------------- |
| `getClient`           | `clientId: string`   | `Promise<Client \| null>` | Fetch a single client by ID                     |
| `searchClients`       | `searchTerm: string` | `Promise<Client[]>`       | Search clients by name, email, or business type |
| `getClientsByStatus`  | `status: string`     | `Promise<Client[]>`       | Get clients filtered by contract status         |
| `clientExistsByEmail` | `email: string`      | `Promise<boolean>`        | Check if a client exists with the given email   |

### Client Data Structure

```typescript
interface Client {
  id: string;
  company_id: string;
  company_name: string;
  client_number: string;
  business_type?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  
  // Tax Information
  nip?: string;
  regon?: string;
  krs?: string;
  tax_form?: string;
  vat_frequency?: string;
  
  // ZUS Information
  zus_number?: string;
  zus_frequency?: string;
  
  // Contract Information
  contract_status?: string;
  contract_date?: string;
  contract_amount?: number;
  
  // System Information
  e_szok_system?: boolean;
  gtu_codes?: string[];
  fixed_costs?: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}
```

## Event System

The Clients module uses an event-driven architecture for real-time updates and inter-module communication.

### Available Events

```typescript
import { clientEvents } from '@/lib/eventBus';

// Listen to client events
clientEvents.created.on((data) => {
  console.log('New client created:', data.client);
});

clientEvents.updated.on((data) => {
  console.log('Client updated:', data.client, data.changes);
});

clientEvents.deleted.on((data) => {
  console.log('Client deleted:', data.clientId);
});

clientEvents.statusChanged.on((data) => {
  console.log('Client status changed:', data.clientId, data.oldStatus, data.newStatus);
});
```

#### Event Data Structures

```typescript
interface ClientCreatedEvent {
  client: Client;
  source: string;
}

interface ClientUpdatedEvent {
  client: Client;
  changes: Partial<Client>;
  source: string;
}

interface ClientDeletedEvent {
  clientId: string;
  source: string;
}

interface ClientStatusChangedEvent {
  clientId: string;
  oldStatus: string;
  newStatus: string;
  source: string;
}
```

## Activity Logging

The Clients module includes comprehensive activity logging that other modules can contribute to.

### Using Client History

```typescript
import { useClientHistory, ACTIVITY_TYPES } from '@/modules/clients';

const MyComponent = () => {
  const { logActivity } = useClientHistory();

  const handleInvoiceGenerated = async (clientId: string, invoiceData: any) => {
    await logActivity({
      clientId,
      activityType: ACTIVITY_TYPES.INVOICE_GENERATED,
      activityTitle: 'Invoice Generated',
      activityDescription: `Generated invoice #${invoiceData.number}`,
      newData: invoiceData,
      source: 'invoicing-module'
    });
  };
};
```

### Available Activity Types

```typescript
export const ACTIVITY_TYPES = {
  // Core Activities
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  VIEWED: 'viewed',
  
  // Communication
  CONTACTED: 'contacted',
  EMAIL_SENT: 'email_sent',
  PHONE_CALL: 'phone_call',
  
  // Documents
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_DELETED: 'document_deleted',
  
  // Financial
  INVOICE_GENERATED: 'invoice_generated',
  INVOICE_SENT: 'invoice_sent',
  PAYMENT_RECEIVED: 'payment_received',
  
  // Contracts
  CONTRACT_SIGNED: 'contract_signed',
  CONTRACT_UPDATED: 'contract_updated',
  CONTRACT_EXPIRED: 'contract_expired',
  
  // Meetings
  MEETING_SCHEDULED: 'meeting_scheduled',
  MEETING_COMPLETED: 'meeting_completed',
  
  // Notes
  NOTE_ADDED: 'note_added',
  NOTE_UPDATED: 'note_updated',
  NOTE_DELETED: 'note_deleted',
  
  // System
  STATUS_CHANGED: 'status_changed',
  ASSIGNED: 'assigned',
  UNASSIGNED: 'unassigned',
  ARCHIVED: 'archived',
  RESTORED: 'restored'
} as const;
```

## Module Integration Patterns

### 1. Action Integration

Add client-specific actions to the client card and detail views:

```typescript
import { useClientsModuleIntegration } from '@/hooks/useModuleIntegration';

const MyModuleIntegration = () => {
  const { 
    isModuleAvailable, 
    callModuleMethod 
  } = useClientsModuleIntegration();

  // Register your module's client actions
  useEffect(() => {
    if (isModuleAvailable('invoicing')) {
      registerClientAction({
        id: 'generate-invoice',
        label: 'Generate Invoice',
        icon: 'Receipt',
        onClick: (client) => callModuleMethod('invoicing', 'generateInvoice', client.id),
        permissions: ['OWNER', 'EMPLOYEE']
      });
    }
  }, []);
};
```

### 2. Data Enrichment

Enhance client data with information from your module:

```typescript
// In your module's API
export const enrichClientData = async (client: Client) => {
  const invoices = await getClientInvoices(client.id);
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  return {
    ...client,
    totalRevenue,
    lastInvoiceDate: invoices[0]?.date,
    invoiceCount: invoices.length
  };
};
```

### 3. Bulk Operations

Implement bulk operations for multiple clients:

```typescript
import { clientEvents } from '@/lib/eventBus';

// Listen for bulk selection events
clientEvents.bulkSelected.on((data) => {
  const { clientIds, action } = data;
  
  if (action === 'bulk-invoice') {
    generateBulkInvoices(clientIds);
  }
});
```

## Configuration

### Module Permissions

```typescript
export const modulePermissions = {
  view: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  create: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  edit: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  delete: ['SUPERADMIN', 'OWNER'],
  export: ['SUPERADMIN', 'OWNER'],
  manage_history: ['SUPERADMIN', 'OWNER']
};
```

### Performance Thresholds

```typescript
export const performanceThresholds = {
  fetchClients: 2000, // ms
  searchClients: 1500, // ms
  createClient: 1000, // ms
  updateClient: 1000, // ms
  deleteClient: 500   // ms
};
```

### Integration Configuration

```typescript
export const moduleIntegrationConfig = {
  supportedFeatures: [
    'client-actions',
    'bulk-operations',
    'data-export',
    'activity-logging',
    'real-time-updates'
  ],
  eventBusTopics: [
    'client:created',
    'client:updated',
    'client:deleted',
    'client:status-changed'
  ],
  apiEndpoints: [
    '/api/clients',
    '/api/clients/search',
    '/api/clients/export'
  ]
};
```

## Examples

### 1. Invoice Module Integration

```typescript
// modules/invoicing/clientIntegration.ts
import { registerModule, clientEvents } from '@/lib/eventBus';
import { ACTIVITY_TYPES } from '@/modules/clients';

export const setupClientIntegration = () => {
  // Register invoice actions for clients
  registerClientAction({
    id: 'generate-invoice',
    label: 'Generate Invoice',
    icon: 'Receipt',
    onClick: async (client) => {
      const invoice = await generateInvoice(client.id);
      
      // Log activity
      await logClientActivity({
        clientId: client.id,
        activityType: ACTIVITY_TYPES.INVOICE_GENERATED,
        activityTitle: 'Invoice Generated',
        activityDescription: `Generated invoice #${invoice.number} for ${invoice.amount}`,
        newData: { invoiceId: invoice.id, amount: invoice.amount }
      });
    }
  });

  // Listen for client updates
  clientEvents.updated.on(async (data) => {
    if (data.changes.email || data.changes.company_name) {
      await updateInvoiceClientInfo(data.client.id, data.changes);
    }
  });
};
```

### 2. Document Management Integration

```typescript
// modules/documents/clientIntegration.ts
export const setupDocumentIntegration = () => {
  registerClientAction({
    id: 'attach-document',
    label: 'Attach Document',
    icon: 'Paperclip',
    onClick: (client) => openDocumentUpload(client.id)
  });

  registerClientAction({
    id: 'view-documents',
    label: 'View Documents',
    icon: 'Files',
    onClick: (client) => navigateToClientDocuments(client.id)
  });
};
```

### 3. Task Management Integration

```typescript
// modules/tasks/clientIntegration.ts
export const setupTaskIntegration = () => {
  registerClientAction({
    id: 'create-task',
    label: 'Create Task',
    icon: 'Plus',
    onClick: (client) => createClientTask(client.id)
  });

  // Add task count to client cards
  registerClientDataEnricher(async (client) => {
    const taskCount = await getClientTaskCount(client.id);
    const overdueTasks = await getClientOverdueTasks(client.id);
    
    return {
      ...client,
      taskCount,
      overdueTaskCount: overdueTasks.length
    };
  });
};
```

## Best Practices

### 1. Error Handling

```typescript
// Always handle errors gracefully
try {
  const client = await clientsAPI.getClient(clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  // Process client
} catch (error) {
  console.error('Failed to fetch client:', error);
  toast.error('Unable to load client information');
}
```

### 2. Performance Optimization

```typescript
// Use debouncing for search operations
const debouncedSearch = useCallback(
  debounce(async (term: string) => {
    const results = await clientsAPI.searchClients(term);
    setSearchResults(results);
  }, 300),
  []
);
```

### 3. Type Safety

```typescript
// Always use proper TypeScript types
import type { Client, ClientHistoryActivity } from '@/modules/clients';

const processClient = (client: Client): void => {
  // Type-safe client processing
};
```

### 4. Event Cleanup

```typescript
// Clean up event listeners
useEffect(() => {
  const unsubscribe = clientEvents.updated.on(handleClientUpdate);
  
  return () => {
    unsubscribe();
  };
}, []);
```

## Testing

### Unit Tests

```typescript
// Test client API integration
describe('Client API Integration', () => {
  it('should fetch client data', async () => {
    const client = await clientsAPI.getClient('test-id');
    expect(client).toBeDefined();
    expect(client?.id).toBe('test-id');
  });

  it('should handle search queries', async () => {
    const results = await clientsAPI.searchClients('test company');
    expect(Array.isArray(results)).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test event system
describe('Client Events', () => {
  it('should emit client created event', async () => {
    const eventSpy = jest.fn();
    clientEvents.created.on(eventSpy);
    
    await createClient(mockClientData);
    
    expect(eventSpy).toHaveBeenCalledWith({
      client: expect.any(Object),
      source: 'test'
    });
  });
});
```

## Migration Guide

### From Legacy Client System

If migrating from an older client system:

1. **Data Migration**: Use the provided migration scripts
2. **API Updates**: Replace old API calls with new module API
3. **Event System**: Migrate from direct database listeners to event bus
4. **Activity Logging**: Implement new activity logging system

### Version Compatibility

| Version       | Breaking Changes             | Migration Required         |
| ------------- | ---------------------------- | -------------------------- |
| 1.0.x → 1.1.x | Activity logging API changes | Yes - Update logging calls |
| 1.1.x → 1.2.x | TBD                          | TBD                        |

## Support and Troubleshooting

### Common Issues

1. **Client not found**: Check permissions and company_id filtering
2. **Event not firing**: Ensure proper event listener registration
3. **Performance issues**: Use pagination and proper indexing
4. **Permission errors**: Verify user roles and module permissions

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('debug', 'clients:*');
```

### Performance Monitoring

The module includes built-in performance monitoring:

```typescript
// Performance warnings are logged automatically
// Check browser console for slow operations
```

---

For more information or support, refer to the main [Module Architecture Guide](./Module.MD) or contact the development team.
