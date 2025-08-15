# Module Architecture Guide

## 📁 Module Structure

A complete module should follow this directory structure:

```
src/modules/[module-name]/
├── index.ts                 # Main export file
├── components/              # UI components
│   └── [Entity]Card.tsx    # Reusable display component
├── hooks/                   # Custom React hooks
│   └── use[Entities].ts    # Data management hook
└── pages/                   # Page components
    ├── [Entities]Page.tsx   # Main listing page
    ├── Add[Entity]Page.tsx  # Create new entity
    └── Edit[Entity]Page.tsx # Edit existing entity
```

## 🔧 Core Components

### 1. **Index File (`index.ts`)**
- Central export point for all module components
- Exports pages, components, and hooks
- Makes imports cleaner throughout the application

```typescript
export { EntitiesPage } from './pages/EntitiesPage';
export { AddEntityPage } from './pages/AddEntityPage';
export { EditEntityPage } from './pages/EditEntityPage';
export { EntityCard } from './components/EntityCard';
export { useEntities } from './hooks/useEntities';
```

### 2. **Custom Hook (`hooks/use[Entities].ts`)**

The hook should provide complete CRUD operations and state management:

#### **Core Features:**
- **State Management**: `entities`, `loading`, `error`
- **Authentication**: Integration with `useAuthStore`
- **Company Scoping**: All queries filtered by `company_id`
- **Activity Logging**: All actions logged via `logActivity`

#### **Required Methods:**
```typescript
- fetchEntities()        # Load all entities
- createEntity()         # Create new entity
- updateEntity()         # Update existing entity
- deleteEntity()         # Delete entity
- searchEntities()       # Search functionality
- filterByField()        # Custom filtering
- getNextNumber()        # Auto-incrementing numbers
```

#### **Key Patterns:**
- Automatic refetch after mutations
- Error handling with user-friendly messages
- Optimistic updates for better UX
- Real-time updates support (optional)

### 3. **Component Card (`components/[Entity]Card.tsx`)**

Display component for individual entity visualization:

#### **Features:**
- **Rich Information Display**: Primary and secondary data
- **Visual Hierarchy**: Icons, badges, status indicators
- **Action Menu**: Edit/Delete with permission checks
- **Responsive Design**: Mobile-friendly layout
- **Interactive Elements**: Clickable emails, phones, links

#### **Permission System:**
```typescript
const canEdit = user?.role === 'OWNER' || 
                user?.role === 'SUPERADMIN' || 
                entity.created_by === user?.id;
```

### 4. **Main Page (`pages/[Entities]Page.tsx`)**

#### **Essential Elements:**

**Module Access Control:**
```typescript
const hasModuleAccess = user?.role === 'SUPERADMIN' || 
                        Boolean(moduleEnabled);
```

**Search & Filter UI:**
- Search bar with real-time filtering
- Status/category filters
- Sort options
- Bulk actions (optional)

**Page Structure:**
- Header with title and action buttons
- Statistics/metrics cards
- Grid/List view of entities
- Pagination (for large datasets)
- Empty states with helpful CTAs

### 5. **Add/Edit Pages**

#### **Form Features:**
- **Validation**: Client and server-side
- **Field Groups**: Logical organization
- **Progressive Disclosure**: Show advanced options as needed
- **Auto-save**: Draft saving (optional)
- **Navigation Guards**: Warn on unsaved changes

## 🗄️ Database Schema

### Table Structure Requirements:

```sql
CREATE TABLE module_entities (
  -- Core Fields
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Business Fields
  name text NOT NULL,
  description text,
  status text,
  
  -- Module-specific fields...
);
```

### Essential Elements:
- **UUID Primary Keys**: For distributed systems
- **Company Scoping**: Multi-tenant isolation
- **Audit Fields**: Track creation and updates
- **Soft Deletes**: Optional `deleted_at` field
- **Indexes**: On frequently queried fields
- **RLS Policies**: Row-level security

