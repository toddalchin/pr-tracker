'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { getPublicationInfo } from '@/lib/publicationData';
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
}

const cleanText = (text: string | undefined | null): string => {
  return text?.toString().trim() || '';
};

const generateIntelligentTitle = (item: any): string => {
  const articleTitle = cleanText(String(item['Article '] || item.Article || ''));
  const outlet = cleanText(String(item.Outlet || ''));
  const type = cleanText(String(item.Type || ''));
  const client = cleanText(String(item['Client (if applicable)'] || item.Client || ''));
  const reporter = cleanText(String(item.Reporter || ''));
  
  // Create intelligent descriptions using Type + context
  if (type && articleTitle && outlet) {
    const typeMap: Record<string, string> = {
      'quote/inclusion': 'Included a quote',
      'quote': 'Included a quote',
      'inclusion': 'Included a quote',
      'feature': 'Featured',
      'q&a': 'Participated in Q&A',
      'qa': 'Participated in Q&A',
      'interview': 'Interviewed',
      'byline': 'Authored byline',
      'op-ed': 'Published op-ed',
      'guest post': 'Wrote guest post',
      'mention': 'Mentioned',
      'commentary': 'Provided commentary',
      'analysis': 'Provided analysis'
    };
    
    const normalizedType = type.toLowerCase().replace(/[^a-z0-9&]/g, '');
    const action = typeMap[normalizedType] || `Contributed to`;
    
    // Create contextual description
    if (client && client !== 'general coverage') {
      // Extract topic/theme from article title (first few meaningful words)
      const titleWords = articleTitle.toLowerCase().split(' ');
      const meaningfulWords = titleWords.filter(word => 
        word.length > 3 && 
        !['this', 'that', 'with', 'from', 'they', 'their', 'will', 'have', 'been', 'are'].includes(word)
      ).slice(0, 3);
      
      if (meaningfulWords.length > 0) {
        const topic = meaningfulWords.join(' ');
        return `${action} about ${topic} in ${outlet}`;
      } else {
        return `${action} regarding ${client} in ${outlet}`;
      }
    } else {
      // Use article title or generic description
      const shortTitle = articleTitle.length > 40 ? 
        articleTitle.substring(0, 40).trim() + '...' : 
        articleTitle;
      return `${action} "${shortTitle}" in ${outlet}`;
    }
  }
  
  // Fallback to original logic if Type info isn't available
  if (articleTitle) {
    return articleTitle;
  }
  
  // Enhanced fallback strategies
  if (client && outlet) {
    return `${client} coverage in ${outlet}`;
  } else if (outlet && item.Date) {
    const date = new Date(String(item.Date));
    if (!isNaN(date.getTime())) {
      return `${outlet} article (${date.toLocaleDateString()})`;
    }
    return `${outlet} feature`;
  } else if (reporter && outlet) {
    return `${reporter}'s piece in ${outlet}`;
  } else if (outlet) {
    return `${outlet} feature`;
  }
  
  return `Media coverage`;
};

const createUniqueKey = (item: any): string => {
  // Create a unique identifier for deduplication
  const date = String(item.Date || '').trim();
  const outlet = String(item.Outlet || '').trim().toLowerCase();
  const article = String(item['Article '] || item.Article || '').trim().toLowerCase();
  const reporter = String(item.Reporter || '').trim().toLowerCase();
  
  // Use combination of date, outlet, and article title (or reporter if no title)
  if (article) {
    return `${date}-${outlet}-${article}`;
  } else {
    return `${date}-${outlet}-${reporter}`;
  }
};

const deduplicateItems = (items: any[]): any[] => {
  const seen = new Set<string>();
  const uniqueItems: any[] = [];
  
  for (const item of items) {
    const key = createUniqueKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }
  
  return uniqueItems;
};

