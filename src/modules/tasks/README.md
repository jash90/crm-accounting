# Tasks Module

## Overview
The Tasks module provides comprehensive task management capabilities with full integration with the Clients module. It supports recurring tasks, statutory deadlines (Polish tax compliance), and Kanban board organization.

## Features
- ✅ Complete CRUD operations for tasks
- ✅ Client integration (optional - works standalone)
- ✅ Recurring tasks with flexible patterns
- ✅ Polish statutory compliance (VAT-7, CIT-8, PIT-4, ZUS, etc.)
- ✅ **Interactive Kanban board with drag-and-drop** (Default view)
- ✅ Multiple view modes: Kanban, Grid, and List
- ✅ Task assignments and priority management
- ✅ Activity logging and audit trail
- ✅ Performance monitoring

## Module Integration

### Using Tasks with Clients Module

When the Clients module is available, the Tasks module automatically enhances it with:

1. **Task Statistics on Client Cards**
   ```tsx
   import { ClientCardWithTasks } from '@/modules/clients';
   
   // This component automatically shows task stats if Tasks module is available
   <ClientCardWithTasks client={client} />
   ```

2. **Client-Specific Task Views**
   ```tsx
   // Navigate to tasks filtered by client
   navigate('/tasks?clientId=' + clientId);
   
   // Create a new task with pre-selected client
   navigate('/tasks/new?clientId=' + clientId);
   ```

3. **Task Integration Hook**
   ```tsx
   import { useClientTaskIntegration } from '@/modules/tasks';
   
   const { stats, overdueTasks, upcomingTasks, actions } = useClientTaskIntegration(clientId);
   
   // Use task stats in your components
   <div>Total Tasks: {stats?.total}</div>
   <div>Overdue: {stats?.overdue}</div>
   
   // Use actions to interact with tasks
   <button onClick={() => actions.createTask(clientId)}>
     Create Task
   </button>
   ```

### API Methods

The Tasks module exposes a comprehensive API:

```typescript
import { tasksAPI } from '@/modules/tasks';

// Get tasks for a client
const tasks = await tasksAPI.getClientTasks(clientId);

// Get task statistics
const stats = await tasksAPI.getClientTaskStats(clientId);

// Create a task for a client
const task = await tasksAPI.createTaskForClient(clientId, {
  title: 'Review tax documents',
  priority: 'high',
  due_date: '2024-12-31'
});

// Get overdue tasks
const overdueTasks = await tasksAPI.getClientOverdueTasks(clientId);

// Get upcoming tasks (next 7 days)
const upcomingTasks = await tasksAPI.getClientUpcomingTasks(clientId, 7);

// Create statutory tasks
await tasksAPI.createStatutoryTasks([clientId], 'VAT-7');

// Search tasks
const results = await tasksAPI.searchTasks({
  search_term: 'invoice',
  status_filter: 'todo',
  priority_filter: 'high'
});
```

## Statutory Task Templates

The module includes pre-configured templates for Polish tax compliance:

- **VAT-7**: Monthly VAT declaration (25th of each month)
- **CIT-8**: Annual corporate income tax (March 31st)
- **PIT-4**: Annual personal income tax (January 31st)
- **ZUS**: Monthly social security (15th of each month)
- **JPK**: Monthly audit file (25th of each month)
- **CEIDG**: Annual business registry update (December 31st)
- **CUSTOMS**: Quarterly customs declaration

## Database Schema

### Main Tables
- `tasks` - Core task data
- `task_checklist_items` - Checklist items for tasks
- `task_comments` - Task comments and discussions
- `task_templates` - Reusable task templates

### Key Fields
- `client_id` - Optional link to client
- `assigned_to` - User assignment
- `priority` - low, medium, high, urgent
- `status` - todo, in_progress, review, completed, cancelled
- `board_column` - Kanban board column
- `is_statutory` - Statutory task flag
- `recurrence_pattern` - Recurrence configuration

## Kanban Board Features

### Interactive Drag-and-Drop
The Kanban board supports full drag-and-drop functionality:

- **Drag tasks between columns** to change status
- **Visual feedback** during drag operations
- **Auto-saves** status changes to database
- **Real-time updates** across all views

### Column Structure
- **Backlog**: Planning and future tasks
- **To Do**: Ready to start tasks
- **In Progress**: Currently active tasks with animated indicator
- **Review**: Tasks awaiting review or approval
- **Completed**: Finished tasks
- **Cancelled**: Cancelled or discarded tasks

