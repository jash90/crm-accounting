import React, { useState } from 'react';
import { usePriceList } from '../hooks/usePriceList';
import { Search, Plus, Minus, Package } from 'lucide-react';

interface PriceListSelectorProps {
  selectedItems: Array<{ itemId: string; qty: number }>;
  onItemsChange: (items: Array<{ itemId: string; qty: number }>) => void;
}

export const PriceListSelector: React.FC<PriceListSelectorProps> = ({
  selectedItems,
  onItemsChange,
}) => {
  const { items, loading } = usePriceList();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemQuantity = (itemId: string): number => {
    return selectedItems.find(item => item.itemId === itemId)?.qty || 0;
  };

  const updateItemQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      // Remove item if quantity is 0 or less
      onItemsChange(selectedItems.filter(item => item.itemId !== itemId));
    } else {
      // Update or add item
      const existingIndex = selectedItems.findIndex(item => item.itemId === itemId);
      if (existingIndex >= 0) {
        const updatedItems = [...selectedItems];
        updatedItems[existingIndex].qty = qty;
        onItemsChange(updatedItems);
      } else {
        onItemsChange([...selectedItems, { itemId, qty }]);
      }
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, selectedItem) => {
      const priceItem = items.find(item => item.id === selectedItem.itemId);
      return total + (priceItem ? priceItem.price * selectedItem.qty : 0);
    }, 0);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Select Items</h2>
        <p className="text-sm text-gray-600">Choose items from your price list to include in this offer.</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search items..."
          />
        </div>
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </h3>
            </div>
            <div className="text-lg font-bold text-blue-900">
              ${calculateTotal().toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading price list...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search.' : 'Add items to your price list first.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const qty = getItemQuantity(item.id);
                const lineTotal = item.price * qty;

                return (
                  <tr key={item.id} className={qty > 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateItemQuantity(item.id, Math.max(0, qty - 1))}
                          className="inline-flex items-center p-1 border border-gray-300 rounded text-gray-400 hover:text-gray-600 hover:border-gray-400"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium min-w-[3rem] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(item.id, qty + 1)}
                          className="inline-flex items-center p-1 border border-gray-300 rounded text-gray-400 hover:text-gray-600 hover:border-gray-400"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {qty > 0 ? `$${lineTotal.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};