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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-surface-600 dark:text-surface-400">Loading...</p>
        </div>
      </div>
    );
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-gray-600">
            Manage your accounting and bookkeeping clients
          </p>
        </div>

        <button
          onClick={() => navigate('/clients/add')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search clients, companies, business types..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 text-primary-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Signed Contracts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      clients.filter(
                        (c) =>
                          c.contract_status === 'Signed' ||
                          c.contract_status === 'Podpisana'
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      clients.filter(
                        (c) =>
                          c.contract_status === 'Pending' ||
                          c.contract_status === 'W trakcie'
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Using e-SZOK
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.filter((c) => c.e_szok_system).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {clients.length === 0
                ? 'Welcome to Client Management'
                : 'No matching clients found'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              {clients.length === 0
                ? 'Start managing your accounting clients efficiently. Add your first client to track contracts, tax forms, and business details.'
                : searchTerm
                  ? `No clients match "${searchTerm}". Try different search terms or check the spelling.`
                  : statusFilter !== 'all'
                    ? `No clients with status "${statusFilter}". Try a different status filter.`
                    : 'Try adjusting your search or filters to find clients.'}
            </p>
            {clients.length === 0 ? (
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => navigate('/clients/add')}
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Client
                </button>
                <div className="text-sm text-gray-500">
                  <p>Quick tips to get started:</p>
                  <ul className="mt-2 space-y-1 text-left max-w-sm mx-auto">
                    <li>• Add basic company information</li>
                    <li>• Set up tax and VAT configurations</li>
                    <li>• Track contract status</li>
                    <li>• Manage multiple contacts per client</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear Search
                  </button>
                )}
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => navigate('/clients/add')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </button>
              </div>
            )}
          </div>
        </div>
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
