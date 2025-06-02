'use client';

import Header from '@/components/Header';
import { useWorksheetData } from '@/hooks/useWorksheetData';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { Mail, Phone, Building, Calendar, User, Target, Users } from 'lucide-react';

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
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('ongoing')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (statusLower.includes('pending') || statusLower.includes('follow-up')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (statusLower.includes('cold') || statusLower.includes('new')) {
      return 'bg-sky-100 text-sky-800 border-sky-200';
    }
    if (statusLower.includes('closed') || statusLower.includes('declined')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Media Relations
          </h1>
          <p className="text-gray-600">Manage your media contacts and relationships</p>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Contacts</p>
                <p className="text-3xl font-bold text-indigo-600">{outreach.length}</p>
                <p className="text-xs text-gray-500 mt-1">In database</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Relationships</p>
                <p className="text-3xl font-bold text-emerald-600">{active.length}</p>
                <p className="text-xs text-gray-500 mt-1">Ongoing contacts</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Follow-ups</p>
                <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Cold Contacts</p>
                <p className="text-3xl font-bold text-sky-600">{cold.length}</p>
                <p className="text-xs text-gray-500 mt-1">Potential outreach</p>
              </div>
              <div className="p-3 bg-sky-100 rounded-xl">
                <Mail className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </div>
        </div>

        {outreach.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Outreach Data Found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any outreach or contact data in your spreadsheet.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600 mb-1">Available sheets:</p>
              <p className="text-sm font-mono text-gray-800">{data.sheetNames.join(', ')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Priority Follow-ups */}
            {pending.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-amber-200">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Priority Follow-ups</h2>
                      <p className="text-sm text-gray-600">Contacts requiring immediate attention</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {pending.map((contact, index) => (
                      <div key={index} className="border border-amber-200 rounded-lg p-4 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {contact.Reporter || contact.Name || 'Unknown Contact'}
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-700">
                                <Building className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                                <span className="truncate">{contact.Outlet || 'Unknown Outlet'}</span>
                              </div>
                              {contact.Type && (
                                <div className="flex items-center text-sm text-gray-700">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 flex-shrink-0"></div>
                                  <span>{contact.Type}</span>
                                </div>
                              )}
                              {contact['Date / Deadline'] && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                                  <span>Deadline: {formatDate(contact['Date / Deadline'])}</span>
                                </div>
                              )}
                            </div>
                            {contact.Topic && (
                              <div className="mt-3 p-2 bg-white rounded border">
                                <p className="text-sm text-gray-700 leading-relaxed">{contact.Topic}</p>
                              </div>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ml-4 flex-shrink-0 ${getStatusColor(contact.Status)}`}>
                            {contact.Status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Contacts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">All Contacts</h2>
                    <p className="text-sm text-gray-600">Complete outreach contact database</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Outlet
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date / Deadline
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Topic
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outreach.map((contact, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {(contact.Reporter || contact.Name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {contact.Reporter || contact.Name || '-'}
                              </div>
                              {contact.Phone && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  <span className="truncate max-w-xs">{contact.Phone}</span>
                                </div>
                              )}
                              {contact.Type && (
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                                  {contact.Type}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.Outlet || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(contact.Status)}`}>
                            {contact.Status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(contact['Date / Deadline'])}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-xs">
                            <div className="overflow-hidden" style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.5'
                            }}>
                              {contact.Topic || '-'}
                            </div>
                          </div>
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