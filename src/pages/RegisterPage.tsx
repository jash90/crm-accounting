import React, { useEffect } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { SimpleThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores/auth';

export const RegisterPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <SimpleThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-surface-900 dark:text-surface-100">
          Create your company account
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-surface-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-surface-200 dark:border-surface-700">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};