### Smart Indicators
- **Overdue tasks**: Red highlighting and warning icons
- **Due today**: Yellow highlighting for urgent attention
- **Priority levels**: Color-coded badges (Urgent: Red, High: Orange, etc.)
- **Statutory tasks**: Purple border for compliance tracking
- **Task counts**: Per-column counters with priority breakdowns

### Quick Actions
- **Add new task**: Quick add button in Todo column
- **Task details**: Click any task card to view/edit details
- **Priority filtering**: Visual priority indicators and counts
- **Assignment tracking**: User avatars and assignment info

## Usage Examples

### Using the Kanban Board
```tsx
import { KanbanBoard } from '@/modules/tasks';

const TaskDashboard = () => {
  const { tasks, loading } = useTasks();
  
  return (
    <div className="h-screen">
      <KanbanBoard tasks={tasks} loading={loading} />
    </div>
  );
};
```

### Creating a Task with Client Integration
```tsx
import { useTasks } from '@/modules/tasks';
import { isModuleAvailable } from '@/lib/moduleRegistry';

const TaskForm = () => {
  const { createTask } = useTasks();
  const hasClients = isModuleAvailable('clients');
  
  return (
    <form onSubmit={handleSubmit}>
      {hasClients ? (
        <ClientSelector onChange={setClientId} />
      ) : (
        <input placeholder="Client name (optional)" />
      )}
      
      <input name="title" placeholder="Task title" required />
      <button type="submit">Create Task</button>
    </form>
  );
};
```

### Displaying Tasks in Client View
```tsx
import { useClientTaskIntegration } from '@/modules/tasks';

const ClientDetailPage = ({ clientId }) => {
  const { stats, overdueTasks, loading } = useClientTaskIntegration(clientId);
  
  if (loading) return <div>Loading tasks...</div>;
  
  return (
    <div>
      <h3>Tasks Overview</h3>
      <div>Total: {stats?.total}</div>
      <div>Pending: {stats?.pending}</div>
      <div>Overdue: {stats?.overdue}</div>
      
      {overdueTasks.length > 0 && (
        <div>
          <h4>Overdue Tasks</h4>
          {overdueTasks.map(task => (
            <div key={task.id}>{task.title}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Module Configuration

The module can be configured via the `config.ts` file:

```typescript
export const tasksModuleConfig = {
  name: 'Tasks Management',
  version: '1.0.0',
  dependencies: {
    optional: ['clients']
  },
  performanceThresholds: {
    fetchTasks: 2000, // ms
    createTask: 1000,
    updateTask: 1000,
    deleteTask: 500
  }
};
```

## Testing

```bash
# Run tests
npm test

# Type checking
npx tsc --noEmit

# Build verification
npm run build
```

### Recent Updates
- ✅ **Kanban Board Added** - Interactive drag-and-drop Kanban board as default view
- ✅ **Multi-View Support** - Toggle between Kanban, Grid, and List views
- ✅ **Enhanced Task Cards** - Rich task cards with priority indicators, due dates, and assignee info
- ✅ **Drag-and-Drop Status Updates** - Tasks automatically update status when moved between columns
- ✅ **Visual Feedback** - Column highlights, task counts, and priority indicators
- ✅ **PERFORMANCE_THRESHOLDS Import Fixed** - Fixed ReferenceError by importing as value instead of type
- ✅ **DOM Nesting Warning Fixed** - Resolved nested button issue in TaskClientSelector component
- ✅ **Client API Integration Fixed** - Updated to use correct Clients module API methods
- ✅ **Module Registration Fixed** - Properly handles both 'clients' and 'Clients' module names
- ✅ **Created By Field Fixed** - All task creation methods now properly set created_by field

## Module Independence

The Tasks module is designed to work independently. When the Clients module is not available:
- Tasks can still be created with manual client information
- All core task management features remain functional
- The module gracefully degrades without breaking

## Performance

The module includes built-in performance monitoring:
- Query performance tracking
- Slow operation warnings
- Optimized database queries with proper indexing
- Efficient data fetching with pagination support

## Security

- Row Level Security (RLS) for company isolation
- Role-based access control
- Input validation and sanitization
- Activity logging for audit trail

## Future Enhancements

- [ ] Drag-and-drop Kanban board
- [ ] Advanced recurring task patterns
- [ ] Email notifications
- [ ] Task dependencies
- [ ] Gantt chart view
- [ ] Time tracking with timer
- [ ] File attachments
- [ ] Task templates library