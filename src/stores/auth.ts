import { create } from 'zustand';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types/supabase';
import { supabase, getCurrentUser } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    companyName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  checkPermission: (requiredRole: UserRole) => boolean;
  acceptInvite?: (token: string, password: string) => Promise<void>;
  createInvite?: (
    email: string,
    role: 'OWNER' | 'EMPLOYEE'
  ) => Promise<{ inviteUrl: string }>;
}

const roleHierarchy: Record<UserRole, number> = {
  SUPERADMIN: 3,
  OWNER: 2,
  EMPLOYEE: 1,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  supabaseUser: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Get user profile
        const userProfile = await getCurrentUser();
        set({
          supabaseUser: session.user,
          user: userProfile,
          initialized: true,
          loading: false,
        });
      } else {
        set({
          supabaseUser: null,
          user: null,
          initialized: true,
          loading: false,
        });
      }

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in
          try {
            const userProfile = await getCurrentUser();
            set({
              supabaseUser: session.user,
              user: userProfile,
              loading: false,
            });
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out
          set({
            supabaseUser: null,
            user: null,
            loading: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refreshed, update user if needed
          const userProfile = await getCurrentUser();
          set({
            supabaseUser: session.user,
            user: userProfile,
            loading: false,
          });
        }
      });

      // Store subscription for cleanup if needed
      // Using global window to store subscription for potential cleanup
      const windowWithAuth = window as Window & {
        __authSubscription?: typeof subscription;
      };
      windowWithAuth.__authSubscription = subscription;
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        supabaseUser: null,
        user: null,
        initialized: true,
        loading: false,
      });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userProfile = await getCurrentUser();
        set({
          supabaseUser: data.user,
          user: userProfile,
          loading: false,
        });
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, companyName: string) => {
    set({ loading: true });
    try {
      console.log('Starting registration for:', email, companyName);

      // Call the register-owner Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-owner`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email,
            password,
            companyName,
          }),
        }
      );

      console.log('Edge function response status:', response.status);
      const result = await response.json();
      console.log('Edge function response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // After successful registration, sign in the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userProfile = await getCurrentUser();
        set({
          supabaseUser: data.user,
          user: userProfile,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      set({ loading: false });
      throw error;
    }
  },

  acceptInvite: async (token: string, password: string) => {
    set({ loading: true });
    try {
      // Call the accept-invite Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        supabaseUser: null,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  checkPermission: (requiredRole: UserRole) => {
    const { user } = get();
    if (!user) return false;

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  },

  createInvite: async (email: string, role: 'OWNER' | 'EMPLOYEE') => {
    set({ loading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email,
            role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create invitation');
      }

      set({ loading: false });
      return result;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
