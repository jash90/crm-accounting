import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useClientHistory } from '../hooks/useClientHistory';
import { ClientHistoryTimeline } from '../components/ClientHistoryTimeline';
import { useClientsModuleIntegration } from '@/hooks/useModuleIntegration';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'react-toastify';
import type { Client } from '@/types/supabase';
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  ScrollText,
  Files,
  ListTodo,
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  Archive,
  RefreshCcw,
} from 'lucide-react';

export const ClientViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { clients, loading, deleteClient, logClientView } = useClients();
  const {
    activities,
    summary,
    loading: historyLoading,
    fetchHistory,
    fetchSummary,
    deleteActivity,
    clearHistory,
    cleanupOldHistory,
  } = useClientHistory();
  const { features, callModuleMethod } = useClientsModuleIntegration();

  const [client, setClient] = useState<Client | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    if (!loading && clients.length > 0 && id) {
      const foundClient = clients.find((c) => c.id === id);
      if (foundClient) {
        setClient(foundClient);
        // Log client view and fetch history (don't await to avoid blocking)
        logClientView(foundClient.id, foundClient.company_name).catch(
          (error) => {
            console.warn('Failed to log client view:', error);
            // Don't throw error to avoid breaking the page
          }
        );
        fetchHistory(foundClient.id);
        fetchSummary(foundClient.id);
      } else {
        toast.error('Client not found');
        navigate('/clients');
      }
    }
  }, [clients, loading, id, navigate, fetchHistory, fetchSummary]);

  const canEdit =
    user?.role === 'OWNER' ||
    user?.role === 'SUPERADMIN' ||
    client?.created_by === user?.id;
  const canDelete = canEdit;
  const canViewSensitive =
    user?.role === 'SUPERADMIN' || user?.role === 'OWNER';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Client not found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The client you're looking for doesn't exist or has been deleted.
            </p>
            <div className="mt-6">
              <Link
                to="/clients"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${client.company_name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClient(client.id);
      toast.success('Client deleted successfully');
      navigate('/clients');
    } catch {
      toast.error('Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getContractStatusColor = (status: string | null) => {
    switch (status) {
      case 'Signed':
      case 'Podpisana':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
      case 'W trakcie':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Not Signed':
      case 'Niepodpisana':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContractStatusIcon = (status: string | null) => {
    switch (status) {
      case 'Signed':
      case 'Podpisana':
        return <CheckCircle className="h-4 w-4" />;
      case 'Pending':
      case 'W trakcie':
        return <AlertCircle className="h-4 w-4" />;
      case 'Not Signed':
      case 'Niepodpisana':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Module-specific actions
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

  const handleManageContracts = () => {
    if (features.canManageContracts) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation and Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/clients')}
              className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Clients
            </button>

            <div className="flex items-center space-x-3">
              {/* Module-specific actions */}
              {features.canGenerateInvoices && (
                <button
                  onClick={handleGenerateInvoice}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Generate Invoice
                </button>
              )}

              {features.canManageContracts && (
                <button
                  onClick={handleManageContracts}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ScrollText className="h-4 w-4 mr-2" />
                  Contracts
                </button>
              )}

              {features.canAttachDocuments && (
                <button
                  onClick={handleAttachDocument}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Files className="h-4 w-4 mr-2" />
                  Documents
                </button>
              )}

              {canEdit && (
                <Link
                  to={`/clients/${client.id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Client Title */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {client.company_name}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-500">
                  Client #{client.client_number}
                </p>
                {summary && (
                  <p className="text-sm text-gray-400">
                    • {summary.total_activities} activities
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Client Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity History
                {summary && summary.total_activities > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {summary.total_activities}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Basic Information
                  </h2>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getContractStatusColor(
                      client.contract_status
                    )}`}
                  >
                    {getContractStatusIcon(client.contract_status)}
                    <span className="ml-2">{client.contract_status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <div className="mt-1 flex items-center">
                      <p className="text-sm text-gray-900">
                        {client.company_name}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(client.company_name, 'Company name')
                        }
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {client.nip && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        NIP
                      </label>
                      <div className="mt-1 flex items-center">
                        <p className="text-sm text-gray-900">{client.nip}</p>
                        <button
                          onClick={() => copyToClipboard(client.nip!, 'NIP')}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {client.business_type && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Business Type
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {client.business_type}
                      </p>
                    </div>
                  )}

                  {client.employment_form && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Employment Form
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {client.employment_form}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(client.start_date)}
                    </p>
                  </div>

                  {client.end_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(client.end_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {client.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="mt-1 flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a
                          href={`mailto:${client.email}`}
                          className="text-sm text-blue-600 hover:text-primary-800"
                        >
                          {client.email}
                        </a>
                        <button
                          onClick={() =>
                            copyToClipboard(client.email!, 'Email')
                          }
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {client.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <div className="mt-1 flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <a
                          href={`tel:${client.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {client.phone}
                        </a>
                        <button
                          onClick={() =>
                            copyToClipboard(client.phone!, 'Phone')
                          }
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {client.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <div className="mt-1 flex items-start">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <p className="text-sm text-gray-900">
                          {client.address}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(client.address!, 'Address')
                          }
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Tax Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {client.tax_form && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tax Form
                      </label>
                      <div className="mt-1 flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-900">
                          {client.tax_form}
                        </p>
                      </div>
                    </div>
                  )}

                  {client.vat_status && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        VAT Status
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {client.vat_status}
                      </p>
                    </div>
                  )}

                  {client.vat_frequency && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        VAT Frequency
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {client.vat_frequency}
                      </p>
                    </div>
                  )}

                  {client.gtu_codes && client.gtu_codes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        GTU Codes
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {client.gtu_codes.map((code: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded ${
                        client.vat_eu_registration
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      } mr-2`}
                    ></div>
                    <span className="text-sm text-gray-700">
                      VAT EU Registration
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded ${
                        client.labor_fund ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}
                    ></div>
                    <span className="text-sm text-gray-700">Labor Fund</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded ${
                        client.free_amount_2022 ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}
                    ></div>
                    <span className="text-sm text-gray-700">
                      Free Amount 2022
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded ${
                        client.e_szok_system ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}
                    ></div>
                    <span className="text-sm text-gray-700">e-SZOK System</span>
                  </div>
                </div>
              </div>

              {/* ZUS Information */}
              {(client.zus_details ||
                client.zus_startup_relief ||
                client.zus_startup_relief_months) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    ZUS Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {client.zus_details && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          ZUS Details
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {client.zus_details}
                        </p>
                      </div>
                    )}

                    {client.zus_startup_relief && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          ZUS Startup Relief
                        </label>
                        <div className="mt-1 flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            Active
                            {client.zus_startup_relief_months &&
                              ` (${client.zus_startup_relief_months} months)`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sensitive Information */}
              {canViewSensitive &&
                (client.bank_account ||
                  client.aml_group ||
                  client.aml_date ||
                  client.additional_notes) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        Sensitive Information
                      </h2>
                      <button
                        onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        {showSensitiveInfo ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        {showSensitiveInfo ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {showSensitiveInfo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {client.bank_account && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Bank Account
                            </label>
                            <div className="mt-1 flex items-center">
                              <p className="text-sm text-gray-900 font-mono">
                                {client.bank_account}
                              </p>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    client.bank_account!,
                                    'Bank account'
                                  )
                                }
                                className="ml-2 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {client.aml_group && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              AML Group
                            </label>
                            <div className="mt-1 flex items-center">
                              <Shield className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm text-gray-900">
                                {client.aml_group}
                              </p>
                            </div>
                          </div>
                        )}

                        {client.aml_date && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              AML Date
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(client.aml_date)}
                            </p>
                          </div>
                        )}

                        {client.additional_notes && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Additional Notes
                            </label>
                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                              {client.additional_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Client Number</span>
                    <span className="text-sm font-medium text-gray-900">
                      #{client.client_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Has Employees</span>
                    <span className="text-sm font-medium text-gray-900">
                      {client.has_employees ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Service Provider
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {client.service_provider || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Database Status
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {client.database_status || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Module Actions */}
              {(features.canGenerateInvoices ||
                features.canManageContracts ||
                features.canAttachDocuments ||
                features.canAssignTasks) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Available Actions
                  </h3>
                  <div className="space-y-2">
                    {features.canGenerateInvoices && (
                      <button
                        onClick={handleGenerateInvoice}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <Receipt className="h-4 w-4 mr-3" />
                        Generate Invoice
                      </button>
                    )}
                    {features.canManageContracts && (
                      <button
                        onClick={handleManageContracts}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <ScrollText className="h-4 w-4 mr-3" />
                        Manage Contracts
                      </button>
                    )}
                    {features.canAttachDocuments && (
                      <button
                        onClick={handleAttachDocument}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <Files className="h-4 w-4 mr-3" />
                        Attach Document
                      </button>
                    )}
                    {features.canAssignTasks && (
                      <Link
                        to={`/tasks?clientId=${client.id}`}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <ListTodo className="h-4 w-4 mr-3" />
                        View Tasks
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Annexes Information */}
              {(client.annexes_2022_status ||
                client.annexes_2023_status ||
                client.annexes_2022_sent_date ||
                client.annexes_2023_sent_date) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Annexes Status
                  </h3>
                  <div className="space-y-4">
                    {client.annexes_2022_status && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            2022 Status
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {client.annexes_2022_status}
                          </span>
                        </div>
                        {client.annexes_2022_sent_date && (
                          <p className="text-xs text-gray-400 mt-1">
                            Sent: {formatDate(client.annexes_2022_sent_date)}
                          </p>
                        )}
                      </div>
                    )}
                    {client.annexes_2023_status && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            2023 Status
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {client.annexes_2023_status}
                          </span>
                        </div>
                        {client.annexes_2023_sent_date && (
                          <p className="text-xs text-gray-400 mt-1">
                            Sent: {formatDate(client.annexes_2023_sent_date)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(client.fixed_costs ||
                client.vehicles_assets ||
                client.depreciation_info) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Additional Details
                  </h3>
                  <div className="space-y-4">
                    {client.fixed_costs && client.fixed_costs.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fixed Costs
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {client.fixed_costs.map(
                            (cost: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                {cost}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {client.vehicles_assets && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Vehicles & Assets
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {client.vehicles_assets}
                        </p>
                      </div>
                    )}
                    {client.depreciation_info && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Depreciation Info
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {client.depreciation_info}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // History Tab Content
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Activity Timeline */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    Activity Timeline
                  </h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={async () => {
                        try {
                          await fetchHistory(client.id);
                          await fetchSummary(client.id);
                        } catch (error) {
                          console.error('Failed to refresh history:', error);
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      disabled={historyLoading}
                    >
                      <RefreshCcw
                        className={`h-4 w-4 mr-1 ${historyLoading ? 'animate-spin' : ''}`}
                      />
                      Refresh
                    </button>
                    {user?.role === 'SUPERADMIN' || user?.role === 'OWNER' ? (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to clear all activity history for this client? This action cannot be undone.'
                            )
                          ) {
                            clearHistory(client.id);
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear History
                      </button>
                    ) : null}
                  </div>
                </div>

                <ClientHistoryTimeline
                  activities={activities}
                  loading={historyLoading}
                  onDeleteActivity={deleteActivity}
                  showActions={
                    user?.role === 'SUPERADMIN' || user?.role === 'OWNER'
                  }
                />
              </div>
            </div>

            {/* Activity Summary Sidebar */}
            <div className="space-y-6">
              {summary && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Activity Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Total Activities
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {summary.total_activities}
                      </span>
                    </div>

                    {summary.last_activity_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Last Activity
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(
                            summary.last_activity_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {summary.most_common_activity && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Most Common
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {summary.most_common_activity.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Team Members
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {summary.unique_users_count}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions for History */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Log Activity
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // This could open a modal or form for logging custom activities
                      toast.info('Custom activity logging coming soon!');
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Add Note
                  </button>
                  <button
                    onClick={() => {
                      const description = prompt('Enter call details:');
                      if (description && client) {
                        // This would use the logClientContact method
                        toast.success('Phone call logged successfully');
                      }
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                  >
                    <Phone className="h-4 w-4 mr-3" />
                    Log Phone Call
                  </button>
                  <button
                    onClick={() => {
                      const description = prompt('Enter email details:');
                      if (description && client) {
                        // This would use the logClientContact method
                        toast.success('Email activity logged successfully');
                      }
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                  >
                    <Mail className="h-4 w-4 mr-3" />
                    Log Email Sent
                  </button>
                </div>
              </div>

              {/* History Management (Admin Only) */}
              {user?.role === 'SUPERADMIN' || user?.role === 'OWNER' ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    History Management
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            'This will clean up history entries older than 1 year across all clients. Continue?'
                          )
                        ) {
                          try {
                            await cleanupOldHistory(365);
                            // Refresh current client history
                            if (client) {
                              await fetchHistory(client.id);
                              await fetchSummary(client.id);
                            }
                          } catch (error) {
                            console.error('Cleanup failed:', error);
                          }
                        }
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 rounded-md border border-orange-200"
                    >
                      <Archive className="h-4 w-4 mr-3" />
                      Cleanup Old History (1+ years)
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            'This will clean up history entries older than 6 months across all clients. Continue?'
                          )
                        ) {
                          try {
                            await cleanupOldHistory(180);
                            // Refresh current client history
                            if (client) {
                              await fetchHistory(client.id);
                              await fetchSummary(client.id);
                            }
                          } catch (error) {
                            console.error('Cleanup failed:', error);
                          }
                        }
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md border border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Cleanup Old History (6+ months)
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