export default function DashboardPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const calculateMetrics = useCallback((data: WorksheetData) => {
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
    
    // DEDUPLICATE items to prevent double counting
    const deduplicatedCoverage = deduplicateItems(validCoverage);
    
    console.log(`Deduplication: ${validCoverage.length} items -> ${deduplicatedCoverage.length} unique items`);
    
    // Process coverage items with reach data
    const processedCoverage: ProcessedCoverageItem[] = deduplicatedCoverage.map(item => ({
      ...item,
      title: generateIntelligentTitle(item),
      client: cleanText(String(item['Client (if applicable)'] || item.Client || '')) || 'General Coverage',
      reachData: getPublicationInfo(String(item.Outlet || ''))
    } as ProcessedCoverageItem));
    
    // Basic counts
    const totalCoverage = processedCoverage.length;
    const totalAwards = awards.length;
    
    // Calculate total reach and quality metrics
    const totalReach = processedCoverage.reduce((sum, item) => sum + (item.reachData.estimatedReach || 0), 0);
    const avgReach = totalCoverage > 0 ? Math.round(totalReach / totalCoverage) : 0;
    
    // Calculate quality score (tier-weighted)
    const tier1Count = processedCoverage.filter(item => item.reachData.tier === 'tier1').length;
    const tier2Count = processedCoverage.filter(item => item.reachData.tier === 'tier2').length;
    const tier3Count = processedCoverage.filter(item => item.reachData.tier === 'tier3').length;
    
    const qualityScore = totalCoverage > 0 
      ? Math.round(((tier1Count * 3) + (tier2Count * 2) + (tier3Count * 1)) / (totalCoverage * 3) * 100)
      : 0;
    
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
    
    const recentCoverage = processedCoverage.filter(item => {
      const date = new Date(String(item.Date || ''));
      return !isNaN(date.getTime()) && date >= now30DaysAgo;
    });
    
    const previousCoverage = processedCoverage.filter(item => {
      const date = new Date(String(item.Date || ''));
      return !isNaN(date.getTime()) && date >= now60DaysAgo && date < now30DaysAgo;
    });
    
    const coverageTrend = previousCoverage.length > 0 ? 
      Math.round(((recentCoverage.length - previousCoverage.length) / previousCoverage.length) * 100) : 0;

    // Calculate reach trend
    const recentReach = recentCoverage.reduce((sum, item) => sum + (item.reachData.estimatedReach || 0), 0);
    const previousReach = previousCoverage.reduce((sum, item) => sum + (item.reachData.estimatedReach || 0), 0);
    const reachTrend = previousReach > 0 ? 
      Math.round(((recentReach - previousReach) / previousReach) * 100) : 0;

    // Awards trend
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

    // Get recent activity
    const recentActivity: RecentActivity[] = [];

    // Recent coverage with better titles
    processedCoverage.forEach(item => {
      const date = new Date(String(item.Date || ''));
      if (!isNaN(date.getTime()) && date >= now30DaysAgo) {
        recentActivity.push({
          type: 'coverage',
          title: item.title,
          date: date.toISOString(),
          outlet: String(item.Outlet || ''),
          link: String(item.Link || '')
        });
      }
    });

    // Recent awards
    awards.forEach(item => {
      const date = new Date(String(item['Date Announced'] || item['Date / Deadline'] || ''));
      if (!isNaN(date.getTime()) && date >= now30DaysAgo) {
        recentActivity.push({
          type: 'award',
          title: String(item.Award || 'Award Entry'),
          date: date.toISOString(),
          status: String(item.Status || '')
        });
      }
    });

    // Recent outreach
    mediaRelations.forEach(item => {
      const date = new Date(String(item['Date / Deadline'] || ''));
      if (!isNaN(date.getTime()) && date >= now30DaysAgo) {
        const contactName = cleanText(String(item.Contact || ''));
        const outlet = cleanText(String(item.Outlet || ''));
        let title = contactName || 'Media Outreach';
        if (contactName && outlet) {
          title = `${contactName} (${outlet})`;
        } else if (outlet) {
          title = `Contact at ${outlet}`;
        }
        
        recentActivity.push({
          type: 'outreach',
          title: title,
          date: date.toISOString(),
          outlet: outlet,
          status: String(item.Status || '')
        });
      }
    });

    // Sort by date, most recent first, then take the latest 8 items
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setMetrics({
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
      recentActivity: recentActivity.slice(0, 8)
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
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
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Footprint</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalReach)}</p>
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
                {Math.abs(metrics.reachTrend)}% vs last month
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Articles Published</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCoverage}</p>
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
                {Math.abs(metrics.coverageTrend)}% vs last month
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.qualityScore}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Tier-weighted score</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Reach</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.avgReach)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Per article</span>
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
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
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
              <div className="p-3 bg-red-100 rounded-lg">
                <Calendar className="w-6 h-6 text-red-600" />
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
              <p className="text-sm text-gray-600">Latest updates from the last 30 days</p>
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
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
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
              <h2 className="text-lg font-semibold text-gray-900">Performance Insights</h2>
              <p className="text-sm text-gray-600">Key performance indicators</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Reach Growth</span>
                    <span className={`text-sm font-medium ${metrics.reachTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.reachTrend >= 0 ? '+' : ''}{metrics.reachTrend}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${metrics.reachTrend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(metrics.reachTrend), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Coverage Growth</span>
                    <span className={`text-sm font-medium ${metrics.coverageTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.coverageTrend >= 0 ? '+' : ''}{metrics.coverageTrend}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${metrics.coverageTrend >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(metrics.coverageTrend), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Quality Score</span>
                    <span className="text-sm font-medium text-purple-600">{metrics.qualityScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${metrics.qualityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Response Rate</span>
                    <span className="text-sm font-medium text-indigo-600">{metrics.responseRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-indigo-500"
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
