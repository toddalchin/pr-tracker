'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { 
  Award, 
  Calendar, 
  Clock, 
  TrendingUp,
  Trophy,
  Target
} from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

interface AwardEntry {
  award: string;
  status: string;
  deadline: string;
  dateAnnounced: string;
  category: string;
  individual: string;
  agency: string;
  notes: string;
  id: number;
  [key: string]: unknown;
}

export default function AwardsPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awards, setAwards] = useState<AwardEntry[]>([]);

  const processAwardsData = useCallback((data: WorksheetData) => {
    const awardsSheet = data.sheets['Awards'] || [];
    
    const processedAwards = awardsSheet.map((item, index) => ({
      award: String(item['Award '] || item.Award || ''),
      status: String(item.Status || item.Submission || ''),
      deadline: String(item['Date / Deadline'] || item.Deadline || ''),
      dateAnnounced: String(item['Date Announced'] || ''),
      category: String(item.Category || ''),
      individual: String(item.Individual || ''),
      agency: String(item.Agency || ''),
      notes: String(item.Notes || ''),
      id: index + 1,
      ...item
    }));
    
    setAwards(processedAwards);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets/all');
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      if (result.success) {
        processAwardsData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [processAwardsData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('won') || statusLower.includes('winner')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statusLower.includes('submitted') || statusLower.includes('pending')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (statusLower.includes('shortlist') || statusLower.includes('finalist')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (statusLower.includes('rejected') || statusLower.includes('not selected')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('won') || statusLower.includes('winner')) {
      return <Trophy className="w-4 h-4" />;
    }
    if (statusLower.includes('shortlist') || statusLower.includes('finalist')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <Target className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  };

  const isUpcoming = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return !isNaN(date.getTime()) && date > now;
  };

  const categorizeAwards = () => {
    const submitted = awards.filter(award => {
      const status = award.status.toLowerCase();
      return status.includes('submitted') || status.includes('pending') || status.includes('shortlist') || status.includes('finalist');
    });

    const won = awards.filter(award => {
      const status = award.status.toLowerCase();
      return status.includes('won') || status.includes('winner') || status.includes('gold') || status.includes('silver') || status.includes('bronze');
    });

    const upcoming = awards.filter(award => {
      // Check if deadline is upcoming and not yet submitted
      if (!award.deadline) return false;
      const deadline = new Date(award.deadline);
      const now = new Date();
      const status = award.status.toLowerCase();
      return !isNaN(deadline.getTime()) && 
             deadline > now && 
             !status.includes('submitted') && 
             !status.includes('won');
    });

    const closed = awards.filter(award => {
      const status = award.status.toLowerCase();
      return status.includes('not this time') || 
             status.includes('rejected') || 
             status.includes('declined') ||
             status.includes('not selected');
    });

    return { submitted, won, upcoming, closed };
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const { submitted, won, upcoming, closed } = categorizeAwards();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Awards Tracker
          </h1>
          <p className="text-gray-600">
            Track award submissions, wins, and upcoming opportunities
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Submitted/Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{submitted.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Won</p>
                <p className="text-2xl font-bold text-green-600">{won.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed/Rejected</p>
                <p className="text-2xl font-bold text-red-600">{closed.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Target className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Awards Lists */}
        <div className="space-y-8">
          {/* Upcoming Awards */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
                <p className="text-sm text-gray-600">Awards with approaching deadlines</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcoming.map((award, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{award.award}</h3>
                        {award.category && (
                          <p className="text-sm text-gray-600">{award.category}</p>
                        )}
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          Deadline: {formatDate(award.deadline)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          <Calendar className="w-3 h-3 mr-1" />
                          Upcoming
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submitted/Pending Awards */}
          {submitted.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Submitted & Pending</h2>
                <p className="text-sm text-gray-600">Awards currently under review</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {submitted.map((award, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{award.award}</h3>
                        {award.category && (
                          <p className="text-sm text-gray-600">{award.category}</p>
                        )}
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          {award.deadline && (
                            <>
                              <Calendar className="w-4 h-4 mr-1" />
                              Deadline: {formatDate(award.deadline)}
                            </>
                          )}
                        </div>
                        {award.notes && (
                          <p className="text-sm text-gray-600 mt-1">{award.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(award.status)}`}>
                          {getStatusIcon(award.status)}
                          <span className="ml-1">{award.status}</span>
                        </span>
                        {award.dateAnnounced && (
                          <div className="text-xs text-gray-500 mt-1">
                            Announced: {formatDate(award.dateAnnounced)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Won Awards */}
          {won.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Awards Won</h2>
                <p className="text-sm text-gray-600">Congratulations on these achievements!</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {won.map((award, index) => (
                    <div key={index} className="flex items-start justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{award.award}</h3>
                        {award.category && (
                          <p className="text-sm text-gray-600">{award.category}</p>
                        )}
                        {award.notes && (
                          <p className="text-sm text-gray-600 mt-1">{award.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <Trophy className="w-3 h-3 mr-1" />
                          {award.status}
                        </span>
                        {award.dateAnnounced && (
                          <div className="text-xs text-gray-500 mt-1">
                            Announced: {formatDate(award.dateAnnounced)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Awards Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">All Awards</h2>
              <p className="text-sm text-gray-600">Complete awards tracking history</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Award
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Announced
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {awards.map((award, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{award.award}</div>
                        {(award.individual || award.agency) && (
                          <div className="text-sm text-gray-500">
                            {award.individual && `Individual: ${award.individual}`}
                            {award.individual && award.agency && ' • '}
                            {award.agency && `Agency: ${award.agency}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {award.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {award.individual ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Individual
                          </span>
                        ) : award.agency ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Agency
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(award.status)}`}>
                          {getStatusIcon(award.status)}
                          <span className="ml-1">{award.status || 'Unknown'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(award.deadline)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(award.dateAnnounced)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 