import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { Search, Filter } from 'lucide-react';

export const ModuleFilters: React.FC = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getFilterOptions = () => {
    const baseOptions = [
      { value: 'all', label: 'All Modules' },
    ];

    if (user?.role === 'SUPERADMIN') {
      return [
        ...baseOptions,
        { value: 'global', label: 'Global Modules' },
        { value: 'company', label: 'Company Modules' },
      ];
    }

    if (user?.role === 'OWNER') {
      return [
        ...baseOptions,
        { value: 'public', label: 'Public Modules' },
        { value: 'private', label: 'Private Modules' },
        { value: 'created', label: 'Created by Me' },
      ];
    }

    return [
      ...baseOptions,
      { value: 'assigned', label: 'Assigned to Me' },
      { value: 'public', label: 'Public Modules' },
    ];
  };

  return (
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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search modules..."
            />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="sm:w-48">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {getFilterOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(searchTerm || selectedFilter !== 'all') && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {selectedFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Filter: {getFilterOptions().find(o => o.value === selectedFilter)?.label}
              <button
                onClick={() => setSelectedFilter('all')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};