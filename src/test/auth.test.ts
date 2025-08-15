import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

// Mock the entire module
vi.mock('@/lib/supabase');

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      supabaseUser: null,
      loading: false,
      initialized: false,
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { user, loading, initialized } = useAuthStore.getState();
    
    expect(user).toBeNull();
    expect(loading).toBe(false);
    expect(initialized).toBe(false);
  });

  it('should handle successful sign in', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      role: 'OWNER' as const,
      company_id: '456',
      created_at: new Date().toISOString(),
    };

    const mockAuthData = {
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
    };

    // Mock Supabase responses
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: mockAuthData,
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    } as any);

    const { signIn } = useAuthStore.getState();
    
    await signIn('test@example.com', 'password');
    
    const { user, loading } = useAuthStore.getState();
    
    expect(loading).toBe(false);
    expect(user).toEqual(mockUser);
  });

  it('should check permissions correctly', () => {
    const { checkPermission } = useAuthStore.getState();
    
    // Set a user with OWNER role
    useAuthStore.setState({
      user: {
        id: '123',
        email: 'owner@test.com',
        role: 'OWNER',
        company_id: '456',
        created_at: new Date().toISOString(),
      },
    });
    
    expect(checkPermission('EMPLOYEE')).toBe(true); // OWNER >= EMPLOYEE
    expect(checkPermission('OWNER')).toBe(true);    // OWNER >= OWNER
    expect(checkPermission('SUPERADMIN')).toBe(false); // OWNER < SUPERADMIN
  });

  it('should handle sign out', async () => {
    // Set initial authenticated state
    useAuthStore.setState({
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'OWNER',
        company_id: '456',
        created_at: new Date().toISOString(),
      },
      initialized: true,
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });

    const { signOut } = useAuthStore.getState();
    
    await signOut();
    
    const { user, loading } = useAuthStore.getState();
    
    expect(user).toBeNull();
    expect(loading).toBe(false);
  });
});