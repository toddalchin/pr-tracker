'use client';

import Header from '@/components/Header';
import { useWorksheetData } from '@/hooks/useWorksheetData';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { getPublicationInfo } from '@/lib/publicationData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  Newspaper, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Target,
  Star,
  ExternalLink,
  User,
  Building,
  Award,
  Clock,
  Filter,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';

interface CoverageItem {
  Date?: string;
  Outlet?: string;
  Title?: string;
  Article?: string;
  Type?: string;
  Status?: string;
  Link?: string;
  Notes?: string;
  Reporter?: string;
  Client?: string;
  'Client (if applicable)'?: string;
  [key: string]: unknown;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function CoveragePage() {
  const { data, loading, error, refetch } = useWorksheetData();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return <ErrorState error="No data available" onRetry={refetch} />;

  // Combine both Media Tracker sheets
  const mediaTracker2024 = (data.sheets['Media Tracker'] || []) as CoverageItem[];
  const mediaTracker2025 = (data.sheets['Media Tracker (2025)'] || []) as CoverageItem[];
  
  // Combine and deduplicate coverage items
  const allCoverageItems = [...mediaTracker2024, ...mediaTracker2025].map((item, index) => ({
    ...item,
    id: index,
    year: getYearFromDate(item.Date),
    source: mediaTracker2025.includes(item as any) ? '2025 Tracker' : '2024 Tracker'
  }));

  function getYearFromDate(dateStr?: string): number {
    if (!dateStr) return new Date().getFullYear();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  }

  // Filter by timeframe
  const getFilteredItems = () => {
    if (selectedTimeframe === 'all') return allCoverageItems;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedTimeframe) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '2025':
        return allCoverageItems.filter(item => item.year === 2025);
      case '2024':
        return allCoverageItems.filter(item => item.year === 2024);
      default:
        return allCoverageItems;
    }
    
