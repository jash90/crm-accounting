import React from 'react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { supabase } from '@/lib/supabase';
import { Building2, Users, Package, TrendingUp, Activity, User } from 'lucide-react';

interface DashboardStats {
  companies: number;
  users: number;
  modules: number;
  active: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { activityLogs, loading: activityLoading } = useActivityLogs(10);
  const [stats, setStats] = useState<DashboardStats>({
    companies: 0,
    users: 0,
    modules: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        let companiesCount = 0;
        let usersCount = 0;
        let modulesCount = 0;
        let activeCount = 0;

        if (user.role === 'SUPERADMIN') {
          // Get all companies count
          const { count: companies } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true });
          companiesCount = companies || 0;

          // Get all users count
          const { count: users } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
          usersCount = users || 0;

          // Get all modules count
          const { count: modules } = await supabase
            .from('modules')
            .select('*', { count: 'exact', head: true });
          modulesCount = modules || 0;

          // Get active companies (companies with users)
          const { count: active } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .not('owner_id', 'is', null);
          activeCount = active || 0;

        } else {
          // For OWNER/EMPLOYEE - show company stats
          companiesCount = 1; // Always 1 for their company

          // Get company users count
          const { count: users } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', user.company_id);
          usersCount = users || 0;

          // Get enabled modules for company
          const { count: modules } = await supabase
            .from('company_modules')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', user.company_id)
            .eq('is_enabled', true);
          modulesCount = modules || 0;

          // Active modules (same as enabled for now)
          activeCount = modulesCount;
        }

        setStats({
          companies: companiesCount,
          users: usersCount,
          modules: modulesCount,
          active: activeCount,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <Package className="h-4 w-4 text-red-600" />;
      case 'enabled':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'disabled':
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'module':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'contact':
        return <User className="h-4 w-4 text-green-600" />;
      case 'client':
        return <Building2 className="h-4 w-4 text-purple-600" />;
      case 'invite':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'text-green-800 bg-green-100';
      case 'updated':
        return 'text-blue-800 bg-blue-100';
      case 'deleted':
        return 'text-red-800 bg-red-100';
      case 'enabled':
        return 'text-green-800 bg-green-100';
      case 'disabled':
        return 'text-gray-800 bg-gray-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.email}
        </h1>
        <p className="mt-2 text-gray-600">
          {user?.role === 'SUPERADMIN' && 'Manage all companies and global modules'}
          {user?.role === 'OWNER' && 'Manage your company modules and team'}
          {user?.role === 'EMPLOYEE' && 'Access your assigned modules'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {user?.role === 'SUPERADMIN' ? 'Total Users' : 'Team Members'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.users}
                    </dd>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {user?.role === 'SUPERADMIN' ? 'Total Modules' : 'Enabled Modules'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.modules}
                    </dd>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {user?.role === 'SUPERADMIN' ? 'Active Companies' : 'Active Modules'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.active}
                    </dd>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
        </div>
        <div className="p-6">
          {activityLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading recent activity...</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">No recent activity found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getResourceIcon(log.resource_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {log.resource_name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {log.resource_type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {log.user_email}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};