## 🔐 Security & Permissions

### Role-Based Access Control (RBAC):

```typescript
SUPERADMIN: Full access to all modules
OWNER: Full access to company modules
EMPLOYEE: Read/limited write based on assignment
```

### RLS Policies Pattern:

```sql
-- Read Policy
CREATE POLICY "Company members can read" ON table
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Write Policy  
CREATE POLICY "Authorized users can write" ON table
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND company_id = table.company_id
            AND role IN ('OWNER', 'SUPERADMIN'))
  );
```

## 📊 Module Logging Strategy

### Logging Layers

Modules should implement multiple logging layers for different purposes:

#### 1. **Activity Logging (Audit Trail)**

Track all significant user actions for audit and compliance:

```typescript
// In hooks/useEntities.ts
import { logActivity } from '@/lib/activityLogger';

const createEntity = async (data) => {
  try {
    const entity = await supabase.from('entities').insert(data);
    
    // Log successful action
    await logActivity({
      action_type: 'created',
      resource_type: 'entity_name',
      resource_name: entity.name,
      details: { 
        entity_id: entity.id,
        ...relevantData 
      }
    });
    
    return entity;
  } catch (error) {
    // Log failed action
    await logActivity({
      action_type: 'failed_create',
      resource_type: 'entity_name',
      resource_name: data.name,
      details: { error: error.message }
    });
    throw error;
  }
};
```

#### 2. **Debug Logging (Development)**

Conditional logging for development and troubleshooting:

```typescript
// In lib/logger.ts
const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Also send to error tracking service in production
  }
};

// Usage in module
logger.debug('Fetching entities', { filters, userId });
logger.info('Entity created', { entityId });
logger.warn('Deprecated API usage', { method: 'oldMethod' });
logger.error('Failed to save entity', error);
```

#### 3. **Performance Logging**

Track module performance for optimization:

```typescript
// In hooks/useEntities.ts
const fetchEntities = async () => {
  const startTime = performance.now();
  
  try {
    const data = await supabase.from('entities').select('*');
    
    const duration = performance.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        operation: 'fetchEntities',
        duration: `${duration}ms`,
        count: data.length
      });
    }
    
    return data;
  } catch (error) {
    logger.error('fetchEntities failed', {
      duration: performance.now() - startTime,
      error
    });
    throw error;
  }
};
```

#### 4. **Module Event Logging**

Log inter-module communication:

```typescript
// When emitting events
eventBus.emit('entity:created', entityData);
logger.debug('Event emitted', { 
  event: 'entity:created', 
  module: 'entities',
  entityId: entityData.id 
});

// When receiving events
eventBus.on('client:updated', (data) => {
  logger.debug('Event received', { 
    event: 'client:updated',
    fromModule: 'clients',
    receivedBy: 'entities'
  });
  // Handle event...
});
```

### What to Log

#### **Always Log:**
- CRUD operations (Create, Read, Update, Delete)
- Permission changes
- Module enable/disable
- Data imports/exports
- Failed operations with error details
- Security-relevant actions

#### **Conditionally Log (Development/Debug):**
- API calls and responses
- State changes
- Performance metrics
- Module discovery attempts
- Cache hits/misses

#### **Never Log:**
- Passwords or authentication tokens
- Personal identifiable information (PII) in debug logs
- Full request/response bodies with sensitive data
- Credit card or payment information

### Logging Best Practices

1. **Structured Logging**: Use consistent format
```typescript
{
  timestamp: Date,
  level: 'debug' | 'info' | 'warn' | 'error',
  module: string,
  action: string,
  userId?: string,
  companyId?: string,
  details: object,
  duration?: number
}
```

2. **Contextual Information**: Include relevant context
```typescript
logger.info('Operation completed', {
  module: 'invoices',
  action: 'generate_pdf',
  invoiceId: invoice.id,
  userId: user.id,
  companyId: user.company_id,
  duration: processingTime
});
```

