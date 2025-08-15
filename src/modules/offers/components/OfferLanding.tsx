import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useOffers } from '../hooks/useOffers';
import { useOfferMutation } from '../hooks/useOfferMutation';
import { Building2, Check, Calendar, Package, AlertCircle } from 'lucide-react';
import type { Offer } from '../types';

export const OfferLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { getOfferByToken } = useOffers();
  const { acceptOffer, loading: acceptLoading } = useOfferMutation();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!token) {
        setError('Invalid offer link');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const offerData = await getOfferByToken(token);
        if (!offerData) {
          setError('Offer not found or has expired');
        } else {
          setOffer(offerData);
          if (offerData.status === 'ACCEPTED') {
            setIsAccepted(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch offer:', err);
        setError('Failed to load offer');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [token, getOfferByToken]);

  const handleAcceptOffer = async () => {
    if (!token) return;

    try {
      const result = await acceptOffer(token);
      setIsAccepted(true);
      setOffer(prev => prev ? { ...prev, status: 'ACCEPTED', accepted_at: new Date().toISOString() } : null);
    } catch (error) {
      console.error('Failed to accept offer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Offer Not Available'}
          </h1>
          <p className="text-gray-600 mb-6">
            This offer link may have expired or is no longer valid. Please contact the company directly for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (isAccepted || offer.status === 'ACCEPTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Offer Accepted!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Thank you for accepting our offer of <strong>${offer.net_total.toFixed(2)}</strong>. 
              We're excited to work with you!
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>What's next?</strong><br />
                Our team will contact you shortly to begin the onboarding process. 
                You should receive a welcome email within the next few hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You have received an offer!
          </h1>
          <p className="text-lg text-gray-600">
            Dear {offer.clients?.company_name || 'Valued Client'},
          </p>
        </div>

        {/* Offer Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Offer Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="text-xl font-semibold">Custom Offer</h2>
                <p className="text-blue-100">
                  Created on {new Date(offer.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  ${offer.net_total.toFixed(2)}
                </div>
                <div className="text-blue-100 text-sm">
                  Total Amount
                </div>
              </div>
            </div>
          </div>

          {/* Offer Items */}
          {offer.offer_items && offer.offer_items.length > 0 && (
            <div className="px-6 py-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                What's Included
              </h3>
              
              <div className="space-y-4">
                {offer.offer_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <div className="text-sm text-gray-500 mt-2">
                        Quantity: {item.qty} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 ml-4">
                      ${item.line_total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 mt-6 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${offer.net_total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Section */}
          <div className="bg-gray-50 px-6 py-6">
            <div className="text-center">
              <p className="text-gray-700 mb-6">
                Ready to get started? Accept this offer to begin working with us.
              </p>
              
              <button
                onClick={handleAcceptOffer}
                disabled={acceptLoading}
                className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acceptLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-3" />
                    Accept Offer
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-4">
                By accepting this offer, you agree to work with us under the terms discussed.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Questions about this offer? Contact us for more information.
          </p>
        </div>
      </div>
    </div>
  );
};