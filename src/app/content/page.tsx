'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import UniversalFilters, { FilterState, applyDateFilter } from '@/components/UniversalFilters';
import { 
  FileText, 
  Calendar, 
  Eye, 
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3,
  Users,
  Globe,
  TrendingUp,
  Target,
  Layers
} from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

interface ContentItem {
  title: string;
  type: string;
  status: string;
  publishDate: string;
  author: string;
  platform: string;
  topic: string;
  audience: string;
  performance: string;
  notes: string;
  deadline: string;
  client: string;
  wordCount: string;
  id: number;
  [key: string]: unknown;
}

interface ContentMetrics {
  totalContent: number;
  published: number;
  inProgress: number;
  scheduled: number;
  draft: number;
  avgContentPerMonth: number;
  upcomingDeadlines: number;
  timeRangeLabel: string;
}

export default function ContentCalendarPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null);

  // Initialize filters with YTD as default
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'ytd',
    year: new Date().getFullYear().toString(),
    tier: 'all',
    client: '',
    entryType: 'all',
    status: 'all'
  });

  const processContentData = useCallback((data: WorksheetData) => {
    const contentSheet = data.sheets['Content Calendar'] || 
                         data.sheets['Content'] || 
                         data.sheets['Content Planning'] || 
                         data.sheets['Editorial Calendar'] || 
                         data.sheets['Blog Calendar'] || [];
    
    const processedContent = contentSheet.map((item, index) => ({
      title: String(item.Title || item['Content Title'] || item.Name || ''),
      type: String(item.Type || item['Content Type'] || item.Format || ''),
      status: String(item.Status || item.State || ''),
      publishDate: String(item['Publish Date'] || item.Date || item.Published || ''),
      author: String(item.Author || item.Writer || item.Creator || ''),
      platform: String(item.Platform || item.Channel || item.Publication || ''),
      topic: String(item.Topic || item.Subject || item.Category || ''),
      audience: String(item.Audience || item['Target Audience'] || ''),
      performance: String(item.Performance || item.Metrics || item.Analytics || ''),
      notes: String(item.Notes || item.Comments || ''),
      deadline: String(item.Deadline || item['Due Date'] || ''),
      client: String(item.Client || item['Client Name'] || ''),
      wordCount: String(item['Word Count'] || item.Length || ''),
      id: index + 1,
      ...item
    }));
    
    setContent(processedContent);
  }, []);

  // Apply filters whenever content or filters change
  useEffect(() => {
    let filtered = [...content];

    // Apply date filtering (use publish date as primary date field)
    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(item => {
        const primaryDate = item.publishDate || item.deadline;
        if (!primaryDate) return false;
        
        const dateFiltered = applyDateFilter([{ Date: primaryDate }], filters, 'Date');
        return dateFiltered.length > 0;
      });
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => {
        const status = item.status.toLowerCase();
        switch (filters.status) {
          case 'won': // Map to 'published'
            return status.includes('published') || status.includes('live') || status.includes('complete');
          case 'submitted': // Map to 'in progress'
            return status.includes('progress') || status.includes('writing') || status.includes('editing') || status.includes('review');
          case 'upcoming': // Map to 'scheduled'
            return status.includes('scheduled') || status.includes('planned') || 
                   (item.publishDate && new Date(item.publishDate) > new Date() && !status.includes('draft'));
          case 'closed': // Map to 'draft'
            return status.includes('draft') || status.includes('idea') || status.includes('concept');
          default:
            return true;
        }
      });
    }

    // Apply client/search filter
    if (filters.client && filters.client.trim() !== '') {
      const searchTerm = filters.client.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.client.toLowerCase().includes(searchTerm) ||
        item.topic.toLowerCase().includes(searchTerm) ||
        item.platform.toLowerCase().includes(searchTerm) ||
        item.author.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredContent(filtered);
  }, [content, filters]);

  // Calculate metrics whenever filtered content changes
  useEffect(() => {
    if (filteredContent.length === 0) {
      setMetrics({
        totalContent: 0,
        published: 0,
        inProgress: 0,
        scheduled: 0,
        draft: 0,
        avgContentPerMonth: 0,
        upcomingDeadlines: 0,
        timeRangeLabel: getTimeRangeLabel()
      });
      return;
    }

    const published = filteredContent.filter(item => {
      const status = item.status.toLowerCase();
      return status.includes('published') || status.includes('live') || status.includes('complete');
    }).length;

    const inProgress = filteredContent.filter(item => {
      const status = item.status.toLowerCase();
      return status.includes('progress') || status.includes('writing') || status.includes('editing') || status.includes('review');
    }).length;

    const scheduled = filteredContent.filter(item => {
      const status = item.status.toLowerCase();
      return status.includes('scheduled') || status.includes('planned') || 
             (item.publishDate && new Date(item.publishDate) > new Date() && !status.includes('draft'));
    }).length;

    const draft = filteredContent.filter(item => {
      const status = item.status.toLowerCase();
      return status.includes('draft') || status.includes('idea') || status.includes('concept');
    }).length;

    // Check for upcoming deadlines (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = filteredContent.filter(item => {
      if (!item.deadline) return false;
      const deadline = new Date(item.deadline);
      const status = item.status.toLowerCase();
      const notCompleted = !status.includes('published') && !status.includes('live') && !status.includes('complete');
      return !isNaN(deadline.getTime()) && deadline >= now && deadline <= sevenDaysFromNow && notCompleted;
    }).length;

    // Calculate average content per month (for published content)
    const monthlyContent = filteredContent.reduce((acc, item) => {
      if (!item.publishDate) return acc;
      const publishDate = new Date(item.publishDate);
      const status = item.status.toLowerCase();
      const isPublished = status.includes('published') || status.includes('live') || status.includes('complete');
      
      if (isPublished && !isNaN(publishDate.getTime())) {
        const monthKey = `${publishDate.getFullYear()}-${String(publishDate.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const avgContentPerMonth = Object.keys(monthlyContent).length > 0 
      ? Math.round(Object.values(monthlyContent).reduce((sum, count) => sum + count, 0) / Object.keys(monthlyContent).length)
      : 0;

    setMetrics({
      totalContent: filteredContent.length,
      published,
      inProgress,
      scheduled,
      draft,
      avgContentPerMonth,
      upcomingDeadlines,
      timeRangeLabel: getTimeRangeLabel()
    });
  }, [filteredContent]);

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
        processContentData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [processContentData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('published') || statusLower.includes('live') || statusLower.includes('complete')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statusLower.includes('progress') || statusLower.includes('writing') || statusLower.includes('editing') || statusLower.includes('review')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (statusLower.includes('scheduled') || statusLower.includes('planned')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (statusLower.includes('draft') || statusLower.includes('idea') || statusLower.includes('concept')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('published') || statusLower.includes('live') || statusLower.includes('complete')) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (statusLower.includes('progress') || statusLower.includes('writing') || statusLower.includes('editing') || statusLower.includes('review')) {
      return <Edit className="w-4 h-4" />;
    }
    if (statusLower.includes('scheduled') || statusLower.includes('planned')) {
      return <Clock className="w-4 h-4" />;
    }
    if (statusLower.includes('draft') || statusLower.includes('idea') || statusLower.includes('concept')) {
      return <FileText className="w-4 h-4" />;
    }
    return <Layers className="w-4 h-4" />;
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

  const isDeadlineUrgent = (deadlineString: string) => {
    if (!deadlineString) return false;
    const deadline = new Date(deadlineString);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return !isNaN(deadline.getTime()) && deadline >= now && deadline <= sevenDaysFromNow;
  };

  const getAvailableYears = () => {
    const years = new Set<string>();
    content.forEach(item => {
      const primaryDate = item.publishDate || item.deadline;
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
  if (!metrics) return <ErrorState message="No content data available" onRetry={fetchData} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
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
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalContent}</p>
                <p className="text-xs text-gray-500">{metrics.timeRangeLabel}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{metrics.published}</p>
                <p className="text-xs text-gray-500">Live content</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.inProgress}</p>
                <p className="text-xs text-gray-500">Being created</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Edit className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent Deadlines</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.upcomingDeadlines}</p>
                <p className="text-xs text-gray-500">Next 7 days</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.scheduled}</p>
                <p className="text-xs text-gray-500">Future publishing</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.draft}</p>
                <p className="text-xs text-gray-500">Ideas & concepts</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Monthly Output</p>
                <p className="text-2xl font-bold text-indigo-600">{metrics.avgContentPerMonth}</p>
                <p className="text-xs text-gray-500">Published pieces</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredContent.length} items
              </h2>
              <div className="text-sm text-gray-500">
                {metrics.timeRangeLabel}
              </div>
            </div>
          </div>
          
          {filteredContent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title / Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Publish Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author / Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topic / Client
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.title || 'Untitled Content'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Layers className="w-3 h-3 mr-1" />
                            {item.type || 'Unknown Type'}
                          </div>
                          {item.wordCount && (
                            <div className="text-xs text-blue-600">{item.wordCount} words</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status || 'Unknown'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isUpcoming(item.publishDate) ? 'text-purple-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(item.publishDate)}
                        </div>
                        {isUpcoming(item.publishDate) && (
                          <div className="text-xs text-purple-500">Upcoming</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {item.author && (
                            <div className="text-sm text-gray-900 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {item.author}
                            </div>
                          )}
                          {item.platform && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Globe className="w-3 h-3 mr-1" />
                              {item.platform}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDeadlineUrgent(item.deadline) ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(item.deadline)}
                        </div>
                        {isDeadlineUrgent(item.deadline) && (
                          <div className="text-xs text-orange-500">Urgent</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {item.topic && (
                            <div className="text-sm text-gray-900">{item.topic}</div>
                          )}
                          {item.client && (
                            <div className="text-xs text-gray-500">{item.client}</div>
                          )}
                          {item.performance && (
                            <div className="text-xs text-green-600 flex items-center">
                              <BarChart3 className="w-3 h-3 mr-1" />
                              {item.performance}
                            </div>
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
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No content found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters or check if content data is available
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 