3. **Log Levels by Environment**:
- **Development**: All levels (debug, info, warn, error)
- **Staging**: Info and above
- **Production**: Warn and error only

4. **Async Logging**: Don't block operations
```typescript
// Log asynchronously to avoid blocking
Promise.resolve().then(() => {
  logActivity({ ...activityData });
}).catch(err => {
  console.error('Logging failed:', err);
});
```

5. **Rate Limiting**: Prevent log spam
```typescript
const rateLimiter = new Map();

const logWithRateLimit = (key: string, message: string) => {
  const now = Date.now();
  const lastLogged = rateLimiter.get(key) || 0;
  
  if (now - lastLogged > 60000) { // Once per minute
    logger.warn(message);
    rateLimiter.set(key, now);
  }
};
```

### Module-Specific Logging

Each module should define its logging strategy:

```typescript
// In module config
export const moduleLoggingConfig = {
  // What actions to log
  logActions: ['create', 'update', 'delete', 'import', 'export'],
  
  // Performance thresholds
  performanceThresholds: {
    fetchList: 1000, // ms
    save: 500,
    delete: 300
  },
  
  // Debug mode settings
  debugMode: {
    logStateChanges: true,
    logAPIcalls: true,
    logCacheOperations: false
  }
};
```

### Integration with Monitoring Services

```typescript
// In production, integrate with services like Sentry, LogRocket, etc.
if (process.env.NODE_ENV === 'production') {
  logger.error = (message: string, error?: any) => {
    console.error(message, error);
    
    // Send to Sentry
    Sentry.captureException(error, {
      tags: {
        module: currentModule,
        action: currentAction
      }
    });
    
    // Send to custom analytics
    analytics.track('error', {
      message,
      module: currentModule,
      error: error?.message
    });
  };
}

## 🎨 UI/UX Patterns

### Consistent Design Elements:

1. **Color Coding**:
   - Success: Green (active, completed)
   - Warning: Yellow (pending, attention)
   - Error: Red (inactive, failed)
   - Info: Blue (default, informational)

2. **Icons**: Lucide React icons for consistency
3. **Loading States**: Skeleton screens or spinners
4. **Error Handling**: Toast notifications + inline errors
5. **Empty States**: Helpful messages with action buttons

### Responsive Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🔄 State Management Patterns

### Local State (Component Level):
- Form inputs
- UI toggles
- Temporary filters

### Hook State (Module Level):
- Entity list
- Loading/error states
- Cached data

### Global State (App Level):
- User authentication
- Company context
- Theme preferences

## 🚀 Performance Optimizations

1. **Pagination**: For large datasets (>100 items)
2. **Virtual Scrolling**: For very long lists
3. **Debounced Search**: 300ms delay
4. **Memoization**: React.memo for expensive components
5. **Lazy Loading**: Code splitting for routes
6. **Optimistic Updates**: Immediate UI feedback

## 📝 TypeScript Types

### Define Clear Interfaces:

```typescript
// In types/supabase.ts or module types.ts
export interface ModuleEntity {
  id: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // ... specific fields
}

export interface ModuleFormData {
  // Fields for create/update operations
}

