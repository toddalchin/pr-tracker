'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import UniversalFilters, { FilterState, applyDateFilter } from '@/components/UniversalFilters';
import { 
  Award, 
  Calendar, 
  Clock, 
  TrendingUp,
  Trophy,
  Target,
  Building,
  Users,
  ExternalLink,
  Filter
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
  client: string;
  isAgencyEntry: boolean;
  notes: string;
  id: number;
  [key: string]: unknown;
}

export default function AwardsPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awards, setAwards] = useState<AwardEntry[]>([]);
  const [filteredAwards, setFilteredAwards] = useState<AwardEntry[]>([]);

  // Initialize filters with YTD as default
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'ytd',
    year: new Date().getFullYear().toString(),
    tier: 'all',
    client: '',
    entryType: 'all',
    status: 'all'
  });

  const processAwardsData = useCallback((data: WorksheetData) => {
    const awardsSheet = data.sheets['Awards'] || [];
    
    const processedAwards = awardsSheet.map((item, index) => {
      // Check if this is an agency entry (marked with 'x' in Agency column)
      const agencyValue = String(item.Agency || '').toLowerCase().trim();
      const isAgencyEntry = agencyValue === 'x' || agencyValue === 'yes' || agencyValue === 'agency';
      
      return {
        award: String(item['Award '] || item.Award || ''),
        status: String(item.Status || item.Submission || ''),
        deadline: String(item['Date / Deadline'] || item.Deadline || ''),
        dateAnnounced: String(item['Date Announced'] || ''),
        category: String(item.Category || ''),
        individual: String(item.Individual || ''),
        agency: String(item.Agency || ''),
        client: String(item.Client || ''),
        isAgencyEntry,
        notes: String(item.Notes || ''),
        id: index + 1,
        ...item
      };
    });
    
    setAwards(processedAwards);
  }, []);

  // Apply filters whenever awards or filters change
  useEffect(() => {
    let filtered = [...awards];

    // Apply date filtering (use deadline for awards without announced date, then announced date)
    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(award => {
        const primaryDate = award.dateAnnounced || award.deadline;
        if (!primaryDate) return false;
        
        const dateFiltered = applyDateFilter([{ Date: primaryDate }], filters, 'Date');
        return dateFiltered.length > 0;
      });
    }

    // Apply entry type filter
    if (filters.entryType !== 'all') {
      filtered = filtered.filter(award => {
        if (filters.entryType === 'agency') {
          return award.isAgencyEntry;
        } else if (filters.entryType === 'client') {
          return !award.isAgencyEntry;
        }
        return true;
      });
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(award => {
        const status = award.status.toLowerCase();
        switch (filters.status) {
          case 'won':
            return status.includes('won') || status.includes('winner') || 
                   status.includes('gold') || status.includes('silver') || status.includes('bronze');
          case 'submitted':
            return status.includes('submitted') || status.includes('pending') || 
                   status.includes('shortlist') || status.includes('finalist');
          case 'upcoming':
            const deadline = new Date(award.deadline);
            const now = new Date();
            return !isNaN(deadline.getTime()) && deadline > now && 
                   !status.includes('submitted') && !status.includes('won');
          case 'closed':
            return status.includes('not this time') || status.includes('rejected') || 
                   status.includes('declined') || status.includes('not selected');
          default:
            return true;
        }
      });
    }

    // Apply client/award name filter
    if (filters.client && filters.client.trim() !== '') {
      const searchTerm = filters.client.toLowerCase();
      filtered = filtered.filter(award => 
        award.award.toLowerCase().includes(searchTerm) ||
        award.client.toLowerCase().includes(searchTerm) ||
        award.category.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredAwards(filtered);
  }, [awards, filters]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/sheets/all');
      
      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          if (errorData.quotaError) {
            throw new Error(`API quota exceeded. Please wait ${errorData.retryAfter || 60} seconds and try again.`);
          }
        }
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

  const categorizeAwards = (awardsToProcess: AwardEntry[]) => {
    const submitted = awardsToProcess.filter(award => {
      const status = award.status.toLowerCase();
      return status.includes('submitted') || status.includes('pending') || status.includes('shortlist') || status.includes('finalist');
    });

    const won = awardsToProcess.filter(award => {
      const status = award.status.toLowerCase();
      return status.includes('won') || status.includes('winner') || status.includes('gold') || status.includes('silver') || status.includes('bronze');
    });

    const upcoming = awardsToProcess.filter(award => {
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

    const closed = awardsToProcess.filter(award => {
      const status = award.status.toLowerCase();
      return status.includes('not this time') || 
             status.includes('rejected') || 
             status.includes('declined') ||
             status.includes('not selected');
    });

    return { submitted, won, upcoming, closed };
  };

  // Get available years from the award data
  const getAvailableYears = () => {
    const years = new Set<string>();
    awards.forEach(award => {
      const primaryDate = award.dateAnnounced || award.deadline;
      if (primaryDate) {
        const date = new Date(primaryDate);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear().toString());
        }
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const { submitted, won, upcoming, closed } = categorizeAwards(filteredAwards);
  const agencyEntries = filteredAwards.filter(award => award.isAgencyEntry);
  const clientEntries = filteredAwards.filter(award => !award.isAgencyEntry);

  const getTimeRangeLabel = () => {
    switch (filters.dateRange) {
      case 'ytd': return `${filters.year || new Date().getFullYear()} YTD`;
      case 'quarter': return `Q${filters.quarter || Math.ceil((new Date().getMonth() + 1) / 3)} ${filters.year || new Date().getFullYear()}`;
      case 'month': return 'This Month';
      case 'all': return 'All Time';
      case 'custom': return 'Custom Period';
      default: return `${filters.year || new Date().getFullYear()} YTD`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Universal Filters */}
        <UniversalFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableYears={getAvailableYears()}
          showEntryTypeFilter={true}
          showStatusFilter={true}
          showClientFilter={true}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Submitted/Pending</p>
                <p className="text-xl font-bold text-yellow-600">{submitted.length}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Won</p>
                <p className="text-xl font-bold text-green-600">{won.length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Upcoming</p>
                <p className="text-xl font-bold text-blue-600">{upcoming.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Closed</p>
                <p className="text-xl font-bold text-gray-600">{closed.length}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Agency Entries</p>
                <p className="text-xl font-bold text-purple-600">{agencyEntries.length}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Client Entries</p>
                <p className="text-xl font-bold text-indigo-600">{clientEntries.length}</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Awards List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredAwards.length} entries
              </h2>
              <div className="text-sm text-gray-500">
                {getTimeRangeLabel()}
              </div>
            </div>
          </div>
          
          {filteredAwards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Award / Category
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
                      Announced
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client/Individual
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAwards.map((award) => (
                    <tr key={award.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {award.award || 'Unnamed Award'}
                          </div>
                          {award.category && (
                            <div className="text-xs text-gray-500">{award.category}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          award.isAgencyEntry 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {award.isAgencyEntry ? (
                            <>
                              <Building className="w-3 h-3 mr-1" />
                              Agency
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3 mr-1" />
                              Client
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(award.status)}`}>
                          {getStatusIcon(award.status)}
                          <span className="ml-1">{award.status || 'Unknown'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isUpcoming(award.deadline) ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(award.deadline)}
                        </div>
                        {isUpcoming(award.deadline) && (
                          <div className="text-xs text-orange-500">Upcoming</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(award.dateAnnounced)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {award.isAgencyEntry ? (
                            award.individual || 'Team Entry'
                          ) : (
                            award.client || 'No Client Specified'
                          )}
                        </div>
                        {award.notes && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {award.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No awards found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters or adding award entries to your spreadsheet
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 