import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChecklists } from '../hooks/useChecklists';
import { useClients } from '@/modules/clients/hooks/useClients';
import { CheckSquare, Square, Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Checklist } from '../types';

export const Checklists: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const { getChecklistsByClient, toggleComplete, createChecklist, deleteChecklist, updateChecklist } = useChecklists();
  const { clients } = useClients();
  
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItem, setEditingItem] = useState<Checklist | null>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const fetchChecklists = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        const items = await getChecklistsByClient(clientId);
        setChecklists(items);
      } catch (error) {
        console.error('Failed to fetch checklists:', error);
        toast.error('Failed to load checklists');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [clientId, getChecklistsByClient]);

  useEffect(() => {
    if (clientId && clients.length > 0) {
      const foundClient = clients.find(c => c.id === clientId);
      setClient(foundClient);
    }
  }, [clientId, clients]);

  const handleToggleComplete = async (itemId: string, isCompleted: boolean) => {
    try {
      await toggleComplete(itemId, !isCompleted);
      setChecklists(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, is_completed: !isCompleted, completed_at: !isCompleted ? new Date().toISOString() : null }
            : item
        )
      );
      toast.success(isCompleted ? 'Item marked as incomplete' : 'Item completed!');
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      toast.error('Failed to update checklist item');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !newItemTitle.trim()) return;

    try {
      await createChecklist({
        client_id: clientId,
        title: newItemTitle.trim(),
        description: newItemDescription.trim() || null,
        is_completed: false,
        completed_at: null,
        completed_by: null,
      });
      
      // Refresh the list
      const items = await getChecklistsByClient(clientId);
      setChecklists(items);
      
      setNewItemTitle('');
      setNewItemDescription('');
      setShowAddForm(false);
      toast.success('Checklist item added successfully');
    } catch (error) {
      console.error('Failed to add checklist item:', error);
      toast.error('Failed to add checklist item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this checklist item?')) {
      return;
    }

    try {
      await deleteChecklist(itemId);
      setChecklists(prev => prev.filter(item => item.id !== itemId));
      toast.success('Checklist item deleted');
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
      toast.error('Failed to delete checklist item');
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<Checklist>) => {
    try {
      await updateChecklist(itemId, updates);
      setChecklists(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
      setEditingItem(null);
      toast.success('Checklist item updated');
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      toast.error('Failed to update checklist item');
    }
  };

  const completedCount = checklists.filter(item => item.is_completed).length;
  const totalCount = checklists.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading checklists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Checklist</h1>
          <p className="mt-2 text-gray-600">
            {client ? `Onboarding tasks for ${client.company_name}` : 'Manage client onboarding tasks'}
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Progress Overview</h2>
          <span className="text-sm text-gray-500">
            {completedCount} of {totalCount} tasks completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-600">
          {progressPercentage === 100 ? (
            <span className="text-green-600 font-medium">🎉 All tasks completed!</span>
          ) : (
            <span>{Math.round(progressPercentage)}% complete</span>
          )}
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Task</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                required
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <label htmlFor="task-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="task-description"
                rows={3}
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional task description"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Checklist Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
        </div>
        
        {checklists.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first task.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {checklists.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => handleToggleComplete(item.id, item.is_completed)}
                    className="flex-shrink-0 mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {item.is_completed ? (
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    {editingItem?.id === item.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingItem.title}
                          onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <textarea
                          value={editingItem.description || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          rows={2}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateItem(item.id, { title: editingItem.title, description: editingItem.description })}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className={`text-sm font-medium ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className={`mt-1 text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                            {item.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Created {new Date(item.created_at).toLocaleDateString()}
                          </div>
                          {item.completed_at && (
                            <div className="flex items-center">
                              <CheckSquare className="h-3 w-3 mr-1" />
                              Completed {new Date(item.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};