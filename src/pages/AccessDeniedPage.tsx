import React from 'react';
import { useLocation } from 'react-router-dom';
import { AccessDenied } from '@/components/ui/AccessDenied';

export const AccessDeniedPage: React.FC = () => {
  const location = useLocation();
  const { moduleName, userRole } = location.state || { 
    moduleName: 'Module', 
    userRole: 'EMPLOYEE' 
  };

  return (
    <AccessDenied 
      moduleName={moduleName} 
      userRole={userRole as 'OWNER' | 'EMPLOYEE'} 
    />
  );
};