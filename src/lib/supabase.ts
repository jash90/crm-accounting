import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get current user with profile
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
};

// Helper function to check user role
export const checkUserRole = async (requiredRole: 'SUPERADMIN' | 'OWNER' | 'EMPLOYEE') => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const roleHierarchy = {
    'SUPERADMIN': 3,
    'OWNER': 2,
    'EMPLOYEE': 1
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};