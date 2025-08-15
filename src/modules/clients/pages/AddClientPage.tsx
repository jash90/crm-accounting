import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { toast } from 'react-toastify';
import { Building2, ArrowLeft, Plus, Minus } from 'lucide-react';

const TAX_FORMS = [
  'Zasady ogólne - miesięcznie',
  'Zasady ogólne - kwartalnie',
  'Ryczałt 3%',
  'Ryczałt 5.5%',
  'Ryczałt 8.5%',
  'Ryczałt 12%',
  'Ryczałt 15%',
  'Ryczałt 17%',
  'Karta podatkowa'
];

const VAT_STATUSES = [
  'Zwolniony z VAT',
  'VAT miesięcznie',
  'VAT kwartalnie',
  'VAT-7 miesięcznie',
  'VAT-7 kwartalnie'
];

const GTU_CODES = [
  'GTU_01', 'GTU_02', 'GTU_03', 'GTU_04', 'GTU_05',
  'GTU_06', 'GTU_07', 'GTU_08', 'GTU_09', 'GTU_10',
  'GTU_11', 'GTU_12', 'GTU_13'
];

const AML_GROUPS = [
  'Grupa I - niskie ryzyko',
  'Grupa II - średnie ryzyko',
  'Grupa III - wysokie ryzyko'
];

const CONTRACT_STATUSES = [
  'Not Signed',
  'Pending',
  'Signed',
  'Niepodpisana',
  'W trakcie',
  'Podpisana'
];

