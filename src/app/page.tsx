'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award, 
  Users, 
  FileText,
  ExternalLink,
  Clock,
  Target
} from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
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
  totalAwards: number;
  responseRate: number;
  upcomingDeadlines: number;
  coverageTrend: number;
  awardsTrend: number;
  recentActivity: RecentActivity[];
}

export default function DashboardPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const calculateMetrics = useCallback((data: WorksheetData) => {
    const mediaTracker = data.sheets['Media Tracker'] || [];
    const awards = data.sheets['Awards'] || [];
    const mediaRelations = data.sheets['Media Relations'] || [];
    const content = data.sheets['Content'] || [];
    
    // Basic counts
    const totalCoverage = mediaTracker.length;
    const totalAwards = awards.length;
    
    // Calculate response rate
    const outreachWithResponse = mediaRelations.filter(item => {
      const status = String(item.Status || '').toLowerCase();
      return status.includes('submitted') || status.includes('response') || status.includes('scheduled');
    }).length;
    const totalOutreach = mediaRelations.length;
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

    // Calculate trends (last 30 days vs previous 30 days)
    const now30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const now60DaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentCoverage = mediaTracker.filter(item => {
      const date = new Date(String(item.Date || ''));
      return !isNaN(date.getTime()) && date >= now30DaysAgo;
    }).length;
    
    const previousCoverage = mediaTracker.filter(item => {
      const date = new Date(String(item.Date || ''));
      return !isNaN(date.getTime()) && date >= now60DaysAgo && date < now30DaysAgo;
    }).length;
    
    const coverageTrend = previousCoverage > 0 ? 
      Math.round(((recentCoverage - previousCoverage) / previousCoverage) * 100) : 0;

    const recentAwards = awards.filter(item => {
      const date = new Date(String(item['Date Announced'] || item['Date / Deadline'] || ''));
      return !isNaN(date.getTime()) && date >= now30DaysAgo;
    }).length;
    
    const previousAwards = awards.filter(item => {
      const date = new Date(String(item['Date Announced'] || item['Date / Deadline'] || ''));
      return !isNaN(date.getTime()) && date >= now60DaysAgo && date < now30DaysAgo;
    }).length;
    
    const awardsTrend = previousAwards > 0 ? 
      Math.round(((recentAwards - previousAwards) / previousAwards) * 100) : 0;

    // Get recent activity (chronological - last items regardless of date)
    const recentActivity: RecentActivity[] = [];

    // Recent coverage
    mediaTracker.forEach(item => {
      const date = new Date(String(item.Date || ''));
      if (!isNaN(date.getTime()) || item.Title) { // Include items with dates or titles
        recentActivity.push({
          type: 'coverage',
          title: String(item.Title || 'Unnamed Article'),
          date: !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString(),
          outlet: String(item.Outlet || ''),
          link: String(item.Link || '')
        });
      }
    });

    // Recent awards
    awards.forEach(item => {
      const date = new Date(String(item['Date Announced'] || item['Date / Deadline'] || ''));
      if (!isNaN(date.getTime()) || item.Award) { // Include items with dates or award names
        recentActivity.push({
          type: 'award',
          title: String(item.Award || 'Award Submission'),
          date: !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString(),
          status: String(item.Status || '')
        });
      }
    });

    // Recent outreach
    mediaRelations.forEach(item => {
      const date = new Date(String(item['Date / Deadline'] || ''));
      if (!isNaN(date.getTime()) || item.Contact) { // Include items with dates or contact names
        recentActivity.push({
          type: 'outreach',
          title: String(item.Contact || 'Media Contact'),
          date: !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString(),
          outlet: String(item.Outlet || ''),
          status: String(item.Status || '')
        });
      }
    });

    // Sort by date, most recent first, then take the latest 8 items
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setMetrics({
      totalCoverage,
      totalAwards,
      responseRate,
      upcomingDeadlines,
      coverageTrend,
      awardsTrend,
      recentActivity: recentActivity.slice(0, 8) // Show top 8 recent activities
    });
  }, []);

  const fetchAllSheetsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets/all');
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      if (result.success) {
        calculateMetrics(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [calculateMetrics]);

  useEffect(() => {
    fetchAllSheetsData();
  }, [fetchAllSheetsData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

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
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PR Dashboard Overview
          </h1>
          <p className="text-gray-600">
            Your latest PR performance, media coverage, and campaign insights
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Coverage</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCoverage}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {metrics.coverageTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${metrics.coverageTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(metrics.coverageTrend)}% vs last month
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Awards Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalAwards}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {metrics.awardsTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${metrics.awardsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(metrics.awardsTrend)}% vs last month
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.responseRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Outreach efficiency</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.upcomingDeadlines}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Next 30 days</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600">Latest updates across all activities</p>
            </div>
            <div className="p-6">
              {metrics.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {metrics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.date)}
                          </span>
                        </div>
                        <div className="mt-1">
                          {activity.outlet && (
                            <span className="text-xs text-gray-600">{activity.outlet}</span>
                          )}
                          {activity.status && (
                            <span className="text-xs text-gray-600 ml-2">{activity.status}</span>
                          )}
                          {activity.link && (
                            <a 
                              href={activity.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 ml-2 inline-flex items-center"
                            >
                              View <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
              <p className="text-sm text-gray-600">Key metrics and trends</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Coverage Growth</span>
                    <span className={`text-sm font-medium ${metrics.coverageTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.coverageTrend >= 0 ? '+' : ''}{metrics.coverageTrend}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${metrics.coverageTrend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(metrics.coverageTrend), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Awards Activity</span>
                    <span className={`text-sm font-medium ${metrics.awardsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.awardsTrend >= 0 ? '+' : ''}{metrics.awardsTrend}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${metrics.awardsTrend >= 0 ? 'bg-purple-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(metrics.awardsTrend), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Response Rate</span>
                    <span className="text-sm font-medium text-blue-600">{metrics.responseRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${metrics.responseRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
