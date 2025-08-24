import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'react-toastify';
import type { ClientHistoryActivity } from '../hooks/useClientHistory';
import {
  Clock,
  User,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
  FileText,
  Receipt,
  ScrollText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Archive,
  RotateCcw,
  Settings,
  Users,
  MessageCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ClientHistoryTimelineProps {
  activities: ClientHistoryActivity[];
  loading?: boolean;
  onDeleteActivity?: (activityId: string) => Promise<void>;
  showActions?: boolean;
}

export const ClientHistoryTimeline: React.FC<ClientHistoryTimelineProps> = ({
  activities,
  loading = false,
  onDeleteActivity,
  showActions = true,
}) => {
  const { user } = useAuthStore();
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set()
  );
  const [deletingActivity, setDeletingActivity] = useState<string | null>(null);

  const canDeleteActivity = (activity: ClientHistoryActivity) => {
    if (!user) return false;

    // Superadmin and owners can delete any activity
    if (user.role === 'SUPERADMIN' || user.role === 'OWNER') return true;

    // Users can delete their own activities within 1 hour
    const activityTime = new Date(activity.created_at).getTime();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    return activity.user_id === user.id && activityTime > oneHourAgo;
  };

  const toggleActivityExpansion = (activityId: string) => {
    setExpandedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!onDeleteActivity) return;

    if (
      !window.confirm(
        'Are you sure you want to delete this activity? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeletingActivity(activityId);
    try {
      await onDeleteActivity(activityId);
    } catch (error) {
      console.error('Error deleting activity:', error);
    } finally {
      setDeletingActivity(null);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'created':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-primary-600" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'viewed':
        return <Eye className="h-4 w-4 text-gray-600" />;
      case 'contacted':
      case 'phone_call':
        return <Phone className="h-4 w-4 text-purple-600" />;
      case 'email_sent':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'meeting_scheduled':
      case 'meeting_completed':
        return <Calendar className="h-4 w-4 text-orange-600" />;
      case 'document_uploaded':
        return <Upload className="h-4 w-4 text-green-600" />;
      case 'document_downloaded':
        return <Download className="h-4 w-4 text-blue-600" />;
      case 'document_deleted':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'invoice_generated':
      case 'invoice_sent':
        return <Receipt className="h-4 w-4 text-green-600" />;
      case 'contract_signed':
      case 'contract_updated':
        return <ScrollText className="h-4 w-4 text-purple-600" />;
      case 'note_added':
      case 'note_updated':
        return <MessageCircle className="h-4 w-4 text-yellow-600" />;
      case 'status_changed':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'assigned':
      case 'unassigned':
        return <Users className="h-4 w-4 text-indigo-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      case 'restored':
        return <RotateCcw className="h-4 w-4 text-green-600" />;
      case 'system_update':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'created':
      case 'invoice_generated':
      case 'contract_signed':
      case 'restored':
        return 'border-green-200 bg-green-50';
      case 'updated':
      case 'email_sent':
      case 'document_downloaded':
        return 'border-blue-200 bg-blue-50';
      case 'deleted':
      case 'document_deleted':
        return 'border-red-200 bg-red-50';
      case 'contacted':
      case 'phone_call':
      case 'contract_updated':
        return 'border-purple-200 bg-purple-50';
      case 'meeting_scheduled':
      case 'meeting_completed':
      case 'status_changed':
        return 'border-orange-200 bg-orange-50';
      case 'note_added':
      case 'note_updated':
        return 'border-yellow-200 bg-yellow-50';
      case 'assigned':
      case 'unassigned':
        return 'border-indigo-200 bg-indigo-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatChangedFields = (changedFields: string[] | null) => {
    if (!changedFields || changedFields.length === 0) return '';

    const fieldNames = changedFields.map((field) => {
      // Convert snake_case to readable names
      return field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    });

    if (fieldNames.length <= 3) {
      return fieldNames.join(', ');
    }

    return `${fieldNames.slice(0, 3).join(', ')} and ${fieldNames.length - 3} more`;
  };

  const renderActivityDetails = (activity: ClientHistoryActivity) => {
    const isExpanded = expandedActivities.has(activity.id);
    const hasDetails =
      activity.old_data ||
      activity.new_data ||
      (activity.changed_fields && activity.changed_fields.length > 0);

    if (!hasDetails) return null;

    return (
      <div className="mt-2">
        <button
          onClick={() => toggleActivityExpansion(activity.id)}
          className="flex items-center text-xs text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 mr-1" />
          ) : (
            <ChevronDown className="h-3 w-3 mr-1" />
          )}
          {isExpanded ? 'Hide details' : 'Show details'}
        </button>

        {isExpanded && (
          <div className="mt-2 p-3 bg-white/50 rounded border text-xs">
            {activity.changed_fields && activity.changed_fields.length > 0 && (
              <div className="mb-2">
                <span className="font-medium text-gray-700">
                  Changed fields:{' '}
                </span>
                <span className="text-gray-600">
                  {formatChangedFields(activity.changed_fields)}
                </span>
              </div>
            )}

            {activity.old_data && activity.new_data && (
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-red-700">Before: </span>
                  <pre className="text-red-600 whitespace-pre-wrap text-xs">
                    {JSON.stringify(activity.old_data, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-green-700">After: </span>
                  <pre className="text-green-600 whitespace-pre-wrap text-xs">
                    {JSON.stringify(activity.new_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-3 animate-pulse">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          No activity yet
        </h3>
        <p className="text-sm text-gray-500">
          Client interactions and updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(
                      activity.activity_type
                    )} border`}
                  >
                    {getActivityIcon(activity.activity_type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.activity_title}
                      </p>
                      {activity.activity_description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.activity_description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {activity.user?.email || 'System'}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatActivityTime(activity.created_at)}
                        </div>
                        {activity.source !== 'web' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {activity.source}
                          </span>
                        )}
                      </div>
                      {renderActivityDetails(activity)}
                    </div>

                    {showActions && canDeleteActivity(activity) && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          disabled={deletingActivity === activity.id}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="Delete activity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Export activity type helpers
export const getActivityTypeLabel = (activityType: string): string => {
  const labels: Record<string, string> = {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    viewed: 'Viewed',
    contacted: 'Contacted',
    email_sent: 'Email Sent',
    phone_call: 'Phone Call',
    meeting_scheduled: 'Meeting Scheduled',
    meeting_completed: 'Meeting Completed',
    document_uploaded: 'Document Uploaded',
    document_downloaded: 'Document Downloaded',
    document_deleted: 'Document Deleted',
    invoice_generated: 'Invoice Generated',
    invoice_sent: 'Invoice Sent',
    payment_received: 'Payment Received',
    contract_signed: 'Contract Signed',
    contract_updated: 'Contract Updated',
    contract_expired: 'Contract Expired',
    note_added: 'Note Added',
    note_updated: 'Note Updated',
    note_deleted: 'Note Deleted',
    status_changed: 'Status Changed',
    assigned: 'Assigned',
    unassigned: 'Unassigned',
    exported: 'Exported',
    imported: 'Imported',
    merged: 'Merged',
    archived: 'Archived',
    restored: 'Restored',
    system_update: 'System Update',
    bulk_operation: 'Bulk Operation',
    other: 'Other',
  };

  return (
    labels[activityType] ||
    activityType.charAt(0).toUpperCase() + activityType.slice(1)
  );
};
