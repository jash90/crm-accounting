import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useModules } from '@/hooks/useModules';
import { useClients } from '../hooks/useClients';
import { ClientCard } from '../components/ClientCard';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { Building2, Plus, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Client } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FinanceCard } from '@/components/ui/finance-card';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner, PageLoading } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

export const ClientsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { modules, loading: modulesLoading } = useModules();
  const { clients, loading, deleteClient, refetch } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check if user has access to Clients module (assuming it exists)
  const clientsModule = modules.find(
    (module) =>
      module.name === 'Clients' &&
      (module as any).company_modules?.[0]?.is_enabled
  );

  const hasClientsAccess =
    user?.role === 'SUPERADMIN' || Boolean(clientsModule);

  // Show loading while checking module access
  if (modulesLoading) {
    return <PageLoading message="Loading clients module..." />;
  }

  // Show access denied if user doesn't have access to clients module
  if (!hasClientsAccess) {
    return (
      <AccessDenied moduleName="Clients" userRole={user?.role || 'EMPLOYEE'} />
    );
  }

  const handleEditClient = (client: Client) => {
    navigate(`/clients/${client.id}/edit`);
  };

  const handleDeleteClient = async (client: Client) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${client.company_name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteClient(client.id);
      toast.success('Client deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete client');
    }
  };

  // Filter clients based on search term and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.business_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.tax_form?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || client.contract_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusOptions = () => {
    const statuses = [...new Set(clients.map((c) => c.contract_status))].filter(
      Boolean
    );
    return [
      { value: 'all', label: 'All Statuses' },
      ...statuses.map((status) => ({ value: status, label: status })),
    ];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your accounting and bookkeeping clients"
      >
        <Button onClick={() => navigate('/clients/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                placeholder="Search clients, companies, business types..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 text-base border border-input focus:outline-none focus:ring-ring focus:border-ring sm:text-sm rounded-md bg-background"
              >
                {getStatusOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <StatusBadge variant="info">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 hover:opacity-70"
                >
                  ×
                </button>
              </StatusBadge>
            )}
            {statusFilter !== 'all' && (
              <StatusBadge variant="success">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-2 hover:opacity-70"
                >
                  ×
                </button>
              </StatusBadge>
            )}
          </div>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <FinanceCard
          title="Total Clients"
          value={clients.length.toString()}
          icon={<Building2 className="h-6 w-6" />}
          trend="neutral"
        />
        
        <FinanceCard
          title="Signed Contracts"
          value={clients.filter((c) => 
            c.contract_status === 'Signed' || c.contract_status === 'Podpisana'
          ).length.toString()}
          trend="up"
          description="Active contracts"
        />
        
        <FinanceCard
          title="Pending"
          value={clients.filter((c) => 
            c.contract_status === 'Pending' || c.contract_status === 'W trakcie'
          ).length.toString()}
          trend="neutral"
          description="Contracts in progress"
        />
        
        <FinanceCard
          title="Using e-SZOK"
          value={clients.filter((c) => c.e_szok_system).length.toString()}
          trend="neutral"
          description="Digital system users"
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading clients..." className="py-12" />
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Building2 className="h-16 w-16" />}
              title={clients.length === 0 
                ? 'Welcome to Client Management' 
                : 'No matching clients found'}
              description={clients.length === 0
                ? 'Start managing your accounting clients efficiently. Add your first client to track contracts, tax forms, and business details.'
                : searchTerm
                  ? `No clients match "${searchTerm}". Try different search terms or check the spelling.`
                  : statusFilter !== 'all'
                    ? `No clients with status "${statusFilter}". Try a different status filter.`
                    : 'Try adjusting your search or filters to find clients.'}
              action={clients.length === 0 ? {
                label: 'Add Your First Client',
                onClick: () => navigate('/clients/add')
              } : undefined}
            />
            {clients.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
                {statusFilter !== 'all' && (
                  <Button variant="outline" onClick={() => setStatusFilter('all')}>
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => navigate('/clients/add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
            />
          ))}
        </div>
      )}
    </div>
  );
};
