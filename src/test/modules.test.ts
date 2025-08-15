import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useModules } from '@/hooks/useModules';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');
vi.mock('@/stores/auth');

describe('useModules Hook', () => {
  const mockUser = {
    id: '123',
    email: 'owner@test.com',
    role: 'OWNER' as const,
    company_id: '456',
    created_at: new Date().toISOString(),
  };

  const mockModules = [
    {
      id: '1',
      name: 'Test Module',
      description: 'A test module',
      company_id: '456',
      created_by: '123',
      is_public_within_company: true,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      supabaseUser: null,
      loading: false,
      initialized: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      initialize: vi.fn(),
      checkPermission: vi.fn(),
      acceptInvite: vi.fn(),
      createInvite: vi.fn(),
    });
  });

  it('should fetch modules for owner', async () => {
    const mockQuery = {
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockModules,
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockQuery),
    } as any);

    const { result } = renderHook(() => useModules());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.modules).toEqual(mockModules);
    expect(result.current.error).toBeNull();
  });

  it('should create a new module', async () => {
    const newModule = {
      name: 'New Module',
      description: 'A new test module',
      isPublic: true,
      isGlobal: false,
    };

    const mockInsert = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '2', ...newModule },
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockInsert as any);

    const { result } = renderHook(() => useModules());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const createdModule = await result.current.createModule(newModule);

    expect(mockInsert.insert).toHaveBeenCalledWith([{
      name: newModule.name,
      description: newModule.description,
      company_id: mockUser.company_id,
      created_by: mockUser.id,
      is_public_within_company: newModule.isPublic,
    }]);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useModules());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError.message);
    expect(result.current.modules).toEqual([]);
  });
});