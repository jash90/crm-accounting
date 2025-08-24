import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TaskForm } from '../components/TaskForm';

export const AddTaskPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Go back to tasks"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Task
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new task to your task management system
            </p>
          </div>
        </div>

        {/* Task Form */}
        <TaskForm
          mode="create"
          onCancel={() => navigate('/tasks')}
        />
      </div>
    </div>
  );
};