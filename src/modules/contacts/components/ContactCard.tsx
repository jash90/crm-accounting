import React from 'react';
import type { Contact } from '@/types/supabase';
import { useAuthStore } from '@/stores/auth';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  DollarSign,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ 
  contact, 
  onEdit, 
  onDelete 
}) => {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = React.useState(false);

  const canEdit = user?.role === 'OWNER' || user?.role === 'SUPERADMIN' || contact.created_by === user?.id;
  const canDelete = canEdit;

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'Unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'Available':
        return <Clock className="h-3 w-3 text-green-600" />;
      case 'Busy':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'Unavailable':
        return <Clock className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {contact.name}
            </h3>
            {contact.title && (
              <p className="text-sm text-gray-500 truncate">{contact.title}</p>
            )}
          </div>
        </div>
        
        {(canEdit || canDelete) && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {canEdit && onEdit && (
                    <button
                      onClick={() => {
                        onEdit(contact);
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Contact
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => {
                        onDelete(contact);
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Contact
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="mt-4 space-y-2">
        {contact.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
              {contact.email}
            </a>
          </div>
        )}
        
        {contact.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
              {contact.phone}
            </a>
          </div>
        )}
        
        {contact.company && (
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
            <span>{contact.company}</span>
          </div>
        )}
        
        {contact.hourly_rate && (
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
            <span>${contact.hourly_rate}/hour</span>
          </div>
        )}
      </div>

      {/* Skills */}
      {contact.skills && contact.skills.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1">
            {contact.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
            {contact.skills.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{contact.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Availability and Notes */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(contact.availability)}`}>
            {getAvailabilityIcon(contact.availability)}
            <span className="ml-1">{contact.availability}</span>
          </span>
        </div>
        
        {contact.notes && (
          <div className="flex items-center text-gray-400" title="Has notes">
            <MessageSquare className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Added {new Date(contact.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};