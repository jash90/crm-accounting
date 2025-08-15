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

## 📊 Activity Logging

All significant actions should be logged:

```typescript
await logActivity({
  action_type: 'created|updated|deleted|enabled|disabled',
  resource_type: 'entity_name',
  resource_name: entity.name,
  details: { ...relevantData }
});
```

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

## 📦 Module Registration

In the main app, modules should be:

1. **Dynamically Loaded**: Based on user permissions
2. **Route Registered**: In App.tsx router
3. **Menu Integrated**: In sidebar/navigation
4. **Permission Checked**: At multiple levels

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