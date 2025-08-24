import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, User as UserIcon, X } from 'lucide-react';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import type { User } from '@/types/supabase';

interface UserSelectorProps {
  value?: string | null;
  onChange: (userId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showClearButton?: boolean;
  allowUnassigned?: boolean;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select user...',
  disabled = false,
  className = '',
  showClearButton = true,
  allowUnassigned = true,
}) => {
  const { users, loading, error } = useCompanyUsers();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedUser = users.find(user => user.id === value);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleUserSelect = (userId: string | null) => {
    onChange(userId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  const getUserInitials = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Error loading users: {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`
          relative w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
          rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
          ${isOpen ? 'ring-2 ring-primary border-primary' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectedUser ? (
              <>
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {getUserInitials(selectedUser)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getUserDisplayName(selectedUser)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedUser.email}
                  </div>
                </div>
              </>
            ) : (
              <>
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {loading ? 'Loading users...' : placeholder}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {selectedUser && showClearButton && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* User list */}
          <div className="max-h-60 overflow-y-auto">
            {allowUnassigned && (
              <div
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between ${
                  !selectedUser ? 'bg-primary text-white' : 'text-gray-900 dark:text-white'
                }`}
                onClick={() => handleUserSelect(null)}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-500 rounded-full flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-gray-400" />
                  </div>
                  <span className="text-sm">Unassigned</span>
                </div>
                {!selectedUser && <Check className="w-4 h-4" />}
              </div>
            )}

            {filteredUsers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No users found' : 'No users available'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between ${
                    selectedUser?.id === user.id ? 'bg-primary text-white' : 'text-gray-900 dark:text-white'
                  }`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {getUserInitials(user)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {user.email} {user.role && `• ${user.role}`}
                      </div>
                    </div>
                  </div>
                  {selectedUser?.id === user.id && <Check className="w-4 h-4 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};