export interface ModuleFilters {
  search?: string;
  status?: string;
  dateRange?: [Date, Date];
}
```

## 🧪 Testing Considerations

### Unit Tests:
- Hook logic
- Utility functions
- Component rendering

### Integration Tests:
- API interactions
- Form submissions
- User workflows

### E2E Tests:
- Complete user journeys
- Permission scenarios
- Error handling

## 🔗 Inter-Module Communication

### Module Independence Principles

Each module must be:
- **Self-Contained**: Fully functional in isolation
- **Loosely Coupled**: No hard dependencies on other modules
- **Gracefully Degrading**: Handle missing dependencies elegantly
- **Discovery-Based**: Detect available modules at runtime

### Communication Patterns

#### 1. **Module Discovery Pattern**

Check if another module exists before using it:

```typescript
// In hooks/useModuleIntegration.ts
export const useModuleIntegration = () => {
  const { modules } = useModules();
  
  const isModuleAvailable = (moduleName: string): boolean => {
    return modules.some(m => 
      m.name === moduleName && 
      (m as any).company_modules?.[0]?.is_enabled
    );
  };
  
  const getModuleData = async (moduleName: string) => {
    if (!isModuleAvailable(moduleName)) {
      return null;
    }
    // Fetch module-specific data
  };
  
  return { isModuleAvailable, getModuleData };
};
```

#### 2. **Optional Dependencies Pattern**

Use conditional imports and checks:

```typescript
// In a component that optionally uses Clients module
import { useModuleIntegration } from '@/hooks/useModuleIntegration';

export const InvoiceForm = () => {
  const { isModuleAvailable } = useModuleIntegration();
  const hasClients = isModuleAvailable('Clients');
  
  // Conditionally import clients hook
  const { clients } = hasClients 
    ? await import('@/modules/clients').then(m => m.useClients())
    : { clients: [] };
  
  return (
    <form>
      {hasClients ? (
        <ClientSelector clients={clients} />
      ) : (
        <input placeholder="Enter client name manually" />
      )}
    </form>
  );
};
```

#### 3. **Shared Data Access Pattern**

Access data from other modules through unified interfaces:

```typescript
// In lib/moduleRegistry.ts
interface ModuleRegistry {
  clients?: {
    getClient: (id: string) => Promise<Client>;
    searchClients: (term: string) => Promise<Client[]>;
  };
  contacts?: {
    getContact: (id: string) => Promise<Contact>;
    getContactsByClient: (clientId: string) => Promise<Contact[]>;
  };
  invoices?: {
    getInvoicesByClient: (clientId: string) => Promise<Invoice[]>;
  };
}

export const moduleRegistry: ModuleRegistry = {};

// Each module registers itself when loaded
export const registerModule = (name: string, api: any) => {
  moduleRegistry[name] = api;
};
```

#### 4. **Event-Based Communication**

Use a pub/sub pattern for loose coupling:

```typescript
// In lib/eventBus.ts
class EventBus {
  private events: Map<string, Set<Function>> = new Map();
  
  on(event: string, callback: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => this.events.get(event)?.delete(callback);
  }
  
  emit(event: string, data?: any) {
    this.events.get(event)?.forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();

// Usage in modules
// Module A emits
eventBus.emit('client:created', { id: clientId, name: clientName });

// Module B listens (if it exists)
useEffect(() => {
  const unsubscribe = eventBus.on('client:created', (data) => {
    // React to client creation
    console.log('New client created:', data);
  });
  
  return unsubscribe;
}, []);
```

#### 5. **Cross-Module Hooks Pattern**

Create hooks that aggregate data from multiple modules:

```typescript
// In hooks/useCrossModuleData.ts
export const useClientWithInvoices = (clientId: string) => {
  const { isModuleAvailable } = useModuleIntegration();
  const [clientData, setClientData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const data: any = {};
      
      // Get client data if module exists
      if (isModuleAvailable('Clients')) {
        const { getClient } = await import('@/modules/clients/hooks/useClients');
        data.client = await getClient(clientId);
      }
      
      // Get invoices if module exists
      if (isModuleAvailable('Invoices')) {
        const { getInvoicesByClient } = await import('@/modules/invoices/hooks/useInvoices');
        data.invoices = await getInvoicesByClient(clientId);
      }
      
      // Get contacts if module exists
      if (isModuleAvailable('Contacts')) {
        const { getContactsByClient } = await import('@/modules/contacts/hooks/useContacts');
        data.contacts = await getContactsByClient(clientId);
      }
      
      setClientData(data);
    };
    
    fetchData();
  }, [clientId]);
  
