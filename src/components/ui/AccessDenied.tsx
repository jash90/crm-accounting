import React from 'react';
import { Shield, Mail } from 'lucide-react';

interface AccessDeniedProps {
  moduleName: string;
  userRole: 'OWNER' | 'EMPLOYEE';
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ moduleName, userRole }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-6">
          You cannot have access to the <strong>{moduleName}</strong> module.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Contact Administrator</span>
          </div>
          <p className="text-sm text-blue-700">
            {userRole === 'OWNER' 
              ? 'Contact your Super Administrator to request access to this module for your company.'
              : 'Contact your company owner or Super Administrator to request access to this module.'
            }
          </p>
        </div>
        
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};