'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import UniversalFilters, { FilterState, applyDateFilter } from '@/components/UniversalFilters';
import { getPublicationInfo } from '@/lib/publicationData';
import { 
  cleanText, 
  generateIntelligentTitle, 
  createUniqueKey, 
  deduplicateItems,
  formatDate,
  formatNumber 
} from '@/lib/dataUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award, 
  Users, 
  FileText,
  ExternalLink,
  Clock,
  Target,
  Eye,
  BarChart3
} from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
  cached?: boolean;
  quotaExceeded?: boolean;
}

interface ProcessedCoverageItem {
  Date: unknown;
  Outlet: unknown;
  'Article '?: unknown;
  Article?: unknown;
  Reporter: unknown;
  'Client (if applicable)'?: unknown;
  Client?: unknown;
  Type?: unknown;
  Link?: unknown;
  Notes?: unknown;
  title: string;
  client: string;
  reachData: ReturnType<typeof getPublicationInfo>;
  [key: string]: unknown;
}

interface RecentActivity {
  type: 'coverage' | 'award' | 'outreach';
  title: string;
  date: string;
  outlet?: string;
  status?: string;
  link?: string;
}

interface DashboardMetrics {
  totalCoverage: number;
  totalReach: number;
  totalAwards: number;
  responseRate: number;
  upcomingDeadlines: number;
  coverageTrend: number;
  reachTrend: number;
  awardsTrend: number;
  qualityScore: number;
  avgReach: number;
  recentActivity: RecentActivity[];
  timeRangeLabel: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  // Initialize filters with YTD as default
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'ytd',
    year: new Date().getFullYear().toString(),
    tier: 'all',
    client: '',
    entryType: 'all',
    status: 'all'
  });

  const calculateMetrics = useCallback((data: WorksheetData, filters: FilterState) => {
    // Get coverage data from both sheets
    const mediaTracker2025 = data.sheets['Media Tracker (2025)'] || [];
    const mediaTracker2024 = data.sheets['Media Tracker'] || [];
    const allMediaTracker = [...mediaTracker2025, ...mediaTracker2024];
    
    const awards = data.sheets['Awards'] || [];
    const mediaRelations = data.sheets['Media Relations'] || [];
    const content = data.sheets['Content'] || [];
    
    // Filter out invalid coverage items
    const validCoverage = allMediaTracker.filter(item => 
      item.Date && 
      item.Outlet && 
      item.Date.toString().trim() !== '' && 
      item.Outlet.toString().trim() !== ''
    );
    
    // Deduplicate coverage items
    const deduplicatedCoverage = deduplicateItems(validCoverage);
    
    // Process coverage data
    const processedCoverage: ProcessedCoverageItem[] = deduplicatedCoverage.map(item => ({
      ...item,
      title: generateIntelligentTitle(item),
      client: cleanText(String(item['Client (if applicable)'] || item.Client || '')) || 'General Coverage',
      reachData: getPublicationInfo(String(item.Outlet || ''))
    }));

    // Apply date filtering based on current filter settings
    const filteredCoverage = applyDateFilter(processedCoverage, filters, 'Date');
    const filteredAwards = applyDateFilter(awards, filters, 'Date Announced');
    const filteredOutreach = applyDateFilter(mediaRelations, filters, 'Date / Deadline');
    
    // Basic counts for filtered data
    const totalCoverage = filteredCoverage.length;
    const totalAwards = filteredAwards.length;
    
    // Calculate total reach and quality metrics for filtered data
    const totalReach = filteredCoverage.reduce((sum, item) => sum + (item.reachData.estimatedReach || 0), 0);
    const avgReach = totalCoverage > 0 ? Math.round(totalReach / totalCoverage) : 0;
    
    // Calculate quality score (tier-weighted) for filtered data
    const tier1Count = filteredCoverage.filter(item => item.reachData.tier === 'tier1').length;
    const tier2Count = filteredCoverage.filter(item => item.reachData.tier === 'tier2').length;
    const tier3Count = filteredCoverage.filter(item => item.reachData.tier === 'tier3').length;
    
    const qualityScore = totalCoverage > 0 
      ? Math.round(((tier1Count * 3) + (tier2Count * 2) + (tier3Count * 1)) / (totalCoverage * 3) * 100)
      : 0;
    
    // Calculate response rate for filtered outreach
    const outreachWithResponse = filteredOutreach.filter(item => {
      const status = String(item.Status || '').toLowerCase();
      return status.includes('submitted') || status.includes('response') || status.includes('scheduled');
    }).length;
    const totalOutreach = filteredOutreach.length;
    const responseRate = totalOutreach > 0 ? Math.round((outreachWithResponse / totalOutreach) * 100) : 0;
    
    // Count upcoming deadlines (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = [...awards, ...content].filter(item => {
      const dateStr = String(item['Date / Deadline'] || item['Deadline'] || '');
      if (!dateStr) return false;
      const deadline = new Date(dateStr);
      return !isNaN(deadline.getTime()) && deadline >= now && deadline <= thirtyDaysFromNow;
    }).length;

    // Calculate trends (compare current period with previous equivalent period)
    const getPreviousPeriodData = () => {
      const currentYear = parseInt(filters.year || new Date().getFullYear().toString());
      const prevFilters = { ...filters, year: (currentYear - 1).toString() };
      
      if (filters.dateRange === 'month') {
        // Compare with previous month
        const currentMonth = new Date().getMonth();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const prevStart = new Date(prevYear, prevMonth, 1);
        const prevEnd = new Date(prevYear, prevMonth + 1, 0);
        
        return {
          coverage: processedCoverage.filter(item => {
            const date = new Date(String(item.Date || ''));
            return !isNaN(date.getTime()) && date >= prevStart && date <= prevEnd;
          }),
          awards: awards.filter(item => {
            const date = new Date(String(item['Date Announced'] || ''));
            return !isNaN(date.getTime()) && date >= prevStart && date <= prevEnd;
          })
        };
      } else {
        // Compare with same period last year
        return {
          coverage: applyDateFilter(processedCoverage, prevFilters, 'Date'),
          awards: applyDateFilter(awards, prevFilters, 'Date Announced')
        };
      }
    };

    const previousPeriod = getPreviousPeriodData();
    
    const coverageTrend = previousPeriod.coverage.length > 0 ? 
      Math.round(((filteredCoverage.length - previousPeriod.coverage.length) / previousPeriod.coverage.length) * 100) : 0;

    // Calculate reach trend
    const currentReach = totalReach;
    const previousReach = previousPeriod.coverage.reduce((sum, item) => sum + (item.reachData?.estimatedReach || 0), 0);
    const reachTrend = previousReach > 0 ? 
      Math.round(((currentReach - previousReach) / previousReach) * 100) : 0;

    // Awards trend
    const awardsTrend = previousPeriod.awards.length > 0 ? 
      Math.round(((filteredAwards.length - previousPeriod.awards.length) / previousPeriod.awards.length) * 100) : 0;

    // Get recent activity from filtered data - last 5 items overall
    const recentActivity: RecentActivity[] = [];

    // Get all activity items with timestamps from filtered data
    const allActivityItems: (RecentActivity & { timestamp: number })[] = [];

    // Recent coverage with better titles
    filteredCoverage.forEach(item => {
      const date = new Date(String(item.Date || ''));
      if (!isNaN(date.getTime())) {
        allActivityItems.push({
          type: 'coverage',
          title: item.title,
          date: date.toISOString(),
          outlet: String(item.Outlet || ''),
          link: String(item.Link || ''),
          timestamp: date.getTime()
        });
      }
    });

    // Recent awards from filtered data
    filteredAwards.forEach(item => {
      const date = new Date(String(item['Date Announced'] || item['Date / Deadline'] || ''));
      if (!isNaN(date.getTime())) {
        allActivityItems.push({
          type: 'award',
          title: String(item.Award || 'Award Entry'),
          date: date.toISOString(),
          status: String(item.Status || ''),
          timestamp: date.getTime()
        });
      }
    });

    // Recent outreach from filtered data
    filteredOutreach.forEach(item => {
      const date = new Date(String(item['Date / Deadline'] || ''));
      if (!isNaN(date.getTime())) {
        const contactName = cleanText(String(item.Contact || ''));
        const outlet = cleanText(String(item.Outlet || ''));
        let title = contactName || 'Media Outreach';
        if (contactName && outlet) {
          title = `${contactName} (${outlet})`;
        } else if (outlet) {
          title = `Contact at ${outlet}`;
        }
        
        allActivityItems.push({
          type: 'outreach',
          title: title,
          date: date.toISOString(),
          outlet: outlet,
          status: String(item.Status || ''),
          timestamp: date.getTime()
        });
      }
    });

    // Sort by timestamp (most recent first) and deduplicate by title+type+date
    allActivityItems.sort((a, b) => b.timestamp - a.timestamp);
    
    const seenActivities = new Set<string>();
    const uniqueActivities: RecentActivity[] = [];
    
    for (const item of allActivityItems) {
      const key = `${item.type}-${item.title}-${item.date.split('T')[0]}`; // Use date without time for deduplication
      if (!seenActivities.has(key) && uniqueActivities.length < 5) {
        seenActivities.add(key);
        const { timestamp, ...activityItem } = item;
        uniqueActivities.push(activityItem);
      }
    }

    recentActivity.push(...uniqueActivities);

    // Generate time range label for display
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

    return {
      totalCoverage,
      totalReach,
      totalAwards,
      responseRate,
      upcomingDeadlines,
      coverageTrend,
      reachTrend,
      awardsTrend,
      qualityScore,
      avgReach,
      recentActivity: recentActivity.slice(0, 5),
      timeRangeLabel: getTimeRangeLabel()
    };
  }, []);

  const fetchAllSheetsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/sheets/all');
      
      if (!response.ok) {
        if (response.status === 429) {
          // Quota exceeded
          const errorData = await response.json();
          if (errorData.quotaError) {
            throw new Error(`API quota exceeded. Please wait ${errorData.retryAfter || 60} seconds and try again.`);
          }
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle cache information
      if (result.cached || result.quotaExceeded) {
        // Still process the data even if cached
      }
      
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recalculate metrics when data or filters change
  useEffect(() => {
    if (data) {
      const calculatedMetrics = calculateMetrics(data, filters);
      setMetrics(calculatedMetrics);
    }
  }, [data, filters, calculateMetrics]);

  useEffect(() => {
    fetchAllSheetsData();
  }, [fetchAllSheetsData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'coverage': return <FileText className="w-4 h-4" />;
      case 'award': return <Award className="w-4 h-4" />;
      case 'outreach': return <Users className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'coverage': return 'bg-blue-100 text-blue-800';
      case 'award': return 'bg-purple-100 text-purple-800';
      case 'outreach': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchAllSheetsData} />;
  if (!metrics) return <ErrorState message="No data available" onRetry={fetchAllSheetsData} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Universal Filters */}
        <UniversalFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableYears={['2025', '2024']}
        />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Footprint</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalReach)}</p>
                <p className="text-xs text-gray-500">Estimated reach - {metrics.timeRangeLabel}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {metrics.reachTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${metrics.reachTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(metrics.reachTrend)}% vs previous period
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Articles Published</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCoverage}</p>
                <p className="text-xs text-gray-500">{metrics.timeRangeLabel}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {metrics.coverageTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${metrics.coverageTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(metrics.coverageTrend)}% vs previous period
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.qualityScore}%</p>
                <p className="text-xs text-gray-500">Tier-weighted score</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Based on publication tiers</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Reach</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.avgReach)}</p>
                <p className="text-xs text-gray-500">Per article</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">3% of publication readership</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Awards Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalAwards}</p>
                <p className="text-xs text-gray-500">{metrics.timeRangeLabel}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {metrics.awardsTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${metrics.awardsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(metrics.awardsTrend)}% vs previous period
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.responseRate}%</p>
                <p className="text-xs text-gray-500">Media outreach success</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Responses to pitches</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.upcomingDeadlines}</p>
                <p className="text-xs text-gray-500">Next 30 days</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Awards & content deadlines</span>
            </div>
          </div>
        </div>

        {/* Main Content - Reorganized for better visibility */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Recent Activity - Wider and More Prominent */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600">Latest activities for {metrics.timeRangeLabel}</p>
            </div>
            <div className="p-4">
              {metrics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {metrics.recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatDate(activity.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.outlet && (
                            <span className="text-xs text-gray-600">{activity.outlet}</span>
                          )}
                          {activity.status && (
                            <span className="text-xs text-gray-600">• {activity.status}</span>
                          )}
                        </div>
                        {activity.link && (
                          <a 
                            href={activity.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {metrics.recentActivity.length > 4 && (
                    <div className="text-center pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        +{metrics.recentActivity.length - 4} more activities
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent activity for this time period</p>
                  <p className="text-xs text-gray-400">Try expanding your date range</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Insights - Compact Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-3 border-b">
                <h2 className="text-base font-semibold text-gray-900">Performance</h2>
                <p className="text-xs text-gray-500">vs previous period</p>
              </div>
              <div className="p-3">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">Reach Growth</span>
                      <span className={`text-xs font-medium ${metrics.reachTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.reachTrend >= 0 ? '+' : ''}{metrics.reachTrend}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${metrics.reachTrend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(metrics.reachTrend), 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">Coverage Growth</span>
                      <span className={`text-xs font-medium ${metrics.coverageTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.coverageTrend >= 0 ? '+' : ''}{metrics.coverageTrend}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${metrics.coverageTrend >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(metrics.coverageTrend), 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">Quality Score</span>
                      <span className="text-xs font-medium text-purple-600">{metrics.qualityScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-purple-500"
                        style={{ width: `${metrics.qualityScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">Response Rate</span>
                      <span className="text-xs font-medium text-indigo-600">{metrics.responseRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${metrics.responseRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats - Compact */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-3 border-b">
                <h2 className="text-base font-semibold text-gray-900">Quick Stats</h2>
                <p className="text-xs text-gray-500">{metrics.timeRangeLabel}</p>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total articles</span>
                  <span className="text-sm font-semibold text-gray-900">{metrics.totalCoverage}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Avg daily reach</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(Math.round(metrics.totalReach / Math.max(metrics.totalCoverage, 1)))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Next deadline</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {metrics.upcomingDeadlines > 0 ? `${metrics.upcomingDeadlines} pending` : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
