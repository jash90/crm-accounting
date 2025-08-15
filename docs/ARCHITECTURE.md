# Multi-Tenant SaaS Platform Architecture

## Overview

This is a comprehensive multi-tenant SaaS platform built with modern web technologies, featuring company-based isolation, role-based access control, and enterprise-grade security.

## Tech Stack

### Frontend
- **React 19** - Modern React with concurrent features
- **Vite 5** - Lightning-fast build tool and dev server
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing with nested routes
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icons

### Backend-as-a-Service
- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - JWT-based authentication
- **Supabase Edge Functions** - Serverless functions for business logic
- **Row Level Security (RLS)** - Database-level security policies

### Testing
- **Vitest** - Unit testing framework
- **Cypress** - End-to-end testing
- **Testing Library** - Component testing utilities

## Architecture Patterns

### 1. Multi-Tenancy
- **Company-based isolation** using `company_id` foreign keys
- **Row Level Security** ensures data isolation at the database level
- **Shared database, isolated data** model for cost efficiency

### 2. Role-Based Access Control (RBAC)
- **Three-tier hierarchy**: SUPERADMIN > OWNER > EMPLOYEE
- **Permission inheritance** - higher roles include lower role permissions
- **Client and server-side validation** for security

### 3. Security Model
- **JWT tokens** managed entirely by Supabase Auth
- **RLS policies** for database-level security
- **Edge Functions** for sensitive operations
- **Input validation** at all levels

## Database Schema

### Core Tables

```sql
-- Company isolation
companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
)

-- Extended user profiles
users (
  id UUID PRIMARY KEY, -- Matches auth.users.id
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPERADMIN', 'OWNER', 'EMPLOYEE')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
)

-- Feature modules
modules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = global
  created_by UUID REFERENCES users(id),
  is_public_within_company BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
)

-- Invitation system
invites (
  id UUID PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'EMPLOYEE')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  expires_at TIMESTAMP DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP DEFAULT now()
)

-- Module assignments
users_modules (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
)
```

### Key RLS Policies

```sql
-- Company data isolation
CREATE POLICY "company_isolation" ON companies
  FOR ALL TO authenticated
  USING (
    id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Module visibility control
CREATE POLICY "module_access" ON modules
  FOR SELECT TO authenticated
  USING (
    -- Global modules
    company_id IS NULL
    -- Company modules
    OR company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    -- Public company modules
    OR (is_public_within_company = true 
        AND company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
    -- Superadmin access
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );
```

## Component Architecture

### 1. Layout System
```
App
├── DashboardLayout
│   ├── Navbar (role-aware navigation)
│   └── Outlet (page content)
├── LoginPage
├── RegisterPage
└── AcceptInvitePage
```

### 2. State Management
```typescript
// Zustand store for authentication
interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, companyName: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkPermission: (role: UserRole) => boolean;
}
```

### 3. Custom Hooks
- `useModules()` - Module CRUD operations
- `useInvites()` - Invitation management
- `useCompanyUsers()` - Company user management

## Security Considerations

### 1. Authentication & Authorization
- **Supabase Auth** handles password hashing, JWT generation, and session management
- **Role hierarchy** enforced both client and server-side
- **Protected routes** with automatic redirects

### 2. Data Security
- **Row Level Security** prevents unauthorized data access
- **Input validation** on all forms and API endpoints
- **HTTPS only** in production
- **Environment variables** for sensitive configuration

### 3. Multi-Tenancy Security
- **Company isolation** at database level
- **No shared data** between companies (except global modules)
- **Audit trails** through created_at timestamps

## Edge Functions

### 1. register-owner
```typescript
// Creates company and owner account atomically
POST /functions/v1/register-owner
Body: { email, password, companyName }
```

### 2. create-invite
```typescript
// Creates invitation with secure token
POST /functions/v1/create-invite
Headers: { Authorization: Bearer <jwt> }
Body: { email, role }
```

### 3. accept-invite
```typescript
// Processes invitation acceptance
POST /functions/v1/accept-invite
Body: { token, password }
```

## Performance Optimizations

### 1. Database
- **Indexes** on frequently queried columns
- **Foreign key constraints** for data integrity
- **Cascade deletes** for cleanup

### 2. Frontend
- **Code splitting** with React Router
- **Optimistic updates** for better UX
- **Error boundaries** for graceful error handling

### 3. Caching
- **Browser session storage** for user state
- **React Query** (future enhancement) for server state

## Deployment

### Development
```bash
npm run dev          # Start dev server
npm run test         # Run unit tests
npm run cypress:open # E2E testing
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Future Enhancements

1. **React Query** for advanced server state management
2. **Real-time subscriptions** for live updates
3. **File uploads** with Supabase Storage
4. **Audit logging** for compliance
5. **Email notifications** for invitations
6. **SSO integration** for enterprise customers
7. **API rate limiting** for security
8. **Multi-factor authentication**

## Monitoring & Analytics

1. **Error tracking** with Sentry integration
2. **Performance monitoring** with Web Vitals
3. **User analytics** with privacy-first approach
4. **Database monitoring** through Supabase dashboard

This architecture provides a solid foundation for a scalable, secure, multi-tenant SaaS platform with room for future enhancements and enterprise features.