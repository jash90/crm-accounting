# Multi-Tenant SaaS Platform

A modern multi-tenant SaaS platform built with React 19, Vite, TypeScript, and Supabase.

## 🏗️ Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: Zustand (coming in Phase 3)
- **UI Components**: shadcn/ui (coming in Phase 3)

## 🔒 Security Model

- **Multi-tenancy**: Company-based isolation with Row Level Security
- **Roles**: SUPERADMIN, OWNER, EMPLOYEE
- **Authentication**: JWT tokens via Supabase Auth
- **Authorization**: RLS policies + client-side guards

## 📊 Database Schema

### Core Tables
- `companies` - Tenant isolation
- `users` - Extended user profiles (linked to Supabase Auth)
- `modules` - Application features/modules
- `invites` - Invitation system
- `users_modules` - User-module assignments

### Key Relationships
- Users belong to companies
- Modules can be company-specific or global
- Invites create new users within companies
- Module access is controlled via junction table

## 🚀 Getting Started

1. **Set up Supabase**:
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` in order
   - Copy your project URL and anon key to `.env`

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Add your Supabase credentials
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Unit tests with UI
npm run test:ui

# E2E tests
npm run cypress:open

# Run all tests
npm run test:all
```

## 📁 Project Structure

```
src/
├── lib/           # Utilities and configurations
├── types/         # TypeScript type definitions
├── components/    # Reusable UI components (Phase 3)
├── pages/         # Route components (Phase 3)
├── hooks/         # Custom React hooks (Phase 3)
└── stores/        # Zustand state stores (Phase 3)
```

## 🗄️ Database Migrations

Run these SQL commands in your Supabase SQL editor:

1. `001_initial_schema.sql` - Core tables and relationships
2. `002_rls_policies.sql` - Row Level Security policies  
3. `003_auth_functions.sql` - Helper functions and triggers

## 🔧 Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run supabase:gen` - Generate TypeScript types from schema