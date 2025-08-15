/**
 * Clients Module
 * Main export file with auto-registration
 */

import { registerModule } from '@/lib/moduleRegistry';
import { clientsAPI } from './api';
import { clientsModuleConfig } from './config';

// Register module when imported
if (typeof window !== 'undefined') {
  // Combine API with module configuration
  registerModule('Clients', {
    ...clientsModuleConfig,
    api: clientsAPI,
  });

  console.log('[Clients Module] Registered with module registry');
}

// Component exports
export { ClientsPage } from './pages/ClientsPage';
export { AddClientPage } from './pages/AddClientPage';
export { EditClientPage } from './pages/EditClientPage';
export { ClientCard } from './components/ClientCard';

// Hook exports
export { useClients } from './hooks/useClients';

// API exports for direct access
export { clientsAPI } from './api';
export type { ClientsAPI } from './api';

// Configuration exports
export {
  clientsModuleConfig,
  performanceThresholds,
  modulePermissions,
} from './config';

// Re-export module types
export type { Client } from '@/types/supabase';
