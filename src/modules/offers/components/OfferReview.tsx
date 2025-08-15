import React, { useState, useEffect } from 'react';
import { usePriceList } from '../hooks/usePriceList';
import { useClients } from '@/modules/clients/hooks/useClients';
import { Building2, Package, DollarSign } from 'lucide-react';

interface OfferReviewProps {
  clientId: string;
  items: Array<{ itemId: string; qty: number }>;
  offerId: string;
}

export const OfferReview: React.FC<OfferReviewProps> = ({
  clientId,
  items,
  offerId,
}) => {
  const { items: priceListItems } = usePriceList();
  const { clients } = useClients();
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const foundClient = clients.find(c => c.id === clientId);
    setClient(foundClient);
  }, [clientId, clients]);

  const calculateTotal = () => {
    return items.reduce((total, selectedItem) => {
      const priceItem = priceListItems.find(item => item.id === selectedItem.itemId);
      return total + (priceItem ? priceItem.price * selectedItem.qty : 0);
    }, 0);
  };

  const getOfferItems = () => {
    return items.map(selectedItem => {
      const priceItem = priceListItems.find(item => item.id === selectedItem.itemId);
      return {
        ...priceItem,
        qty: selectedItem.qty,
        lineTotal: priceItem ? priceItem.price * selectedItem.qty : 0,
      };
    }).filter(item => item.id);
  };

  const offerItems = getOfferItems();
  const total = calculateTotal();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Review Offer</h2>
        <p className="text-sm text-gray-600">Review the offer details before sending to the client.</p>
      </div>

      {/* Client Information */}
      {client && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">{client.company_name}</h3>
              <p className="text-sm text-gray-600">{client.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Offer Items */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Offer Items
        </h3>
        
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
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
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offerItems.map((item, index) => (
                <tr key={index}>
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
                    ${item.lineTotal.toFixed(2)}
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
                  ${total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Offer Summary
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-900">
              ${total.toFixed(2)}
            </div>
            <div className="text-xs text-blue-700">
              {offerItems.length} item{offerItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-blue-800">
          <p>
            This offer will be sent to <strong>{client?.email}</strong> with a secure acceptance link.
            The client will be able to review and accept the offer with one click.
          </p>
        </div>
      </div>

      {offerId && (
        <div className="mt-4 text-xs text-gray-500">
          <p>Offer ID: {offerId}</p>
        </div>
      )}
    </div>
  );
};