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
  Area
} from 'recharts';
import { 
  Newspaper, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Target,
  Star,
  ExternalLink 
} from 'lucide-react';

interface CoverageItem {
  Date?: string;
  Outlet?: string;
  Title?: string;
  Type?: string;
  Status?: string;
  Link?: string;
  Notes?: string;
  [key: string]: unknown;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function CoveragePage() {
  const { data, loading, error, refetch } = useWorksheetData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return <ErrorState error="No data available" onRetry={refetch} />;

  const coverageItems = (data.sheets['Media Tracker'] || []) as CoverageItem[];

  const processedData = coverageItems.map((item, index) => {
    const outlet = String(item.Outlet || 'Unknown');
    const publicationInfo = getPublicationInfo(outlet);
    
    return {
      ...item,
      id: index,
      estimatedReach: publicationInfo?.estimatedReach || 0,
      tier: publicationInfo?.tier || 'unknown'
    };
  });

  // Analytics functions
  const getOutletBreakdown = () => {
    const outletCounts: Record<string, number> = {};
    coverageItems.forEach(item => {
      const outlet = String(item.Outlet || 'Unknown');
      outletCounts[outlet] = (outletCounts[outlet] || 0) + 1;
    });
    
    return Object.entries(outletCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getTypeBreakdown = () => {
    const typeCounts: Record<string, number> = {};
    coverageItems.forEach(item => {
      const type = String(item.Type || 'Unknown');
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  };

  const getMonthlyTrend = () => {
    const monthCounts: Record<string, number> = {};
    coverageItems.forEach(item => {
      const dateStr = String(item.Date || '');
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });
    
    return Object.entries(monthCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-6);
  };

  const getRecentCoverage = () => {
    return coverageItems
      .filter(item => item.Date)
      .sort((a, b) => new Date(String(b.Date)).getTime() - new Date(String(a.Date)).getTime())
      .slice(0, 5);
  };

  const getTotalReach = () => {
    return processedData.reduce((total, item) => total + item.estimatedReach, 0);
  };

  const getHighImpactCoverage = () => {
    return processedData
      .filter(item => item.estimatedReach > 100000)
      .sort((a, b) => b.estimatedReach - a.estimatedReach);
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

  const outletData = getOutletBreakdown();
  const typeData = getTypeBreakdown();
  const trendData = getMonthlyTrend();
  const recentCoverage = getRecentCoverage();
  const totalReach = getTotalReach();
  const highImpactCoverage = getHighImpactCoverage();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📰 Media Coverage Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive view of your media presence and PR impact
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Coverage</p>
                <p className="text-2xl font-bold text-blue-600">{coverageItems.length}</p>
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
                <p className="text-2xl font-bold text-purple-600">{outletData.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Impact</p>
                <p className="text-2xl font-bold text-orange-600">{highImpactCoverage.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Coverage by Outlet */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage by Outlet</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={outletData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Coverage Type Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Type Distribution</h3>
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
        </div>

        {/* Coverage Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Trend (Last 6 Months)</h3>
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
          {/* Recent Coverage */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Latest Coverage</h3>
              <p className="text-sm text-gray-600">Your most recent media mentions</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentCoverage.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.Title || 'Untitled Article'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(item.Date)}
                          <span className="mx-2">•</span>
                          {item.Outlet}
                        </div>
                        {item.Type && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.Type}
                          </span>
                        )}
                      </div>
                      {item.Link && (
                        <a
                          href={String(item.Link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
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
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">High Impact Coverage</h3>
              <p className="text-sm text-gray-600">Coverage with significant reach</p>
            </div>
            <div className="p-6">
              {highImpactCoverage.length > 0 ? (
                <div className="space-y-4">
                  {highImpactCoverage.slice(0, 5).map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {item.Title || 'Untitled Article'}
                          </h4>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Eye className="w-4 h-4 mr-1" />
                            {formatReach(item.estimatedReach)} reach
                            <span className="mx-2">•</span>
                            {item.Outlet}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(item.Date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            High Impact
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No high-impact coverage found</p>
              )}
            </div>
          </div>
        </div>

        {/* Full Coverage Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">All Coverage</h3>
            <p className="text-sm text-gray-600">Complete media coverage database</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outlet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Reach
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.Date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.Outlet}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate">
                        {item.Title || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.Type && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.Type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.estimatedReach > 0 ? formatReach(item.estimatedReach) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.Status || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 