  return clientData;
};
```

### Module Relationship Examples

#### **Clients ↔ Invoices Integration**
```typescript
// In Invoices module
const InvoiceForm = () => {
  const { isModuleAvailable } = useModuleIntegration();
  
  if (isModuleAvailable('Clients')) {
    // Show client selector
    return <InvoiceWithClientSelector />;
  } else {
    // Show manual client input
    return <InvoiceWithManualClient />;
  }
};
```

#### **Clients ↔ Contacts Integration**
```typescript
// In Clients module - show related contacts if available
const ClientDetails = ({ clientId }) => {
  const { isModuleAvailable } = useModuleIntegration();
  const [contacts, setContacts] = useState([]);
  
  useEffect(() => {
    if (isModuleAvailable('Contacts')) {
      import('@/modules/contacts/hooks/useContacts')
        .then(({ getContactsByClient }) => getContactsByClient(clientId))
        .then(setContacts);
    }
  }, [clientId]);
  
  return (
    <div>
      <ClientInfo />
      {contacts.length > 0 && (
        <RelatedContacts contacts={contacts} />
      )}
    </div>
  );
};
```

### Shared Services Layer

Create shared services that modules can use:

```typescript
// In lib/services/
├── searchService.ts      # Unified search across modules
├── exportService.ts      # Data export functionality
├── reportingService.ts   # Cross-module reporting
└── notificationService.ts # System-wide notifications
```

Example unified search:

```typescript
// In lib/services/searchService.ts
export const unifiedSearch = async (query: string) => {
  const results = {
    clients: [],
    contacts: [],
    invoices: [],
    offers: []
  };
  
  const { modules } = useModules();
  
  // Search each available module
  const searchPromises = [];
  
  if (isModuleEnabled('Clients')) {
    searchPromises.push(
      import('@/modules/clients').then(m => 
        m.searchClients(query).then(r => results.clients = r)
      )
    );
  }
  
  if (isModuleEnabled('Contacts')) {
    searchPromises.push(
      import('@/modules/contacts').then(m => 
        m.searchContacts(query).then(r => results.contacts = r)
      )
    );
  }
  
  await Promise.all(searchPromises);
  return results;
};
```

### Database Relationships

#### **Foreign Keys with Graceful Handling**

```sql
-- Invoices can reference clients, but handle missing client module
CREATE TABLE invoices (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name text NOT NULL, -- Fallback if client is deleted
  -- ... other fields
);

-- Query pattern that works with or without clients
SELECT 
  i.*,
  COALESCE(c.company_name, i.client_name) as display_name
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id;
```

### Module Context Provider

Create a context for module availability:

```typescript
// In contexts/ModuleContext.tsx
interface ModuleContextType {
  availableModules: string[];
  isModuleAvailable: (name: string) => boolean;
  getModuleAPI: (name: string) => Promise<any>;
}

