'use client';

import Header from '@/components/Header';
import { useWorksheetData } from '@/hooks/useWorksheetData';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { Mail, Phone, Building, Calendar, User, Target } from 'lucide-react';

interface OutreachData {
  Name?: string;
  Reporter?: string;
  Outlet?: string;
  Email?: string;
  Phone?: string;
  Status?: string;
  'Date / Deadline'?: string;
  Topic?: string;
  Type?: string;
  Priority?: string;
  [key: string]: unknown;
}

export default function OutreachPage() {
  const { data, loading, error, refetch } = useWorksheetData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return <ErrorState error="No data available" onRetry={refetch} />;

  // Try multiple possible sheet names for outreach
  const possibleOutreachSheets = ['Media Relations', 'Outreach', 'Contacts', 'PR Contacts', 'Media Contacts'];
  let outreach: OutreachData[] = [];
  let sheetName = '';

  for (const name of possibleOutreachSheets) {
    if (data.sheets[name] && data.sheets[name].length > 0) {
      outreach = data.sheets[name] as OutreachData[];
      sheetName = name;
      break;
    }
  }

  // If no specific outreach sheet, check if any sheet has contact-like data
  if (outreach.length === 0) {
    const allSheets = Object.entries(data.sheets);
    for (const [name, sheetData] of allSheets) {
      if (sheetData.length > 0) {
        const firstRow = sheetData[0];
        const hasContactFields = Object.keys(firstRow).some(key => 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('contact') ||
          key.toLowerCase().includes('organization') ||
          key.toLowerCase().includes('outlet')
        );
        if (hasContactFields) {
          outreach = sheetData as OutreachData[];
          sheetName = name;
          break;
        }
      }
    }
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('ongoing')) {
      return 'bg-green-100 text-green-800';
    }
    if (statusLower.includes('pending') || statusLower.includes('follow-up')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (statusLower.includes('cold') || statusLower.includes('new')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (statusLower.includes('closed') || statusLower.includes('declined')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  };

  const categorizeOutreach = () => {
    const active = outreach.filter(item => {
      const status = (item.Status || '').toLowerCase();
      return status.includes('active') || status.includes('ongoing');
    });

    const pending = outreach.filter(item => {
      const status = (item.Status || '').toLowerCase();
      return status.includes('pending') || status.includes('follow-up');
    });

    const cold = outreach.filter(item => {
      const status = (item.Status || '').toLowerCase();
      return status.includes('cold') || status.includes('new') || !item.Status;
    });

    return { active, pending, cold };
  };

  const { active, pending, cold } = categorizeOutreach();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Outreach
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-purple-600">{outreach.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Relationships</p>
                <p className="text-2xl font-bold text-green-600">{active.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cold Contacts</p>
                <p className="text-2xl font-bold text-blue-600">{cold.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {outreach.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Outreach Data Found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any outreach or contact data in your spreadsheet.
            </p>
            <p className="text-sm text-gray-500">
              Available sheets: {data.sheetNames.join(', ')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Follow-ups */}
            {pending.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Pending Follow-ups</h2>
                  <p className="text-sm text-gray-600">Contacts requiring immediate attention</p>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {pending.map((contact, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {contact.Reporter || contact.Name || 'Unknown Contact'}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Building className="w-4 h-4 mr-1" />
                              {contact.Outlet || 'Unknown Outlet'}
                            </div>
                            {contact.Type && (
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                {contact.Type}
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Mail className="w-4 h-4 mr-1" />
                              {contact.Email || 'No email'}
                            </div>
                            {contact['Date / Deadline'] && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Calendar className="w-4 h-4 mr-1" />
                                Deadline: {formatDate(contact['Date / Deadline'])}
                              </div>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.Status)}`}>
                            {contact.Status || 'Unknown'}
                          </span>
                        </div>
                        {contact.Topic && (
                          <p className="text-sm text-gray-700 mt-3">{contact.Topic}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Contacts Table */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">All Contacts</h2>
                <p className="text-sm text-gray-600">Complete outreach contact database</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outlet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date / Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topic
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outreach.map((contact, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.Reporter || contact.Name || '-'}
                          </div>
                          {contact.Phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.Phone}
                            </div>
                          )}
                          {contact.Type && (
                            <div className="text-sm text-gray-500">
                              {contact.Type}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.Outlet || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.Email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.Status)}`}>
                            {contact.Status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(contact['Date / Deadline'])}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {contact.Topic || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 