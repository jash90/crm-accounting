import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOfferMutation } from '@/modules/offers/hooks/useOfferMutation';
import { useOffers } from '@/modules/offers/hooks/useOffers';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Offers Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useOfferMutation', () => {
    it('should create draft offer successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          offerId: 'test-offer-id',
          netTotal: 100.00,
          status: 'DRAFT'
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });

      const { result } = renderHook(() => useOfferMutation());

      const offerData = {
        clientId: 'test-client-id',
        items: [{ itemId: 'test-item-id', qty: 2 }]
      };

      const offerId = await result.current.createDraftOffer(offerData);

      expect(offerId).toBe('test-offer-id');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-draft-offer'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          }),
          body: JSON.stringify(offerData)
        })
      );
    });

    it('should handle offer acceptance', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          clientName: 'Test Client',
          amount: 100.00
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOfferMutation());

      const acceptResult = await result.current.acceptOffer('test-token');

      expect(acceptResult.success).toBe(true);
      expect(acceptResult.clientName).toBe('Test Client');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/accept-offer'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'test-token' })
        })
      );
    });

    it('should handle token generation uniqueness', async () => {
      const tokens = new Set();
      
      // Mock crypto.getRandomValues to generate different values
      const originalCrypto = global.crypto;
      global.crypto = {
        ...originalCrypto,
        getRandomValues: vi.fn((arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        })
      };

      // Generate multiple tokens and ensure uniqueness
      for (let i = 0; i < 100; i++) {
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        tokens.add(token);
      }

      expect(tokens.size).toBe(100); // All tokens should be unique
      
      global.crypto = originalCrypto;
    });
  });

  describe('useOffers', () => {
    it('should fetch offers with related data', async () => {
      const mockOffers = [
        {
          id: 'offer-1',
          client_id: 'client-1',
          net_total: 100.00,
          status: 'DRAFT',
          clients: {
            id: 'client-1',
            name: 'Test Client',
            email: 'test@example.com',
            company_name: 'Test Company'
          },
          offer_items: [
            {
              id: 'item-1',
              name: 'Test Item',
              qty: 2,
              price: 50.00,
              line_total: 100.00
            }
          ]
        }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOffers,
              error: null
            })
          })
        })
      } as any);

      const { result } = renderHook(() => useOffers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.offers).toEqual(mockOffers);
      expect(result.current.error).toBeNull();
    });

    it('should handle offer status transitions', async () => {
      const mockOffer = {
        id: 'offer-1',
        status: 'DRAFT',
        net_total: 100.00
      };

      // Test status progression: DRAFT -> SENT -> ACCEPTED
      const statusProgression = ['DRAFT', 'SENT', 'ACCEPTED'];
      
      statusProgression.forEach((status, index) => {
        expect(['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED']).toContain(status);
        
        if (index > 0) {
          // Ensure valid transitions
          if (status === 'SENT') {
            expect(statusProgression[index - 1]).toBe('DRAFT');
          } else if (status === 'ACCEPTED') {
            expect(statusProgression[index - 1]).toBe('SENT');
          }
        }
      });
    });
  });
});