    return allCoverageItems.filter(item => {
      const itemDate = new Date(item.Date || '');
      return !isNaN(itemDate.getTime()) && itemDate >= cutoffDate;
    });
  };

  const filteredItems = getFilteredItems();

  const processedData = filteredItems.map((item) => {
    const outlet = String(item.Outlet || 'Unknown');
    const publicationInfo = getPublicationInfo(outlet);
    
    return {
      ...item,
      estimatedReach: publicationInfo?.estimatedReach || 0,
      tier: publicationInfo?.tier || 'unknown',
      title: item.Title || item.Article || 'Untitled',
      client: item.Client || item['Client (if applicable)'] || 'N/A',
      reporter: item.Reporter || 'Unknown'
    };
  });

  // Enhanced Analytics Functions
  const getOutletBreakdown = () => {
    const outletCounts: Record<string, { count: number; reach: number }> = {};
    processedData.forEach(item => {
      const outlet = String(item.Outlet || 'Unknown');
      if (!outletCounts[outlet]) {
        outletCounts[outlet] = { count: 0, reach: 0 };
      }
      outletCounts[outlet].count += 1;
      outletCounts[outlet].reach += item.estimatedReach;
    });
    
    return Object.entries(outletCounts)
      .map(([name, data]) => ({ 
        name, 
        value: data.count, 
        reach: data.reach,
        avgReach: data.reach / data.count 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const getTypeBreakdown = () => {
    const typeCounts: Record<string, number> = {};
    processedData.forEach(item => {
      const type = String(item.Type || 'Unknown');
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getClientBreakdown = () => {
    const clientCounts: Record<string, number> = {};
    processedData.forEach(item => {
      const client = item.client === 'N/A' ? 'Thought Leadership' : item.client;
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    });
    
    return Object.entries(clientCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getReporterBreakdown = () => {
    const reporterCounts: Record<string, { count: number; outlets: Set<string> }> = {};
    processedData.forEach(item => {
      const reporter = item.reporter;
      const outlet = String(item.Outlet || 'Unknown');
      
      if (!reporterCounts[reporter]) {
        reporterCounts[reporter] = { count: 0, outlets: new Set() };
      }
      reporterCounts[reporter].count += 1;
      reporterCounts[reporter].outlets.add(outlet);
    });
    
    return Object.entries(reporterCounts)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        outlets: data.outlets.size,
        outletList: Array.from(data.outlets)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getMonthlyTrend = () => {
    const monthCounts: Record<string, number> = {};
    processedData.forEach(item => {
      const dateStr = String(item.Date || '');
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });
    
    const sortedMonths = Object.entries(monthCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    
    return sortedMonths.slice(-12); // Last 12 months
  };

  const getRecentCoverage = () => {
    return processedData
      .filter(item => item.Date)
      .sort((a, b) => new Date(String(b.Date)).getTime() - new Date(String(a.Date)).getTime())
      .slice(0, 8);
  };

  const getTotalReach = () => {
    return processedData.reduce((total, item) => total + item.estimatedReach, 0);
  };

  const getHighImpactCoverage = () => {
    return processedData
      .filter(item => item.estimatedReach > 100000)
      .sort((a, b) => b.estimatedReach - a.estimatedReach);
  };

  const getYearOverYearComparison = () => {
    const currentYear = new Date().getFullYear();
    const currentYearData = allCoverageItems.filter(item => item.year === currentYear);
    const previousYearData = allCoverageItems.filter(item => item.year === currentYear - 1);
    
    return {
      current: currentYearData.length,
      previous: previousYearData.length,
      change: currentYearData.length - previousYearData.length,
      percentChange: previousYearData.length > 0 
        ? ((currentYearData.length - previousYearData.length) / previousYearData.length * 100)
        : 0
    };
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatReach = (reach: number) => {
    if (reach >= 1000000) return `${(reach / 1000000).toFixed(1)}M`;
    if (reach >= 1000) return `${(reach / 1000).toFixed(0)}K`;
    return reach.toString();
  };

  // Calculate all analytics
  const outletData = getOutletBreakdown();
  const typeData = getTypeBreakdown();
  const clientData = getClientBreakdown();
  const reporterData = getReporterBreakdown();
  const trendData = getMonthlyTrend();
  const recentCoverage = getRecentCoverage();
  const totalReach = getTotalReach();
  const highImpactCoverage = getHighImpactCoverage();
  const uniqueOutlets = new Set(processedData.map(item => item.Outlet)).size;
  const uniqueReporters = new Set(processedData.map(item => item.reporter)).size;
  const yearComparison = getYearOverYearComparison();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📰 Media Coverage Intelligence
          </h1>
          <p className="text-gray-600">
            Comprehensive analytics across {mediaTracker2024.length + mediaTracker2025.length} media mentions from 2024-2025
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Timeframe:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Time' },
                { key: '30d', label: 'Last 30 days' },
                { key: '90d', label: 'Last 90 days' },
                { key: '2025', label: '2025' },
                { key: '2024', label: '2024' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedTimeframe(key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedTimeframe === key
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'outlets', label: 'Outlets & Reach', icon: Building },
                { key: 'reporters', label: 'Reporter Network', icon: User },
                { key: 'content', label: 'Content Analysis', icon: Newspaper }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Coverage</p>
                    <p className="text-2xl font-bold text-blue-600">{filteredItems.length}</p>
                    {yearComparison.change !== 0 && (
                      <p className={`text-xs ${yearComparison.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {yearComparison.change > 0 ? '+' : ''}{yearComparison.change} vs last year
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Newspaper className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reach</p>
                    <p className="text-2xl font-bold text-green-600">{formatReach(totalReach)}</p>
                    <p className="text-xs text-gray-500">Estimated audience</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Outlets</p>
                    <p className="text-2xl font-bold text-purple-600">{uniqueOutlets}</p>
                    <p className="text-xs text-gray-500">Publications reached</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reporter Network</p>
                    <p className="text-2xl font-bold text-orange-600">{uniqueReporters}</p>
                    <p className="text-xs text-gray-500">Media contacts</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Impact</p>
                    <p className="text-2xl font-bold text-red-600">{highImpactCoverage.length}</p>
                    <p className="text-xs text-gray-500">100K+ reach</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Star className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Trend */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Coverage Type Distribution */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Type Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Client Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage by Client/Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clientData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Outlets & Reach Tab */}
        {activeTab === 'outlets' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Coverage by Outlet */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Volume by Outlet</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={outletData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={11}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reach Analysis */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Reach by Outlet</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={outletData.filter(item => item.reach > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={11}
                    />
                    <YAxis tickFormatter={formatReach} />
                    <Tooltip formatter={(value) => [formatReach(Number(value)), 'Total Reach']} />
                    <Bar dataKey="reach" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Outlet Analysis */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Outlet Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coverage Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reach</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Reach</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outletData.map((outlet, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {outlet.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {outlet.value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatReach(outlet.reach)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {outlet.reach > 0 ? formatReach(outlet.avgReach) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            outlet.avgReach > 100000 ? 'bg-green-100 text-green-800' :
                            outlet.avgReach > 50000 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {outlet.avgReach > 100000 ? 'High' : outlet.avgReach > 50000 ? 'Medium' : 'Standard'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Reporter Network Tab */}
        {activeTab === 'reporters' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Media Contacts</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reporterData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'count' ? 'Coverage Count' : 'Outlets']}
                    labelFormatter={(label) => `Reporter: ${label}`}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Reporter Relationship Matrix */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Reporter Relationship Analysis</h3>
                <p className="text-sm text-gray-600">Key contacts and their outlet diversity</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reporterData.slice(0, 9).map((reporter, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{reporter.name}</h4>
                          <p className="text-sm text-gray-600">{reporter.count} articles</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {reporter.outlets} outlet{reporter.outlets !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Active at:</p>
                        <div className="flex flex-wrap gap-1">
                          {reporter.outletList.slice(0, 3).map((outlet, i) => (
                            <span key={i} className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              {outlet}
                            </span>
                          ))}
                          {reporter.outletList.length > 3 && (
                            <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              +{reporter.outletList.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Content Analysis Tab */}
        {activeTab === 'content' && (
          <>
            {/* Recent Coverage */}
            <div className="bg-white rounded-lg shadow-sm border mb-8">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Latest Coverage</h3>
                <p className="text-sm text-gray-600">Most recent media mentions with details</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentCoverage.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(item.Date)}
                            <span className="mx-2">•</span>
                            <Building className="w-4 h-4 mr-1" />
                            {item.Outlet}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <User className="w-4 h-4 mr-1" />
                            {item.reporter}
                            {item.estimatedReach > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <Eye className="w-4 h-4 mr-1" />
                                {formatReach(item.estimatedReach)}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {item.Type && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.Type}
                              </span>
                            )}
                            {item.client !== 'N/A' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {item.client}
                              </span>
                            )}
                          </div>
                          {item.Notes && (
                            <p className="text-xs text-gray-600 line-clamp-2">{item.Notes}</p>
                          )}
                        </div>
                        {item.Link && (
                          <a
                            href={String(item.Link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* High Impact Coverage */}
            {highImpactCoverage.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">High Impact Coverage</h3>
                  <p className="text-sm text-gray-600">Coverage with significant reach (100K+ estimated)</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {highImpactCoverage.slice(0, 6).map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {item.title}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <Eye className="w-4 h-4 mr-1" />
                              {formatReach(item.estimatedReach)} estimated reach
                              <span className="mx-2">•</span>
                              <Building className="w-4 h-4 mr-1" />
                              {item.Outlet}
                              <span className="mx-2">•</span>
                              <User className="w-4 h-4 mr-1" />
                              {item.reporter}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(item.Date)}
                              {item.Type && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="text-blue-600">{item.Type}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              High Impact
                            </span>
                            {item.Link && (
                              <a
                                href={String(item.Link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:text-blue-800 mt-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 