export const AddClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { createClient } = useClients();
  
  // Basic Information
  const [companyName, setCompanyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [employmentForm, setEmploymentForm] = useState('');
  
  // ZUS Information
  const [zusDetails, setZusDetails] = useState('');
  const [zusStartupRelief, setZusStartupRelief] = useState(false);
  const [zusStartupReliefMonths, setZusStartupReliefMonths] = useState(0);
  
  // Tax Information
  const [taxForm, setTaxForm] = useState('');
  const [vatStatus, setVatStatus] = useState('');
  const [vatFrequency, setVatFrequency] = useState('');
  const [gtuCodes, setGtuCodes] = useState<string[]>([]);
  const [vatEuRegistration, setVatEuRegistration] = useState(false);
  const [laborFund, setLaborFund] = useState(false);
  const [freeAmount2022, setFreeAmount2022] = useState(false);
  
  // Costs and Assets
  const [fixedCosts, setFixedCosts] = useState<string[]>([]);
  const [vehiclesAssets, setVehiclesAssets] = useState('');
  const [depreciationInfo, setDepreciationInfo] = useState('');
  
  // Systems
  const [eSzokSystem, setESzokSystem] = useState(false);
  const [hasEmployees, setHasEmployees] = useState(false);
  
  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Compliance
  const [databaseStatus, setDatabaseStatus] = useState('Not Created');
  const [amlGroup, setAmlGroup] = useState('');
  const [amlDate, setAmlDate] = useState('');
  
  // Service Management
  const [serviceProvider, setServiceProvider] = useState('');
  const [contractStatus, setContractStatus] = useState('Not Signed');
  
  // Annexes
  const [annexes2022Status, setAnnexes2022Status] = useState('');
  const [annexes2022SentDate, setAnnexes2022SentDate] = useState('');
  const [annexes2023Status, setAnnexes2023Status] = useState('');
  const [annexes2023SentDate, setAnnexes2023SentDate] = useState('');
  
  // Additional
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [newFixedCost, setNewFixedCost] = useState('');

  const handleAddFixedCost = () => {
    if (newFixedCost.trim() && !fixedCosts.includes(newFixedCost.trim())) {
      setFixedCosts([...fixedCosts, newFixedCost.trim()]);
      setNewFixedCost('');
    }
  };

  const handleRemoveFixedCost = (costToRemove: string) => {
    setFixedCosts(fixedCosts.filter(cost => cost !== costToRemove));
  };

  const handleToggleGtuCode = (code: string) => {
    if (gtuCodes.includes(code)) {
      setGtuCodes(gtuCodes.filter(c => c !== code));
    } else {
      setGtuCodes([...gtuCodes, code]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clientData = {
        company_name: companyName,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        business_type: businessType || undefined,
        employment_form: employmentForm || undefined,
        zus_details: zusDetails || undefined,
        zus_startup_relief: zusStartupRelief,
        zus_startup_relief_months: zusStartupReliefMonths,
        tax_form: taxForm || undefined,
        vat_status: vatStatus || undefined,
        vat_frequency: vatFrequency || undefined,
        gtu_codes: gtuCodes.length > 0 ? gtuCodes : undefined,
        vat_eu_registration: vatEuRegistration,
        labor_fund: laborFund,
        free_amount_2022: freeAmount2022,
        fixed_costs: fixedCosts.length > 0 ? fixedCosts : undefined,
        vehicles_assets: vehiclesAssets || undefined,
        depreciation_info: depreciationInfo || undefined,
        e_szok_system: eSzokSystem,
        has_employees: hasEmployees,
        phone: phone || undefined,
        email: email || undefined,
        database_status: databaseStatus,
        aml_group: amlGroup || undefined,
        aml_date: amlDate || undefined,
        service_provider: serviceProvider || undefined,
        contract_status: contractStatus,
        annexes_2022_status: annexes2022Status || undefined,
        annexes_2022_sent_date: annexes2022SentDate || undefined,
        annexes_2023_status: annexes2023Status || undefined,
        annexes_2023_sent_date: annexes2023SentDate || undefined,
        additional_notes: additionalNotes || undefined,
      };

      await createClient(clientData);
      toast.success('Client created successfully!');
      navigate('/clients');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
            <p className="mt-1 text-gray-600">Add a new accounting client to your company database</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  id="company-name"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label htmlFor="business-type" className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <input
                  id="business-type"
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., IT Services, Consulting"
                />
              </div>

              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                  End Date (if suspended)
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="employment-form" className="block text-sm font-medium text-gray-700">
                  Employment Form
                </label>
                <input
                  id="employment-form"
                  type="text"
                  value={employmentForm}
                  onChange={(e) => setEmploymentForm(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., DG (Działalność Gospodarcza)"
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Tax Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tax-form" className="block text-sm font-medium text-gray-700">
                  Tax Form
                </label>
                <select
                  id="tax-form"
                  value={taxForm}
                  onChange={(e) => setTaxForm(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select tax form</option>
                  {TAX_FORMS.map((form) => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vat-status" className="block text-sm font-medium text-gray-700">
                  VAT Status
                </label>
                <select
                  id="vat-status"
                  value={vatStatus}
                  onChange={(e) => setVatStatus(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select VAT status</option>
                  {VAT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* GTU Codes */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                GTU Codes
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {GTU_CODES.map((code) => (
                  <label key={code} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={gtuCodes.includes(code)}
                      onChange={() => handleToggleGtuCode(code)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">{code}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tax checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={vatEuRegistration}
                  onChange={(e) => setVatEuRegistration(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">VAT-EU Registration</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={laborFund}
                  onChange={(e) => setLaborFund(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Labor Fund</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={zusStartupRelief}
                  onChange={(e) => setZusStartupRelief(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">ZUS Startup Relief</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={freeAmount2022}
                  onChange={(e) => setFreeAmount2022(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Free Amount 2022 Calculated</span>
              </label>
            </div>
          </div>

          {/* ZUS Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">ZUS Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="zus-details" className="block text-sm font-medium text-gray-700">
                  ZUS Details
                </label>
                <input
                  id="zus-details"
                  type="text"
                  value={zusDetails}
                  onChange={(e) => setZusDetails(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Wysoki ZUS bez chorobowego"
                />
              </div>

              {zusStartupRelief && (
                <div>
                  <label htmlFor="zus-relief-months" className="block text-sm font-medium text-gray-700">
                    Relief Months
                  </label>
                  <input
                    id="zus-relief-months"
                    type="number"
                    min="0"
                    max="6"
                    value={zusStartupReliefMonths}
                    onChange={(e) => setZusStartupReliefMonths(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="client-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="client-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="+48 123 456 789"
                />
              </div>
            </div>
          </div>

          {/* Service Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Service Management</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contract-status" className="block text-sm font-medium text-gray-700">
                  Contract Status
                </label>
                <select
                  id="contract-status"
                  value={contractStatus}
                  onChange={(e) => setContractStatus(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {CONTRACT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="aml-group" className="block text-sm font-medium text-gray-700">
                  AML Group
                </label>
                <select
                  id="aml-group"
                  value={amlGroup}
                  onChange={(e) => setAmlGroup(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select AML group</option>
                  {AML_GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {amlGroup && (
                <div>
                  <label htmlFor="aml-date" className="block text-sm font-medium text-gray-700">
                    AML Assignment Date
                  </label>
                  <input
                    id="aml-date"
                    type="date"
                    value={amlDate}
                    onChange={(e) => setAmlDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label htmlFor="service-provider" className="block text-sm font-medium text-gray-700">
                  Service Provider
                </label>
                <input
                  id="service-provider"
                  type="text"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Alltaxo Sp. z o.o."
                />
              </div>
            </div>
          </div>

          {/* Fixed Costs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Fixed Costs</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fixed Costs
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  value={newFixedCost}
                  onChange={(e) => setNewFixedCost(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFixedCost())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Internet, Phone, Office rent..."
                />
                <button
                  type="button"
                  onClick={handleAddFixedCost}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {fixedCosts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {fixedCosts.map((cost, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {cost}
                      <button
                        type="button"
                        onClick={() => handleRemoveFixedCost(cost)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* System Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Systems & Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={eSzokSystem}
                  onChange={(e) => setESzokSystem(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">e-SZOK System</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasEmployees}
                  onChange={(e) => setHasEmployees(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Has Employees</span>
              </label>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h3>
            <div>
              <label htmlFor="additional-notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="additional-notes"
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Additional notes about this client..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};