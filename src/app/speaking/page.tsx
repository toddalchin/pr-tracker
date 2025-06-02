'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import UniversalFilters, { FilterState, applyDateFilter } from '@/components/UniversalFilters';
import { 
  Mic, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  MapPin,
  Users,
  Video,
  ExternalLink,
  Presentation,
  Building,
  Globe,
  Target,
  TrendingUp
} from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

interface SpeakingOpportunity {
  eventName: string;
  venue: string;
  date: string;
  status: string;
  topic: string;
  format: string;
  audience: string;
  location: string;
  contact: string;
  notes: string;
  deadline: string;
  fee: string;
  duration: string;
  speaker: string;
  id: number;
  [key: string]: unknown;
}

interface SpeakingMetrics {
  totalOpportunities: number;
  confirmed: number;
  pending: number;
  declined: number;
  completed: number;
  upcomingEvents: number;
  avgMonthlyEvents: number;
  timeRangeLabel: string;
}

export default function SpeakingOpportunitiesPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<SpeakingOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<SpeakingOpportunity[]>([]);
  const [metrics, setMetrics] = useState<SpeakingMetrics | null>(null);

  // Initialize filters with YTD as default
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'ytd',
    year: new Date().getFullYear().toString(),
    tier: 'all',
    client: '',
    entryType: 'all',
    status: 'all'
  });

  const processSpeakingData = useCallback((data: WorksheetData) => {
    const speakingSheet = data.sheets['Speaking Opps'] || [];
    
    const processedOpportunities = speakingSheet.map((item, index) => ({
      eventName: String(item['Event'] || item['Event Name'] || item.Conference || ''),
      venue: String(item.Venue || item.Location || item.Organization || ''),
      date: String(item.Date || item['Event Date'] || item.When || ''),
      status: String(item.Status || item.Response || ''),
      topic: String(item.Topic || item.Subject || item.Title || ''),
      format: String(item.Format || item.Type || ''),
      audience: String(item.Audience || item['Target Audience'] || ''),
      location: String(item.Location || item.City || item.Where || ''),
      contact: String(item.Contact || item['Contact Person'] || item.Organizer || ''),
      notes: String(item.Notes || item.Comments || ''),
      deadline: String(item.Deadline || item['Response Deadline'] || ''),
      fee: String(item.Fee || item.Payment || item.Honorarium || ''),
      duration: String(item.Duration || item.Length || ''),
      speaker: String(item.Speaker || item.Presenter || ''),
      id: index + 1,
      ...item
    }));
    
    setOpportunities(processedOpportunities);
  }, []);

  // Apply filters whenever opportunities or filters change
  useEffect(() => {
    let filtered = [...opportunities];

    // Apply date filtering (use event date as primary date field)
    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(opportunity => {
        const primaryDate = opportunity.date || opportunity.deadline;
        if (!primaryDate) return false;
        
        const dateFiltered = applyDateFilter([{ Date: primaryDate }], filters, 'Date');
        return dateFiltered.length > 0;
      });
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(opportunity => {
        const status = opportunity.status.toLowerCase();
        switch (filters.status) {
          case 'won': // Map to 'confirmed'
            return status.includes('confirmed') || status.includes('accepted') || status.includes('yes');
          case 'submitted': // Map to 'pending'
            return status.includes('pending') || status.includes('waiting') || status.includes('under review');
          case 'closed': // Map to 'declined'
            return status.includes('declined') || status.includes('rejected') || status.includes('no') || status.includes('cancelled');
          case 'upcoming': // Map to 'upcoming events'
            if (!opportunity.date) return false;
            const eventDate = new Date(opportunity.date);
            const now = new Date();
            const confirmed = status.includes('confirmed') || status.includes('accepted');
            return !isNaN(eventDate.getTime()) && eventDate > now && confirmed;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (filters.client && filters.client.trim() !== '') {
      const searchTerm = filters.client.toLowerCase();
      filtered = filtered.filter(opportunity => 
        opportunity.eventName.toLowerCase().includes(searchTerm) ||
        opportunity.venue.toLowerCase().includes(searchTerm) ||
        opportunity.topic.toLowerCase().includes(searchTerm) ||
        opportunity.location.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredOpportunities(filtered);
  }, [opportunities, filters]);

  // Calculate metrics whenever filtered opportunities change
  useEffect(() => {
    if (filteredOpportunities.length === 0) {
      setMetrics({
        totalOpportunities: 0,
        confirmed: 0,
        pending: 0,
        declined: 0,
        completed: 0,
        upcomingEvents: 0,
        avgMonthlyEvents: 0,
        timeRangeLabel: getTimeRangeLabel()
      });
      return;
    }

    const confirmed = filteredOpportunities.filter(o => {
      const status = o.status.toLowerCase();
      return status.includes('confirmed') || status.includes('accepted') || status.includes('yes');
    }).length;

    const pending = filteredOpportunities.filter(o => {
      const status = o.status.toLowerCase();
      return status.includes('pending') || status.includes('waiting') || status.includes('under review');
    }).length;

    const declined = filteredOpportunities.filter(o => {
      const status = o.status.toLowerCase();
      return status.includes('declined') || status.includes('rejected') || status.includes('no') || status.includes('cancelled');
    }).length;

    // Check for completed events (past dates with confirmed status)
    const now = new Date();
    const completed = filteredOpportunities.filter(o => {
      if (!o.date) return false;
      const eventDate = new Date(o.date);
      const status = o.status.toLowerCase();
      const isConfirmed = status.includes('confirmed') || status.includes('accepted');
      return !isNaN(eventDate.getTime()) && eventDate < now && isConfirmed;
    }).length;

    // Check for upcoming confirmed events
    const upcomingEvents = filteredOpportunities.filter(o => {
      if (!o.date) return false;
      const eventDate = new Date(o.date);
      const status = o.status.toLowerCase();
      const isConfirmed = status.includes('confirmed') || status.includes('accepted');
      return !isNaN(eventDate.getTime()) && eventDate > now && isConfirmed;
    }).length;

    // Calculate average monthly events (for completed events)
    const monthlyEvents = filteredOpportunities.reduce((acc, o) => {
      if (!o.date) return acc;
      const eventDate = new Date(o.date);
      const status = o.status.toLowerCase();
      const isCompleted = (status.includes('confirmed') || status.includes('accepted')) && eventDate < now;
      
      if (isCompleted && !isNaN(eventDate.getTime())) {
        const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const avgMonthlyEvents = Object.keys(monthlyEvents).length > 0 
      ? Math.round(Object.values(monthlyEvents).reduce((sum, count) => sum + count, 0) / Object.keys(monthlyEvents).length)
      : 0;

    setMetrics({
      totalOpportunities: filteredOpportunities.length,
      confirmed,
      pending,
      declined,
      completed,
      upcomingEvents,
      avgMonthlyEvents,
      timeRangeLabel: getTimeRangeLabel()
    });
  }, [filteredOpportunities]);

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
        processSpeakingData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [processSpeakingData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('confirmed') || statusLower.includes('accepted') || statusLower.includes('yes')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('under review')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (statusLower.includes('declined') || statusLower.includes('rejected') || statusLower.includes('no') || statusLower.includes('cancelled')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('confirmed') || statusLower.includes('accepted') || statusLower.includes('yes')) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('under review')) {
      return <Clock className="w-4 h-4" />;
    }
    if (statusLower.includes('declined') || statusLower.includes('rejected') || statusLower.includes('no') || statusLower.includes('cancelled')) {
      return <XCircle className="w-4 h-4" />;
    }
    return <Calendar className="w-4 h-4" />;
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

  const getAvailableYears = () => {
    const years = new Set<string>();
    opportunities.forEach(opportunity => {
      const primaryDate = opportunity.date || opportunity.deadline;
      if (primaryDate) {
        const date = new Date(primaryDate);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear().toString());
        }
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!metrics) return <ErrorState message="No speaking opportunity data available" onRetry={fetchData} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Speaking
          </h1>
        </div>

        {/* Universal Filters */}
        <UniversalFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableYears={getAvailableYears()}
          showStatusFilter={true}
          showClientFilter={true}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalOpportunities}</p>
                <p className="text-xs text-gray-500">{metrics.timeRangeLabel}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Presentation className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{metrics.confirmed}</p>
                <p className="text-xs text-gray-500">Speaking engagements</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.upcomingEvents}</p>
                <p className="text-xs text-gray-500">Future speaking</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-indigo-600">{metrics.completed}</p>
                <p className="text-xs text-gray-500">Past events</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Mic className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Response</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.pending}</p>
                <p className="text-xs text-gray-500">Awaiting confirmation</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Declined</p>
                <p className="text-2xl font-bold text-red-600">{metrics.declined}</p>
                <p className="text-xs text-gray-500">Not available</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Monthly Events</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.avgMonthlyEvents}</p>
                <p className="text-xs text-gray-500">Speaking frequency</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredOpportunities.length} opportunities
              </h2>
              <div className="text-sm text-gray-500">
                {metrics.timeRangeLabel}
              </div>
            </div>
          </div>
          
          {filteredOpportunities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event / Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date / Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOpportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {opportunity.eventName || 'Unnamed Event'}
                          </div>
                          {opportunity.topic && (
                            <div className="text-xs text-gray-500">{opportunity.topic}</div>
                          )}
                          {opportunity.speaker && (
                            <div className="text-xs text-blue-600">Speaker: {opportunity.speaker}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm ${isUpcoming(opportunity.date) ? 'text-purple-600 font-medium' : 'text-gray-900'}`}>
                            {formatDate(opportunity.date)}
                          </div>
                          {opportunity.venue && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Building className="w-3 h-3 mr-1" />
                              {opportunity.venue}
                            </div>
                          )}
                          {opportunity.location && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {opportunity.location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(opportunity.status)}`}>
                          {getStatusIcon(opportunity.status)}
                          <span className="ml-1">{opportunity.status || 'Unknown'}</span>
                        </span>
                        {opportunity.deadline && (
                          <div className="text-xs text-gray-500 mt-1">
                            Deadline: {formatDate(opportunity.deadline)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{opportunity.format || 'Not specified'}</div>
                        {opportunity.duration && (
                          <div className="text-xs text-gray-500">{opportunity.duration}</div>
                        )}
                        {opportunity.audience && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {opportunity.audience}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{opportunity.contact || 'No contact'}</div>
                        {opportunity.fee && (
                          <div className="text-xs text-green-600">{opportunity.fee}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {opportunity.notes ? (
                            <div className="text-xs text-gray-500 truncate">
                              {opportunity.notes}
                            </div>
                          ) : (
                            <span className="text-gray-400">No additional details</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No speaking opportunities found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters or check if speaking opportunity data is available
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 