export const ModuleProvider: React.FC = ({ children }) => {
  const { modules } = useModules();
  
  const availableModules = useMemo(() => 
    modules
      .filter(m => (m as any).company_modules?.[0]?.is_enabled)
      .map(m => m.name),
    [modules]
  );
  
  const getModuleAPI = async (name: string) => {
    if (!availableModules.includes(name)) return null;
    
    try {
      const module = await import(`@/modules/${name.toLowerCase()}`);
      return module;
    } catch {
      return null;
    }
  };
  
  return (
    <ModuleContext.Provider value={{
      availableModules,
      isModuleAvailable: (name) => availableModules.includes(name),
      getModuleAPI
    }}>
      {children}
    </ModuleContext.Provider>
  );
};
```

### Best Practices for Module Communication

1. **Never Hard-Code Dependencies**: Always check module availability
2. **Provide Fallbacks**: Manual input when automated integration unavailable
3. **Cache Module Checks**: Avoid repeated availability checks
4. **Use TypeScript Guards**: Type-safe module detection
5. **Document Dependencies**: Clear indication of optional integrations
6. **Test in Isolation**: Each module should have independent tests
7. **Version Compatibility**: Handle different module versions
8. **Performance**: Lazy load optional module code
9. **Error Boundaries**: Isolate module failures
10. **Graceful Degradation**: Core functionality without dependencies

## 📦 Module Registration

In the main app, modules should be:

1. **Dynamically Loaded**: Based on user permissions
2. **Route Registered**: In App.tsx router
3. **Menu Integrated**: In sidebar/navigation
4. **Permission Checked**: At multiple levels
5. **API Registered**: In module registry for cross-module access
6. **Event Listeners Setup**: For inter-module communication

## 🎯 Best Practices Summary

1. **Consistency**: Follow established patterns
2. **Modularity**: Keep modules self-contained
3. **Reusability**: Extract common components
4. **Type Safety**: Leverage TypeScript fully
5. **Performance**: Consider scale from the start
6. **Accessibility**: ARIA labels, keyboard navigation
7. **Documentation**: Comment complex logic
8. **Error Handling**: Graceful degradation
9. **Security**: Never trust client-side only
10. **Testing**: Maintain good coverage

This architecture ensures modules are:
- **Scalable**: Easy to extend
- **Maintainable**: Clear structure
- **Secure**: Multi-layer protection
- **Performant**: Optimized for speed
- **User-Friendly**: Intuitive interfaces

Each module should be a complete, self-contained feature that can be enabled/disabled per company while maintaining consistency with the overall application architecture.

## 🔄 Module Data Flow & Relationships

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
├─────────────────────────────────────────────────────────┤
│                    Module Components                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Clients  │  │ Invoices │  │ Contacts │  │  ...   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
├───────┴──────────────┴──────────────┴───────────┴───────┤
│                  Module Integration Layer                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Module Discovery | Event Bus | Module Registry │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                     Shared Services                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Search  │  │  Export  │  │ Activity │  │  Auth  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
├─────────────────────────────────────────────────────────┤
│                   Database (Supabase)                    │
│  with RLS policies ensuring data isolation              │
└─────────────────────────────────────────────────────────┘
```

### Practical Implementation Examples

#### Example 1: Invoice Module Using Optional Client Data

```typescript
// src/modules/invoices/components/InvoiceForm.tsx
import React, { useState, useEffect } from 'react';
import { useModuleIntegration } from '@/hooks/useModuleIntegration';

export const InvoiceForm: React.FC = () => {
  const { isModuleAvailable, getModuleAPI } = useModuleIntegration();
  const [clientsAPI, setClientsAPI] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  useEffect(() => {
    // Check if Clients module is available and load it
    const loadClientsModule = async () => {
      if (isModuleAvailable('Clients')) {
        const api = await getModuleAPI('Clients');
        setClientsAPI(api);
      }
    };
    loadClientsModule();
  }, []);
  
  return (
    <form>
      {clientsAPI ? (
        // Clients module is available - use client selector
        <div>
          <label>Select Client</label>
          <ClientSelector 
            onSelect={(client) => {
              setSelectedClient(client);
              // Auto-fill client details
              form.setValue('client_name', client.company_name);
              form.setValue('client_email', client.email);
              form.setValue('client_address', client.address);
            }}
          />
        </div>
      ) : (
        // Clients module not available - manual input
        <div>
          <input name="client_name" placeholder="Client Name" required />
          <input name="client_email" placeholder="Client Email" />
          <input name="client_address" placeholder="Client Address" />
        </div>
      )}
      
      {/* Rest of invoice form */}
    </form>
  );
};
```

#### Example 2: Dashboard Aggregating Multiple Modules

