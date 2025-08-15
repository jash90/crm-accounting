import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOffers } from '../hooks/useOffers';
import { useOfferMutation } from '../hooks/useOfferMutation';
import { ArrowLeft, Building2, Calendar, Send, Check, Clock, X, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Offer } from '../types';

export const OfferView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOfferById } = useOffers();
  const { sendOffer, loading: mutationLoading } = useOfferMutation();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const offerData = await getOfferById(id);
        setOffer(offerData);
      } catch (error) {
        console.error('Failed to fetch offer:', error);
        toast.error('Failed to load offer');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id, getOfferById]);

  const handleSendOffer = async () => {
    if (!offer) return;

    try {
      const result = await sendOffer(offer.id);
      setOffer(prev => prev ? { ...prev, status: 'SENT', token: result.token } : null);
      toast.success('Offer sent successfully!');
    } catch (error) {
      console.error('Failed to send offer:', error);
    }
  };

  const copyOfferUrl = () => {
    if (offer?.token) {
      const offerUrl = `${window.location.origin}/offer/${offer.token}`;
      navigator.clipboard.writeText(offerUrl);
      toast.success('Offer URL copied to clipboard');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="h-4 w-4" />;
      case 'SENT':
        return <Send className="h-4 w-4" />;
      case 'ACCEPTED':
        return <Check className="h-4 w-4" />;
      case 'EXPIRED':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Not Found</h2>
          <p className="text-gray-600 mb-4">The offer you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/offers')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/offers')}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offer Details</h1>
            <p className="mt-1 text-gray-600">
              Offer #{offer.id.slice(0, 8)} - {offer.clients?.company_name || 'Unknown Client'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {offer.status === 'DRAFT' && (
            <button
              onClick={handleSendOffer}
              disabled={mutationLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {mutationLoading ? 'Sending...' : 'Send Offer'}
            </button>
          )}
          
          {offer.token && (
            <button
              onClick={copyOfferUrl}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </button>
          )}
        </div>
      </div>

      {/* Offer Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Offer Summary</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(offer.status)}`}>
              {getStatusIcon(offer.status)}
              <span className="ml-2">{offer.status}</span>
            </span>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Client</dt>
              <dd className="mt-1 flex items-center">
                <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {offer.clients?.company_name || 'Unknown Client'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {offer.clients?.email}
                  </div>
                </div>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                ${offer.net_total.toFixed(2)}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 flex items-center text-sm text-gray-900">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                {new Date(offer.created_at).toLocaleDateString()}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Items */}
      {offer.offer_items && offer.offer_items.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Offer Items</h2>
          </div>
          
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offer.offer_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${item.line_total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Net Total:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ${offer.net_total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
        </div>
        
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Offer ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{offer.id}</dd>
            </div>
            
            {offer.accepted_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Accepted At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(offer.accepted_at).toLocaleString()}
                </dd>
              </div>
            )}
            
            {offer.token && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Public Link</dt>
                <dd className="mt-1">
                  <div className="flex items-center space-x-2">
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {window.location.origin}/offer/{offer.token}
                    </code>
                    <button
                      onClick={copyOfferUrl}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};