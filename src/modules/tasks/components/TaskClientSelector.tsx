import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, X } from 'lucide-react';
import { isModuleAvailable, getModuleAPI } from '@/lib/moduleRegistry';

interface Client {
  id: string;
  company_name?: string;
  name?: string;
  email?: string;
}

interface TaskClientSelectorProps {
  value?: string;
  onChange: (clientId: string | null, clientName?: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const TaskClientSelector: React.FC<TaskClientSelectorProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'Select a client',
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const hasClientsModule = isModuleAvailable('clients') || isModuleAvailable('Clients');

  // Load clients if module is available
  useEffect(() => {
    const loadClients = async () => {
      if (!hasClientsModule) return;

      setLoading(true);
      try {
        const clientsAPI = getModuleAPI('clients') || getModuleAPI('Clients');
        if (clientsAPI && clientsAPI.getActiveClients) {
          const clientsData = await clientsAPI.getActiveClients();
          setClients(clientsData || []);
        } else if (clientsAPI && clientsAPI.searchClients) {
          // Fallback: search for all clients with an empty term
          const clientsData = await clientsAPI.searchClients('');
          setClients(clientsData || []);
        } else {
          console.warn('Clients API not available or missing required methods');
          setClients([]);
        }
      } catch (error) {
        console.warn('Failed to load clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [hasClientsModule]);

  // Find selected client when value changes
  useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find(c => c.id === value);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [value, clients]);

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    const companyName = client.company_name?.toLowerCase() || '';
    const name = client.name?.toLowerCase() || '';
    const email = client.email?.toLowerCase() || '';
    
    return companyName.includes(searchLower) || 
           name.includes(searchLower) || 
           email.includes(searchLower);
  });

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    onChange(client.id, client.company_name || client.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedClient(null);
    onChange(null);
    setSearchTerm('');
  };

  const handleManualInput = (clientName: string) => {
    onChange(null, clientName);
  };

  // If Clients module is not available, fall back to manual input
  if (!hasClientsModule) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <Building2 className="inline h-4 w-4 mr-1" />
          Client Name {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Enter client name manually"
          onChange={(e) => handleManualInput(e.target.value)}
          required={required}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Install the Clients module for enhanced client selection with auto-complete
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <Building2 className="inline h-4 w-4 mr-1" />
        Client {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              onClick={() => setIsOpen(!isOpen)}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              <span className={selectedClient ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                {selectedClient 
                  ? (selectedClient.company_name || selectedClient.name || 'Unknown Client')
                  : placeholder
                }
              </span>
            </button>
            <div className="flex items-center gap-1 ml-2">
              {selectedClient && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Clear selection"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Toggle dropdown"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {/* Client list */}
            <div className="max-h-48 overflow-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  Loading clients...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No clients match your search' : 'No clients available'}
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 text-gray-900 dark:text-white"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {client.company_name || client.name || 'Unknown Client'}
                      </span>
                      {client.email && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {client.email}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Manual input option */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-600">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Or enter client name manually..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      handleManualInput(target.value.trim());
                      setIsOpen(false);
                      target.value = '';
                    }
                  }
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Press Enter to add a manual client name
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Display selected client info */}
      {selectedClient && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Selected: {selectedClient.company_name || selectedClient.name}
          {selectedClient.email && ` (${selectedClient.email})`}
        </div>
      )}
    </div>
  );
};