```typescript
// src/pages/DashboardPage.tsx
import { useModuleIntegration } from '@/hooks/useModuleIntegration';

export const DashboardPage: React.FC = () => {
  const { isModuleAvailable } = useModuleIntegration();
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    const loadStats = async () => {
      const newStats = {};
      
      // Load stats from each available module
      if (isModuleAvailable('Clients')) {
        const { getClientStats } = await import('@/modules/clients');
        newStats.clients = await getClientStats();
      }
      
      if (isModuleAvailable('Invoices')) {
        const { getInvoiceStats } = await import('@/modules/invoices');
        newStats.invoices = await getInvoiceStats();
      }
      
      if (isModuleAvailable('Tasks')) {
        const { getTaskStats } = await import('@/modules/tasks');
        newStats.tasks = await getTaskStats();
      }
      
      setStats(newStats);
    };
    
    loadStats();
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.clients && <ClientStatsCard {...stats.clients} />}
      {stats.invoices && <InvoiceStatsCard {...stats.invoices} />}
      {stats.tasks && <TaskStatsCard {...stats.tasks} />}
      {/* Only show stats for available modules */}
    </div>
  );
};
```

#### Example 3: Cross-Module Search Implementation

```typescript
// src/components/GlobalSearch.tsx
import { useState } from 'react';
import { useModuleIntegration } from '@/hooks/useModuleIntegration';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const { availableModules, getModuleAPI } = useModuleIntegration();
  
  const handleSearch = async () => {
    const searchResults = {};
    
    // Search in parallel across all available modules
    const searchPromises = availableModules.map(async (moduleName) => {
      try {
        const moduleAPI = await getModuleAPI(moduleName);
        if (moduleAPI?.search) {
          searchResults[moduleName] = await moduleAPI.search(query);
        }
      } catch (error) {
        console.error(`Search failed for ${moduleName}:`, error);
      }
    });
    
    await Promise.all(searchPromises);
    setResults(searchResults);
  };
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Search across all modules..."
      />
      
      <div className="search-results">
        {Object.entries(results).map(([module, items]) => (
          <div key={module}>
            <h3>{module}</h3>
            {items.map(item => (
              <SearchResultItem key={item.id} item={item} module={module} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Database Design for Module Independence

#### Flexible Foreign Keys Pattern

```sql
-- Generic reference table for cross-module relationships
CREATE TABLE module_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module text NOT NULL,
  source_id uuid NOT NULL,
  target_module text NOT NULL,
  target_id uuid NOT NULL,
  relationship_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(source_module, source_id, target_module, target_id, relationship_type)
);

