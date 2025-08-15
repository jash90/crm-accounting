# Module Development Prompt for Claude Sonnet

## Context
You are developing modules for a CRM accounting system built with React, TypeScript, Supabase, and Tailwind CSS. Each module must be self-contained, work independently, but enhance functionality when integrated with other modules.

## Module Structure
```
src/modules/[module-name]/
├── index.ts                 # Exports all module components
├── components/              # UI components (EntityCard.tsx)
├── hooks/                   # Custom hooks (useEntities.ts)
└── pages/                   # Page components (EntitiesPage, AddEntityPage, EditEntityPage)
```

## Core Requirements

### 1. **Independence & Integration**
- Module MUST function fully in isolation
- Check for other modules using `isModuleAvailable(moduleName)`
- Provide fallbacks when dependencies are missing (e.g., manual input vs auto-select)
- Use event bus for loose coupling between modules

### 2. **Data Management Hook**
Every module needs a primary hook with:
- State: `entities`, `loading`, `error`
- Methods: `fetchEntities()`, `createEntity()`, `updateEntity()`, `deleteEntity()`, `searchEntities()`
- Company scoping: Filter by `company_id`
- Activity logging: Log all CRUD operations
- Auto-refresh after mutations

### 3. **Database Design**
```sql
CREATE TABLE module_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- module-specific fields
);
```
- Always include RLS policies for company isolation
- Optional foreign keys for cross-module references
- Store fallback data (e.g., client_name even if client_id exists)

### 4. **Permission System**
- Check module access: `user.role === 'SUPERADMIN' || moduleEnabled`
- CRUD permissions based on roles (OWNER, EMPLOYEE)
- Show AccessDenied component when unauthorized

### 5. **Inter-Module Communication**
```typescript
// Check if another module exists
if (isModuleAvailable('Clients')) {
  const clientsAPI = await import('@/modules/clients');
  // Use enhanced features
} else {
  // Provide manual fallback
}
```

### 6. **UI Patterns**
- EntityCard component for display
- Search bar with real-time filtering
- Status badges with consistent colors (green=active, yellow=pending, red=error)
- Action menus with permission checks
- Empty states with helpful CTAs
- Loading skeletons during data fetch

### 7. **Logging Strategy**
- Activity logs for audit trail (stored in DB)
- Debug logs in development only
- Performance warnings for slow operations (>1000ms)
- Never log sensitive data (passwords, tokens, PII)

## Implementation Checklist

When creating a new module, ensure:

✅ **Structure**
- [ ] Follows the standard folder structure
- [ ] Has index.ts exporting all public components
- [ ] Includes TypeScript types in types/supabase.ts

✅ **Functionality**
- [ ] Works without any other modules
- [ ] Enhances when other modules are available
- [ ] Implements full CRUD operations
- [ ] Has search and filter capabilities
- [ ] Logs all significant actions

✅ **Database**
- [ ] Table with required fields (id, company_id, timestamps)
- [ ] RLS policies for security
- [ ] Indexes on frequently queried fields
- [ ] Migration file created

✅ **UI/UX**
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Consistent with existing modules
- [ ] Loading and error states handled
- [ ] Permission-based UI elements
- [ ] Toast notifications for user feedback

✅ **Integration**
- [ ] Module discovery implemented
- [ ] Event emitters for other modules
- [ ] API registered in module registry
- [ ] Routes added to App.tsx
- [ ] Sidebar menu item (if applicable)

## Example Module Creation Flow

1. **Plan the module**: Define entities, relationships, and UI needs
2. **Create database schema**: Tables, indexes, RLS policies
3. **Build the hook**: Implement useEntities with all CRUD operations
4. **Create components**: EntityCard for display
5. **Build pages**: List page, Add page, Edit page
6. **Add integration points**: Module discovery, event bus, API registration
7. **Implement logging**: Activity logs, debug logs, performance monitoring
8. **Test independence**: Verify module works alone and with others
9. **Document**: Add module-specific documentation

## Key Principles

1. **Self-Contained**: Every module must work independently
2. **Loosely Coupled**: No hard dependencies between modules
3. **Gracefully Degrading**: Missing dependencies don't break functionality
4. **Consistently Structured**: Follow the established patterns
5. **Securely Isolated**: Company data separation via RLS
6. **Fully Logged**: Audit trail for all actions
7. **Performance Conscious**: Monitor and optimize slow operations
8. **User-Friendly**: Clear feedback and intuitive interfaces

## Anti-Patterns to Avoid

❌ Hard-coding dependencies on other modules
❌ Storing sensitive data in logs
❌ Blocking operations with synchronous logging
❌ Tight coupling through direct imports
❌ Missing permission checks
❌ No fallback for missing modules
❌ Inconsistent UI patterns
❌ Missing error handling

## Module Communication Example

```typescript
// Invoice module checking for Clients module
const InvoiceForm = () => {
  const { isModuleAvailable } = useModuleIntegration();
  
  if (isModuleAvailable('Clients')) {
    // Show client selector with auto-fill
    return <InvoiceWithClientSelector />;
  } else {
    // Show manual input fields
    return <InvoiceWithManualClient />;
  }
};
```

This architecture ensures modules are scalable, maintainable, secure, and provide excellent user experience while maintaining complete independence.
