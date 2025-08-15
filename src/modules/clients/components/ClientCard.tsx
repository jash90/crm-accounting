import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client } from '@/types/supabase';
import { useAuthStore } from '@/stores/auth';
import { useClientsModuleIntegration } from '@/hooks/useModuleIntegration';
import { toast } from 'react-toastify';
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  FileText,
  DollarSign,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  ScrollText,
  Files,
  ListTodo,
  Eye,
} from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);
  const { features, callModuleMethod } = useClientsModuleIntegration();

  const canEdit =
    user?.role === 'OWNER' ||
    user?.role === 'SUPERADMIN' ||
    client.created_by === user?.id;
  const canDelete = canEdit;

  // Handle module-specific actions
  const handleGenerateInvoice = async () => {
    if (features.canGenerateInvoices) {
      const result = await callModuleMethod(
        'Invoices',
        'createForClient',
        client.id
      );
      if (result) {
        toast.success('Invoice generation started');
      }
    }
  };

  const handleManageContracts = async () => {
    if (features.canManageContracts) {
      // Navigate to contracts for this client
      window.location.href = `/contracts?clientId=${client.id}`;
    }
  };

  const handleAttachDocument = async () => {
    if (features.canAttachDocuments) {
      const result = await callModuleMethod(
        'Documents',
        'attachToClient',
        client.id
      );
      if (result) {
        toast.success('Document attached successfully');
      }
    }
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'Signed':
      case 'Podpisana':
        return 'bg-green-100 text-green-800';
      case 'Pending':
      case 'W trakcie':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Signed':
      case 'Niepodpisana':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case 'Signed':
      case 'Podpisana':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'Pending':
      case 'W trakcie':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      case 'Not Signed':
      case 'Niepodpisana':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <FileText className="h-3 w-3 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Clickable area for navigation */}
      <div
        className="p-6 cursor-pointer"
        onClick={() => navigate(`/clients/${client.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                  {client.company_name}
                </h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  #{client.client_number}
                </span>
              </div>
              {client.business_type && (
                <p className="text-sm text-gray-500 truncate">
                  {client.business_type}
                </p>
              )}
            </div>
          </div>

          {/* Action menu - prevent click propagation */}
          {(canEdit || canDelete) && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>

                    {canEdit && onEdit && (
                      <button
                        onClick={() => {
                          onEdit(client);
                          setShowMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                      </button>
                    )}

                    {/* Module-specific actions */}
                    {features.canGenerateInvoices && (
                      <button
                        onClick={() => {
                          handleGenerateInvoice();
                          setShowMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Generate Invoice
                      </button>
                    )}

                    {features.canManageContracts && (
                      <button
                        onClick={() => {
                          handleManageContracts();
                          setShowMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <ScrollText className="h-4 w-4 mr-2" />
                        Manage Contracts
                      </button>
                    )}

                    {features.canAttachDocuments && (
                      <button
                        onClick={() => {
                          handleAttachDocument();
                          setShowMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Files className="h-4 w-4 mr-2" />
                        Attach Document
                      </button>
                    )}

                    {features.canAssignTasks && (
                      <button
                        onClick={() => {
                          window.location.href = `/tasks?clientId=${client.id}`;
                          setShowMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <ListTodo className="h-4 w-4 mr-2" />
                        View Tasks
                      </button>
                    )}

                    {(features.canGenerateInvoices ||
                      features.canManageContracts ||
                      features.canAttachDocuments ||
                      features.canAssignTasks) && (
                      <div className="border-t border-gray-100 my-1"></div>
                    )}

                    {canDelete && onDelete && (
                      <button
                        onClick={() => {
                          onDelete(client);
                          setShowMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Client
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-4 space-y-2">
        {client.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            <a href={`mailto:${client.email}`} className="hover:text-blue-600">
              {client.email}
            </a>
          </div>
        )}

        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <a href={`tel:${client.phone}`} className="hover:text-blue-600">
              {client.phone}
            </a>
          </div>
        )}

        {client.start_date && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>Started: {formatDate(client.start_date)}</span>
          </div>
        )}

        {client.tax_form && (
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
            <span>{client.tax_form}</span>
          </div>
        )}

        {client.has_employees && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>Has employees</span>
          </div>
        )}
      </div>

      {/* Tax and Business Details */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-1">
          {client.vat_status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {client.vat_status}
            </span>
          )}
          {client.employment_form && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {client.employment_form}
            </span>
          )}
          {client.zus_startup_relief && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ZUS Relief
            </span>
          )}
          {client.e_szok_system && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              e-SZOK
            </span>
          )}
        </div>
      </div>

      {/* Contract Status and AML */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContractStatusColor(client.contract_status)}`}
          >
            {getContractStatusIcon(client.contract_status)}
            <span className="ml-1">{client.contract_status}</span>
          </span>
          {client.aml_group && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              AML: {client.aml_group}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 flex justify-between">
          <span>Created {formatDate(client.created_at)}</span>
          {client.service_provider && (
            <span>Service: {client.service_provider}</span>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
};