-- Example: Invoice can work with or without specific modules
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields that always exist
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  
  -- Flexible client reference
  client_id uuid, -- Can be NULL if Clients module not available
  client_name text NOT NULL, -- Always store name for independence
  client_details jsonb, -- Store snapshot of client data
  
  -- Status and amounts
  status text NOT NULL DEFAULT 'DRAFT',
  total_amount decimal(10,2) NOT NULL,
  
  company_id uuid REFERENCES companies(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for optional foreign key
CREATE INDEX idx_invoices_client_id ON invoices(client_id) 
  WHERE client_id IS NOT NULL;
```

### Module Lifecycle Hooks

```typescript
// src/lib/moduleLifecycle.ts
export interface ModuleLifecycle {
  onEnable: () => Promise<void>;
  onDisable: () => Promise<void>;
  onInstall: () => Promise<void>;
  onUninstall: () => Promise<void>;
  onUpgrade: (fromVersion: string, toVersion: string) => Promise<void>;
}

// Example implementation in a module
export const clientsModuleLifecycle: ModuleLifecycle = {
  onEnable: async () => {
    // Register module in registry
    registerModule('clients', clientsAPI);
    
    // Set up event listeners
    eventBus.on('user:created', handleNewUser);
    
    // Initialize module-specific settings
    await initializeClientSettings();
  },
  
  onDisable: async () => {
    // Clean up event listeners
    eventBus.off('user:created', handleNewUser);
    
    // Unregister from module registry
    unregisterModule('clients');
  },
  
  onInstall: async () => {
    // Run initial setup
    await createDefaultCategories();
    await setupDefaultPermissions();
  },
  
  onUninstall: async () => {
    // Archive data instead of deleting
    await archiveClientData();
  },
  
  onUpgrade: async (fromVersion, toVersion) => {
    // Handle version-specific migrations
    if (fromVersion < '2.0.0' && toVersion >= '2.0.0') {
      await migrateToNewSchema();
    }
  }
};
```

### Testing Module Independence

```typescript
// src/modules/invoices/__tests__/independence.test.ts
import { render } from '@testing-library/react';
import { InvoiceForm } from '../components/InvoiceForm';

describe('Invoice Module Independence', () => {
  it('should work without Clients module', () => {
    // Mock module availability
    jest.mock('@/hooks/useModuleIntegration', () => ({
      useModuleIntegration: () => ({
        isModuleAvailable: (name: string) => false,
        getModuleAPI: () => null
      })
    }));
    
    const { getByPlaceholderText } = render(<InvoiceForm />);
    
    // Should show manual input fields
    expect(getByPlaceholderText('Client Name')).toBeInTheDocument();
    expect(getByPlaceholderText('Client Email')).toBeInTheDocument();
  });
  
  it('should integrate with Clients module when available', () => {
    // Mock module availability
    jest.mock('@/hooks/useModuleIntegration', () => ({
      useModuleIntegration: () => ({
        isModuleAvailable: (name: string) => name === 'Clients',
        getModuleAPI: () => mockClientsAPI
      })
    }));
    
    const { getByText } = render(<InvoiceForm />);
    
    // Should show client selector
    expect(getByText('Select Client')).toBeInTheDocument();
  });
});
```

### Module Configuration Schema

```typescript
// src/types/module.config.ts
export interface ModuleConfig {
  name: string;
  version: string;
  description: string;
  
  // Dependencies
  dependencies?: {
    required: string[]; // Modules that must be present
    optional: string[]; // Modules that enhance functionality
    incompatible: string[]; // Modules that conflict
  };
  
  // Capabilities
  provides: {
    api?: string[]; // API methods this module exposes
    events?: string[]; // Events this module emits
    hooks?: string[]; // Hooks this module provides
  };
  
  // Requirements
  requires: {
    permissions?: string[]; // Required permissions
    settings?: string[]; // Required settings
    database?: {
      tables: string[]; // Required tables
      functions?: string[]; // Required DB functions
    };
  };
  
  // UI Integration
  ui: {
    routes?: RouteConfig[];
    menuItems?: MenuItemConfig[];
    widgets?: WidgetConfig[];
    dashboardCards?: DashboardCardConfig[];
  };
}

// Example module config
export const invoicesModuleConfig: ModuleConfig = {
  name: 'Invoices',
  version: '1.0.0',
  description: 'Manage invoices and billing',
  
  dependencies: {
    optional: ['Clients', 'Products', 'Taxes'],
    incompatible: ['LegacyBilling']
  },
  
  provides: {
    api: ['getInvoice', 'createInvoice', 'searchInvoices'],
    events: ['invoice:created', 'invoice:paid', 'invoice:cancelled'],
    hooks: ['useInvoices', 'useInvoiceStats']
  },
  
  requires: {
    permissions: ['invoices:read', 'invoices:write'],
    database: {
      tables: ['invoices', 'invoice_items', 'invoice_templates']
    }
  },
  
  ui: {
    routes: [
      { path: '/invoices', component: 'InvoicesPage' },
      { path: '/invoices/:id', component: 'InvoiceDetail' }
    ],
    menuItems: [
      { label: 'Invoices', icon: 'FileText', path: '/invoices' }
    ],
    dashboardCards: [
      { component: 'InvoiceStatsCard', position: 'top' }
    ]
  }
};
```